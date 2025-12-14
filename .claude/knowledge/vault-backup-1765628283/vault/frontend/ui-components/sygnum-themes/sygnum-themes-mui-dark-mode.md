# Sygnum Themes Dark Mode

<!--
Migrated from: temp-FE-Mono/technical/sygnum-themes/sygnum-themes-dark-mode.md
Migration date: 2025-12-08
Original category: technical/sygnum-themes
New category: patterns/sygnum/sygnum-themes
Source repo: temp-FE-Mono
-->

# Sygnum Themes - Dark Mode

Theme mode management and dark mode support.

## Theme Mode Management

```typescript
import { useTheme } from '@sygnum/sygnum-themes';

const { mode, toggleMode, setMode } = useTheme();

// Current mode
console.log(mode); // 'light' | 'dark'

// Toggle between modes
<Button onClick={toggleMode}>
  {mode === 'light' ? 'Dark' : 'Light'} Mode
</Button>

// Set specific mode
<Button onClick={() => setMode('dark')}>Dark Mode</Button>
<Button onClick={() => setMode('light')}>Light Mode</Button>
```

## Dark Mode Styles

```typescript
// Colors adapt automatically
const containerSx: SxProps = {
  backgroundColor: palette.background.paper,  // Adapts to mode
  color: palette.text.primary,                // Adapts to mode
};

// Manual mode-specific styles
const customSx: SxProps = {
  backgroundColor: mode === 'dark'
    ? palette.grey[800]
    : palette.grey[100],
};
```

## Persistence

Theme mode is automatically persisted to localStorage.

```typescript
// On mount, theme loads saved preference
// On toggle, preference is saved automatically
```

## System Preference

```typescript
// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Initialize with system preference
useEffect(() => {
  if (!localStorage.getItem('themeMode')) {
    setMode(prefersDark ? 'dark' : 'light');
  }
}, []);
```
