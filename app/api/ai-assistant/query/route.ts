import { NextRequest, NextResponse } from 'next/server';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';
import { generateEmbedding, searchSimilar } from '@/lib/vector';
import { moderateContent } from '@/lib/aigc';
import { sql } from '@/db/client';

type CoursePromptFields = {
  course_id: string;
  course_name: string;
  credit: number | null;
};

function buildCourseInfoSection(course: CoursePromptFields): string {
  const lines: string[] = [];
  if (course.course_name?.trim()) {
    lines.push(`课程名称：${course.course_name.trim()}`);
  }
  if (course.course_id?.trim()) {
    lines.push(`课程编号：${course.course_id.trim()}`);
  }
  if (course.credit != null && !Number.isNaN(Number(course.credit))) {
    lines.push(`学分：${Number(course.credit)}`);
  }
  return lines.length > 0 ? lines.join('\n') : '（暂无课程元数据）';
}

// 处理AI助手提问
export async function POST(request: NextRequest) {
  try {
    // 验证 token
    const authResult = withAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { query, courseId } = await request.json();

    if (!query || !courseId) {
      return NextResponse.json({ error: '问题和课程ID不能为空' }, { status: 400 });
    }

    const courses = await sql`
      SELECT id, course_id, course_name, credit
      FROM courses
      WHERE course_id = ${courseId}
    `;

    if (courses.length === 0) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const courseRow = courses[0] as CoursePromptFields & { id: string };
    const courseUuid = courseRow.id;

    // 审核问题内容
    const moderationResult = await moderateContent(query);
    if (!moderationResult.approved) {
      return NextResponse.json(
        { error: moderationResult.reason || '问题内容不符合规范' },
        { status: 400 }
      );
    }

    const queryEmbedding = await generateEmbedding(query);

    const similarResults = await searchSimilar(queryEmbedding, 5, {
      courseId: courseUuid
    });

    let context = '';
    for (const hit of similarResults) {
      const meta = (hit as { metadata?: { document?: string; content?: string } })
        .metadata;
      const piece = meta?.document ?? meta?.content;
      if (piece) {
        context += piece + '\n\n';
      }
    }

    const stream = await generateAnswerStream(query, context, {
      course_id: courseRow.course_id,
      course_name: courseRow.course_name,
      credit: courseRow.credit,
    });

    return applyAuthToResponse(
      new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      }),
      authResult
    );
  } catch (error) {
    console.error('AI助手查询失败:', error);
    return NextResponse.json({ error: 'AI助手查询失败' }, { status: 500 });
  }
}

// 调用LLM生成流式回答
async function generateAnswerStream(
  query: string,
  context: string,
  course: CoursePromptFields
): Promise<ReadableStream> {
  const AIGC_API_KEY = process.env.AIGC_API_KEY || '';
  const AIGC_BASE_URL = process.env.AIGC_BASE_URL || 'https://api.moonshot.cn/v1';
  const AIGC_MODE = process.env.AIGC_MODE || 'moonshot-v1-8k';

  const courseLabel = course.course_name?.trim() || '本课程';
  const courseInfoBlock = buildCourseInfoSection(course);

  const systemPrompt = `你是《${courseLabel}》的AI助教，负责回答学生关于本课程的问题。请根据下方课程信息与参考资料，生成准确、专业的回答。

课程信息：
${courseInfoBlock}

参考资料（来自教师上传的教学材料等）：
${context}

注意：
1. 回答须围绕当前课程，避免与其他课程内容混淆
2. 优先依据参考资料作答；回答必须基于参考资料与上述课程信息，不要编造参考资料中不存在的事实
3. 回答要简洁明了，直接回答问题
4. 若参考资料为空或无法据此回答，请明确说明`;

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
