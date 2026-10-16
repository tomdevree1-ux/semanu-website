import 'server-only';
import { env } from '@/lib/env';

/**
 * SERVER ONLY AI provider abstraction for P14 report generation. One thin interface, one configured
 * implementation (Anthropic over HTTP, no SDK dependency). The API key comes from `env` and is never
 * logged or returned. Generation code depends on `AiProvider`, so tests inject a fake without network.
 */
export type AiUsage = { input: number; output: number; total: number };
export type AiResult = { text: string; usage: AiUsage; costEstimate: number; model: string; provider: string };
export type AiGenerateArgs = {
  system: string;
  prompt: string;
  maxOutputTokens: number;
  temperature?: number;
};
export type AiProvider = {
  provider: string;
  model: string;
  generate(args: AiGenerateArgs): Promise<AiResult>;
};

export class AiNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiNotConfiguredError';
  }
}
export class AiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiRequestError';
  }
}

// Conservative per-million-token cost estimate (USD/CHF equivalent) for the cost ceiling. Defaults to
// Claude Sonnet-class pricing; only used for the soft estimate + hard cap, not billing.
function estimateCost(usage: AiUsage): number {
  const inPerM = 3;
  const outPerM = 15;
  return (usage.input / 1_000_000) * inPerM + (usage.output / 1_000_000) * outPerM;
}

function anthropicProvider(model: string, apiKey: string): AiProvider {
  return {
    provider: 'anthropic',
    model,
    async generate({ system, prompt, maxOutputTokens }) {
      let res: Response;
      try {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            // `temperature` is intentionally omitted: newer models (e.g. claude-opus-4-8) reject it as
            // deprecated (HTTP 400), and the default sampling is fine for report generation.
            model,
            max_tokens: maxOutputTokens,
            system,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
      } catch {
        throw new AiRequestError('ai_network_error');
      }
      if (!res.ok) {
        // Never include the response body verbatim (may echo the prompt); status only.
        throw new AiRequestError(`ai_http_${res.status}`);
      }
      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text = (data.content ?? [])
        .filter((b) => b.type === 'text' && typeof b.text === 'string')
        .map((b) => b.text as string)
        .join('');
      const usage: AiUsage = {
        input: data.usage?.input_tokens ?? 0,
        output: data.usage?.output_tokens ?? 0,
        total: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      };
      return { text, usage, costEstimate: estimateCost(usage), model, provider: 'anthropic' };
    },
  };
}

/** Resolve the configured provider, or throw `AiNotConfiguredError` (caught by generation → safe failure). */
export function getAiProvider(): AiProvider {
  const provider = env.aiProvider;
  if (provider === 'anthropic') {
    const model = env.aiModel;
    const key = env.anthropicApiKey;
    if (!model) throw new AiNotConfiguredError('AI_MODEL is not set');
    if (!key) throw new AiNotConfiguredError('ANTHROPIC_API_KEY is not set');
    return anthropicProvider(model, key);
  }
  throw new AiNotConfiguredError(`Unsupported AI provider: ${provider}`);
}
