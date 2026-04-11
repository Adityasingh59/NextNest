# NextNest

Phase 1 scaffold for a verified student lease takeover marketplace built with:

- Next.js App Router
- React + TypeScript
- Tailwind CSS + shadcn/ui conventions
- Prisma + PostgreSQL
- Auth.js-compatible schema

## Initial structure

```text
NextNest/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── prisma.ts
│       └── utils.ts
├── .env.example
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Notes

- The Prisma schema is designed to support the full lease-transfer workflow, not just the minimal MVP entities.
- Third-party integration SDKs are included in `package.json`, but the actual wrappers and flows are intentionally deferred to later phases.
- Install dependencies and run `prisma generate` before starting Phase 2.
