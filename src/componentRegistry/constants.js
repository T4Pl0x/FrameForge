export const defaultText = "Double-click to edit text";
export const genId = () => Math.random().toString(36).slice(2);

export const MenuCatalog = {
  "Typography & Text": {
    icon: "📝",
    description: "Text elements and typography",
    items: [
      {
        type: 'Title',
        name: 'Heading',
        description: 'Large heading text',
        icon: 'H1',
        preview: { size: 24, weight: 700, content: 'Heading' }
      },
      {
        type: 'Paragraph',
        name: 'Body Text',
        description: 'Regular paragraph text',
        icon: '¶',
        preview: { size: 14, weight: 400, content: 'Body text' }
      }
    ]
  },
  "Interactive Elements": {
    icon: "🎯",
    description: "Buttons and interactive components",
    items: [
      {
        type: 'Button',
        name: 'Primary Button',
        description: 'Main call-to-action',
        icon: '🔵',
        preview: { variant: 'primary', shade: 'medium', content: 'Click me', fontSize: '14px', fontFamily: 'Inter', cornerStyle: 'rounded' }
      },
      {
        type: 'Button',
        name: 'Secondary Button',
        description: 'Secondary action',
        icon: '⚪',
        preview: { variant: 'secondary', shade: 'medium', content: 'Secondary', fontSize: '14px', fontFamily: 'Inter', cornerStyle: 'rounded' }
      },
      {
        type: 'Button',
        name: 'Success Button',
        description: 'Positive action confirmation',
        icon: '✅',
        preview: { variant: 'success', shade: 'medium', content: 'Success', fontSize: '14px', fontFamily: 'Inter', cornerStyle: 'rounded' }
      },
      {
        type: 'Button',
        name: 'Warning Button',
        description: 'Caution or warning action',
        icon: '⚠️',
        preview: { variant: 'warning', shade: 'medium', content: 'Warning', fontSize: '14px', fontFamily: 'Inter', cornerStyle: 'rounded' }
      },
      {
        type: 'Button',
        name: 'Error Button',
        description: 'Destructive or error action',
        icon: '❌',
        preview: { variant: 'error', shade: 'medium', content: 'Error', fontSize: '14px', fontFamily: 'Inter', cornerStyle: 'rounded' }
      }
    ]
  },
  "Form Elements": {
    icon: "📋",
    description: "Input fields and form controls",
    items: [
      {
        type: 'Input',
        name: 'Text Input',
        description: 'Single-line text input',
        icon: '📝',
        preview: { label: 'Name', placeholder: 'Enter text' }
      },
      {
        type: 'TextArea',
        name: 'Text Area',
        description: 'Multi-line text input',
        icon: '📄',
        preview: { label: 'Description', placeholder: 'Enter description', rows: 3 }
      },
      {
        type: 'Checkbox',
        name: 'Checkbox',
        description: 'Boolean selection control',
        icon: '☑️',
        preview: { label: 'Accept terms', checked: false }
      },
      {
        type: 'Radio',
        name: 'Radio Button',
        description: 'Single selection from options',
        icon: '🔘',
        preview: { label: 'Option 1', name: 'group1', checked: true }
      },
      {
        type: 'Select',
        name: 'Select Dropdown',
        description: 'Choose from predefined options',
        icon: '▼',
        preview: { label: 'Choose option', options: ['Option 1', 'Option 2', 'Option 3'] }
      },
      {
        type: 'Switch',
        name: 'Toggle Switch',
        description: 'On/off toggle control',
        icon: '🔄',
        preview: { label: 'Enable feature', checked: true }
      }
    ]
  },
  "Layout & Containers": {
    icon: "📦",
    description: "Cards and layout components",
    items: [
      {
        type: 'Card',
        name: 'Content Card',
        description: 'Container with content',
        icon: '📄',
        preview: { title: 'Card Title', subtitle: 'Card content' }
      },
      {
        type: 'Grid',
        name: 'Grid Container',
        description: 'CSS Grid layout system',
        icon: '🔲',
        preview: { columns: 3, rows: 2 }
      },
      {
        type: 'Flex',
        name: 'Flex Container',
        description: 'Flexible layout container',
        icon: '↕️',
        preview: { direction: 'row', alignItems: 'center' }
      }
    ]
  },
  "Navigation": {
    icon: "🧭",
    description: "Navigation and wayfinding components",
    items: [
      {
        type: 'Tabs',
        name: 'Tab Navigation',
        description: 'Tabbed interface navigation',
        icon: '📑',
        preview: { tabs: ['Tab 1', 'Tab 2', 'Tab 3'], active: 0 }
      },
      {
        type: 'Breadcrumb',
        name: 'Breadcrumb',
        description: 'Navigation breadcrumb trail',
        icon: '🍞',
        preview: { items: ['Home', 'Products', 'Details'] }
      },
      {
        type: 'Pagination',
        name: 'Pagination',
        description: 'Page navigation controls',
        icon: '📄',
        preview: { current: 1, total: 10 }
      }
    ]
  },
  "Data Display": {
    icon: "📊",
    description: "Components for displaying data",
    items: [
      {
        type: 'Avatar',
        name: 'Avatar',
        description: 'User profile image',
        icon: '👤',
        preview: { size: 'md', initials: 'JD' }
      },
      {
        type: 'Badge',
        name: 'Badge',
        description: 'Status indicator badge',
        icon: '🏷️',
        preview: { text: 'New', variant: 'primary' }
      },
      {
        type: 'Chip',
        name: 'Chip',
        description: 'Compact information chip',
        icon: '💎',
        preview: { text: 'Tag', variant: 'outlined' }
      },
      {
        type: 'List',
        name: 'List',
        description: 'Organized list of items',
        icon: '📝',
        preview: { items: ['Item 1', 'Item 2', 'Item 3'] }
      }
    ]
  },
  "Feedback": {
    icon: "💬",
    description: "User feedback and interaction components",
    items: [
      {
        type: 'Alert',
        name: 'Alert',
        description: 'User notification message',
        icon: '⚠️',
        preview: { type: 'info', message: 'This is an alert message' }
      },
      {
        type: 'Tooltip',
        name: 'Tooltip',
        description: 'Hover information tooltip',
        icon: '💡',
        preview: { text: 'Hover for info', position: 'top' }
      },
      {
        type: 'Modal',
        name: 'Modal Dialog',
        description: 'Modal popup dialog',
        icon: '📋',
        preview: { title: 'Modal Title', content: 'Modal content' }
      },
      {
        type: 'Progress',
        name: 'Progress Bar',
        description: 'Loading progress indicator',
        icon: '📊',
        preview: { value: 75, max: 100 }
      }
    ]
  }
};
