import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

let mermaidInitialized = false;
let mermaidInstance = null;
let mermaidLoadPromise = null;

const loadMermaid = async () => {
  if (mermaidInstance) return mermaidInstance;

  if (!mermaidLoadPromise) {
    mermaidLoadPromise = import('mermaid/dist/mermaid.esm.min.mjs')
      .then((module) => {
        const mermaid = module.default || module;
        if (!mermaidInitialized) {
          mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' });
          mermaidInitialized = true;
        }
        mermaidInstance = mermaid;
        return mermaid;
      })
      .catch((error) => {
        mermaidLoadPromise = null;
        throw error;
      });
  }

  return mermaidLoadPromise;
};

const MermaidCanvas = ({ definition, onChange, onRefresh }) => {
  const containerRef = useRef(null);
  const diagramIdRef = useRef(`mermaid-diagram-${Math.random().toString(36).slice(2, 9)}`);
  const renderTimeoutRef = useRef(null);
  const lastRenderedRef = useRef('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mermaidApi, setMermaidApi] = useState(null);
  const [zoom, setZoom] = useState(1);

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const handleZoomIn = () => setZoom((z) => clamp(parseFloat((z + 0.1).toFixed(2)), 0.25, 3));
  const handleZoomOut = () => setZoom((z) => clamp(parseFloat((z - 0.1).toFixed(2)), 0.25, 3));
  // const handleZoomReset = () => setZoom(1);

  useEffect(() => {
    let active = true;
    loadMermaid()
      .then((mermaid) => {
        if (!active) return;
        setMermaidApi(mermaid);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to load Mermaid renderer.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !mermaidApi || isLoading) return;

    const normalizedDefinition = definition?.trim() ? definition : 'flowchart TD; A[No data]';

    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    let cancelled = false;

    renderTimeoutRef.current = setTimeout(async () => {
      if (cancelled) return;
      if (normalizedDefinition === lastRenderedRef.current) return;

      try {
        const { svg } = await mermaidApi.render(diagramIdRef.current, normalizedDefinition);
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        lastRenderedRef.current = normalizedDefinition;
        setError(null);

        const rendered = containerRef.current.querySelector('svg');
        if (rendered) {
          rendered.style.transform = `scale(${zoom})`;
          rendered.style.transformOrigin = 'top left';
          rendered.style.maxWidth = 'none';
          rendered.style.width = 'auto';
          rendered.style.height = 'auto';
          rendered.style.display = 'block';
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Mermaid render error:', err);
        if (containerRef.current) containerRef.current.innerHTML = '';
        setError(err?.str || err?.message || 'Unable to render Mermaid diagram.');
      }
    }, 200);

    return () => {
      cancelled = true;
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
    };
  }, [definition, mermaidApi, isLoading]);

  // Re-apply zoom to the rendered SVG when zoom changes
  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg');
    if (svg) {
      svg.style.transform = `scale(${zoom})`;
      svg.style.transformOrigin = 'top left';
    }
  }, [zoom]);

  const handleWheel = (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = Math.sign(event.deltaY);
      if (delta > 0) handleZoomOut();
      else if (delta < 0) handleZoomIn();
    }
  };

  return (
    <div className="mermaid-container">
      <div className="mermaid-editor">
        <div className="mermaid-editor__header">
          <h5>Mermaid Definition</h5>
          <div className="mermaid-editor__actions">
            <button type="button" onClick={onRefresh}>Refresh from UI</button>
          </div>
        </div>
        <textarea
          value={definition}
          onChange={(event) => onChange(event.target.value)}
          spellCheck="false"
        />
        {error && <div className="mermaid-error">⚠ {error}</div>}
      </div>

      <div className="mermaid-preview" onWheel={handleWheel}>
        <div className="mermaid-zoom-controls" role="toolbar" aria-label="Zoom">
          <button type="button" className="mermaid-zoom-btn" title="Zoom out" onClick={handleZoomOut}>−</button>
          <button type="button" className="mermaid-zoom-btn" title="Zoom in" onClick={handleZoomIn}>+</button>
        </div>
        <div className="mermaid-viewport" ref={containerRef} />
        {isLoading && <div className="mermaid-loading">Loading Mermaid renderer…</div>}
      </div>
    </div>
  );
};

MermaidCanvas.propTypes = {
  definition: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default MermaidCanvas;
