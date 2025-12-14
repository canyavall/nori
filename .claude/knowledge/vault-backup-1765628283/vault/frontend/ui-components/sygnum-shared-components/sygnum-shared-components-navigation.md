# Sygnum Shared Components Navigation

<!--
Migrated from: temp-FE-Mono/technical/sygnum-shared-components/sygnum-shared-components-navigation.md
Migration date: 2025-12-08
Original category: technical/sygnum-shared-components
New category: patterns/sygnum/sygnum-shared-components
Source repo: temp-FE-Mono
-->

# Sygnum Shared Components - Navigation

Navigation and header components.

## AppBar

Application header with navigation and user menu.

```typescript
import { AppBar } from '@sygnum/sygnum-shared-components/components/AppBar';

<AppBar
  logo={<Logo />}
  navigation={navigationItems}
  userMenu={<UserMenu />}
  notifications={<NotificationBell />}
/>
```

## UserMenu

User account menu with profile and logout.

```typescript
import { UserMenu } from '@sygnum/sygnum-shared-components/components/UserMenu';

<UserMenu
  user={user}
  menuItems={[
    { label: 'Profile', onClick: handleProfile },
    { label: 'Settings', onClick: handleSettings },
    { label: 'Logout', onClick: handleLogout },
  ]}
/>
```

## Breadcrumbs

Navigation breadcrumbs for current page path.

```typescript
import { Breadcrumbs } from '@sygnum/sygnum-shared-components/components/Breadcrumbs';

const items = [
  { label: 'Home', href: '/' },
  { label: 'Transactions', href: '/transactions' },
  { label: 'Details' }, // Current page (no href)
];

<Breadcrumbs items={items} />
```

## Sidebar

Side navigation menu.

```typescript
import { Sidebar } from '@sygnum/sygnum-shared-components/components/Sidebar';

<Sidebar
  items={menuItems}
  activeItem={activeRoute}
  collapsed={isCollapsed}
  onToggle={handleToggle}
/>
```
