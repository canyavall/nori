import { useState, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Trash2, Edit, Save, X } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";

// Mock data for knowledge entries
const knowledgeData: Record<string, any> = {
  k1: {
    title: "Button Best Practices",
    category: "Components",
    description: "Guidelines for creating accessible and reusable button components",
    tags: ["React", "Accessibility", "UI"],
    rules: "Always include proper aria-labels\nUse semantic HTML\nProvide loading and disabled states",
    requiredKnowledge: ["HTML Basics", "ARIA Fundamentals"],
    content: `# Button Best Practices

## Overview
Buttons are fundamental UI elements that trigger actions when clicked.

## Key Principles

### Accessibility
- Always use proper semantic HTML (\`<button>\` tag)
- Include descriptive aria-labels for icon-only buttons
- Ensure keyboard navigation works properly
- Maintain sufficient color contrast

### States
- **Default**: Normal state
- **Hover**: Visual feedback on mouse over
- **Active**: Pressed state
- **Disabled**: Non-interactive state
- **Loading**: Async operation in progress

## Code Example

\`\`\`jsx
<button
  className="btn btn-primary"
  onClick={handleClick}
  disabled={isDisabled}
  aria-label="Submit form"
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
\`\`\`

## Common Pitfalls
- Don't use divs as buttons
- Don't forget focus states
- Don't make buttons too small (min 44x44px for touch)
`,
  },
  k2: {
    title: "Form Validation",
    category: "Components",
    description: "Best practices for implementing form validation",
    tags: ["Forms", "Validation", "UX"],
    rules: "Validate on blur\nShow clear error messages\nPrevent submission of invalid forms",
    requiredKnowledge: ["React Hook Form"],
    content: `# Form Validation

## Introduction
Proper form validation improves user experience and data quality.

## Validation Strategies

### Client-Side Validation
- Immediate feedback
- Reduces server load
- Better UX

### Server-Side Validation
- Security requirement
- Final source of truth
- Handles complex business logic

## Implementation Tips
- Use libraries like React Hook Form or Formik
- Validate on blur for better UX
- Show inline error messages
- Disable submit button until form is valid
`,
  },
  k3: {
    title: "Modal Patterns",
    category: "Components",
    description: "Design patterns for modal dialogs and overlays",
    tags: ["Modal", "Dialog", "UX"],
    rules: "Trap focus within modal\nProvide close button\nClose on escape key\nClose on backdrop click",
    requiredKnowledge: ["React Portals", "Accessibility"],
    content: `# Modal Patterns

## Overview
Modals are overlay windows that require user interaction before returning to the main content.

## Best Practices
- Always provide a way to close the modal
- Trap keyboard focus within the modal
- Return focus to trigger element on close
- Use semantic HTML and ARIA attributes
`,
  },
  k4: {
    title: "Redux Setup",
    category: "State Management",
    description: "How to set up Redux in a React application",
    tags: ["Redux", "State", "Architecture"],
    rules: "Use Redux Toolkit\nOrganize by feature\nKeep reducers pure",
    requiredKnowledge: ["React Context", "Immutability"],
    content: `# Redux Setup Guide

## Installation
\`\`\`bash
npm install @reduxjs/toolkit react-redux
\`\`\`

## Store Configuration
Create a store with Redux Toolkit for simplified setup and best practices.
`,
  },
  k5: {
    title: "Context API Guide",
    category: "State Management",
    description: "Using React Context for state management",
    tags: ["Context", "React", "State"],
    rules: "Split contexts by concern\nMemoize context values\nAvoid deep nesting",
    requiredKnowledge: ["React Hooks"],
    content: `# React Context API

## When to Use Context
- Theme data
- User authentication
- Localization
- Application settings

## Best Practices
- Create separate contexts for different concerns
- Use useContext hook for consumption
- Memoize complex context values
`,
  },
  k6: {
    title: "Code Splitting",
    category: "Performance",
    description: "Implementing code splitting for better performance",
    tags: ["Performance", "Optimization", "Webpack"],
    rules: "Split by route\nLazy load heavy components\nUse dynamic imports",
    requiredKnowledge: ["Webpack", "React Lazy"],
    content: `# Code Splitting

## Overview
Code splitting breaks your bundle into smaller chunks that can be loaded on demand.

## Techniques
- Route-based splitting
- Component-based splitting
- Dynamic imports with React.lazy()
`,
  },
  k7: {
    title: "Lazy Loading",
    category: "Performance",
    description: "Lazy loading strategies for React components",
    tags: ["Performance", "React", "Loading"],
    rules: "Show loading states\nHandle errors gracefully\nPreload critical routes",
    requiredKnowledge: ["React Suspense"],
    content: `# Lazy Loading

## React.lazy()
Use React.lazy() to dynamically import components.

\`\`\`jsx
const MyComponent = React.lazy(() => import('./MyComponent'));
\`\`\`

## Suspense
Wrap lazy components with Suspense to show fallback content.
`,
  },
};

interface KnowledgeDetailProps {
  knowledgeId: string;
}

export default function KnowledgeDetail({ knowledgeId }: KnowledgeDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(
    knowledgeData[knowledgeId] || {
      title: "",
      category: "",
      description: "",
      tags: [],
      rules: "",
      requiredKnowledge: [],
      content: "",
    }
  );

  // Update form data when knowledge ID changes
  useEffect(() => {
    const currentKnowledge = knowledgeData[knowledgeId] || {
      title: "",
      category: "",
      description: "",
      tags: [],
      rules: "",
      requiredKnowledge: [],
      content: "",
    };
    setFormData(currentKnowledge);
    setIsEditing(false);
  }, [knowledgeId]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Save logic would go here
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(knowledgeData[knowledgeId]);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this knowledge entry?")) {
      // Delete logic would go here
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header Actions */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={handleDelete}
          disabled={isEditing}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Form Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            {isEditing ? (
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
              />
            ) : (
              <p className="text-lg font-semibold">{formData.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            {isEditing ? (
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Enter category"
              />
            ) : (
              <p className="text-gray-900">{formData.category}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            ) : (
              <p className="text-gray-700">{formData.description}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            {isEditing ? (
              <Input
                value={formData.tags.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((t) => t.trim()),
                  })
                }
                placeholder="Enter tags separated by commas"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rules
            </label>
            {isEditing ? (
              <Textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Enter rules (one per line)"
                rows={4}
              />
            ) : (
              <div className="bg-white p-4 rounded-md border">
                {formData.rules.split("\n").map((rule: string, index: number) => (
                  <p key={index} className="text-gray-700 mb-1">
                    • {rule}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Required Knowledge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Knowledge
            </label>
            {isEditing ? (
              <Input
                value={formData.requiredKnowledge.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiredKnowledge: e.target.value.split(",").map((k) => k.trim()),
                  })
                }
                placeholder="Enter required knowledge separated by commas"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.requiredKnowledge.map((knowledge: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {knowledge}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content - Markdown Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content (Markdown)
            </label>
            {isEditing ? (
              <MarkdownEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Enter content in Markdown format"
              />
            ) : (
              <div className="bg-white p-6 rounded-md border prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-800">
                  {formData.content}
                </pre>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}