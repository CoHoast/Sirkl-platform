# DOKit Modules (The Paint Palette) 🎨

This folder contains all modular tools/workflows that can be assigned to clients.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    MODULE REGISTRY                          │
│                  (registry/index.ts)                        │
│                                                             │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│   │ Intake   │ │ Claims   │ │ Bill     │ │ Bed      │      │
│   │          │ │ Adjud.   │ │ Negot.   │ │ Mgmt     │      │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
       CLIENT CONFIG PICKS ───┼─── WHICH MODULES THEY GET
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌────────────┐         ┌────────────┐         ┌────────────┐
│  OPTALIS   │         │ SOLIDARITY │         │  UNITED    │
│ ✓ Intake   │         │ ✓ Claims   │         │  REFUAH    │
│ ✓ Bed Mgmt │         │ ✓ Bill Neg │         │ ✓ Claims   │
│ ✓ Analytics│         │ ✓ Analytics│         │ ✓ Analytics│
└────────────┘         └────────────┘         └────────────┘
```

---

## Folder Structure

```
modules/
├── README.md              # This file
├── registry/
│   └── index.ts           # THE PAINT PALETTE - all modules listed here
├── _template/             # Copy this to create new modules
│   ├── README.md
│   └── index.ts
│
├── intake/                # Application/document intake (Optalis)
├── claims-adjudication/   # Claims review
├── claims-repricing/      # Repricing workflow
├── bill-negotiator/       # Medical bill analysis
├── bed-management/        # Bed availability
├── analytics/             # Reporting
└── ...                    # More modules
```

---

## Creating a New Module

### Step 1: Copy the template
```bash
cp -r src/modules/_template src/modules/your-module-name
```

### Step 2: Update the module definition
Edit `your-module-name/index.ts`:
```typescript
export const moduleDefinition: DokitModule = {
  id: 'your-module-name',
  name: 'Your Module Name',
  description: 'What it does',
  icon: '📦',
  category: 'operations',
  monthlyPrice: 500,
  status: 'active',
  routes: [
    { path: '/your-module', name: 'Your Module', showInSidebar: true },
  ],
};
```

### Step 3: Register in the palette
Add to `registry/index.ts`:
```typescript
import yourModule from '../your-module-name';

export const moduleRegistry = {
  // ... existing modules ...
  'your-module-name': yourModule,
};
```

### Step 4: Assign to clients
Edit `src/clients/[client].json`:
```json
{
  "modules": [
    "existing-module",
    "your-module-name"   // Add here
  ]
}
```

---

## Module Interface

Every module must export this structure:

```typescript
interface DokitModule {
  id: string;              // Unique ID (kebab-case)
  name: string;            // Display name
  description: string;     // What it does
  icon: string;            // Emoji or icon
  category: string;        // intake | claims | operations | analytics | admin
  monthlyPrice?: number;   // Cost (for pricing reference)
  status: string;          // active | beta | coming-soon | deprecated
  routes: Route[];         // Pages this module adds
  dashboardWidget?: string; // Optional dashboard card
  permissions?: string[];  // Required permissions
  dependencies?: string[]; // Other modules required
}
```

---

## Current Modules

| Module | Category | Status | Price |
|--------|----------|--------|-------|
| `application-intake` | intake | active | $750 |
| `document-intake` | intake | active | $750 |
| `member-intake` | intake | active | $500 |
| `claims-adjudication` | claims | active | $1,000 |
| `claims-repricing` | claims | active | $750 |
| `bill-negotiator` | claims | active | $1,000 |
| `provider-bills` | claims | active | $500 |
| `workers-comp` | claims | active | $750 |
| `bed-management` | operations | active | $500 |
| `scheduling` | operations | active | $500 |
| `analytics` | analytics | active | $250 |
| `audit-log` | analytics | active | $100 |
| `team-management` | admin | active | included |
| `integrations` | integrations | active | included |
| `email-intake` | integrations | active | $250 |

---

## Rules

1. **One module = one folder** — Keep everything for a module together
2. **No cross-dependencies** — Modules shouldn't import from each other
3. **Shared code goes in core** — Put reusable stuff in `src/components/` or `src/lib/`
4. **Register before using** — Module must be in registry to be assignable
5. **Config drives UI** — Client's sidebar is built from their module list
