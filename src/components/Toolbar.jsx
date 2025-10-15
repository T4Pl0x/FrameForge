import React from 'react';
import PropTypes from 'prop-types';

/**
 * Toolbar component - handles main application actions
 * Follows single responsibility principle
 */
const Toolbar = ({ 
  onAddFrame, 
  onAnalyzeDesign, 
  onApplyEdits,
  onExport, 
  onImport, 
  onShowAIPanel, 
  onShowAdvancedPanel,
  selectedFrame,
  viewMode,
  onChangeView,
}) => {
  return (
    <div className="toolbar">
      <button onClick={onAddFrame}>+ Frame</button>
      <button onClick={onAnalyzeDesign} disabled={!selectedFrame}>
        Analyze Design
      </button>
      <button onClick={onApplyEdits} title="Compile pending frame changes into tasks">
        Apply Edits
      </button>
      <button onClick={onShowAIPanel}>🤖 AI Assistant</button>
      <button onClick={onShowAdvancedPanel}>⚙️ Tools</button>
      <button onClick={onExport}>Export</button>
      <label className="fileio">
        Import
        <input type="file" accept=".json" onChange={onImport} />
      </label>
      <div className="toolbar-view-toggle" role="group" aria-label="Center canvas mode">
        <button
          type="button"
          className={`toolbar-view-toggle__option${viewMode === 'design' ? ' toolbar-view-toggle__option--active' : ''}`}
          onClick={() => onChangeView('design')}
          aria-pressed={viewMode === 'design'}
        >
          Design Canvas
        </button>
        <button
          type="button"
          className={`toolbar-view-toggle__option${viewMode === 'workflow' ? ' toolbar-view-toggle__option--active' : ''}`}
          onClick={() => onChangeView('workflow')}
          aria-pressed={viewMode === 'workflow'}
        >
          Workflow Nodes
        </button>
      </div>
    </div>
  );
};

Toolbar.propTypes = {
  onAddFrame: PropTypes.func.isRequired,
  onAnalyzeDesign: PropTypes.func.isRequired,
  onApplyEdits: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  onShowAIPanel: PropTypes.func.isRequired,
  onShowAdvancedPanel: PropTypes.func.isRequired,
  selectedFrame: PropTypes.object,
  viewMode: PropTypes.oneOf(['design', 'mermaid']).isRequired,
  onChangeView: PropTypes.func.isRequired,
};

export default Toolbar;
