import { useEffect, useState } from 'react';
import { aiIntegration } from '../aiIntegration.js';
import { genId } from '../componentRegistry/index.js';

/**
 * Custom hook for managing application state
 * Follows the single responsibility principle by grouping related state
 */
export const useAppState = () => {
  // Document and UI state
  const loadDoc = () => {
    if (typeof window === 'undefined') {
      return { screens: [], frames: [] };
    }

    try {
      const stored = window.localStorage.getItem('frameforge-doc');
      if (!stored) {
        return { screens: [], frames: [] };
      }

      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.frames)) {
        return { screens: [], frames: [] };
      }

      const ensureScreens = Array.isArray(parsed.screens) && parsed.screens.length > 0
        ? parsed.screens
        : [{ id: 'screen-main', name: 'Main', order: 0, isDefault: true }];

      return {
        screens: ensureScreens.map((s, idx) => ({
          id: typeof s.id === 'string' && s.id ? s.id : `screen-${idx}`,
          name: typeof s.name === 'string' && s.name ? s.name : `Screen ${idx + 1}`,
          order: Number.isFinite(s.order) ? s.order : idx,
          isDefault: Boolean(s.isDefault) || idx === 0,
        })),
        frames: parsed.frames.map((frame) => ({
          id: frame.id || genId(),
          x: Number.isFinite(frame.x) ? frame.x : 100,
          y: Number.isFinite(frame.y) ? frame.y : 100,
          width: Number.isFinite(frame.width) ? frame.width : 300,
          height: Number.isFinite(frame.height) ? frame.height : 200,
          radius: Number.isFinite(frame.radius) ? frame.radius : 0,
          padding: Number.isFinite(frame.padding) ? frame.padding : 0,
          gap: Number.isFinite(frame.gap) ? frame.gap : 0,
          shadow: typeof frame.shadow === 'string' ? frame.shadow : '',
          cornerStyle: typeof frame.cornerStyle === 'string' ? frame.cornerStyle : 'square',
          title: typeof frame.title === 'string' ? frame.title : 'Untitled Frame',
          background: typeof frame.background === 'string' ? frame.background : '',
          screenId: typeof frame.screenId === 'string' && frame.screenId
            ? frame.screenId
            : (Array.isArray(parsed.screens) && parsed.screens[0]?.id) || 'screen-main',
          nodes: Array.isArray(frame.nodes) ? frame.nodes : [],
        })),
      };
    } catch (error) {
      console.warn('Failed to load saved document state:', error);
      return { screens: [], frames: [] };
    }
  };

  const [doc, setDoc] = useState(loadDoc);
  const initialActiveScreen = (() => {
    const first = doc.screens?.[0]?.id;
    return first || 'screen-main';
  })();
  const [activeScreenId, setActiveScreenId] = useState(initialActiveScreen);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [menu, setMenu] = useState(null);
  
  // Analysis and panels state
  const [designAnalysis, setDesignAnalysis] = useState(null);
  const [showBMADPanel, setShowBMADPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  
  // AI Configuration
  const [apiKey, setApiKey] = useState(aiIntegration.apiKey);
  const [selectedModel, setSelectedModel] = useState(aiIntegration.selectedModel);
  const [creativeSuggestions, setCreativeSuggestions] = useState([]);
  const [realTimeFeedback, setRealTimeFeedback] = useState(null);
  const [inspiredComponents, setInspiredComponents] = useState([]);
  const [designIntelligence, setDesignIntelligence] = useState({});
  const [designPatterns, setDesignPatterns] = useState([]);
  
  // UI Configuration
  const [zoom] = useState(100);
  const [showGrid] = useState(true);
  const [snapToGrid] = useState(true);
  const [centerViewMode, setCenterViewMode] = useState('design');
  const [mermaidDefinition, setMermaidDefinition] = useState(`%% Describe the frontend and backend workflows
flowchart TD
    Frontend_UI[Frontend Surface]
    Backend_Services((Backend Services))

    Frontend_UI --> Backend_Services

    note("Use the editor to document how UI screens connect to services")
    Frontend_UI -.-> note
    Backend_Services -.-> note`);
  
  // Component management
  const [componentMenus, setComponentMenus] = useState({});
  const [componentComments, setComponentComments] = useState({});
  const [frameTitleOptions, setFrameTitleOptions] = useState([
    'Landing Page',
    'Dashboard Overview',
    'Checkout Flow',
    'Onboarding Journey',
  ]);
  const [chatPanelMode, setChatPanelMode] = useState('chat');
  const [chatMessages, setChatMessages] = useState([
    {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: 'Welcome back! Let me know what you need and we can sketch it out together.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [chatLLMConfig, setChatLLMConfig] = useState({
    provider: 'OpenRouter',
    model: aiIntegration.selectedModel,
    temperature: 0.7,
    maxTokens: 2000,
  });
  // UI hints (tooltips/help)
  const [uiHintsEnabled, setUiHintsEnabled] = useState(true);
  
  // Backend workflow graph (nodes/edges)
  const loadBackendGraph = () => {
    try {
      const raw = localStorage.getItem('frameforge-backend');
      if (!raw) return { nodes: [], edges: [] };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return { nodes: [], edges: [] };
      const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      const edges = Array.isArray(parsed.edges) ? parsed.edges : [];
      return { nodes, edges };
    } catch {
      return { nodes: [], edges: [] };
    }
  };
  const [backendGraph, setBackendGraph] = useState(loadBackendGraph);
  const [chatPolicies, setChatPolicies] = useState(`Stay aligned with the brand voice guidelines.
Avoid generating disallowed content or personal data.
Offer actionable layout or UX feedback.`);
  const [agentWorkflowRules, setAgentWorkflowRules] = useState(`1. Review the frame context before replying.
2. Respond with concise, constructive recommendations.
3. Suggest follow-up tasks when gaps are identified.`);
  const [tasks, setTasks] = useState([
    { id: genId(), title: 'Set up the first frame', status: 'pending', category: 'Setup' },
    { id: genId(), title: 'Add heading with core message', status: 'pending', category: 'Content' },
    { id: genId(), title: 'Drop in primary action button', status: 'pending', category: 'Interaction' },
  ]);

  const loadRefactorAutomation = () => {
    try {
      const stored = localStorage.getItem('frameforge-refactor-automation');
      if (!stored) {
        return {
          enabled: false,
          repoOwner: '',
          repoName: '',
          workflowId: 'copilot-refactor.yml',
          branch: 'main',
          dryRun: true,
          apply: false,
          hotspotThreshold: 250,
          token: '',
        };
      }
      const parsed = JSON.parse(stored);
      return {
        enabled: Boolean(parsed.enabled),
        repoOwner: parsed.repoOwner || '',
        repoName: parsed.repoName || '',
        workflowId: parsed.workflowId || 'copilot-refactor.yml',
        branch: parsed.branch || 'main',
        dryRun: parsed.dryRun !== undefined ? Boolean(parsed.dryRun) : true,
        apply: parsed.apply !== undefined ? Boolean(parsed.apply) : false,
        hotspotThreshold: Number.isFinite(parsed.hotspotThreshold) ? parsed.hotspotThreshold : 250,
        token: parsed.token || '',
      };
    } catch (error) {
      console.warn('Failed to parse refactor automation preferences:', error);
      return {
        enabled: false,
        repoOwner: '',
        repoName: '',
        workflowId: 'copilot-refactor.yml',
        branch: 'main',
        dryRun: true,
        apply: false,
        hotspotThreshold: 250,
        token: '',
      };
    }
  };

  const [refactorAutomation, setRefactorAutomation] = useState(loadRefactorAutomation);

  useEffect(() => {
    if (apiKey !== aiIntegration.apiKey) {
      aiIntegration.setApiKey(apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    if (selectedModel !== aiIntegration.selectedModel) {
      aiIntegration.setModel(selectedModel);
    }
  }, [selectedModel]);

  useEffect(() => {
    setChatLLMConfig(prev => (
      prev.model === selectedModel && prev.provider === 'OpenRouter'
        ? prev
        : {
            ...prev,
            provider: 'OpenRouter',
            model: selectedModel,
          }
    ));
  }, [selectedModel]);

  useEffect(() => {
    try {
      localStorage.setItem('frameforge-refactor-automation', JSON.stringify(refactorAutomation));
      try { window.dispatchEvent(new CustomEvent('ff:automation:updated', { detail: { refactorAutomation } })); } catch {}
    } catch (error) {
      console.warn('Failed to persist refactor automation preferences:', error);
    }
  }, [refactorAutomation]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem('frameforge-doc', JSON.stringify(doc));
    } catch (error) {
      console.warn('Failed to persist document state:', error);
    }
  }, [doc]);

  useEffect(() => {
    try {
      localStorage.setItem('frameforge-backend', JSON.stringify(backendGraph));
    } catch (e) {
      console.warn('Failed to persist backend graph:', e);
    }
  }, [backendGraph]);

  return {
    // Document state
    doc,
    setDoc,
    activeScreenId,
    setActiveScreenId,
    selectedFrameId,
    setSelectedFrameId,
    selectedNodeId,
    setSelectedNodeId,
    menu,
    setMenu,
    
    // Analysis state
    designAnalysis,
    setDesignAnalysis,
    showBMADPanel,
    setShowBMADPanel,
    showAIPanel,
    setShowAIPanel,
    showAdvancedPanel,
    setShowAdvancedPanel,
    
    // AI state
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    creativeSuggestions,
    setCreativeSuggestions,
    realTimeFeedback,
    setRealTimeFeedback,
    inspiredComponents,
    setInspiredComponents,
    designIntelligence,
    setDesignIntelligence,
    designPatterns,
    setDesignPatterns,
    
    // UI config
    zoom,
    showGrid,
    snapToGrid,
    
    // Component state
    componentMenus,
    setComponentMenus,
    componentComments,
    setComponentComments,
    frameTitleOptions,
    setFrameTitleOptions,
  centerViewMode,
  setCenterViewMode,
    chatPanelMode,
    setChatPanelMode,
    chatMessages,
    setChatMessages,
  mermaidDefinition,
  setMermaidDefinition,
    chatLLMConfig,
    setChatLLMConfig,
    chatPolicies,
    setChatPolicies,
    agentWorkflowRules,
    setAgentWorkflowRules,
    tasks,
    setTasks,
    refactorAutomation,
    setRefactorAutomation,
    backendGraph,
    setBackendGraph,
    uiHintsEnabled,
    setUiHintsEnabled,
  };
};
