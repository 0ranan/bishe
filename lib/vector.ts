import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'crypto';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'vibe-ai-assistant';

/** Must match `vectors.size` in ensureCollection */
const EMBEDDING_DIM = 1536;

const qdrant = new QdrantClient({
  url: QDRANT_URL,
});

type EmbeddingsApiResponse = {
  data?: Array<{ embedding: number[] }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Moonshot/Kimi 对话网关无 OpenAI 兼容 /v1/embeddings，误用会得到 404 Not support。 */
function isChatOnlyBaseUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes('moonshot.cn') || u.includes('moonshot.ai') || u.includes('api.kimi');
}

/**
 * 保证最终请求为 `{origin}{path}/embeddings`，path 以 /v1 结尾（百炼为 .../compatible-mode/v1）。
 */
function normalizeEmbeddingBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  try {
    const u = new URL(trimmed);
    let path = u.pathname.replace(/\/$/, '') || '';
    if (/\/v1$/i.test(path)) {
      return `${u.origin}${path}`;
    }
    if (path.endsWith('/compatible-mode')) {
      return `${u.origin}${path}/v1`;
    }
    if (path === '' || path === '/') {
      return `${u.origin}/v1`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function resolveEmbeddingBaseUrl(): string {
  const explicit = process.env.EMBEDDING_BASE_URL?.trim();
  if (explicit) {
    return normalizeEmbeddingBaseUrl(explicit);
  }
  const aigc = process.env.AIGC_BASE_URL?.trim();
  if (aigc) {
    if (isChatOnlyBaseUrl(aigc)) {
      throw new Error(
        '未配置 EMBEDDING_BASE_URL：Moonshot/Kimi 不支持 /embeddings（会出现 Not support）。请在 .env 设置百炼 https://dashscope.aliyuncs.com/compatible-mode/v1 或其它嵌入网关，并配置 EMBEDDING_API_KEY。'
      );
    }
    return normalizeEmbeddingBaseUrl(aigc);
  }
  return normalizeEmbeddingBaseUrl('https://api.openai.com/v1');
}

/**
 * OpenAI-compatible POST .../embeddings. EMBEDDING_BASE_URL 优先；不向 Moonshot 回退。
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('无法对空文本生成向量');
  }

  const baseUrl = resolveEmbeddingBaseUrl();
  const apiKey = process.env.EMBEDDING_API_KEY || process.env.AIGC_API_KEY || '';
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  if (!apiKey) {
    throw new Error('未配置 EMBEDDING_API_KEY 或 AIGC_API_KEY');
  }

  const embedUrl = `${baseUrl}/embeddings`;

  const body: Record<string, unknown> = {
    model,
    input: trimmed.slice(0, 30_000),
  };
  // OpenAI text-embedding-3-*；阿里云百炼 compatible-mode 的 text-embedding-v4 等支持 dimensions
  if (
    model.includes('text-embedding-3') ||
    model.includes('text-embedding-v4')
  ) {
    body.dimensions = EMBEDDING_DIM;
  }

  const response = await fetch(embedUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let hint = '';
    try {
      const parsed = JSON.parse(errText) as {
        error?: { message?: string; code?: string };
        message?: string;
        code?: string;
      };
      const msg = parsed.error?.message ?? parsed.message ?? '';
      const code = String(parsed.error?.code ?? parsed.code ?? '');
      if (
        code === 'model_not_supported' ||
        /unsupported model/i.test(msg)
      ) {
        hint =
          ' 提示：EMBEDDING_MODEL 必须是嵌入专用模型（如 text-embedding-3-small、阿里云 text-embedding-v4），不能使用对话模型（如 qwen*-plus）。';
      } else if (
        response.status === 404 &&
        (/not support/i.test(msg) ||
          code === 'Not Found' ||
          /not\s*found/i.test(code))
      ) {
        hint = ` 提示：当前请求 ${embedUrl} 被拒绝。请核对 EMBEDDING_BASE_URL（阿里云须为 https://dashscope.aliyuncs.com/compatible-mode/v1 ，勿漏 /v1；OpenAI 为 https://api.openai.com/v1），且勿使用仅支持对话的网关。`;
      }
    } catch {
      /* 非 JSON 错误体 */
    }
    throw new Error(`Embedding API 失败 (${response.status}): ${errText.slice(0, 500)}${hint}`);
  }

  const json = (await response.json()) as EmbeddingsApiResponse;
  const embedding = json.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Embedding API 返回格式异常');
  }
  if (embedding.length !== EMBEDDING_DIM) {
    throw new Error(
      `Embedding 维度为 ${embedding.length}，与 Qdrant 集合 ${EMBEDDING_DIM} 不一致，请调整 EMBEDDING_MODEL 或 Qdrant 配置`
    );
  }
  return embedding;
}

async function ensureCollection(): Promise<void> {
  try {
    await qdrant.getCollection(QDRANT_COLLECTION);
  } catch {
    try {
      await qdrant.createCollection(QDRANT_COLLECTION, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });
    } catch (createError) {
      console.warn('创建集合失败:', createError);
      throw createError;
    }
  }
}

export async function storeEmbedding(
  id: string, 
  embedding: number[], 
  metadata: Record<string, unknown>,
  document: string = ''
): Promise<void> {
  try {
    await ensureCollection();
    
    const payload: Record<string, unknown> = {
      ...metadata,
      document,
      originalId: id,
    };
    
    await qdrant.upsert(QDRANT_COLLECTION, {
      points: [
        {
          id: randomUUID(),
          vector: embedding,
          payload,
        },
      ],
    });
  } catch (error) {
    console.error('向量存储失败:', error);
    if (error && typeof error === 'object' && 'data' in error) {
      console.error('错误详情:', (error as { data: unknown }).data);
    }
  }
}

export async function searchSimilar(
  queryEmbedding: number[], 
  topK: number = 5,
  filter?: Record<string, unknown>
): Promise<unknown[]> {
  try {
    await ensureCollection();
    
    const searchParams: {
      vector: number[];
      limit: number;
      filter?: {
        must?: Array<{
          key: string;
          match: {
            value: unknown;
          };
        }>;
      };
      with_payload: boolean;
    } = {
      vector: queryEmbedding,
      limit: topK,
      with_payload: true,
    };
    
    if (filter && Object.keys(filter).length > 0) {
      const mustConditions = Object.entries(filter).map(([key, value]) => ({
        key,
        match: { value },
      }));
      
      searchParams.filter = {
        must: mustConditions,
      };
    }
    
    const results = await qdrant.search(QDRANT_COLLECTION, searchParams);

    return results.map((result) => ({
      id: result.payload?.originalId || result.id,
      score: result.score,
      metadata: result.payload,
    }));
  } catch (error) {
    console.error('向量检索失败:', error);
    if (error && typeof error === 'object' && 'data' in error) {
      console.error('错误详情:', (error as { data: unknown }).data);
    }
    return [];
  }
}

export async function processFileContent(
  fileId: string, 
  content: string, 
  metadata: Record<string, unknown>
): Promise<void> {
  const chunks = splitTextIntoChunks(content).filter((c) => c.trim().length > 0);

  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      await sleep(150);
    }
    const chunk = chunks[i];
    const chunkId = `${fileId}-chunk-${i}`;
    const embedding = await generateEmbedding(chunk);

    await storeEmbedding(chunkId, embedding, {
      ...metadata,
      fileId,
      chunkIndex: i,
    }, chunk);
  }
}

function splitTextIntoChunks(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of text.split(/[。！？.!?]/)) {
    if (currentChunk.length + sentence.length < chunkSize) {
      currentChunk += sentence + '。';
    } else {
      chunks.push(currentChunk);
      currentChunk = sentence + '。';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
