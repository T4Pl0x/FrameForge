// AI Integration Module - Custom AI API with OpenRouter Support
// Supports multiple LLMs for design assistance and code generation

export const AVAILABLE_MODELS = [
  {
    id: 'openrouter/anonymized-gpt-4o-mini',
    name: 'OpenRouter · GPT-4o Mini (community)',
    provider: 'OpenRouter',
    contextLength: 128000,
    strengths: 'General-purpose, cost-effective default',
    pricing: { prompt: 0.00015, completion: 0.0006 }
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Anthropic · Claude 3 Haiku',
    provider: 'Anthropic',
    contextLength: 200000,
    strengths: 'Fast responses, creative tasks',
    pricing: { prompt: 0.00025, completion: 0.00125 }
  },
  {
    id: 'openai/gpt-4o',
    name: 'OpenAI · GPT-4o',
    provider: 'OpenAI',
    contextLength: 128000,
    strengths: 'Versatile, coding, design assistance',
    pricing: { prompt: 0.0005, completion: 0.0015 }
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Meta · Llama 3.1 70B Instruct',
    provider: 'Meta',
    contextLength: 131072,
    strengths: 'Large context, good for complex analysis',
    pricing: { prompt: 0.00045, completion: 0.0006 }
  }
];

export class AIIntegration {
  constructor() {
    this.apiKey = localStorage.getItem('openrouter-api-key') || '';
    this.selectedModel = localStorage.getItem('selected-model') || AVAILABLE_MODELS[0].id;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.modelCache = null;
    this.modelCacheTimestamp = 0;
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('openrouter-api-key', key);
  }

  setModel(modelId) {
    this.selectedModel = modelId;
    localStorage.setItem('selected-model', modelId);
  }

  async generateDesignSuggestion(prompt, context = {}, overrides = {}) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const systemPrompt = `You are an expert UI/UX designer and developer assistant. Help create beautiful, accessible, and user-friendly interfaces.

Design Principles to follow:
- Visual Hierarchy: Use clear information structure
- Consistency: Maintain uniform design language
- Accessibility: Ensure WCAG compliance
- Responsive: Mobile-first approach
- Performance: Optimize for speed and efficiency

Provide specific, actionable suggestions with code examples when relevant.`;

    const userPrompt = this.buildDesignPrompt(prompt, context);
    const model = overrides.model || this.selectedModel;
    const temperature = Number.isFinite(overrides.temperature) ? overrides.temperature : 0.7;
    const maxTokens = Number.isFinite(overrides.maxTokens) && overrides.maxTokens > 0 ? overrides.maxTokens : 2000;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'FrameForge UI Designer'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Integration Error:', error);
      throw error;
    }
  }

  buildDesignPrompt(userPrompt, context) {
    let prompt = `Design Request: ${userPrompt}\n\n`;

    if (context.selectedFrame) {
      prompt += `Current Frame Context:
- Size: ${context.selectedFrame.width}×${context.selectedFrame.height}
- Components: ${context.selectedFrame.nodes?.length || 0} elements
- Current styling: ${JSON.stringify(context.selectedFrame, null, 2)}\n\n`;
    }

    if (context.designAnalysis) {
      prompt += `Current Design Analysis:
- Score: ${context.designAnalysis.analysis?.score || 0}/100
- Issues: ${context.designAnalysis.analysis?.violations?.length || 0} violations found
- Recommendations: ${context.designAnalysis.recommendations?.length || 0} suggestions\n\n`;
    }

    prompt += `Please provide:
1. Specific design recommendations
2. Code snippets if applicable
3. Implementation guidance
4. Accessibility considerations
5. Performance optimization tips`;

    return prompt;
  }

  async suggestComponentVariants(componentType, currentProps = {}) {
    const prompt = `Suggest 3-5 creative variations for a ${componentType} component with the following current properties: ${JSON.stringify(currentProps, null, 2)}.

Provide variations that improve:
- Visual appeal
- User experience
- Accessibility
- Modern design trends`;

    return this.generateDesignSuggestion(prompt);
  }

  async analyzeDesignIssues(frame, nodes) {
    const prompt = `Analyze this design for potential issues and improvements:
Frame: ${JSON.stringify(frame, null, 2)}
Components: ${JSON.stringify(nodes, null, 2)}

Focus on:
- Visual hierarchy problems
- Accessibility barriers
- UX inconsistencies
- Performance bottlenecks
- Modern design best practices`;

    return this.generateDesignSuggestion(prompt);
  }

  async generateCodeExport(frame, targetFramework = 'react') {
    const prompt = `Generate clean, production-ready code for this design:
Target Framework: ${targetFramework}
Frame: ${JSON.stringify(frame, null, 2)}
Components: ${JSON.stringify(frame.nodes || [], null, 2)}

Requirements:
- Use modern React patterns
- Include proper TypeScript types
- Follow accessibility best practices
- Optimize for performance
- Include responsive design
- Use CSS-in-JS or Tailwind classes`;

    return this.generateDesignSuggestion(prompt);
  }

  getModelInfo(modelId) {
    if (this.modelCache) {
      const cached = this.modelCache.find(model => model.id === modelId);
      if (cached) {
        return cached;
      }
    }
    return AVAILABLE_MODELS.find(model => model.id === modelId);
  }

  async fetchAvailableModels({ signal, forceRefresh = false } = {}) {
    const cacheValid = this.modelCache && Date.now() - this.modelCacheTimestamp < 5 * 60 * 1000;
    if (!forceRefresh && cacheValid) {
      return this.modelCache;
    }

    try {
      const headers = {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FrameForge UI Designer'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers,
        signal
      });

      if (!response.ok) {
        throw new Error(`Unable to load models (${response.status})`);
      }

      const data = await response.json();
      const models = Array.isArray(data?.data)
        ? data.data.map(model => ({
            id: model.id,
            name: model.name || model.id,
            provider: model.provider?.name || model.id.split('/')[0],
            contextLength: model.context_length,
            pricing: model.pricing,
            usageRights: model.usage_rights,
            tags: model.tags,
          }))
        : [];

      if (!models.length) {
        throw new Error('No models returned. Check your API key permissions.');
      }

      this.modelCache = models;
      this.modelCacheTimestamp = Date.now();
      return models;
    } catch (error) {
      console.warn('Falling back to hard-coded OpenRouter models:', error);
      this.modelCache = AVAILABLE_MODELS;
      this.modelCacheTimestamp = Date.now();
      return AVAILABLE_MODELS;
    }
  }

  async testConnection() {
    try {
      await this.generateDesignSuggestion('Hello, test connection', {});
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
export const aiIntegration = new AIIntegration();