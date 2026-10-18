# Company Store Workflow Rebrand Implementation Plan

> **For agentic workers:** Implement task-by-task in this session. Keep the existing local-demo limits visible and preserve unrelated working-tree changes.

**Goal:** Turn Company Store setup into a simple client-facing guided workflow and the employee preview into a polished, familiar online shop.

**Architecture:** Rework the existing StoreAdminShell into four named stages using the current draft model and panels. Refine the employee storefront and product detail around catalogue browsing, bag, employee identity/access, and delivery, without representing local browser storage as a live service. Keep styling within the Company Stores stylesheet and reuse the existing catalogue, draft, and order helpers.

**Tech Stack:** Next.js 16.4 App Router, React 19, TypeScript, project CSS, existing Company Store local-draft utilities.

**Spec:** User request in this conversation (Company Store client setup dashboard and employee shopping experience).

## Global Constraints

- Preserve unrelated working-tree changes and keep the scope within Company Store pages/components/data.
- Keep the employee demo honestly labelled as local preview until real account infrastructure is available.
- Use current Next.js local documentation before changing Next APIs.
- Maintain keyboard access, responsive layout, and existing draft data compatibility.

## Review Focus

- Empty store draft: clearly guide the client toward store identity and product selection.
- Product range size: prevent configuring more than the stated 30 products and surface the selected count.
- Employee identity/access: never imply a real account exists if the flow is local-only.
- Credit/allowance: preserve draft caps and avoid suggesting an actual balance deduction.
- Mobile employee checkout: keep browse, bag, and delivery fields usable at narrow widths.

### Task 1: Guided client setup

**Files:** Modify `src/components/company-store/StoreAdminShell.tsx`, `src/app/company-stores/company-stores.css`.

- [ ] Replace the seven-tab admin navigation with four clear stages: Store identity, Product range, Credits & delivery, Employee access & preview.
- [ ] Keep existing forms and data model, but add visible progress, short stage descriptions, next/back actions, and a compact persistent summary of the company, selected product count, and configured allowance.
- [ ] Keep order requests and configuration summary accessible as secondary actions, not primary setup stages.
- [ ] Verify lint and production build.

### Task 2: Employee ecommerce experience

**Files:** Modify `src/components/company-store/EmployeeStorefront.tsx`, `src/components/company-store/EmployeeProductDetail.tsx`, `src/components/company-store/StoreDemoBanner.tsx`, `src/app/company-stores/company-stores.css`.

- [ ] Reframe employee preview as a branded shop with clear programme identity/allowance, category browsing, search, product cards, product details, and bag actions.
- [ ] Make checkout a deliberate delivery step with clear address fields, line-item summary, allowance guidance, and confirmation state.
- [ ] Implement employee identity behavior according to the user's response; if unanswered, ship only a unique demo identity and label it as such.
- [ ] Verify lint and production build.

### Task 3: Final review and delivery

- [ ] Check all four client stages and mobile shop styles against empty, configured, and checkout states.
- [ ] Run `npx eslint` on changed TypeScript files, `git diff --check`, and `npm run build`.
- [ ] Commit only Company Store task files and publish according to the user's existing preview-deploy request.
