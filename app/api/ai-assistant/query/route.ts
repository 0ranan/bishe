import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { generateEmbedding, searchSimilar } from '@/lib/vector';
import { moderateContent } from '@/lib/aigc';
import { sql } from '@/db/client';

// 处理AI助手提问
export async function POST(request: NextRequest) {
  try {
    // 验证 token
    const result = await withAuth(request);
    if (result instanceof Response) return result;

    const { query, courseId } = await request.json();

    if (!query || !courseId) {
      return new Response(JSON.stringify({ error: '问题和课程ID不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 查询课程的UUID
    const courses = await sql`
      SELECT id FROM courses WHERE course_id = ${courseId}
    `;
    
    if (courses.length === 0) {
      return new Response(JSON.stringify({ error: '课程不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const courseUuid = courses[0].id;

    // 审核问题内容
    const moderationResult = await moderateContent(query);
    if (!moderationResult.approved) {
      return new Response(JSON.stringify({ error: moderationResult.reason || '问题内容不符合规范' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成查询向量
    const queryEmbedding = await generateEmbedding();

    // 检索相似内容
    const similarResults = await searchSimilar(queryEmbedding, 5, {
      courseId: courseUuid
    });

    // 构建上下文
    let context = '';
    for (const result of similarResults) {
      if (result.metadata?.content) {
        context += result.metadata.content + '\n\n';
      }
    }

    // 创建流式响应
    const stream = await generateAnswerStream(query, context);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('AI助手查询失败:', error);
    return new Response(JSON.stringify({ error: 'AI助手查询失败' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 调用LLM生成流式回答
async function generateAnswerStream(query: string, context: string): Promise<ReadableStream> {
  const AIGC_API_KEY = process.env.AIGC_API_KEY || '';
  const AIGC_BASE_URL = process.env.AIGC_BASE_URL || 'https://api.moonshot.cn/v1';
  const AIGC_MODE = process.env.AIGC_MODE || 'moonshot-v1-8k';

  const systemPrompt = `你是一个AI助教，负责回答学生的问题。请根据提供的上下文信息，生成准确、专业的回答。

上下文信息：
${context}

注意：
1. 回答必须基于提供的上下文信息
2. 回答要简洁明了，直接回答问题
3. 如果无法根据上下文回答，请明确说明`;

  const response = await fetch(`${AIGC_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AIGC_API_KEY}`,
    },
    body: JSON.stringify({
      model: AIGC_MODE,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error('LLM API请求失败');
  }

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode('抱歉，我无法回答这个问题。'));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      } catch (error) {
        console.error('流式响应错误:', error);
        controller.enqueue(encoder.encode('\n[发生错误]'));
      } finally {
        controller.close();
      }
    },
  });
}
