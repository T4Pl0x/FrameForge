import { genId } from '../componentRegistry/index.js';
import { useKernel } from '../kernel/KernelProvider.jsx';

const DEFAULT_FRAME_PROPS = {
  x: 100,
  y: 100,
  width: 300,
  height: 200,
  radius: 12,
  padding: 12,
  gap: 8,
  shadow: '',
  cornerStyle: 'rounded',
  title: 'Untitled Frame',
};

const isFiniteNumber = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const sanitizeNode = (node) => {
  if (!node || typeof node !== 'object') {
    return {
      id: genId(),
      type: 'text',
      content: '',
      props: { x: 20, y: 20 },
    };
  }

  return {
    id: node.id ?? genId(),
    type: typeof node.type === 'string' && node.type.trim() ? node.type : 'text',
    content: typeof node.content === 'string' ? node.content : '',
    props: {
      x: isFiniteNumber(node.props?.x, 20),
      y: isFiniteNumber(node.props?.y, 20),
    },
  };
};

const sanitizeFrame = (frame) => {
  if (!frame || typeof frame !== 'object') {
    return {
      id: genId(),
      ...DEFAULT_FRAME_PROPS,
      screenId: 'screen-main',
      nodes: [],
    };
  }

  const safeFrame = {
    id: frame.id ?? genId(),
    x: isFiniteNumber(frame.x, DEFAULT_FRAME_PROPS.x),
    y: isFiniteNumber(frame.y, DEFAULT_FRAME_PROPS.y),
    width: isFiniteNumber(frame.width, DEFAULT_FRAME_PROPS.width),
    height: isFiniteNumber(frame.height, DEFAULT_FRAME_PROPS.height),
    radius: isFiniteNumber(frame.radius, DEFAULT_FRAME_PROPS.radius),
    padding: isFiniteNumber(frame.padding, DEFAULT_FRAME_PROPS.padding),
    gap: isFiniteNumber(frame.gap, DEFAULT_FRAME_PROPS.gap),
    shadow: typeof frame.shadow === 'string' ? frame.shadow : DEFAULT_FRAME_PROPS.shadow,
    cornerStyle:
      typeof frame.cornerStyle === 'string' && frame.cornerStyle.trim()
        ? frame.cornerStyle
        : DEFAULT_FRAME_PROPS.cornerStyle,
    title: typeof frame.title === 'string' && frame.title.trim()
      ? frame.title
      : DEFAULT_FRAME_PROPS.title,
    screenId: typeof frame.screenId === 'string' && frame.screenId.trim() ? frame.screenId : 'screen-main',
  };

  safeFrame.nodes = Array.isArray(frame.nodes)
    ? frame.nodes.map(sanitizeNode)
    : [];

  return safeFrame;
};

const normalizeDocument = (rawDoc) => {
  if (!rawDoc || typeof rawDoc !== 'object') {
    throw new Error('Document root is not a valid object');
  }

  const frames = Array.isArray(rawDoc.frames)
    ? rawDoc.frames.map(sanitizeFrame)
    : [];

  const screens = Array.isArray(rawDoc.screens) && rawDoc.screens.length > 0
    ? rawDoc.screens.map((s, idx) => ({
        id: typeof s.id === 'string' && s.id ? s.id : `screen-${idx}`,
        name: typeof s.name === 'string' && s.name ? s.name : `Screen ${idx + 1}`,
        order: Number.isFinite(s.order) ? s.order : idx,
        isDefault: Boolean(s.isDefault) || idx === 0,
      }))
    : [{ id: 'screen-main', name: 'Main', order: 0, isDefault: true }];

  return {
    screens,
    frames,
  };
};

/**
 * Custom hook for document operations
 * Encapsulates all document-related business logic
 */
export const useDocumentOperations = (doc, setDoc, setMenu, activeScreenId) => {
  const kernelCtx = (() => {
    try { return useKernel(); } catch { return null; }
  })();

  const submitProposal = async (patches, title, rationale, idempotencyKey) => {
    if (!kernelCtx) return;
    const id = kernelCtx.proposals.propose({
      target: 'ui.json',
      patch: patches,
      rationale: rationale || title || 'UI edit',
      metadata: {
        title: title || 'UI edit',
        sourceExtension: '@frameforge/ext-ui',
        scope: ['ui'],
        labels: ['ui', 'geometry']
      },
      idempotencyKey
    });
    try { kernelCtx.proposals.preflight(id); } catch {}
    // Do not auto-approve/apply here
  };

  // Batched gesture buffer
  let batchBuffer = [];
  let batchGestureId = null;
  let batchTimer = null;

  const startGesture = () => {
    batchGestureId = `gst_${Math.random().toString(36).slice(2, 10)}`;
  };

  const enqueueOps = (ops) => {
    if (!Array.isArray(ops) || ops.length === 0) return;
    batchBuffer.push(...ops);
  };

  const flushBatch = () => {
    if (!batchBuffer.length) return;
    const ops = batchBuffer.splice(0, batchBuffer.length);
    const idem = batchGestureId ? `idem:${batchGestureId}` : undefined;
    submitProposal(ops, 'UI gesture: batched edits', 'Batched drag/resize gesture', idem);
    batchGestureId = null;
    if (batchTimer) { clearTimeout(batchTimer); batchTimer = null; }
  };

  const cancelBatch = () => {
    batchBuffer = [];
    batchGestureId = null;
    if (batchTimer) { clearTimeout(batchTimer); batchTimer = null; }
  };

  const idxByFrameId = (id) => {
    try {
      const spec = kernelCtx?.store?.snapshot()?.spec;
      const frames = spec?.ui?.frames || [];
      return frames.findIndex((f) => f.id === id);
    } catch { return -1; }
  };

  const idxByNodeId = (frame, nodeId) => {
    if (!frame) return -1;
    const nodes = Array.isArray(frame.nodes) ? frame.nodes : [];
    return nodes.findIndex((n) => n.id === nodeId);
  };

  // When spec changes (approved + applied), refresh local view from spec.ui
  try {
    if (kernelCtx?.bus && typeof window !== 'undefined') {
      kernelCtx.bus.on('spec:changed', ({ spec }) => {
        if (spec?.ui) setDoc(spec.ui);
      });
    }
  } catch {}
  // Add a new frame to the document
  const addFrame = (overrides = {}) => {
    const newFrame = {
      id: genId(),
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      radius: 12,
      padding: 12,
      gap: 8,
      shadow: '',
      cornerStyle: 'rounded',
      title: 'Untitled Frame',
      screenId: activeScreenId || (doc.screens && doc.screens[0]?.id) || 'screen-main',
      nodes: [],
      ...overrides
    };
    submitProposal([
      { op: 'add', path: '/ui/frames/-', value: newFrame }
    ], 'UI edit: add frame', 'User added a frame on canvas');
    
    return newFrame.id;
  };

  // Add a component to a frame
  const addComponent = (frameId, componentType) => {
    const fi = idxByFrameId(frameId);
    if (fi < 0) return;
    const newNode = {
      id: genId(),
      type: componentType,
      content: '',
      props: {
        x: 20,
        y: 20
      }
    };
    submitProposal([
      { op: 'add', path: `/ui/frames/${fi}/nodes/-`, value: newNode }
    ], 'UI edit: add component', `Add ${componentType} to frame`);
    setMenu(null);
  };

  // Update node properties
  const updateNode = (frameId, nodeId, updates) => {
    const fi = idxByFrameId(frameId);
    if (fi < 0) return;
    const spec = kernelCtx?.store?.snapshot()?.spec;
    const frame = spec?.ui?.frames?.[fi];
    const ni = idxByNodeId(frame, nodeId);
    if (ni < 0) return;
    const ops = [];
    if (updates.type !== undefined) ops.push({ op: 'replace', path: `/ui/frames/${fi}/nodes/${ni}/type`, value: updates.type });
    if (updates.content !== undefined) ops.push({ op: 'replace', path: `/ui/frames/${fi}/nodes/${ni}/content`, value: updates.content });
    if (updates.props && typeof updates.props === 'object') {
      for (const [k, v] of Object.entries(updates.props)) {
        ops.push({ op: 'replace', path: `/ui/frames/${fi}/nodes/${ni}/props/${k}`, value: v });
      }
    }
    if (ops.length) submitProposal(ops, 'UI edit: update node', 'User updated a node');
  };

  // Update frame properties
  const updateFrame = (frameId, updates) => {
    const fi = idxByFrameId(frameId);
    if (fi < 0) return;
    const ops = [];
    for (const [k, v] of Object.entries(updates || {})) {
      ops.push({ op: 'replace', path: `/ui/frames/${fi}/${k}`, value: v });
    }
    if (ops.length) submitProposal(ops, 'UI edit: update frame', 'User updated frame properties');
  };

  const enqueueFrameUpdate = (frameId, updates) => {
    const fi = idxByFrameId(frameId);
    if (fi < 0) return;
    const ops = [];
    for (const [k, v] of Object.entries(updates || {})) {
      ops.push({ op: 'replace', path: `/ui/frames/${fi}/${k}`, value: v });
    }
    enqueueOps(ops);
  };

  const enqueueNodeUpdate = (frameId, nodeId, updates) => {
    const fi = idxByFrameId(frameId);
    if (fi < 0) return;
    const spec = kernelCtx?.store?.snapshot()?.spec;
    const frame = spec?.ui?.frames?.[fi];
    const ni = idxByNodeId(frame, nodeId);
    if (ni < 0) return;
    const ops = [];
    if (updates.props && typeof updates.props === 'object') {
      for (const [k, v] of Object.entries(updates.props)) {
        ops.push({ op: 'replace', path: `/ui/frames/${fi}/nodes/${ni}/props/${k}`, value: v });
      }
    }
    enqueueOps(ops);
  };

  const removeFrame = (frameId) => {
    const fi = idxByFrameId(frameId);
    if (fi < 0) return;
    submitProposal([{ op: 'remove', path: `/ui/frames/${fi}` }], 'UI edit: remove frame', 'User removed a frame');
    setMenu(prev => (prev?.frameId === frameId ? null : prev));
  };

  const removeComponent = (frameId, nodeId) => {
    const fi = idxByFrameId(frameId);
    if (fi < 0) return;
    const spec = kernelCtx?.store?.snapshot()?.spec;
    const frame = spec?.ui?.frames?.[fi];
    const ni = idxByNodeId(frame, nodeId);
    if (ni < 0) return;
    submitProposal([{ op: 'remove', path: `/ui/frames/${fi}/nodes/${ni}` }], 'UI edit: remove component', 'User removed a component');
  };

  // Export document as JSON
  const exportDoc = () => {
    const dataStr = JSON.stringify(doc, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'frameforge-export.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import document from JSON file
  const importDoc = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedDoc = JSON.parse(e.target.result);
        const normalizedDoc = normalizeDocument(importedDoc);
        submitProposal([{ op: 'replace', path: '/ui', value: normalizedDoc }], 'UI replace: import', 'Imported document');
        setMenu(null);
      } catch (error) {
        console.error('Error importing document:', error);
        window.alert('The selected file could not be imported. Please verify it is a valid FrameForge export.');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return {
    addFrame,
    startGesture,
    enqueueFrameUpdate,
    enqueueNodeUpdate,
    flushBatch,
    cancelBatch,
    addScreen: (screen) => {
      const scr = screen || { id: `screen-${Date.now().toString(36)}`, name: 'Screen', order: (doc.screens?.length || 0), isDefault: false };
      submitProposal([{ op: 'add', path: '/ui/screens/-', value: scr }], 'UI edit: add screen', 'User added a screen');
      return scr.id;
    },
    addComponent,
    updateNode,
    updateFrame,
    removeFrame,
    removeComponent,
    exportDoc,
    importDoc,
  };
};

