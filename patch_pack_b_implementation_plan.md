# Patch Pack B: UI Creator & Interaction Chrome - Implementation Plan

## 🎯 Purpose
Deliver the "Figma-style" creator with professional interaction chrome for FrameForge v1.0.

## 📋 Deliverables Overview

| Module | Goal | Acceptance Criteria |
|--------|------|-------------------|
| `src/ui-creator/SelectionChrome.tsx` | Resizable/Draggable wrapper with 8 handles + drag bar | Elements can be moved/resized with mouse or keyboard |
| `src/ui-creator/ControlCluster.tsx` | [＋] menu + 🗑 delete button | Delete key or 🗑 removes element → proposal patch applied |
| `src/ui-creator/GridSnap.ts` | Alignment guides + grid snap logic | Elements snap to grid and alignment guides |
| `src/ui-creator/KeyboardMap.ts` | Arrow move, Shift = fine move, Esc = clear selection | Full keyboard navigation support |
| `src/ui-creator/hooks/useSelection.ts` | Central selection state | Centralized selection management |
| `src/ui-creator/hooks/useA11yLive.ts` | Live-region announcer for screen readers | Handles announce size/position in live region |

## 🏗️ Architecture Overview

### Core Components Structure
```
src/ui-creator/
├── SelectionChrome.tsx          # Main selection wrapper
├── ControlCluster.tsx           # Action buttons (add/delete)
├── GridSnap.ts                  # Grid and alignment logic
├── KeyboardMap.ts               # Keyboard interaction handlers
├── hooks/
│   ├── useSelection.ts          # Selection state management
│   └── useA11yLive.ts           # Accessibility announcements
└── types/
    └── selection.ts             # TypeScript definitions
```

### Integration Points
- **Existing Canvas**: Enhance current Canvas component with new chrome
- **Kernel Integration**: All changes go through proposal system
- **Accessibility**: WCAG 2.1 AA compliant interactions
- **Performance**: Optimized for 60fps interactions

## 🔄 Workflow: WF-5 UI Creator Interaction Upgrade

### Phase 1: Foundation (Days 1-2)
1. **Selection System Setup**
   - Create selection state management hooks
   - Implement basic selection logic
   - Add accessibility infrastructure

2. **Chrome Components**
   - Build SelectionChrome with resize handles
   - Create ControlCluster with action buttons
   - Implement drag functionality

### Phase 2: Interactions (Days 3-4)
1. **Mouse Interactions**
   - 8-point resize handles (corners + edges)
   - Drag bar for moving elements
   - Visual feedback and hover states

2. **Keyboard Navigation**
   - Arrow key movement (10px increments)
   - Shift + arrow for fine movement (1px)
   - Escape to clear selection
   - Delete/Backspace to remove elements

### Phase 3: Advanced Features (Days 5-6)
1. **Grid & Alignment**
   - Configurable grid snap (default: 8px)
   - Smart alignment guides
   - Multi-select with Shift+Click

2. **Accessibility & Polish**
   - Screen reader announcements
   - High contrast mode support
   - Focus management
   - Keyboard shortcuts help

## 🛠️ Technical Implementation Details

### SelectionChrome.tsx
```typescript
interface SelectionChromeProps {
  element: UIElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (updates: Partial<UIElement>) => void;
  onDelete: (id: string) => void;
  gridSize?: number;
  showAlignmentGuides?: boolean;
}

// Features:
- 8 resize handles (nw, n, ne, e, se, s, sw, w)
- Drag bar at top for moving
- Visual feedback on hover/focus
- Keyboard navigation support
- Accessibility labels
```

### ControlCluster.tsx
```typescript
interface ControlClusterProps {
  selectedElement: UIElement;
  onAddComponent: () => void;
  onDelete: () => void;
  onEditProps: () => void;
}

// Features:
- [＋] Add component button
- 🗑 Delete button with confirmation
- Props/Data/Layout/Style/A11y/Actions tabs
- Contextual menu positioning
```

### useSelection.ts Hook
```typescript
interface SelectionState {
  selectedIds: Set<string>;
  activeId: string | null;
  isMultiSelect: boolean;
}

interface UseSelectionReturn {
  selectedElements: UIElement[];
  select: (id: string, multi?: boolean) => void;
  deselect: (id?: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}
```

### GridSnap.ts
```typescript
interface GridSnapOptions {
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  showAlignmentGuides: boolean;
}

// Features:
- Configurable grid size
- Smart alignment detection
- Visual guide rendering
- Performance optimized
```

## 🎨 Design Specifications

### Visual Design
- **Selection Border**: 2px solid #3B82F6, 50% opacity
- **Resize Handles**: 8px squares, white fill, blue border
- **Drag Bar**: 24px height, blue background, drag cursor
- **Alignment Guides**: 1px red dashed lines
- **Grid Lines**: 1px light gray, 50% opacity

### Interaction States
- **Hover**: Blue highlight, pointer cursor
- **Active**: Darker blue, solid border
- **Focus**: Blue outline, visible focus ring
- **Disabled**: Gray opacity, not-allowed cursor

### Animations
- **Selection**: 150ms ease-in-out fade
- **Resize**: Real-time, no lag
- **Drag**: Smooth 60fps movement
- **Alignment Guides**: Fade in/out 100ms

## ♿ Accessibility Requirements

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader**: Descriptive labels and announcements
- **Focus Management**: Logical tab order and visible focus
- **Color Contrast**: Minimum 4.5:1 ratio
- **Text Scaling**: Support 200% zoom

### Live Region Announcements
```
"Selected button, position 100, 200, width 80, height 32"
"Moved to 110, 200"
"Resized to 90, 200, width 100, height 32"
"Deleted button"
```

### Keyboard Shortcuts
- **Arrow Keys**: Move 10px
- **Shift + Arrow**: Move 1px (fine control)
- **Tab**: Navigate between handles
- **Enter/Space**: Activate handle
- **Escape**: Clear selection
- **Delete/Backspace**: Remove element

## 🔧 Integration with Existing System

### Canvas Integration
```typescript
// Enhanced Canvas component
const Canvas = () => {
  const { selectedElements, select, deselect } = useSelection();
  
  return (
    <div className="canvas">
      {elements.map(element => (
        <SelectionChrome
          key={element.id}
          element={element}
          isSelected={selectedElements.has(element.id)}
          onSelect={select}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};
```

### Kernel Integration
```typescript
// All changes go through proposal system
const handleUpdate = async (updates: Partial<UIElement>) => {
  const patch = [{
    op: 'replace',
    path: `/ui/frames/${frameIndex}/nodes/${nodeIndex}`,
    value: { ...element, ...updates }
  }];
  
  const proposalId = await kernel.proposals.propose({
    target: '/ui',
    patch,
    rationale: 'Update element via UI creator'
  });
  
  await kernel.proposals.approve(proposalId, { by: 'user', user });
  await kernel.proposals.apply(proposalId, { user });
};
```

## 📊 Performance Considerations

### Optimization Strategies
- **Virtualization**: Only render visible elements
- **Debouncing**: Batch rapid movements
- **Memoization**: Cache expensive calculations
- **Event Delegation**: Single listener for mouse events
- **RequestAnimationFrame**: Smooth 60fps animations

### Memory Management
- **Cleanup**: Remove event listeners on unmount
- **Weak References**: Avoid memory leaks
- **Object Pooling**: Reuse handle objects
- **Lazy Loading**: Load chrome components on demand

## 🧪 Testing Strategy

### Unit Tests
- Selection state management
- Grid snap calculations
- Keyboard event handlers
- Accessibility announcements

### Integration Tests
- Canvas + Chrome interaction
- Kernel proposal flow
- Multi-select behavior
- Undo/redo functionality

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- Focus management

### Performance Tests
- 60fps interaction benchmark
- Memory usage monitoring
- Large document handling
- Mobile device performance

## 📈 Success Metrics

### User Experience
- **Interaction Latency**: < 16ms (60fps)
- **Learning Curve**: < 5 minutes for basic tasks
- **Error Rate**: < 2% for common operations
- **Accessibility Score**: 100% WCAG 2.1 AA compliance

### Technical Metrics
- **Bundle Size**: < 50KB for chrome components
- **Memory Usage**: < 10MB for 100 elements
- **CPU Usage**: < 5% during interactions
- **Test Coverage**: > 90% for critical paths

## 🚀 Deployment Plan

### Phase 1: Foundation
- Selection system and basic chrome
- Mouse interactions
- Core accessibility features

### Phase 2: Enhancement
- Keyboard navigation
- Grid and alignment
- Advanced interactions

### Phase 3: Polish
- Performance optimization
- Accessibility validation
- User testing feedback

### Rollout Strategy
1. **Feature Flag**: Enable for beta testers
2. **Gradual Rollout**: 10% → 50% → 100%
3. **Monitoring**: Performance and error tracking
4. **Feedback Loop**: User surveys and analytics

This implementation plan provides a comprehensive roadmap for delivering professional-grade UI creator interactions that rival industry standards like Figma, while maintaining FrameForge's unique proposal-based architecture and commitment to accessibility.