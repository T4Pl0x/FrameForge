import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const formatContextLength = (value) => {
  if (!value) return null;
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M tokens`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k tokens`;
  }
  return `${value} tokens`;
};

export default function ModelPicker({
  models,
  value,
  onChange,
  isLoading,
  onRefresh,
  error,
  updatedAt,
  recommendedModel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(() => {
    if (models.length) {
      const match = models.find((model) => model.id === value);
      if (match) return match;
    }
    if (recommendedModel) {
      return recommendedModel;
    }
    return null;
  }, [models, recommendedModel, value]);

  const filteredModels = useMemo(() => {
    if (!query.trim()) {
      return models;
    }
    const normalized = query.trim().toLowerCase();
    return models.filter((model) =>
      model.name.toLowerCase().includes(normalized) ||
      model.id.toLowerCase().includes(normalized) ||
      (model.provider?.toLowerCase().includes(normalized))
    );
  }, [models, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClick = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleSelect = (modelId) => {
    onChange(modelId);
    setIsOpen(false);
  };

  const handleTriggerKey = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((open) => !open);
    }
  };

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
    setActiveIndex(0);
  };

  const handleOptionKeyDown = (event) => {
    if (!filteredModels.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filteredModels.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const active = filteredModels[activeIndex];
      if (active) {
        handleSelect(active.id);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const dropdown = listRef.current;
    if (!dropdown) return;
    const active = dropdown.querySelector('[data-active="true"]');
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen, filteredModels.length]);

  return (
    <div className="model-picker" ref={containerRef}>
      <button
        type="button"
        className="model-picker__trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onKeyDown={handleTriggerKey}
      >
        <div className="model-picker__trigger-text">
          <span className="model-picker__trigger-label">{selected?.name || 'Select a model'}</span>
          {selected?.provider && (
            <span className="model-picker__trigger-meta">{selected.provider}</span>
          )}
        </div>
        <span className="model-picker__chevron" aria-hidden="true">▾</span>
      </button>
      {isOpen && (
        <div
          className="model-picker__dropdown"
          role="listbox"
          aria-activedescendant={filteredModels[activeIndex]?.id ?? undefined}
        >
          <div className="model-picker__search">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search models…"
              autoFocus
              onKeyDown={handleOptionKeyDown}
            />
          </div>
          {filteredModels.length === 0 ? (
            <div className="model-picker__empty">No OpenRouter models available.</div>
          ) : (
            <div className="model-picker__options" ref={listRef}>
              {filteredModels.map((model, index) => {
                const isActive = model.id === value;
                const isKeyboardActive = index === activeIndex;
              const context = formatContextLength(model.contextLength);
              return (
                <button
                  key={model.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                    data-active={isKeyboardActive ? 'true' : 'false'}
                    className={`model-picker__option${isActive ? ' model-picker__option--active' : ''}${isKeyboardActive ? ' model-picker__option--focused' : ''}`}
                    onClick={() => handleSelect(model.id)}
                    onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="model-picker__option-header">
                    <span className="model-picker__option-name">{model.name}</span>
                    {isActive && <span className="model-picker__badge">Active</span>}
                    {!isActive && recommendedModel?.id === model.id && (
                      <span className="model-picker__badge model-picker__badge--recommended">Recommended</span>
                    )}
                  </div>
                  <div className="model-picker__option-meta">
                    <span>{model.provider}</span>
                    {context && <span>• {context}</span>}
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      <div className="model-picker__footer">
        <button
          type="button"
          className="model-picker__refresh"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
        <div className="model-picker__status">
          {error ? (
            <span className="model-picker__status-error">{error}</span>
          ) : updatedAt ? (
            <span>Verified {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          ) : (
            <span>Refresh to verify the OpenRouter catalog.</span>
          )}
        </div>
      </div>
    </div>
  );
}

ModelPicker.propTypes = {
  models: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    provider: PropTypes.string,
    contextLength: PropTypes.number,
  })).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
  error: PropTypes.string,
  updatedAt: PropTypes.instanceOf(Date),
  recommendedModel: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    provider: PropTypes.string,
  }),
};

ModelPicker.defaultProps = {
  value: '',
  isLoading: false,
  error: null,
  updatedAt: null,
  recommendedModel: null,
};
