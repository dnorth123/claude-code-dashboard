import type { TokenUsage } from './types'

interface TokenPricing {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
}

const MODEL_PRICING: Record<string, TokenPricing> = {
  'claude-opus-4-6': { input: 15, output: 75, cacheCreation: 18.75, cacheRead: 1.875 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheCreation: 3.75, cacheRead: 0.375 },
  'claude-haiku-4-5': { input: 0.80, output: 4, cacheCreation: 1, cacheRead: 0.08 },
}

export function getPricing(model: string): TokenPricing {
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key)) return pricing
  }
  return MODEL_PRICING['claude-opus-4-6']
}

export function calculateSessionCost(tokens: TokenUsage, model: string): number {
  const pricing = getPricing(model)
  const costDollars =
    (tokens.input * pricing.input +
      tokens.output * pricing.output +
      tokens.cacheCreation * pricing.cacheCreation +
      tokens.cacheRead * pricing.cacheRead) /
    1_000_000
  return Math.round(costDollars * 100)
}
