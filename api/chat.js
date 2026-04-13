const DEFAULT_BASE_URL = 'https://api.minimaxi.com/v1';
const DEFAULT_MODEL = 'MiniMax-M2.5';

function readContentText(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (part && typeof part === 'object' && typeof part.text === 'string') {
          return part.text;
        }
        return '';
      })
      .join('');
  }

  return '';
}

function stripReasoningTags(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

function parseAnswerPayload(text, allowedProductIds) {
  const cleaned = stripReasoningTags(text);
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return {
      answer: cleaned || '我已收到你的问题，请继续补充预算、风格或场景。',
      picks: []
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const answer = typeof parsed.answer === 'string' && parsed.answer.trim() ? parsed.answer.trim() : '我已收到你的问题，请继续补充预算、风格或场景。';

    const picks = Array.isArray(parsed.picks)
      ? parsed.picks
          .filter((item) => typeof item === 'string' && allowedProductIds.includes(item))
          .slice(0, 3)
      : [];

    return { answer, picks };
  } catch (_error) {
    return {
      answer: cleaned || '我已收到你的问题，请继续补充预算、风格或场景。',
      picks: []
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing MINIMAX_API_KEY environment variable' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const query = typeof body.query === 'string' ? body.query.trim() : '';

  if (!query) {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  const context = body.context && typeof body.context === 'object' ? body.context : {};
  const detailOpen = Boolean(context.detailOpen);
  const currentProductId = typeof context.currentProductId === 'string' ? context.currentProductId : null;
  const viewedProductIds = Array.isArray(context.viewedProductIds)
    ? context.viewedProductIds.filter((item) => typeof item === 'string').slice(0, 10)
    : [];
  const allowedProductIds = Array.isArray(context.allowedProductIds)
    ? context.allowedProductIds.filter((item) => typeof item === 'string').slice(0, 30)
    : [];

  const systemPrompt = [
    '你是 Apple 产品顾问。',
    '你的任务：高效承接用户意图，直接给可执行建议。',
    '必须输出严格 JSON，且只能包含两个字段：',
    '{"answer":"...","picks":["p1","p2"]}',
    '规则：',
    '1) answer 使用中文，控制在 120 字内。',
    '2) picks 只能从允许的商品 ID 中选择，最多 3 个，可为空数组。',
    '3) 如果 detailOpen=true，优先回答当前商品相关问题（配置、对比、配件、优惠）。',
    '4) 严禁输出 markdown、代码块或额外字段。'
  ].join('\n');

  const userPrompt = JSON.stringify(
    {
      query,
      detailOpen,
      currentProductId,
      viewedProductIds,
      allowedProductIds
    },
    null,
    2
  );

  const baseUrl = (process.env.MINIMAX_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const model = process.env.MINIMAX_MODEL || DEFAULT_MODEL;

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      res.status(502).json({ error: 'Upstream minimax error', detail: errorText.slice(0, 300) });
      return;
    }

    const data = await upstream.json();
    const content = readContentText(data?.choices?.[0]?.message?.content || '');
    const result = parseAnswerPayload(content, allowedProductIds);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch minimax', detail: String(error && error.message ? error.message : error) });
  }
}
