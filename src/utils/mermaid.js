const BACKEND_KEYWORDS = /(api|backend|service|server|database|data|auth|payment|queue|integration|cron|worker|lambda|function|webhook|microservice)/i;

const FRONTEND_HUB_ID = 'Frontend_Hub';
const BACKEND_HUB_ID = 'Backend_Hub';

export const sanitizeMermaidLabel = (value) => (
  (value ?? '')
    .toString()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/"/g, '\\"')
);

export const buildMermaidDefinition = (frames = [], tasks = []) => {
  const lines = ['%% Auto-generated from current UI and task data', 'flowchart TD'];

  const frameNodes = frames.map((frame, index) => ({
    id: `F${index}`,
    label: sanitizeMermaidLabel(frame?.title || `Frame ${index + 1}`),
  }));

  const backendNodes = tasks
    .filter((task) => BACKEND_KEYWORDS.test(task?.category || '') || BACKEND_KEYWORDS.test(task?.title || ''))
    .map((task, index) => ({
      id: `B${index}`,
      label: sanitizeMermaidLabel(task?.title || `Backend Task ${index + 1}`),
    }));

  lines.push(`    ${FRONTEND_HUB_ID}["Frontend Experience Flow"]`);
  lines.push(`    ${BACKEND_HUB_ID}(("Platform & Backend Services"))`);

  lines.push('    subgraph Frontend_UI["UI Surfaces"]');
  lines.push('        direction TB');
  if (frameNodes.length) {
    frameNodes.forEach((node) => {
      lines.push(`        ${node.id}["${node.label}"]`);
    });
  } else {
    lines.push('        Placeholder_Frame["Add frames to map the experience"]');
  }
  lines.push('    end');

  lines.push('    subgraph Backend_Services["Supporting Services"]');
  lines.push('        direction TB');
  if (backendNodes.length) {
    backendNodes.forEach((node) => {
      lines.push(`        ${node.id}((${node.label}))`);
    });
  } else {
    lines.push('        Placeholder_Service(("Document backend integrations here"))');
  }
  lines.push('    end');

  lines.push(`    Frontend_UI --> ${FRONTEND_HUB_ID}`);
  lines.push(`    ${FRONTEND_HUB_ID} --> ${BACKEND_HUB_ID}`);
  lines.push(`    ${BACKEND_HUB_ID} --> Backend_Services`);

  frameNodes.forEach((node) => {
    lines.push(`    ${node.id} --> ${FRONTEND_HUB_ID}`);
  });
  backendNodes.forEach((node) => {
    lines.push(`    ${BACKEND_HUB_ID} --> ${node.id}`);
  });

  return lines.join('\n');
};
