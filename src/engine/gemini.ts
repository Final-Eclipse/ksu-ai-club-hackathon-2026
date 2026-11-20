export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

export interface GeminiReply {
  text: string;
  model: GeminiModel;
}

export interface GeminiPayloadReply {
  payload: unknown;
  model: GeminiModel;
}

function responseText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = Reflect.get(payload, 'candidates');
  if (!Array.isArray(candidates)) return null;
  const first = candidates[0];
  if (!first || typeof first !== 'object') return null;
  const content = Reflect.get(first, 'content');
  if (!content || typeof content !== 'object') return null;
  const parts = Reflect.get(content, 'parts');
  if (!Array.isArray(parts)) return null;
  const texts = parts.flatMap((part) => {
    if (!part || typeof part !== 'object') return [];
    const text = Reflect.get(part, 'text');
    return typeof text === 'string' ? [text] : [];
  });
  return texts.join(' ').trim() || null;
}

async function requestModel(
  model: GeminiModel,
  body: unknown,
  apiKey: string,
  signal?: AbortSignal,
): Promise<GeminiPayloadReply> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      ...(signal ? { signal } : {}),
    },
  );
  if (!response.ok) throw new Error(`${model} returned ${response.status}`);
  return { payload: await response.json() as unknown, model };
}

export function geminiAvailable(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY?.trim());
}

export async function requestGeminiFlashPayload(
  body: unknown,
  signal?: AbortSignal,
): Promise<GeminiPayloadReply> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('Gemini API key is not configured.');
  return requestModel('gemini-2.5-flash', body, apiKey, signal);
}

export async function requestGeminiPayload(
  body: unknown,
  signal?: AbortSignal,
): Promise<GeminiPayloadReply> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('Gemini API key is not configured.');
  try {
    return await requestModel('gemini-2.5-flash', body, apiKey, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    return requestModel('gemini-2.5-flash-lite', body, apiKey, signal);
  }
}

export async function requestGemini(
  prompt: string,
  context: string,
  signal?: AbortSignal,
): Promise<GeminiReply> {
  const reply = await requestGeminiPayload(
    {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are OwlFlow, a concise KSU campus mobility assistant. Use the supplied context only. Give one plain-text recommendation under 45 words with no markdown.\n\nContext: ${context}\n\nStudent: ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 90 },
    },
    signal,
  );
  const text = responseText(reply.payload);
  if (!text) throw new Error(`${reply.model} returned no readable text`);
  return { text, model: reply.model };
}
