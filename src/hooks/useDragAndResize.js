import { bmadMethodology } from '../bmadMethodology.js';

/**
 * Custom hook for drag and resize operations
 * Handles all mouse interactions for frames and components
 */
export const useDragAndResize = (
  updateFrame,
  updateNode,
  snapToGrid,
  setSelectedFrameId,
  setSelectedNodeId,
  canvasRef
) => {
  // Handle frame dragging
  const handleFrameMouseDown = (e, frameId, frame) => {
    // Ignore if clicking on frame controls or components
    if (e.target.closest('.resize-handle') || 
        e.target.closest('button') || 
        e.target.closest('.component') ||
        e.target.classList.contains('plus')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setSelectedFrameId(frameId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startFrameX = frame.x;
    const startFrameY = frame.y;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newX = startFrameX + deltaX;
      let newY = startFrameY + deltaY;

      // Snap to grid if enabled
      if (snapToGrid) {
        newX = Math.round(newX / 8) * 8;
        newY = Math.round(newY / 8) * 8;
      }

      // Constrain to canvas boundaries
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        newX = Math.max(20, Math.min(canvasRect.width - frame.width - 40, newX));
        newY = Math.max(20, Math.min(canvasRect.height - frame.height - 40, newY));
      }

      // Batch: queue ops; actual submit on flush in App integration
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ff:gesture:queue', { detail: { type: 'frame', frameId, updates: { x: newX, y: newY } } }));
        }
      } catch {}
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      try { window.dispatchEvent(new CustomEvent('ff:gesture:flush')); } catch {}
    };

    try { window.dispatchEvent(new CustomEvent('ff:gesture:start')); } catch {}
    document.body.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle frame resizing
  const handleResizeMouseDown = (e, frameId, frame) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = frame.width;
    const startHeight = frame.height;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = Math.max(200, startWidth + deltaX);
      let newHeight = Math.max(150, startHeight + deltaY);

      // Snap to grid if enabled
      if (snapToGrid) {
        newWidth = Math.round(newWidth / 8) * 8;
        newHeight = Math.round(newHeight / 8) * 8;
      }

      // Constrain maximum size to prevent overflow
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const maxWidth = canvasRect.width - frame.x - 40;
        const maxHeight = canvasRect.height - frame.y - 40;
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);
      }

      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ff:gesture:queue', { detail: { type: 'frame', frameId, updates: { width: newWidth, height: newHeight } } }));
        }
      } catch {}
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      try { window.dispatchEvent(new CustomEvent('ff:gesture:flush')); } catch {}
    };

    try { window.dispatchEvent(new CustomEvent('ff:gesture:start')); } catch {}
    document.body.style.cursor = 'nw-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle component dragging
  const handleComponentDrag = (e, frameId, nodeId, frame, node) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedNodeId(nodeId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = node.props?.x || 0;
    const startNodeY = node.props?.y || 0;

    // BMAD methodology: Validate initial component position
    const bmadAnalysis = bmadMethodology.analyzeFrame(frame, frame.nodes);
    const initialScore = bmadAnalysis?.score || 0;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Apply BMAD spacing guidelines (8px grid system)
      const newX = snapToGrid ? Math.round((startNodeX + deltaX) / 8) * 8 : startNodeX + deltaX;
      const newY = snapToGrid ? Math.round((startNodeY + deltaY) / 8) * 8 : startNodeY + deltaY;

      // Constrain to frame boundaries with BMAD accessibility guidelines  
      const nodeWidth = parseInt(node.props?.width) || 100;
      const nodeHeight = parseInt(node.props?.height) || 40;
      const constrainedX = Math.max(0, Math.min(frame.width - nodeWidth - 32, newX));
      const constrainedY = Math.max(0, Math.min(frame.height - nodeHeight - 64, newY));

      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ff:gesture:queue', { detail: { type: 'node', frameId, nodeId, updates: { props: { ...node.props, x: constrainedX, y: constrainedY } } } }));
        }
      } catch {}
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setSelectedNodeId(null);

      // BMAD methodology: Analyze design after move and provide feedback
      // Note: This could be enhanced with actual feedback display
      const finalAnalysis = bmadMethodology.analyzeFrame(frame, frame.nodes);
      if (finalAnalysis?.score < initialScore) {
        console.log('Design improvement needed after component move');
      }
      try { window.dispatchEvent(new CustomEvent('ff:gesture:flush')); } catch {}
    };

    try { window.dispatchEvent(new CustomEvent('ff:gesture:start')); } catch {}
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return {
    handleFrameMouseDown,
    handleResizeMouseDown,
    handleComponentDrag,
  };
};
