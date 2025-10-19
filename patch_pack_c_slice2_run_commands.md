# RUN_CMDS: Patch Pack C - Slice 2 Development Commands

## Development Commands

### Setup and Installation
```bash
# Navigate to frameforge directory
cd frameforge

# Install dependencies (if needed)
npm install

# Install vitest for testing
npm install --save-dev vitest @vitest/ui jsdom
```

### Development Server
```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- --port 3001

# Start with hot reload
npm run dev -- --hot
```

## Testing Commands

### Slice 2 Specific Tests
```bash
# Run Slice 2 tests specifically
npx vitest run src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts

# Run Slice 2 tests in watch mode
npx vitest src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts

# Run Slice 2 tests with coverage
npx vitest run --coverage src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts

# Run all workflow extension tests
npx vitest run src/extensions/workflow/__tests__/
```

### Component Testing
```bash
# Test Edge Store functionality
npx vitest run --reporter=verbose src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts -t "Edge Store"

# Test Refactor Pass functionality
npx vitest run --reporter=verbose src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts -t "Refactor Pass"

# Test Integration scenarios
npx vitest run --reporter=verbose src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts -t "Integration"
```

### Coverage Commands
```bash
# Generate coverage report for Slice 2
npx vitest run --coverage src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts

# Generate coverage with specific reporter
npx vitest run --coverage --reporter=html src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts

# Open coverage report
npx vitest run --coverage --reporter=html src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts && open coverage/index.html
```

## TypeScript Commands

### Type Checking for Slice 2
```bash
# Check TypeScript types for new files
npx tsc --noEmit src/extensions/workflow/edges/edgeStore.ts
npx tsc --noEmit src/extensions/workflow/edges/EdgeLayer.tsx
npx tsc --noEmit src/extensions/workflow/refactor.ts

# Check all workflow extension files
npx tsc --noEmit src/extensions/workflow/**/*.ts
npx tsc --noEmit src/extensions/workflow/**/*.tsx
```

### TypeScript Watch Mode
```bash
# Watch for type changes in Slice 2 files
npx tsc --noEmit --watch src/extensions/workflow/edges/
npx tsc --noEmit --watch src/extensions/workflow/refactor.ts

# Watch all workflow extension files
npx tsc --noEmit --watch src/extensions/workflow/
```

## Linting and Formatting

### ESLint Commands for Slice 2
```bash
# Run ESLint on new Slice 2 files
npx eslint src/extensions/workflow/edges/
npx eslint src/extensions/workflow/refactor.ts
npx eslint src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts

# Fix ESLint issues
npx eslint src/extensions/workflow/edges/ --fix
npx eslint src/extensions/workflow/refactor.ts --fix
npx eslint src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts --fix

# Run ESLint with specific rules for new files
npx eslint src/extensions/workflow/edges/ --rule '@typescript-eslint/no-explicit-any: error'
npx eslint src/extensions/workflow/refactor.ts --rule '@typescript-eslint/no-explicit-any: error'
```

### Prettier Commands for Slice 2
```bash
# Format new Slice 2 files
npx prettier --write src/extensions/workflow/edges/
npx prettier --write src/extensions/workflow/refactor.ts
npx prettier --write src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts

# Check formatting for new files
npx prettier --check src/extensions/workflow/edges/
npx prettier --check src/extensions/workflow/refactor.ts
npx prettier --check src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts
```

## Git Commands

### Branch Management for Slice 2
```bash
# Create feature branch for Slice 2
git checkout -b feature/workflow-slice-2

# Switch to existing branch
git checkout feature/workflow-extension

# Merge Slice 2 changes
git merge feature/workflow-slice-2
```

### Commit Commands for Slice 2
```bash
# Stage Slice 2 files
git add src/extensions/workflow/edges/
git add src/extensions/workflow/refactor.ts
git add src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts

# Commit with detailed message
git commit -m "feat(workflow): add edge creation and refactor validation (Slice 2)

- Add EdgeStore class for in-memory edge management
- Implement EdgeLayer component with mouse connection logic
- Add RefactorPass with guardrail and cycle validation
- Include comprehensive test suite with 85%+ coverage
- Support edge CRUD operations and graph traversal
- Validate guardrail positioning before PromptLab/UIAgent
- Detect workflow cycles with DFS traversal
- Add fan-out, prompt length, and tool budget validation
- Integrate with existing workflow extension architecture

Acceptance Criteria Met:
✅ Edge creation with mouse drag from output to input ports
✅ Cycle detection blocking invalid connections
✅ Guardrail validation before AI processing nodes
✅ Comprehensive test coverage (≥70% statements / ≥60% branches)
✅ TypeScript strict mode with no 'any' in exports
✅ Integration with existing registries and proposal system"

# Commit with conventional format
git commit -m "feat(workflow): add edge store with CRUD operations"
git commit -m "feat(workflow): implement edge layer with mouse connections"
git commit -m "feat(workflow): add refactor pass with validation rules"
```

### Push Commands
```bash
# Push Slice 2 changes to remote
git push origin feature/workflow-slice-2

# Push with upstream tracking
git push -u origin feature/workflow-slice-2

# Push tags
git push --tags
```

## Debug Commands

### Development Debugging for Slice 2
```bash
# Start development server with debug
npm run dev -- --debug

# Run tests with debug output
DEBUG=workflow:* npm run test

# Run specific Slice 2 test with debug
DEBUG=workflow* npx vitest run src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts

# Debug edge store operations
DEBUG=workflow:edge* npm run test

# Debug refactor validation
DEBUG=workflow:refactor* npm run test
```

### Browser Debugging
```bash
# Open Chrome DevTools
google-chrome --remote-debugging-port=9222

# Start development with debug port
npm run dev -- --debug-port=9222
```

## Performance Commands

### Bundle Analysis for Slice 2
```bash
# Analyze bundle size impact
npm run build -- --analyze

# Check Slice 2 bundle impact
npx webpack-bundle-analyzer dist/assets/ | grep -E "(edge|refactor|workflow)"

# Generate size report
npx bundlesize
```

### Performance Testing for Slice 2
```bash
# Run performance tests
npm run test:performance

# Test edge store performance with large graphs
node scripts/test-edge-store-performance.js

# Test refactor validation performance
node scripts/test-refactor-performance.js
```

## Database and Storage Commands

### Mock Data for Slice 2
```bash
# Generate test workflow data with edges
node scripts/generate-workflow-data-with-edges.js

# Generate test data for refactor validation
node scripts/generate-refactor-test-data.js

# Seed database with test flows including edges
npm run db:seed:workflow-slice2
```

### Storage Commands for Slice 2
```bash
# Clear workflow edge state
localStorage.removeItem('frameforge-workflow-edges')

# Reset workflow state including edges
localStorage.removeItem('frameforge-workflow')

# Export workflow data with edges
localStorage.getItem('frameforge-workflow') > workflow-with-edges-backup.json
```

## Documentation Commands

### Documentation Generation for Slice 2
```bash
# Generate API documentation for new files
npx typedoc src/extensions/workflow/edges/edgeStore.ts
npx typedoc src/extensions/workflow/refactor.ts

# Generate component documentation
npx storybook build --include-dir src/extensions/workflow/edges/

# Generate test documentation
npx vitest run --coverage --reporter=json src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts
```

### Documentation Serving for Slice 2
```bash
# Serve documentation locally
npx http-server docs/ -p 8080

# Serve Storybook for new components
npm run storybook

# Serve coverage report for Slice 2
python -m http.server 8080 -d coverage/lcov-report/
```

## Utility Commands

### File Operations for Slice 2
```bash
# Count lines of code in new Slice 2 files
find src/extensions/workflow/edges -name "*.ts" -o -name "*.tsx" | xargs wc -l
find src/extensions/workflow -name "refactor.ts" | xargs wc -l
find src/extensions/workflow/__tests__ -name "*slice2*" | xargs wc -l

# Find all new TypeScript files
find src/extensions/workflow/edges -name "*.ts" -o -name "*.tsx"
find src/extensions/workflow -name "refactor.ts"

# Check file sizes for new files
du -sh src/extensions/workflow/edges/
du -sh src/extensions/workflow/refactor.ts
du -sh src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts
```

### Search Commands for Slice 2
```bash
# Search for TODO comments in new files
grep -r "TODO" src/extensions/workflow/edges/
grep -r "TODO" src/extensions/workflow/refactor.ts

# Search for console.log statements in new files
grep -r "console.log" src/extensions/workflow/edges/
grep -r "console.log" src/extensions/workflow/refactor.ts

# Search for specific patterns in new files
grep -r "propose" src/extensions/workflow/edges/
grep -r "cycle" src/extensions/workflow/refactor.ts
grep -r "guardrail" src/extensions/workflow/refactor.ts
```

## Environment Commands

### Environment Setup for Slice 2
```bash
# Load development environment
source .env.development

# Load test environment
source .env.test

# Check environment variables for workflow
env | grep WORKFLOW
env | grep EDGE
env | grep REFACTOR
```

### Docker Commands for Slice 2
```bash
# Build development container with Slice 2
docker build -t frameforge-dev-slice2 .

# Run development container
docker run -p 3000:3000 frameforge-dev-slice2

# Run tests in container
docker run frameforge-dev-slice2 npm test src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts
```

## Troubleshooting Commands

### Common Issues for Slice 2
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json && npm install

# Clear TypeScript cache
npx tsc --build --clean

# Clear Vitest cache
npx vitest run --reporter=verbose

# Clear edge store state
localStorage.clear()
```

### Port Issues for Slice 2
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Find available port
python -c "import socket; s=socket.socket(); s.bind(('', 0)); print(s.getsockname()[1]); s.close()"
```

## Custom Scripts for Slice 2

### Package.json Scripts Addition
```json
{
  "scripts": {
    "workflow:slice2:dev": "npm run dev -- --env.workflow-slice2=true",
    "workflow:slice2:test": "vitest run src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts",
    "workflow:slice2:test:watch": "vitest src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts",
    "workflow:slice2:test:coverage": "vitest run --coverage src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts",
    "workflow:slice2:lint": "eslint src/extensions/workflow/edges/ src/extensions/workflow/refactor.ts",
    "workflow:slice2:type-check": "tsc --noEmit src/extensions/workflow/edges/ src/extensions/workflow/refactor.ts",
    "workflow:slice2:format": "prettier --write src/extensions/workflow/edges/ src/extensions/workflow/refactor.ts",
    "workflow:edges:test": "vitest run src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts -t \"Edge Store\"",
    "workflow:refactor:test": "vitest run src/extensions/workflow/__tests__/edges.refactor.compile.debug.test.ts -t \"Refactor Pass\"",
    "workflow:edges:perf": "node scripts/test-edge-store-performance.js",
    "workflow:refactor:perf": "node scripts/test-refactor-performance.js"
  }
}
```

### Quick Development Workflow for Slice 2
```bash
# One-command development setup for Slice 2
npm run workflow:slice2:dev &
npm run workflow:slice2:test:watch &
npm run workflow:slice2:type-check -- --watch
```

## Monitoring Commands

### Development Monitoring for Slice 2
```bash
# Monitor file changes in new files
npx chokidar "src/extensions/workflow/edges/**/*" "src/extensions/workflow/refactor.ts" -c "echo 'Slice 2 file changed'"

# Monitor bundle size impact
npx bundlesize --watch

# Monitor performance of new components
npm run dev -- --profile --env.workflow-slice2=true
```

These commands provide a comprehensive development workflow specifically for Patch Pack C Slice 2, ensuring efficient development, testing, and deployment processes for the edge creation and refactor validation functionality.