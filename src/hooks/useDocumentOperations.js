import { genId } from '../componentRegistry/index.js';

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
  // Add a new frame to the document
  const addFrame = () => {
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
      nodes: []
    };
    
    setDoc(prev => ({
      ...prev,
      frames: [...prev.frames, newFrame]
    }));
    
    return newFrame.id;
  };

  // Add a component to a frame
  const addComponent = (frameId, componentType) => {
    setDoc(prev => ({
      ...prev,
      frames: prev.frames.map(frame => {
        if (frame.id === frameId) {
          const newNode = {
            id: genId(),
            type: componentType,
            content: '',
            props: {
              x: 20 + (frame.nodes.length * 10),
              y: 20 + (frame.nodes.length * 10)
            }
          };
          const next = { ...frame, nodes: [...frame.nodes, newNode] };
          next.changeFlags = { ...(frame.changeFlags || {}), added: true };
          next.lastChangedAt = Date.now();
          return next;
        }
        return frame;
      })
    }));
    setMenu(null);
  };

  // Update node properties
  const updateNode = (frameId, nodeId, updates) => {
    setDoc(prev => ({
      ...prev,
      frames: prev.frames.map(frame => {
        if (frame.id === frameId) {
          const next = {
            ...frame,
            nodes: frame.nodes.map(node => (node.id === nodeId ? { ...node, ...updates } : node))
          };
          next.changeFlags = { ...(frame.changeFlags || {}), edited: true };
          next.lastChangedAt = Date.now();
          return next;
        }
        return frame;
      })
    }));
  };

  // Update frame properties
  const updateFrame = (frameId, updates) => {
    setDoc(prev => ({
      ...prev,
      frames: prev.frames.map(frame => {
        if (frame.id === frameId) {
          const moved = ('x' in updates) || ('y' in updates);
          const resized = ('width' in updates) || ('height' in updates);
          const next = { ...frame, ...updates };
          if (moved || resized) {
            next.changeFlags = { ...(frame.changeFlags || {}), moved: moved || undefined, resized: resized || undefined };
            next.lastChangedAt = Date.now();
          }
          return next;
        }
        return frame;
      })
    }));
  };

  const removeFrame = (frameId) => {
    setDoc(prev => ({
      ...prev,
      frames: prev.frames.filter(frame => frame.id !== frameId),
    }));
    setMenu(prev => (prev?.frameId === frameId ? null : prev));
  };

  const removeComponent = (frameId, nodeId) => {
    setDoc(prev => ({
      ...prev,
      frames: prev.frames.map(frame => {
        if (frame.id === frameId) {
          const next = { ...frame, nodes: frame.nodes.filter(node => node.id !== nodeId) };
          next.changeFlags = { ...(frame.changeFlags || {}), removed: true };
          next.lastChangedAt = Date.now();
          return next;
        }
        return frame;
      }),
    }));
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
        setDoc(normalizedDoc);
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
    addComponent,
    updateNode,
    updateFrame,
    removeFrame,
    removeComponent,
    exportDoc,
    importDoc,
  };
};

