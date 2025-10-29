import React from 'react';
import ModelPicker from '../../ModelPicker';

const ChatPanel = ({
  chatMessages,
  chatHistoryRef,
  isChatGenerating,
  formatTimestamp,
  chatInput,
  setChatInput,
  handleChatKeyDown,
  handleSendMessage,
  chatError,
  chatInputRef,
}) => {
  return (
    <>
      <div ref={chatHistoryRef} className="chat-history">
        {chatMessages.map(message => (
          <div key={message.id} className={`chat-message chat-message--${message.role}`}>
            <div className="chat-message__meta">
              <span className="chat-message__author">{message.role === 'assistant' ? 'FrameForge Copilot' : 'You'}</span>
              <span className="chat-message__time">{formatTimestamp(message.timestamp)}</span>
            </div>
            <p>{message.content}</p>
          </div>
        ))}
        {isChatGenerating && (
          <div className="chat-message chat-message--assistant chat-message--pending">
            <div className="chat-message__meta">
              <span className="chat-message__author">FrameForge Copilot</span>
              <span className="chat-message__time">{formatTimestamp(new Date().toISOString())}</span>
            </div>
            <p>Thinking through your layout…</p>
          </div>
        )}
        {chatMessages.length === 0 && (
          <div className="chat-empty">Start a conversation to get tailored guidance.</div>
        )}
      </div>
      <div className="chat-composer">
        <textarea
          ref={chatInputRef}
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          onKeyDown={handleChatKeyDown}
          placeholder="Ask anything about your interface..."
          aria-busy={isChatGenerating}
        />
        <div className="chat-actions">
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || isChatGenerating}
          >
            Send
          </button>
        </div>
        {chatError && (
          <div className="chat-error" role="status" aria-live="polite">
            {chatError}
          </div>
        )}
      </div>
    </>
  );
};

export default ChatPanel;
