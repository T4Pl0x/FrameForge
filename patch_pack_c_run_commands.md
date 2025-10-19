# RUN_CMDS: Patch Pack C - Development and Testing Commands

## Development Commands

### Setup and Installation
```bash
# Navigate to frameforge directory
cd frameforge

# Install dependencies (if needed)
npm install

# Install vitest if not already present
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

### Build Commands
```bash
# Build for development
npm run build

# Build for production
npm run build:prod

# Build with analysis
npm run build -- --analyze
```

## Testing Commands

### Basic Test Commands
```bash
# Run all tests
npm run test

# Run workflow extension tests specifically
npm run test workflow

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Specific Test Commands
```bash
# Run workflow extension tests
npx vitest run src/extensions/workflow/__tests__/workflow.test.ts

# Run tests with coverage for workflow extension
npx vitest run --coverage src/extensions/workflow/__tests__/

# Run tests in UI mode
npx vitest --ui src/extensions/workflow/__tests__/
```

### Coverage Commands
```bash
# Generate coverage report
npx vitest run --coverage

# Generate coverage with specific reporter
npx vitest run --coverage --reporter=html

# Open coverage report
npx vitest run --coverage --reporter=html && open coverage/index.html
```

## TypeScript Commands

### Type Checking
```bash
# Check TypeScript types
npm run type-check

# Check specific workflow types
npx tsc --noEmit src/extensions/workflow/flowTypes.ts

# Check all workflow extension files
npx tsc --noEmit src/extensions/workflow/**/*.ts
```

### TypeScript Watch Mode
```bash
# Watch for type changes
npx tsc --noEmit --watch src/extensions/workflow/

# Watch with specific config
npx tsc --noEmit --watch --project tsconfig.json src/extensions/workflow/
```

## Linting and Formatting

### ESLint Commands
```bash
# Run ESLint on workflow extension
npx eslint src/extensions/workflow/

# Fix ESLint issues
npx eslint src/extensions/workflow/ --fix

# Run ESLint with specific rules
npx eslint src/extensions/workflow/ --rule '@typescript-eslint/no-explicit-any: error'
```

### Prettier Commands
```bash
# Format workflow extension files
npx prettier --write src/extensions/workflow/

# Check formatting
npx prettier --check src/extensions/workflow/

# Format specific file types
npx prettier --write src/extensions/workflow/**/*.{ts,tsx,js,jsx}
```

## Git Commands

### Branch Management
```bash
# Create feature branch for workflow extension
git checkout -b feature/workflow-extension

# Switch to existing branch
git checkout feature/ui-creator-chrome

# Merge branches
git merge feature/workflow-extension
```

### Commit Commands
```bash
# Stage workflow extension files
git add src/extensions/workflow/

# Commit with detailed message
git commit -m "feat: Add workflow extension foundation

- Add core flow types and interfaces
- Implement extension registration system
- Create minimal FlowCanvas with palette
- Add TriggerNode and PromptLabNode components
- Add comprehensive test suite
- Integrate with existing extension registries

Acceptance Criteria Met:
✅ Core types defined with TypeScript strict mode
✅ Dynamic registration via extension/view registries
✅ Canvas skeleton with drag-and-drop palette
✅ Basic nodes with configuration forms
✅ Test coverage ≥ 70% statements / 60% branches
✅ Accessibility compliance (WCAG 2.1 AA)
✅ Proposal-based mutations via AppState.io.propose"

# Commit with conventional format
git commit -m "feat(workflow): add FlowCanvas component with node palette"
```

### Push Commands
```bash
# Push to remote repository
git push origin feature/workflow-extension

# Push with upstream tracking
git push -u origin feature/workflow-extension

# Push tags
git push --tags
```

## Debug Commands

### Development Debugging
```bash
# Start development server with debug
npm run dev -- --debug

# Run tests with debug output
DEBUG=* npm run test

# Run specific test with debug
DEBUG=vitest* npx vitest run src/extensions/workflow/__tests__/workflow.test.ts
```

### Browser Debugging
```bash
# Open Chrome DevTools
google-chrome --remote-debugging-port=9222

# Start development with debug port
npm run dev -- --debug-port=9222
```

## Performance Commands

### Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Check workflow extension bundle impact
npx webpack-bundle-analyzer dist/assets/

# Generate size report
npx bundlesize
```

### Performance Testing
```bash
# Run performance tests
npm run test:performance

# Lighthouse audit
npx lighthouse http://localhost:3000 --output=html

# Performance profiling
npm run dev -- --profile
```

## CI/CD Commands

### Continuous Integration
```bash
# Run CI checks locally
npm run test:ci

# Run pre-commit hooks
npm run prepare

# Run all quality checks
npm run lint && npm run type-check && npm run test:coverage
```

### Deployment Commands
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod

# Build and deploy
npm run build && npm run deploy:prod
```

## Database and Storage Commands

### Mock Data Commands
```bash
# Generate test workflow data
node scripts/generate-workflow-data.js

# Seed database with test flows
npm run db:seed

# Clear test data
npm run db:clear
```

### Storage Commands
```bash
# Clear local storage
localStorage.clear()

# Reset workflow state
localStorage.removeItem('frameforge-workflow')

# Export workflow data
localStorage.getItem('frameforge-workflow') > workflow-backup.json
```

## Documentation Commands

### Documentation Generation
```bash
# Generate API documentation
npx typedoc src/extensions/workflow/

# Generate component documentation
npx storybook build

# Generate test documentation
npx vitest run --coverage --reporter=json
```

### Documentation Serving
```bash
# Serve documentation locally
npx http-server docs/ -p 8080

# Serve Storybook
npm run storybook

# Serve coverage report
python -m http.server 8080 -d coverage/
```

## Utility Commands

### File Operations
```bash
# Count lines of code in workflow extension
find src/extensions/workflow -name "*.ts" -o -name "*.tsx" | xargs wc -l

# Find all TypeScript files
find src/extensions/workflow -name "*.ts" -o -name "*.tsx"

# Check file sizes
du -sh src/extensions/workflow/
```

### Search Commands
```bash
# Search for TODO comments
grep -r "TODO" src/extensions/workflow/

# Search for console.log statements
grep -r "console.log" src/extensions/workflow/

# Search for specific patterns
grep -r "propose" src/extensions/workflow/
```

## Environment Commands

### Environment Setup
```bash
# Load development environment
source .env.development

# Load test environment
source .env.test

# Check environment variables
env | grep FRAMEFORGE
```

### Docker Commands
```bash
# Build development container
docker build -t frameforge-dev .

# Run development container
docker run -p 3000:3000 frameforge-dev

# Run tests in container
docker run frameforge-dev npm test
```

## Troubleshooting Commands

### Common Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json && npm install

# Clear TypeScript cache
npx tsc --build --clean

# Clear Vitest cache
npx vitest run --reporter=verbose
```

### Port Issues
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Find available port
python -c "import socket; s=socket.socket(); s.bind(('', 0)); print(s.getsockname()[1]); s.close()"
```

## Custom Scripts

### Workflow Extension Scripts
```bash
# Add to package.json scripts section:
{
  "scripts": {
    "workflow:dev": "npm run dev -- --env.workflow=true",
    "workflow:test": "vitest run src/extensions/workflow/__tests__/",
    "workflow:test:watch": "vitest src/extensions/workflow/__tests__/",
    "workflow:test:coverage": "vitest run --coverage src/extensions/workflow/__tests__/",
    "workflow:build": "npm run build -- --include=workflow",
    "workflow:lint": "eslint src/extensions/workflow/",
    "workflow:type-check": "tsc --noEmit src/extensions/workflow/",
    "workflow:format": "prettier --write src/extensions/workflow/"
  }
}
```

### Quick Development Workflow
```bash
# One-command development setup
npm run workflow:dev &
npm run workflow:test:watch &
npm run workflow:type-check -- --watch
```

## Monitoring Commands

### Development Monitoring
```bash
# Monitor file changes
npx chokidar "src/extensions/workflow/**/*" -c "echo 'File changed'"

# Monitor bundle size
npx bundlesize --watch

# Monitor performance
npm run dev -- --profile
```

These commands provide a comprehensive development workflow for the Workflow Extension, ensuring efficient development, testing, and deployment processes.