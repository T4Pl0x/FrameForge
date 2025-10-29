import React from 'react';
import ModelPicker from '../../ModelPicker';

const ChatSettings = ({
  apiKey,
  handleApiKeyInputChange,
  availableModels,
  selectedModel,
  handleChatLLMConfigChange,
  isFetchingModels,
  handleRefreshModels,
  modelsError,
  modelsUpdatedAt,
  recommendedModel,
  chatLLMConfig,
  chatPolicies,
  handleChatPoliciesChange,
  agentWorkflowRules,
  handleAgentWorkflowRulesChange,
  uiHintsEnabled,
  setUiHintsEnabled,
}) => {
  return (
    <div className="chat-settings">
      <section className="chat-settings__section">
        <header>
          <h5>LLM Configuration</h5>
          <p>Choose the provider, model, and generation parameters for the assistant.</p>
        </header>
        <label className="chat-settings__field chat-settings__field--stack">
          <span>OpenRouter API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => handleApiKeyInputChange(event.target.value)}
            placeholder="sk-or-v1-..."
            autoComplete="off"
          />
          <small className="chat-settings__hint">Stored locally in this browser. Create keys at openrouter.ai.</small>
        </label>
        <div className="chat-settings__grid">
          <label className="chat-settings__field">
            <span>Provider</span>
            <input type="text" value="OpenRouter" readOnly />
          </label>
          <label className="chat-settings__field">
            <span>Model</span>
            <div className="chat-settings__model-row">
              <ModelPicker
                models={availableModels}
                value={selectedModel}
                onChange={(modelId) => handleChatLLMConfigChange('model', modelId)}
                isLoading={isFetchingModels}
                onRefresh={handleRefreshModels}
                error={modelsError}
                updatedAt={modelsUpdatedAt}
                recommendedModel={recommendedModel}
              />
            </div>
            {!modelsError && recommendedModel && (
              <small className="chat-settings__hint">Suggested starter: {recommendedModel.name}</small>
            )}
            {modelsError && (
              <small className="chat-settings__hint chat-settings__hint--error">{modelsError}</small>
            )}
          </label>
          <label className="chat-settings__field">
            <span>Temperature</span>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={chatLLMConfig.temperature}
              onChange={(event) => handleChatLLMConfigChange('temperature', event.target.value)}
            />
          </label>
          <label className="chat-settings__field">
            <span>Max Tokens</span>
            <input
              type="number"
              min="0"
              step="100"
              value={chatLLMConfig.maxTokens}
              onChange={(event) => handleChatLLMConfigChange('maxTokens', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="chat-settings__section">
        <header>
          <h5>AI Rules &amp; Policies</h5>
          <p>Define the guardrails the assistant must follow in every response.</p>
        </header>
        <textarea
          value={chatPolicies}
          onChange={(event) => handleChatPoliciesChange(event.target.value)}
          placeholder="Outline the acceptable guidance, tone, and compliance requirements."
        />
      </section>

      <section className="chat-settings__section">
        <header>
          <h5>Agent Workflow Instructions</h5>
          <p>Set the multi-step workflow or escalation rules for the assistant.</p>
        </header>
        <textarea
          value={agentWorkflowRules}
          onChange={(event) => handleAgentWorkflowRulesChange(event.target.value)}
          placeholder="Describe how the agent should break down tasks, hand off actions, or request clarification."
        />
      </section>

      <section className="chat-settings__section">
        <header>
          <h5>UI Settings</h5>
          <p>Toggle helper hints like tooltips and aria labels.</p>
        </header>
        <label className="chat-settings__field">
          <input
            type="checkbox"
            checked={uiHintsEnabled}
            onChange={(e) => setUiHintsEnabled(e.target.checked)}
          />
          <span style={{ marginLeft: 8 }}>Show hints/tooltips</span>
        </label>
      </section>
    </div>
  );
};

export default ChatSettings;
