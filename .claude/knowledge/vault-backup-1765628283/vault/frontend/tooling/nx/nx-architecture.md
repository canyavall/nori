# Nx Architecture

Nx monorepo architecture patterns. Covers workspace structure, project organization, and dependency management.

## Workspace Structure

**Typical Nx monorepo structure**:
```
workspace-root/
├── apps/                          # Applications (deployable)
│   ├── web-app/                  # Main web application
│   ├── admin-panel/              # Admin application
│   ├── mobile-app/               # Mobile application (optional)
│   └── api/                      # Backend API (optional)
├── libs/                          # Shared libraries
│   ├── ui/                       # UI component library
│   ├── data-access/              # API clients, services
│   ├── utils/                    # Utility functions
│   ├── feature/                  # Feature-specific code
│   └── modules/                  # Domain modules
│       ├── auth/
│       ├── dashboard/
│       └── settings/
├── nx.json                        # Nx configuration
├── package.json                   # Workspace dependencies
├── tsconfig.base.json            # Shared TypeScript config
└── .eslintrc.json                # Shared ESLint config
```

## Project Types

**Applications (`apps/`)**:
- Deployable applications
- Consume libraries
- Minimal business logic (delegates to libs)
- Each app has its own build and serve targets

**Libraries (`libs/`)**:
- Reusable code and components
- Shared across applications
- Cannot depend on applications
- Organized by type: `suil`, `sygnum-*`, `modules/*`

## Dependency Rules

**View dependency graph**:
```bash
npx nx graph
npx nx graph --focus=[project]
```

**Rules**:
- ✅ Libs can depend on libs (not apps)
- ✅ Apps can depend on libs (not other apps)
- ❌ No circular dependencies allowed

## Path Mappings

**Correct imports** (use path mappings defined in tsconfig.base.json):
```typescript
import { Button } from '@company/ui/components/Button';
import { useAuth } from '@company/data-access/auth';
import { formatDate } from '@company/utils';
```

**Avoid** (relative imports across libraries):
```typescript
import { Button } from '../../../libs/ui/components/Button';
```

**Note**: Replace `@company` with your organization's npm scope (e.g., `@acme`, `@myorg`).
