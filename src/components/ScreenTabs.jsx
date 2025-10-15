import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTab({ screen, active, onSelect, onRename, onMoveLeft, onMoveRight, onDelete, uiHintsEnabled }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: screen.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={`screen-tab${active ? ' screen-tab--active' : ''}`} role="tab" aria-selected={active}>
      <button className="screen-tab__label" onClick={() => onSelect(screen.id)} title={uiHintsEnabled ? screen.name : undefined} {...attributes} {...listeners}>
        {screen.name}
      </button>
      <div className="screen-tab__actions">
        <button className="screen-tab__btn" title={uiHintsEnabled ? 'Rename' : undefined} aria-label={uiHintsEnabled ? 'Rename' : undefined} onClick={() => onRename(screen)}>✎</button>
        <button className="screen-tab__btn" title={uiHintsEnabled ? 'Move left' : undefined} aria-label={uiHintsEnabled ? 'Move left' : undefined} onClick={() => onMoveLeft(screen)}>◄</button>
        <button className="screen-tab__btn" title={uiHintsEnabled ? 'Move right' : undefined} aria-label={uiHintsEnabled ? 'Move right' : undefined} onClick={() => onMoveRight(screen)}>►</button>
        <button className="screen-tab__btn" title={uiHintsEnabled ? 'Delete' : undefined} aria-label={uiHintsEnabled ? 'Delete' : undefined} onClick={() => onDelete(screen)}>×</button>
      </div>
    </div>
  );
}

SortableTab.propTypes = {
  screen: PropTypes.object.isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onMoveLeft: PropTypes.func.isRequired,
  onMoveRight: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  uiHintsEnabled: PropTypes.bool,
};

export default function ScreenTabs({ screens, activeScreenId, setActiveScreenId, setDoc, uiHintsEnabled = true }) {
  const ordered = useMemo(() => (Array.isArray(screens) ? [...screens].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []), [screens]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 4 } })
  );

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
    const currentOrder = ordered.map((s) => s.id);
    const oldIndex = currentOrder.indexOf(active.id);
    const newIndex = currentOrder.indexOf(over.id);
    const nextIds = arrayMove(currentOrder, oldIndex, newIndex);
    // write back orders
    setDoc((prev) => ({
      ...prev,
      screens: prev.screens.map((s) => ({
        ...s,
        order: nextIds.indexOf(s.id),
      })),
    }));
  };

  const rename = (s) => {
    const next = prompt('Rename screen', s.name);
    if (next && next.trim()) {
      setDoc((prev) => ({
        ...prev,
        screens: prev.screens.map((sc) => (sc.id === s.id ? { ...sc, name: next.trim() } : sc)),
      }));
    }
  };

  const moveLeft = (s) => {
    const idx = ordered.findIndex((x) => x.id === s.id);
    if (idx <= 0) return;
    const a = ordered[idx - 1];
    const b = ordered[idx];
    setDoc((prev) => ({
      ...prev,
      screens: prev.screens.map((sc) => (sc.id === a.id ? { ...sc, order: b.order } : sc.id === b.id ? { ...sc, order: a.order } : sc)),
    }));
  };

  const moveRight = (s) => {
    const idx = ordered.findIndex((x) => x.id === s.id);
    if (idx === -1 || idx >= ordered.length - 1) return;
    const a = ordered[idx];
    const b = ordered[idx + 1];
    setDoc((prev) => ({
      ...prev,
      screens: prev.screens.map((sc) => (sc.id === a.id ? { ...sc, order: b.order } : sc.id === b.id ? { ...sc, order: a.order } : sc)),
    }));
  };

  const remove = (s) => {
    const remaining = ordered.filter((x) => x.id !== s.id);
    if (remaining.length === 0) {
      alert('At least one screen is required.');
      return;
    }
    const targetId = remaining[0].id;
    setDoc((prev) => ({
      ...prev,
      screens: prev.screens.filter((sc) => sc.id !== s.id).map((sc, i) => ({ ...sc, order: i })),
      frames: prev.frames.map((f) => (f.screenId === s.id ? { ...f, screenId: targetId } : f)),
    }));
    if (activeScreenId === s.id) setActiveScreenId(targetId);
  };

  const add = () => {
    const id = `screen-${Date.now().toString(36)}`;
    const order = ordered.length;
    const name = `Screen ${ordered.length + 1}`;
    setDoc((prev) => ({ ...prev, screens: [...ordered, { id, name, order, isDefault: false }] }));
    setActiveScreenId(id);
  };

  return (
    <div className="screen-tabs" role="tablist" aria-label="Screens">
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={ordered.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
          {ordered.map((s) => (
            <SortableTab
              key={s.id}
              screen={s}
              active={activeScreenId === s.id}
              onSelect={setActiveScreenId}
              onRename={rename}
              onMoveLeft={moveLeft}
              onMoveRight={moveRight}
              onDelete={remove}
              uiHintsEnabled={uiHintsEnabled}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button type="button" className="screen-tab screen-tab--add" aria-label={uiHintsEnabled ? 'Add screen' : undefined} title={uiHintsEnabled ? 'Add screen' : undefined} onClick={add}>+</button>
      </div>
  );
}

ScreenTabs.propTypes = {
  screens: PropTypes.array.isRequired,
  activeScreenId: PropTypes.string,
  setActiveScreenId: PropTypes.func.isRequired,
  setDoc: PropTypes.func.isRequired,
  uiHintsEnabled: PropTypes.bool,
};
