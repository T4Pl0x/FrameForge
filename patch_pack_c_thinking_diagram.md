# THINKING_DIAGRAM: Patch Pack C - Workflow/Agent Builder Extension

## Architecture Overview
```
FrameForge Extension System
├── Extension Registry (Patch Pack A)
├── View Registry (Patch Pack A)
└── Workflow Extension (Patch Pack C)
    ├── FlowCanvas (node-based UI)
    ├── Node Types (Trigger, PromptLab, UIAgent, etc.)
    ├── Flow Engine (refactor, compile, debug)
    └── Integration Hooks (existing systems)
```

## Data Flow
1. **User Interaction** → FlowCanvas → State Management
2. **Flow Creation** → Nodes + Edges → Flow Object
3. **Refactor Pass** → Validation → Warnings
4. **Compile Pass** → Flow → flow.json (runnable plan)
5. **Debug Pass** → Mock Execution → Trace Results
6. **Integration** → Existing Systems (PromptLab, Compiler, etc.)

## Key Components
- **FlowCanvas**: Drag-and-drop node editor with grid snap
- **Node Types**: 8 specialized nodes for different workflow stages
- **Flow Engine**: Validation, compilation, and execution
- **Extension Registry**: Dynamic registration with Shell

## Integration Points
- **PromptLab**: Generate prompt packs via existing contract
- **UI Creator**: Emit seed/patch proposals
- **Compiler**: Invoke CLI hooks
- **Sandbox**: Write/read normalized reports
- **Publisher**: PR creation workflow

## Technical Requirements
- TypeScript strict mode, no `any` in exports
- Proposal-based mutations (AppState.io.propose)
- Vitest coverage ≥ 70% statements / 60% branches
- Dynamic registration via extension/view registries
- WCAG 2.1 AA accessibility compliance
- Grid snap & alignment guides (reuse UI Creator components)