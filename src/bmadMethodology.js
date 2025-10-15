// BMAD (UI/UX Design Methodology) System
// Implements comprehensive design principles, guidelines, and workflow

export const DesignPrinciples = {
  HIERARCHY: {
    name: 'Visual Hierarchy',
    description: 'Guide user attention through clear information structure',
    guidelines: [
      'Use consistent font sizes for headings (H1: 32px, H2: 24px, H3: 20px, Body: 16px)',
      'Maintain proper contrast ratios (4.5:1 for normal text, 3:1 for large text)',
      'Use whitespace strategically to separate content sections',
      'Apply consistent spacing using 8px grid system'
    ],
    checker: (frame, nodes) => {
      const issues = [];
      const headings = nodes.filter(n => ['Title'].includes(n.type));

      // Check heading hierarchy
      if (headings.length > 0) {
        const sizes = headings.map(h => h.props.size || 28);
        const sortedSizes = [...sizes].sort((a, b) => b - a);
        if (JSON.stringify(sizes) !== JSON.stringify(sortedSizes)) {
          issues.push('Heading sizes should follow hierarchy (largest to smallest)');
        }
      }

      return issues;
    }
  },

  CONSISTENCY: {
    name: 'Design Consistency',
    description: 'Maintain uniform design language across components',
    guidelines: [
      'Use consistent border radius (8px, 12px, 16px)',
      'Maintain consistent spacing (8px increments)',
      'Use unified color palette',
      'Apply consistent typography scale'
    ],
    checker: (frame, nodes) => {
      const issues = [];

      // Check border radius consistency
      const radii = nodes.map(n => n.props.radius ?? 8);
      const uniqueRadii = [...new Set(radii)];
      if (uniqueRadii.length > 3) {
        issues.push('Limit border radius to 3 values for consistency');
      }

      // Check spacing consistency
      const paddings = [frame.padding];
      const gaps = [frame.gap];
      if (paddings.some(p => p % 4 !== 0) || gaps.some(g => g % 4 !== 0)) {
        issues.push('Use 4px increments for spacing consistency');
      }

      return issues;
    }
  },

  ACCESSIBILITY: {
    name: 'Accessibility Standards',
    description: 'Ensure inclusive design for all users',
    guidelines: [
      'Maintain 4.5:1 contrast ratio for text',
      'Provide sufficient touch target sizes (44px minimum)',
      'Include proper focus indicators',
      'Use semantic component structure'
    ],
    checker: (frame, nodes) => {
      const issues = [];

      // Check touch target sizes
      if (frame.width < 44 || frame.height < 44) {
        issues.push('Interactive elements should be at least 44px for accessibility');
      }

      // Check for text without proper contrast
      const textComponents = nodes.filter(n => ['Title', 'Paragraph'].includes(n.type));
      if (textComponents.length === 0) {
        issues.push('Include descriptive text for screen readers');
      }

      return issues;
    }
  },

  RESPONSIVENESS: {
    name: 'Responsive Design',
    description: 'Create layouts that work across all devices',
    guidelines: [
      'Design mobile-first approach',
      'Use flexible layouts with relative units',
      'Test breakpoints: 320px, 768px, 1024px, 1440px',
      'Maintain readability at all screen sizes'
    ],
    checker: (frame, nodes) => {
      const issues = [];

      // Check for fixed widths that might not be responsive
      if (frame.width < 280) {
        issues.push('Frame width too narrow for mobile devices');
      }

      // Check text readability at small sizes
      const smallText = nodes.filter(n =>
        ['Paragraph'].includes(n.type) &&
        (n.props.size || 14) < 14
      );
      if (smallText.length > 0) {
        issues.push('Text size too small for mobile readability');
      }

      return issues;
    }
  },

  PERFORMANCE: {
    name: 'Performance Optimization',
    description: 'Ensure fast loading and smooth interactions',
    guidelines: [
      'Limit component complexity',
      'Use efficient layout techniques',
      'Optimize images and assets',
      'Minimize re-renders and calculations'
    ],
    checker: (frame, nodes) => {
      const issues = [];

      // Check for excessive component count
      if (nodes.length > 20) {
        issues.push('High component count may impact performance');
      }

      // Check for deeply nested structures
      const maxDepth = Math.max(...nodes.map(n => (n.content || '').split(' ').length));
      if (maxDepth > 50) {
        issues.push('Consider breaking down complex components');
      }

      return issues;
    }
  }
};

export const UXWorkflowSteps = [
  {
    id: 'discover',
    name: 'Discovery & Research',
    description: 'Understand user needs and business requirements',
    checklist: [
      'User research completed',
      'Stakeholder interviews conducted',
      'Competitive analysis done',
      'User personas created'
    ]
  },
  {
    id: 'define',
    name: 'Define & Plan',
    description: 'Establish project scope and success metrics',
    checklist: [
      'User journey maps created',
      'Information architecture defined',
      'Success metrics established',
      'Technical constraints identified'
    ]
  },
  {
    id: 'design',
    name: 'Design & Prototype',
    description: 'Create wireframes and interactive prototypes',
    checklist: [
      'Low-fidelity wireframes completed',
      'High-fidelity mockups created',
      'Interactive prototype built',
      'Usability testing conducted'
    ]
  },
  {
    id: 'validate',
    name: 'Validate & Iterate',
    description: 'Test designs and gather user feedback',
    checklist: [
      'User testing sessions completed',
      'Feedback analysis done',
      'Design iterations implemented',
      'Accessibility audit passed'
    ]
  },
  {
    id: 'deliver',
    name: 'Deliver & Document',
    description: 'Hand off designs and documentation',
    checklist: [
      'Design system documented',
      'Component specifications created',
      'Developer handoff completed',
      'Style guide published'
    ]
  }
];

export class BMADMethodology {
  constructor() {
    this.violations = [];
    this.score = 100;
  }

  // Analyze a frame against design principles
  analyzeFrame(frame, nodes = []) {
    this.violations = [];
    this.score = 100;

    Object.values(DesignPrinciples).forEach(principle => {
      const issues = principle.checker(frame, nodes);
      if (issues.length > 0) {
        this.violations.push({
          principle: principle.name,
          severity: 'warning',
          issues: issues
        });
        this.score -= issues.length * 5;
      }
    });

    this.score = Math.max(0, this.score);
    return {
      score: this.score,
      violations: this.violations,
      grade: this.getGrade()
    };
  }

  // Get letter grade based on score
  getGrade() {
    if (this.score >= 90) return 'A';
    if (this.score >= 80) return 'B';
    if (this.score >= 70) return 'C';
    if (this.score >= 60) return 'D';
    return 'F';
  }

  // Get improvement suggestions
  getSuggestions() {
    const suggestions = [];

    this.violations.forEach(violation => {
      const principle = Object.values(DesignPrinciples).find(p => p.name === violation.principle);
      if (principle) {
        suggestions.push(...principle.guidelines.slice(0, 2)); // Top 2 guidelines per violation
      }
    });

    return [...new Set(suggestions)]; // Remove duplicates
  }

  // Generate design recommendations
  generateRecommendations(frame, nodes) {
    const analysis = this.analyzeFrame(frame, nodes);
    const recommendations = [];

    // Add specific recommendations based on violations
    this.violations.forEach(violation => {
      switch (violation.principle) {
        case 'Visual Hierarchy':
          recommendations.push({
            type: 'typography',
            priority: 'high',
            message: 'Improve text hierarchy with consistent heading sizes',
            action: 'Use H1: 32px, H2: 24px, H3: 20px for better readability'
          });
          break;
        case 'Design Consistency':
          recommendations.push({
            type: 'spacing',
            priority: 'medium',
            message: 'Standardize spacing and border radius',
            action: 'Use 8px increments for spacing and limit radius to 3 values'
          });
          break;
        case 'Accessibility Standards':
          recommendations.push({
            type: 'accessibility',
            priority: 'high',
            message: 'Enhance accessibility compliance',
            action: 'Ensure 44px minimum touch targets and proper contrast ratios'
          });
          break;
        case 'Responsive Design':
          recommendations.push({
            type: 'responsive',
            priority: 'medium',
            message: 'Improve mobile responsiveness',
            action: 'Test designs at 320px, 768px, 1024px breakpoints'
          });
          break;
        case 'Performance Optimization':
          recommendations.push({
            type: 'performance',
            priority: 'low',
            message: 'Optimize component performance',
            action: 'Reduce component count and complexity where possible'
          });
          break;
      }
    });

    return {
      analysis,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    };
  }
}

// Design system utilities
export const DesignTokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999
  },
  typography: {
    scale: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  colors: {
    primary: '#6aa4ff',
    secondary: '#9b7bff',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  }
};

// Workflow management
export class DesignWorkflow {
  constructor(projectId) {
    this.projectId = projectId;
    this.currentStep = 0;
    this.completedSteps = [];
    this.feedback = [];
  }

  // Move to next workflow step
  advanceStep() {
    if (this.currentStep < UXWorkflowSteps.length - 1) {
      this.completedSteps.push(this.currentStep);
      this.currentStep++;
      return UXWorkflowSteps[this.currentStep];
    }
    return null;
  }

  // Get current workflow status
  getStatus() {
    return {
      currentStep: UXWorkflowSteps[this.currentStep],
      progress: ((this.completedSteps.length) / UXWorkflowSteps.length) * 100,
      completedSteps: this.completedSteps.map(i => UXWorkflowSteps[i]),
      remainingSteps: UXWorkflowSteps.slice(this.currentStep)
    };
  }

  // Add feedback or notes
  addFeedback(stepId, type, content) {
    this.feedback.push({
      stepId,
      type, // 'comment', 'issue', 'approval'
      content,
      timestamp: new Date().toISOString()
    });
  }

  // Generate workflow report
  generateReport() {
    return {
      projectId: this.projectId,
      status: this.getStatus(),
      feedback: this.feedback,
      recommendations: this.generateRecommendations()
    };
  }

  // Generate workflow recommendations
  generateRecommendations() {
    const recommendations = [];
    const currentStep = UXWorkflowSteps[this.currentStep];

    switch (currentStep.id) {
      case 'discover':
        recommendations.push('Conduct user interviews and create user personas');
        break;
      case 'define':
        recommendations.push('Create user journey maps and define information architecture');
        break;
      case 'design':
        recommendations.push('Build low-fidelity wireframes before high-fidelity designs');
        break;
      case 'validate':
        recommendations.push('Conduct usability testing with at least 5 users');
        break;
      case 'deliver':
        recommendations.push('Create comprehensive design documentation and specifications');
        break;
    }

    return recommendations;
  }
}

// Export singleton instance
export const bmadMethodology = new BMADMethodology();