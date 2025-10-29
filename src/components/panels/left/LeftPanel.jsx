import React from 'react';
import ChatPanel from './ChatPanel';
import ChatSettings from './ChatSettings';

const LeftPanel = (props) => {
  const {
    chatPanelMode,
    chatPanelTitle,
    chatPanelSubtitle,
    chatSettingsButtonIcon,
    chatSettingsButtonLabel,
    handleToggleChatSettings,
    uiHintsEnabled,
  } = props;

  const isChatSettingsMode = chatPanelMode === 'settings';

  return (
    <div className="panel left">
      <div className="panel-header">
        <div>
          <h4>{chatPanelTitle}</h4>
          <p className="panel-subtitle">{chatPanelSubtitle}</p>
        </div>
        <div className="panel-header-actions">
          <span className="status-dot">● online</span>
          <button
            type="button"
            className={`panel-icon-button${isChatSettingsMode ? ' panel-icon-button--active' : ''}`}
            onClick={handleToggleChatSettings}
            aria-pressed={isChatSettingsMode}
            aria-label={uiHintsEnabled ? chatSettingsButtonLabel : undefined}
            title={uiHintsEnabled ? chatSettingsButtonLabel : undefined}
          >
            {chatSettingsButtonIcon}
          </button>
        </div>
      </div>
      <div className="chat-panel">
        {isChatSettingsMode ? <ChatSettings {...props} /> : <ChatPanel {...props} />}
      </div>
    </div>
  );
};

export default LeftPanel;
