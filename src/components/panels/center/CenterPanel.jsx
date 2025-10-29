import React, { Suspense } from 'react';
import ScreenTabs from '../../ScreenTabs';
import Toolbar from '../../Toolbar';
import Canvas from '../../Canvas';
const WorkflowEditor = React.lazy(() => import('../../WorkflowEditor.jsx'));

const CenterPanel = (props) => {
  const {
    screens,
    activeScreenId,
    setActiveScreenId,
    setDoc,
    uiHintsEnabled,
    onAddFrame,
    onAnalyzeDesign,
    onApplyEdits,
    exportDoc,
    importDoc,
    handleFocusChat,
    handleFocusTasks,
    selectedFrame,
    centerViewMode,
    handleCenterViewChange,
    canvasRef,
    framesForActiveScreen,
    selectedFrameId,
    selectedNodeId,
    showGrid,
    zoom,
    handleCanvasClick,
    handleFrameMouseDown,
    handleResizeMouseDown,
    handleComponentDrag,
    showMenu,
    updateFrame,
    updateNode,
    showComponentMenu,
    handleCreateScreen,
    handleCreateModalFrame,
    componentMenus,
    getComponent,
    closeComponentMenu,
    addComponentComment,
    getComponentComments,
    frameTitleOptions,
    handleSelectFrameTitle,
    handleAddFrameTitleOption,
    handleDeleteFrame,
    handleDeleteComponent,
    onAskCopilot,
    backendGraph,
    setBackendGraph,
  } = props;

  return (
    <div className="panel center">
      <ScreenTabs screens={screens} activeScreenId={activeScreenId} setActiveScreenId={setActiveScreenId} setDoc={setDoc} uiHintsEnabled={uiHintsEnabled} />
      <Toolbar
        onAddFrame={onAddFrame}
        onAnalyzeDesign={onAnalyzeDesign}
        onApplyEdits={onApplyEdits}
        onExport={exportDoc}
        onImport={importDoc}
        onShowAIPanel={handleFocusChat}
        onShowAdvancedPanel={handleFocusTasks}
        selectedFrame={selectedFrame}
        viewMode={centerViewMode}
        onChangeView={handleCenterViewChange}
      />

      {centerViewMode === 'design' ? (
        <Canvas
          canvasRef={canvasRef}
          frames={framesForActiveScreen}
          screens={screens}
          selectedFrameId={selectedFrameId}
          selectedNodeId={selectedNodeId}
          showGrid={showGrid}
          zoom={zoom}
          onCanvasClick={handleCanvasClick}
          onFrameMouseDown={handleFrameMouseDown}
          onResizeMouseDown={handleResizeMouseDown}
          onComponentMouseDown={handleComponentDrag}
          onShowMenu={showMenu}
          onUpdateFrame={updateFrame}
          onUpdateNode={updateNode}
          onShowComponentMenu={showComponentMenu}
          onCreateScreen={handleCreateScreen}
          onCreateModalFrame={handleCreateModalFrame}
          componentMenus={componentMenus}
          getComponent={getComponent}
          closeComponentMenu={closeComponentMenu}
          addComponentComment={addComponentComment}
          getComponentComments={getComponentComments}
          frameTitleOptions={frameTitleOptions}
          onSelectFrameTitle={handleSelectFrameTitle}
          onAddFrameTitleOption={handleAddFrameTitleOption}
          onDeleteFrame={handleDeleteFrame}
          onDeleteComponent={handleDeleteComponent}
          uiHintsEnabled={uiHintsEnabled}
          onAskCopilot={onAskCopilot}
        />
      ) : (
        <Suspense fallback={<div className="panel-loading">Loading diagram workspace…</div>}>
          <WorkflowEditor backendGraph={backendGraph} onChange={setBackendGraph} />
        </Suspense>
      )}
    </div>
  );
};

export default CenterPanel;
