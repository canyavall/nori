# Flow: Multi-Provider Architecture

> The complete journey of provider selection, model management, hot-switching, and how different LLM APIs are unified behind a common interface.

---

## Flow Diagram

```
+------------------+     +------------------+     +-------------------+
|  Config / Env    |---->| Provider         |---->| Agent Created     |
|  Detection       |     | Auto-Selection   |     | with Provider     |
+------------------+     +------------------+     +--------+----------+
                                                           |
                                                  +--------v----------+
                                                  | User Presses      |
                                                  | Ctrl+O (Models)   |
                                                  +--------+----------+
                                                           |
                                                  +--------v----------+
                                                  | Hot-Switch Model  |
                                                  | (same session)    |
                                                  +-------------------+
```

---

## Step 1: Provider Detection at Startup

**What happens during `config.Load()`**:

The system checks for available providers in a specific priority order:

```
Priority 1: GitHub Copilot
  -> Check ~/.config/github-copilot/hosts.json
  -> Check ~/.config/github-copilot/apps.json
  -> Check $GITHUB_TOKEN env var
  -> Check config file providers.copilot.apiKey

Priority 2: Anthropic
  -> Check $ANTHROPIC_API_KEY env var
  -> Check config file providers.anthropic.apiKey

Priority 3: OpenAI
  -> Check $OPENAI_API_KEY env var
  -> Check config file providers.openai.apiKey

Priority 4: Google Gemini
  -> Check $GEMINI_API_KEY env var
  -> Check config file providers.gemini.apiKey

Priority 5: Groq
  -> Check $GROQ_API_KEY env var
  -> Check config file providers.groq.apiKey

Priority 6: OpenRouter
  -> Check $OPENROUTER_API_KEY env var
  -> Check config file providers.openrouter.apiKey

Priority 7: xAI
  -> Check $XAI_API_KEY env var
  -> Check config file providers.xai.apiKey

Priority 8: AWS Bedrock
  -> Check AWS credentials (AWS_ACCESS_KEY_ID, AWS_PROFILE, etc.)
  -> Check region configuration

Priority 9: Azure OpenAI
  -> Check $AZURE_OPENAI_ENDPOINT env var

Priority 10: Google VertexAI
  -> Check $VERTEXAI_PROJECT + $VERTEXAI_LOCATION

Priority 11: Self-hosted (Local)
  -> Check $LOCAL_ENDPOINT env var
```

**The first available provider sets defaults for ALL agent types**:
```go
// Example: if Anthropic is first available
viper.SetDefault("agents.coder.model", models.Claude4Sonnet)
viper.SetDefault("agents.summarizer.model", models.Claude4Sonnet)
viper.SetDefault("agents.task.model", models.Claude4Sonnet)
viper.SetDefault("agents.title.model", models.Claude4Sonnet)
```

---

## Step 2: Model Registry

**All supported models are defined in `internal/llm/models/`**:

Each provider has its own file (anthropic.go, openai.go, gemini.go, etc.) that defines a `map[ModelID]Model`:

```go
var AnthropicModels = map[ModelID]Model{
    Claude4Sonnet: {
        ID:                 Claude4Sonnet,
        Name:               "Claude 4 Sonnet",
        Provider:           ProviderAnthropic,
        APIModel:           "claude-sonnet-4-20250514",
        CostPer1MIn:        3.0,
        CostPer1MOut:       15.0,
        CostPer1MInCached:  3.75,
        CostPer1MOutCached: 0.30,
        ContextWindow:      200000,
        DefaultMaxTokens:   16384,
        CanReason:          true,
        SupportsAttachments: true,
    },
    // ... more models
}
```

**At init time**, all provider model maps are merged into a single `SupportedModels` map:
```go
func init() {
    maps.Copy(SupportedModels, AnthropicModels)
    maps.Copy(SupportedModels, OpenAIModels)
    maps.Copy(SupportedModels, GeminiModels)
    maps.Copy(SupportedModels, GroqModels)
    maps.Copy(SupportedModels, AzureModels)
    maps.Copy(SupportedModels, OpenRouterModels)
    maps.Copy(SupportedModels, XAIModels)
    maps.Copy(SupportedModels, VertexAIGeminiModels)
    maps.Copy(SupportedModels, CopilotModels)
}
```

### Supported Model Counts (as of v0.0.55)

| Provider | Models |
|----------|--------|
| OpenAI | ~12 (GPT-4.1 family, GPT-4.5, GPT-4o, O1, O3, O4) |
| Anthropic | ~7 (Claude 4 Sonnet/Opus, 3.7 Sonnet, 3.5 Sonnet/Haiku, 3 Opus) |
| GitHub Copilot | ~15 (mix of GPT, Claude, Gemini, O-series) |
| Google Gemini | ~4 (Gemini 2.5, 2.5 Flash, 2.0 Flash/Lite) |
| AWS Bedrock | 1 (Claude 3.7 Sonnet) |
| Groq | ~5 (Llama 4, QWEN, Deepseek, Llama 3.3) |
| Azure OpenAI | ~12 (mirrors OpenAI models) |
| VertexAI | ~2 (Gemini 2.5, 2.5 Flash) |
| OpenRouter | ~5 (Claude, GPT models via OpenRouter) |
| xAI | ~3 (Grok 3, Grok 3 Mini) |
| Local | Dynamic (loaded from endpoint) |

---

## Step 3: Provider Creation

**When an agent is created**, a provider is instantiated:

```go
func createAgentProvider(agentName config.AgentName) (provider.Provider, error) {
    // 1. Get agent config (model ID, maxTokens)
    agentConfig := cfg.Agents[agentName]

    // 2. Look up model in registry
    model := models.SupportedModels[agentConfig.Model]

    // 3. Get provider config (API key)
    providerCfg := cfg.Providers[model.Provider]

    // 4. Build options
    opts := []provider.ProviderClientOption{
        provider.WithAPIKey(providerCfg.APIKey),
        provider.WithModel(model),
        provider.WithSystemMessage(prompt.GetAgentPrompt(agentName, model.Provider)),
        provider.WithMaxTokens(maxTokens),
    }

    // 5. Add provider-specific options
    if model.CanReason && provider == models.ProviderOpenAI {
        opts = append(opts, provider.WithOpenAIOptions(
            provider.WithReasoningEffort(agentConfig.ReasoningEffort),
        ))
    } else if model.CanReason && provider == models.ProviderAnthropic {
        opts = append(opts, provider.WithAnthropicOptions(
            provider.WithAnthropicShouldThinkFn(provider.DefaultShouldThinkFn),
        ))
    }

    // 6. Create provider via factory
    return provider.NewProvider(model.Provider, opts...)
}
```

---

## Step 4: Provider Implementation Details

### OpenAI-Compatible Providers

Groq, OpenRouter, xAI, and Local providers all reuse the OpenAI client:

```go
case models.ProviderGROQ:
    clientOptions.openaiOptions = append(clientOptions.openaiOptions,
        WithOpenAIBaseURL("https://api.groq.com/openai/v1"))
    return &baseProvider[OpenAIClient]{client: newOpenAIClient(clientOptions)}, nil

case models.ProviderOpenRouter:
    clientOptions.openaiOptions = append(clientOptions.openaiOptions,
        WithOpenAIBaseURL("https://openrouter.ai/api/v1"),
        WithOpenAIExtraHeaders(map[string]string{
            "HTTP-Referer": "opencode.ai",
            "X-Title":      "OpenCode",
        }))
    return &baseProvider[OpenAIClient]{client: newOpenAIClient(clientOptions)}, nil

case models.ProviderLocal:
    clientOptions.openaiOptions = append(clientOptions.openaiOptions,
        WithOpenAIBaseURL(os.Getenv("LOCAL_ENDPOINT")))
    return &baseProvider[OpenAIClient]{client: newOpenAIClient(clientOptions)}, nil
```

### Dedicated Providers
- **Anthropic**: Uses official `anthropic-sdk-go`, supports streaming, thinking, caching
- **Gemini**: Uses `google.golang.org/genai`, supports Gemini-specific features
- **Bedrock**: Uses AWS SDK, wraps Anthropic API via AWS Bedrock service
- **Copilot**: Uses GitHub Copilot API (token from Copilot CLI/extension auth)
- **Azure**: Uses Azure OpenAI SDK with Entra ID or API key authentication
- **VertexAI**: Uses Google Cloud VertexAI Gemini endpoint

---

## Step 5: Streaming Response Unification

All providers emit the same `ProviderEvent` types regardless of underlying API differences:

```
Anthropic API           -> ProviderEvent
  content_block_start   -> EventContentStart / EventToolUseStart
  content_block_delta   -> EventContentDelta / EventToolUseDelta / EventThinkingDelta
  content_block_stop    -> EventContentStop / EventToolUseStop
  message_stop          -> EventComplete

OpenAI API              -> ProviderEvent
  chunk.choices[0].delta.content     -> EventContentDelta
  chunk.choices[0].delta.tool_calls  -> EventToolUseStart / EventToolUseDelta
  chunk.choices[0].finish_reason     -> EventComplete

Gemini API              -> ProviderEvent
  GenerateContentResponse.Candidates -> EventContentDelta / EventToolUseStart
  (completion)                       -> EventComplete
```

The agent loop only handles `ProviderEvent` types and never sees provider-specific API details.

---

## Step 6: Hot-Switch Model (Ctrl+O)

**User action**: Presses Ctrl+O to open model selection dialog

**User sees**: Dialog listing all available models, grouped by provider

```
+---------------------------------------+
|         Select Model                   |
|                                       |
|  Anthropic                            |
|    > Claude 4 Sonnet          *       |
|      Claude 4 Opus                    |
|      Claude 3.7 Sonnet               |
|                                       |
|  OpenAI                               |
|      GPT-4.1                          |
|      GPT-4.1 Mini                     |
|      O3                               |
|                                       |
|  <- h/l ->  j/k  Enter to select     |
+---------------------------------------+
```

**Navigation**: h/l for provider, j/k for model, Enter to select

**What happens on selection**:
```go
case dialog.ModelSelectedMsg:
    a.showModelDialog = false
    model, err := a.app.CoderAgent.Update(config.AgentCoder, msg.Model.ID)
    if err != nil {
        return a, util.ReportError(err)
    }
    return a, util.ReportInfo("Model changed to " + model.Name)
```

**Agent update process**:
```go
func (a *agent) Update(agentName config.AgentName, modelID models.ModelID) (models.Model, error) {
    if a.IsBusy() {
        return models.Model{}, fmt.Errorf("cannot change model while processing")
    }

    // 1. Update config file
    config.UpdateAgentModel(agentName, modelID)

    // 2. Create new provider for the new model
    provider, err := createAgentProvider(agentName)

    // 3. Replace the agent's provider
    a.provider = provider

    return a.provider.Model(), nil
}
```

**Key point**: The session continues with the new model. Previous messages in the conversation history are preserved and sent to the new model. This works because the message format (`[]message.Message`) is provider-agnostic.

---

## Step 7: Per-Agent Model Configuration

OpenCode supports four agent types, each with independent model configuration:

| Agent | Purpose | Default | Max Tokens |
|-------|---------|---------|------------|
| **coder** | Main coding assistant | (first available provider's best model) | 5000+ (model-dependent) |
| **summarizer** | Auto-compact summarization | Same as coder | Same as coder |
| **task** | Sub-agent for delegated tasks | Same as coder (or mini variant) | Same as coder |
| **title** | Session title generation | Same as coder | 80 (hardcoded) |

**Config file**:
```json
{
    "agents": {
        "coder": {
            "model": "claude-4-sonnet",
            "maxTokens": 16384
        },
        "task": {
            "model": "gpt-4.1-mini",
            "maxTokens": 5000
        },
        "title": {
            "model": "gpt-4.1-mini",
            "maxTokens": 80
        }
    }
}
```

**System prompts differ by agent type AND provider**:
```go
func GetAgentPrompt(agentName config.AgentName, provider models.ModelProvider) string {
    switch agentName {
    case config.AgentCoder:
        return CoderPrompt(provider)  // Different prompt for OpenAI vs Anthropic
    case config.AgentSummarizer:
        return SummarizerPrompt()
    case config.AgentTask:
        return TaskPrompt()
    case config.AgentTitle:
        return TitlePrompt()
    }
}
```

The coder prompt is notably different for OpenAI vs Anthropic, reflecting their different system prompt conventions and capabilities.

---

## Step 8: Retry Logic

**Max retries**: 8 (defined as `const maxRetries = 8` in provider.go)

Each provider implementation handles retries for transient failures (rate limits, timeouts, server errors). The retry count is configurable at the provider level.

---

## Step 9: Reasoning/Thinking Support

Models with `CanReason: true` support extended thinking:

**Anthropic**: Uses `AnthropicShouldThinkFn` to determine when to enable thinking
**OpenAI**: Uses `ReasoningEffort` parameter (low/medium/high)

Thinking content is streamed via `EventThinkingDelta` and stored separately from main content via `assistantMsg.AppendReasoningContent()`.
