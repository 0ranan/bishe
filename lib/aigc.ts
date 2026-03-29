const AIGC_API_KEY = process.env.AIGC_API_KEY || '';
const AIGC_BASE_URL = process.env.AIGC_BASE_URL || 'https://api.moonshot.cn/v1';
const AIGC_MODE = process.env.AIGC_MODE || 'moonshot-v1-8k';

interface AIGCResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function moderateContent(content: string): Promise<{ approved: boolean; reason?: string }> {
  try {
    const systemPrompt = `你是一个内容审核助手。请审核以下用户评论内容，判断是否包含以下违规内容：
1. 色情、暴力、恐怖等不良信息
2. 政治敏感内容
3. 辱骂、人身攻击等不友善言论
4. 广告、垃圾信息
5. 其他违反公序良俗的内容

请仅返回JSON格式的结果，格式如下：
{"approved": true/false, "reason": "如果不通过，请说明原因"}

注意：
- approved为true表示内容通过审核
- approved为false表示内容不通过审核
- 务必只返回JSON，不要有其他文字说明`;

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
          { role: 'user', content: `请审核以下评论内容：\n\n${content}` }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('AIGC API请求失败:', response.status, response.statusText);
      return { approved: true };
    }

    const data: AIGCResponse = await response.json();
    const resultText = data.choices[0]?.message?.content || '';

    try {
      const result = JSON.parse(resultText);
      return {
        approved: result.approved === true,
        reason: result.reason
      };
    } catch {
      console.error('AIGC返回格式错误:', resultText);
      return { approved: true };
    }
  } catch (error) {
    console.error('AIGC审核异常:', error);
    return { approved: true };
  }
}
