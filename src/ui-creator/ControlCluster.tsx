import React, { useState, useRef, useEffect } from 'react';
import { ControlClusterProps } from './types/selection';

export const ControlCluster: React.FC<ControlClusterProps> = ({
  selectedElements,
  onAddComponent,
  onDelete,
  onEditProps,
  position,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setActiveTab(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isMenuOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsMenuOpen(false);
          setActiveTab(null);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          // Navigate to next tab
          const tabs = ['props', 'data', 'layout', 'style', 'a11y', 'actions'];
          const currentIndex = activeTab ? tabs.indexOf(activeTab) : -1;
          const nextIndex = (currentIndex + 1) % tabs.length;
          setActiveTab(tabs[nextIndex]);
          break;
        case 'ArrowUp':
          event.preventDefault();
          // Navigate to previous tab
          const tabsUp = ['props', 'data', 'layout', 'style', 'a11y', 'actions'];
          const currentIndexUp = activeTab ? tabsUp.indexOf(activeTab) : 0;
          const prevIndex = currentIndexUp <= 0 ? tabsUp.length - 1 : currentIndexUp - 1;
          setActiveTab(tabsUp[prevIndex]);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, activeTab]);

  const handleAddClick = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setActiveTab('props');
    }
  };

  const handleDeleteClick = () => {
    if (selectedElements.length > 0) {
      const confirmed = window.confirm(
        `Delete ${selectedElements.length} element${selectedElements.length > 1 ? 's' : ''}?`
      );
      if (confirmed) {
        onDelete();
      }
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'actions') {
      onEditProps();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'props':
        return (
          <div className="control-cluster__tab-content">
            <h4>Properties</h4>
            <div className="control-cluster__form-group">
              <label>Element Type</label>
              <select>
                <option>Button</option>
                <option>Input</option>
                <option>Text</option>
                <option>Container</option>
              </select>
            </div>
            <div className="control-cluster__form-group">
              <label>Content</label>
              <input type="text" placeholder="Enter content..." />
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="control-cluster__tab-content">
            <h4>Data Binding</h4>
            <div className="control-cluster__form-group">
              <label>Data Source</label>
              <select>
                <option>None</option>
                <option>API Response</option>
                <option>Local State</option>
              </select>
            </div>
            <div className="control-cluster__form-group">
              <label>Field Mapping</label>
              <input type="text" placeholder="field.name" />
            </div>
          </div>
        );

      case 'layout':
        return (
          <div className="control-cluster__tab-content">
            <h4>Layout</h4>
            <div className="control-cluster__form-group">
              <label>Position</label>
              <div className="control-cluster__input-row">
                <input type="number" placeholder="X" />
                <input type="number" placeholder="Y" />
              </div>
            </div>
            <div className="control-cluster__form-group">
              <label>Size</label>
              <div className="control-cluster__input-row">
                <input type="number" placeholder="Width" />
                <input type="number" placeholder="Height" />
              </div>
            </div>
          </div>
        );

      case 'style':
        return (
          <div className="control-cluster__tab-content">
            <h4>Style</h4>
            <div className="control-cluster__form-group">
              <label>Background Color</label>
              <input type="color" />
            </div>
            <div className="control-cluster__form-group">
              <label>Text Color</label>
              <input type="color" />
            </div>
            <div className="control-cluster__form-group">
              <label>Border Radius</label>
              <input type="range" min="0" max="20" />
            </div>
          </div>
        );

      case 'a11y':
        return (
          <div className="control-cluster__tab-content">
            <h4>Accessibility</h4>
            <div className="control-cluster__form-group">
              <label>ARIA Label</label>
              <input type="text" placeholder="Enter accessible name..." />
            </div>
            <div className="control-cluster__form-group">
              <label>ARIA Role</label>
              <select>
                <option>button</option>
                <option>link</option>
                <option>textbox</option>
                <option>none</option>
              </select>
            </div>
            <div className="control-cluster__form-group">
              <label>
                <input type="checkbox" />
                Skip to content link
              </label>
            </div>
          </div>
        );

      case 'actions':
        return (
          <div className="control-cluster__tab-content">
            <h4>Actions</h4>
            <div className="control-cluster__form-group">
              <label>On Click</label>
              <select>
                <option>None</option>
                <option>Navigate to Screen</option>
                <option>Open Modal</option>
                <option>Call API</option>
                <option>Set State</option>
              </select>
            </div>
            <div className="control-cluster__form-group">
              <label>On Hover</label>
              <select>
                <option>None</option>
                <option>Show Tooltip</option>
                <option>Change Style</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedElements.length === 0) {
    return null;
  }

  return (
    <div
      className="control-cluster"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      <div className="control-cluster__buttons">
        <button
          ref={buttonRef}
          type="button"
          className="control-cluster__add-button"
          onClick={handleAddClick}
          aria-label="Add component"
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
        >
          +
        </button>

        <button
          type="button"
          className="control-cluster__delete-button"
          onClick={handleDeleteClick}
          aria-label={`Delete ${selectedElements.length} element${selectedElements.length > 1 ? 's' : ''}`}
        >
          🗑
        </button>
      </div>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="control-cluster__menu"
          role="menu"
          aria-labelledby="add-button"
        >
          <div className="control-cluster__tabs" role="tablist">
            {['props', 'data', 'layout', 'style', 'a11y', 'actions'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`control-cluster__tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabClick(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tab}-panel`}
                tabIndex={activeTab === tab ? 0 : -1}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div
            className="control-cluster__panel"
            role="tabpanel"
            id={`${activeTab}-panel`}
            aria-labelledby={`${activeTab}-tab`}
          >
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlCluster;