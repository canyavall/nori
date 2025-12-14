# Sygnum Toastify Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-toastify/sygnum-toastify-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-toastify
New category: patterns/sygnum/sygnum-toastify
Source repo: temp-FE-Mono
-->

# Sygnum Toastify - Basics

Global toast notification system using react-toastify and AlertToast component.

## When to Use

- Success/error/warning/info notifications after user actions
- Global alerts without prop drilling
- Action confirmations with buttons

## Setup

Add ToastContainer to app root once:

```tsx
import { ToastContainer } from '@sygnum/sygnum-toastify/ToastContainer';

function App() {
  return (
    <div>
      <AppContent />
      <ToastContainer />
    </div>
  );
}
```

## Basic Usage

```tsx
import { sygnumToast } from '@sygnum/sygnum-toastify/toast';

// Success - stays open until user closes
sygnumToast.success('Operation completed');

// Error with auto-close after 3s
sygnumToast.error('Failed to save', { autoHideDuration: 3000 });

// Warning with title
sygnumToast.warning('Unsaved Changes', {
  title: 'Warning',
  autoHideDuration: 5000,
});

// Info at custom position
sygnumToast.info('New message', { position: 'bottom-right' });
```

## With Action Buttons

```tsx
sygnumToast.warning('You have unsaved changes', {
  title: 'Unsaved Changes',
  primaryActionProps: {
    children: 'Save',
    onClick: () => handleSave(),
  },
  secondaryActionProps: {
    children: 'Discard',
    onClick: () => handleDiscard(),
  },
});
```

## Methods

- `success/error/warning/info(message, options?)` - Show toast
- `dismiss(toastId?)` / `dismissAll()` - Close toasts
