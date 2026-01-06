# Storybook Best Practices - Core Guidelines

Essential DO's and DON'Ts for creating effective Storybook stories.

## Best Practices

### DO:

✅ Use `*.story.tsx` filename (not `*.stories.tsx`)
✅ Use `autodocs` tag for automatic documentation
✅ Provide version info in parameters
✅ Create multiple variants showing different states
✅ Use descriptive story names (Default, WithIcon, Disabled, etc.)
✅ Test accessibility with Storybook a11y addon
✅ Use argTypes for interactive controls
✅ Add decorators for theming/layout
✅ Document complex components with descriptions
✅ Show edge cases (empty states, errors, loading)
✅ Use args for dynamic props
✅ Export meta as default
✅ Use proper title organization

### DON'T:

❌ Use `*.stories.tsx` filename
❌ Hardcode props without using args
❌ Create stories that depend on external state
❌ Duplicate component logic in stories
❌ Skip version parameters
❌ Create overly complex stories
❌ Test business logic in stories
❌ Mix multiple unrelated components in one story
❌ Use stories for integration testing
❌ Forget to add autodocs tag
