# Flow: Multi-Provider AI Integration

> How OpenCode abstracts across 19+ AI providers.

---

## Flow Diagram

```
User selects model (e.g., "claude-sonnet-4")
        │
        ▼
┌───────────────────┐     ┌──────────────────┐
│ Provider Registry  │────►│ Provider Loader   │
│ (config + built-in)│     │ (SDK-specific)    │
└───────────────────┘     └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
                          │ Vercel AI SDK     │
                          │ streamText()      │
                          └────────┬─────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                     ▼
        ┌──────────┐       ┌──────────┐          ┌──────────┐
        │ Anthropic│       │  OpenAI  │          │  Google  │
        │  Claude  │       │   GPT    │          │  Gemini  │
        └──────────┘       └──────────┘          └──────────┘
```

---

## Supported Providers (19+)

| Provider | SDK Package | Special Handling |
|----------|-------------|------------------|
| Anthropic | @ai-sdk/anthropic | Beta headers for Claude Code features |
| OpenAI | @ai-sdk/openai | responses() API for GPT-5+ |
| Google | @ai-sdk/google | Generative AI API |
| Google Vertex | @ai-sdk/google-vertex | Project/location from env vars |
| Azure | @ai-sdk/azure | responses() or chat() based on config |
| AWS Bedrock | @ai-sdk/amazon-bedrock | Credential chain, cross-region |
| OpenRouter | @openrouter/ai-sdk-provider | Multi-model gateway |
| XAI (Grok) | @ai-sdk/xai | Standard integration |
| Mistral | @ai-sdk/mistral | Standard integration |
| Groq | @ai-sdk/groq | Fast inference |
| DeepInfra | @ai-sdk/deepinfra | Standard integration |
| Cerebras | @ai-sdk/cerebras | Standard integration |
| Cohere | @ai-sdk/cohere | Standard integration |
| Gateway | @ai-sdk/gateway | Vercel gateway |
| Together AI | @ai-sdk/togetherai | Standard integration |
| Perplexity | @ai-sdk/perplexity | Standard integration |
| GitLab | @gitlab/gitlab-ai-provider | GitLab Duo |
| GitHub Copilot | @ai-sdk/openai | responses() for GPT-5+ |
| OpenAI Compatible | @ai-sdk/openai-compatible | Custom endpoints |

---

## Provider Configuration

### In opencode.json
```jsonc
{
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "sk-ant-...",
        // or use ANTHROPIC_API_KEY env var
      }
    },
    "openai-compatible": {
      "options": {
        "baseURL": "http://localhost:11434/v1",
        "name": "Ollama",
        "models": {
          "llama3.2": {
            "name": "Llama 3.2",
            "cost": { "input": 0, "output": 0 }
          }
        }
      }
    }
  }
}
```

### Auth Priority
```
1. Config file (opencode.json) → highest priority
2. Environment variable (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
3. Stored auth (from `opencode auth` command)
```

---

## Model Selection

**User journey**: Choosing a model

### TUI
- Press keybinding → model picker opens
- Shows grouped by provider
- Each model shows: name, cost (input/output per 1M tokens)
- Current model highlighted

### Web/Desktop
- Dropdown in header area
- Grouped by provider
- Cost and capability indicators

**Data model**:
```typescript
Provider.Model {
  id: "claude-sonnet-4-20250514",
  name: "Claude Sonnet 4",
  providerID: "anthropic",
  cost: {
    input: 3,     // $3 per 1M input tokens
    output: 15    // $15 per 1M output tokens
  },
  capabilities: {
    temperature: true,
    topP: true,
    streaming: true,
    vision: true,
    caching: true
  }
}
```

---

## Provider-Specific Behaviors

### Tool Selection by Model
```
GPT-based models → use apply_patch tool (unified diffs)
Claude/others   → use edit + write tools (string replacement)
```

### Token Limits
```typescript
function maxOutputTokens(model) {
  // Each provider/model has different limits
  // Calculated from model metadata
  // Used in streamText({ maxTokens })
}
```

### Prompt Caching
```
Anthropic Claude: Two-part system prompt structure
  Part 1: Stable header (cached between requests)
  Part 2: Dynamic tail (changes per request)

If header hasn't changed → prompt cache hit → lower cost
```

### Provider Headers
```typescript
// Anthropic: Beta headers for Claude Code features
headers: { "anthropic-beta": "prompt-caching-2024-07-31,..." }

// Azure: Deployment-specific endpoints
baseURL: `${azureEndpoint}/openai/deployments/${modelID}`

// AWS Bedrock: Cross-region model prefixing
modelID: `${region}.${originalModelID}`
```
