# THINKING_DIAGRAM: Patch Pack C - Slice 2 Implementation

## Architecture Overview
```
Slice 2 Focus: Edge Creation & Refactor Pass
├── Edge Management System
│   ├── Edge Store (in-memory state)
│   ├── Edge Layer (visual rendering)
│   ├── Connection Logic (mouse + keyboard)
│   └── Edge Validation (cycles, fan-out)
├── Refactor Pass System
│   ├── Guardrail Validation (before PromptLab/UIAgent)
│   ├── Cycle Detection (graph traversal)
│   ├── Fan-out Validation (≤4 per node)
│   └── Warning System (structured feedback)
└── Integration Layer
    ├── FlowCanvas Integration
    ├── Event System Updates
    └── Accessibility Enhancements
```

## Data Flow for Edge Creation
1. **User Interaction** → Port Click/Drag → Connection Mode
2. **Connection Mode** → Visual Feedback → Target Port Selection
3. **Edge Creation** → Validation → Store Update → Event Emission
4. **Flow Update** → Proposal System → State Persistence

## Data Flow for Refactor Pass
1. **Flow Input** → Graph Analysis → Rule Application
2. **Rule Engine** → Validation Checks → Warning Generation
3. **Warning Output** → Structured Feedback → UI Display
4. **User Action** → Flow Modification → Re-validation

## Key Technical Components

### Edge Store Design
- **In-memory state management** for performance
- **CRUD operations** with validation
- **Graph traversal helpers** for cycle detection
- **Event emission** for UI updates

### Edge Layer Rendering
- **SVG-based rendering** for smooth lines
- **Port detection** and hover states
- **Connection path calculation** (curved/straight lines)
- **Visual feedback** for connection modes

### Refactor Engine
- **Rule-based validation system**
- **Graph algorithms** (DFS for cycles)
- **Configurable constraints** (tool budget, fan-out)
- **Structured warning format**

### Accessibility Enhancements
- **Keyboard navigation** for edge creation
- **Screen reader announcements** for connections
- **Focus management** for port selection
- **Live region updates** for feedback

## Integration Points

### With Existing FlowCanvas
- **Edge rendering layer** overlaid on canvas
- **Event handling integration** with existing mouse events
- **State synchronization** with flow object
- **Selection management** coordination

### With Node Components
- **Port registration** for connection targets
- **Event bubbling** for edge-related actions
- **Visual coordination** for hover/selection states
- **Accessibility coordination** for focus management

### With Extension System
- **Command registration** for edge operations
- **Event bus integration** for edge lifecycle
- **Proposal system** for edge mutations
- **View registry** integration unchanged

## Technical Constraints & Solutions

### Performance Considerations
- **Edge rendering optimization**: Use SVG with minimal DOM nodes
- **Validation efficiency**: Implement graph algorithms with O(n) complexity
- **State management**: Minimize re-renders with careful dependency arrays

### Accessibility Requirements
- **Keyboard edge creation**: Implement "C" key + Tab navigation
- **Screen reader support**: ARIA labels for ports and connections
- **Live region announcements**: Connection feedback for assistive tech

### Type Safety Requirements
- **Strict TypeScript**: No `any` types in exports
- **Interface consistency**: Maintain type definitions from Slice 1
- **Generic type parameters**: For reusable validation functions

## Testing Strategy

### Unit Tests
- **Edge Store operations**: CRUD, validation, graph traversal
- **Refactor engine**: Rule application, warning generation
- **Utility functions**: Path calculation, validation helpers

### Integration Tests
- **Edge creation flow**: Mouse and keyboard interactions
- **Refactor integration**: Flow validation cycle
- **Event system**: Edge lifecycle event handling

### Accessibility Tests
- **Keyboard navigation**: Edge creation via keyboard
- **Screen reader**: Port identification and connection announcements
- **Focus management**: Proper focus order and restoration

## Implementation Phases

### Phase 1: Foundation (This Response)
- **Edge Store**: Basic CRUD and validation
- **Edge Layer**: Minimal rendering + mouse connect
- **Refactor Pass**: Guardrail validation + cycle detection
- **Tests**: Core functionality coverage

### Phase 2: Completion (Future Response)
- **Compile Pass**: Flow → flow.json transformation
- **Debug Pass**: Single trace simulation
- **Remaining Nodes**: All 6 node stub implementations
- **Full Integration**: Complete workflow system

## Success Metrics
- **Edge Creation**: Smooth mouse/keyboard connections
- **Validation**: Accurate refactor warnings
- **Performance**: Sub-100ms validation for 100-node flows
- **Accessibility**: Full WCAG 2.1 AA compliance
- **Coverage**: ≥70% statements / ≥60% branches

## Risk Mitigation
- **Complexity Management**: Incremental implementation with clear phases
- **Performance**: Optimized algorithms and rendering techniques
- **Type Safety**: Comprehensive TypeScript coverage
- **Accessibility**: Early and continuous accessibility testing
- **Integration**: Careful coordination with existing systems