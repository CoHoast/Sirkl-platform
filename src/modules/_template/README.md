# Module Template

Copy this folder to create a new module.

## Steps to Create a New Module

### 1. Copy this folder
```bash
cp -r src/modules/_template src/modules/your-module-name
```

### 2. Update the module definition
Edit `index.ts` to define your module's identity, routes, etc.

### 3. Build your components
Add your pages, components, and API functions.

### 4. Register the module
Add your module to `src/modules/registry/index.ts`

### 5. Assign to clients
Add the module ID to client config files in `src/clients/`

---

## Folder Structure

```
your-module-name/
├── index.ts          # Module definition and exports
├── types.ts          # TypeScript types
├── components/       # React components
│   ├── List.tsx      # List view
│   ├── Detail.tsx    # Detail view
│   └── Form.tsx      # Create/edit form
├── pages/            # Page components
├── api/              # API functions
│   └── client.ts     # API client
├── hooks/            # Custom hooks
│   └── useData.ts    # Data fetching
└── utils/            # Helper functions
```

---

## Module Checklist

- [ ] Update module ID and name in `index.ts`
- [ ] Define routes
- [ ] Build main list page
- [ ] Build detail page
- [ ] Add API functions
- [ ] Create dashboard widget (optional)
- [ ] Register in `registry/index.ts`
- [ ] Add to at least one client config
- [ ] Test in isolation
