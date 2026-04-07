const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const CHROMA_COLLECTION = process.env.CHROMA_COLLECTION || 'vibe-ai-assistant';
const TENANT = 'default_tenant';
const DATABASE = 'default_database';

// 生成文本向量（这里使用模拟向量，实际应该使用真实的嵌入模型）
export async function generateEmbedding(): Promise<number[]> {
  // 模拟向量生成，实际应该调用真实的嵌入API
  // 例如：OpenAI的text-embedding-ada-002模型
  const embedding = Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  return embedding;
}

// 初始化或获取集合
async function ensureCollection(): Promise<string> {
  try {
    // 获取所有集合列表
    const listResponse = await fetch(
      `${CHROMA_URL}/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`,
      {
        method: 'GET',
      }
    );
    
    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      throw new Error(`获取集合列表失败: ${listResponse.status} ${listResponse.statusText} - ${errorText}`);
    }
    
    const collections = await listResponse.json();
    const existingCollection = collections.find((c: { name: string }) => c.name === CHROMA_COLLECTION);
    
    if (existingCollection) {
      return existingCollection.id;
    }
    
    // 集合不存在，创建它
    const createResponse = await fetch(
      `${CHROMA_URL}/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: CHROMA_COLLECTION,
          get_or_create: true
        }),
      }
    );
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`创建集合失败: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
    }
    
    const newCollection = await createResponse.json();
    return newCollection.id;
    
  } catch (error) {
    console.warn('确保集合存在失败:', error);
    throw error;
  }
}

// 存储向量到Chroma
export async function storeEmbedding(
  id: string, 
  embedding: number[], 
  metadata: Record<string, unknown>,
  document: string = ''
): Promise<void> {
  try {
    const collectionId = await ensureCollection();
    
    await fetch(
      `${CHROMA_URL}/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections/${collectionId}/upsert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [id],
          embeddings: [embedding],
          metadatas: [metadata],
          documents: [document]
        }),
      }
    );
  } catch (error) {
    console.error('向量存储失败:', error);
    // 即使向量存储失败，也不要阻止文件上传
  }
}

// 检索相似向量
export async function searchSimilar(
  queryEmbedding: number[], 
  topK: number = 5,
  filter: Record<string, unknown> = {}
): Promise<unknown[]> {
  try {
    const collectionId = await ensureCollection();
    
    const response = await fetch(
      `${CHROMA_URL}/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections/${collectionId}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_embeddings: [queryEmbedding],
          n_results: topK,
          where: filter
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`向量检索失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const results = await response.json();

    // 转换结果格式以保持与原有代码兼容
    return results.documents?.[0]?.map((doc: string, index: number) => ({
      id: results.ids?.[0]?.[index],
      score: results.distances?.[0]?.[index],
      metadata: results.metadatas?.[0]?.[index]
    })) || [];
  } catch (error) {
    console.error('向量检索失败:', error);
    return [];
  }
}

// 处理文件内容，生成向量并存储
export async function processFileContent(
  fileId: string, 
  content: string, 
  metadata: Record<string, unknown>
): Promise<void> {
  // 分割文本为多个块
  const chunks = splitTextIntoChunks(content);

  // 为每个块生成向量并存储
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkId = `${fileId}-chunk-${i}`;
    const embedding = await generateEmbedding();
    
    await storeEmbedding(chunkId, embedding, {
      ...metadata,
      fileId,
      chunkIndex: i
    }, chunk);
  }
}

// 将文本分割为块
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
