/**
 * Rough token estimation
 * GPT-style approximation: ~4 characters per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens for entire message history
 */
export function estimateMessageTokens(messages: Array<{ role: string; content: string }>): number {
  let total = 0;

  for (const msg of messages) {
    // Content tokens
    total += estimateTokens(msg.content);

    // Role overhead (~5 tokens per message for formatting)
    total += 5;
  }

  return total;
}
