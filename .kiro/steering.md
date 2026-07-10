# Billing App — UI/UX Steering Rules

## Theme & Colors

- The **main content area** (everything to the right of the sidebar) must ALWAYS use **light mode** — white/light backgrounds, dark text. No dark mode toggle for the main content.
- The **sidebar** stays dark (navy/dark blue) — it is the only dark-themed section.
- **Accent color** in the main content should be a **lighter, softer shade** — NOT the same bold blue used in the sidebar active state. Use a gentle blue like `#4f8cff` or similar light-soft blue for buttons, links, and interactive highlights in the content area.
- The sidebar active item uses a **subtle transparent highlight** (`rgba(143, 179, 255, 0.12)`) — NOT a bold solid blue. It should be a soft glow, not a heavy filled background.

## Terminology

- Use **"Fee Payment"** or **"Payment"** — never "collection" or "collect".
- Use **"Record Payment"** for the action of receiving a fee payment from a student.
- Use **"Fee Pending"** or **"Pending Fees"** — not "pending dues" or "outstanding".
- Use **"Receipt"** for the generated proof of payment.
- Use **"Reversal"** for undoing a payment — not "refund".

## Design System

- All colors must use CSS custom variables defined in `globals.css`. Never hardcode hex values in component files.
- Border radius: use only `rounded-lg` (0.75rem), `rounded-xl` (1.25rem), or `rounded-2xl` (1.5rem). Avoid arbitrary values like `rounded-[18px]` or `rounded-[20px]`.
- **Nav items and tables** must use `rounded-lg` (boxy/subtle) — NOT `rounded-xl` or `rounded-2xl`.
- **Tables** must have NO border-radius anywhere — fully boxy/square. No rounded wrappers around tables.
- **Buttons, inputs, selects, and tabs** must use `rounded-full` (oval/pill shape).
- Cards and dialogs can use `rounded-2xl`. 
- Use the design tokens from `tailwind.config.ts` — don't introduce colors outside the defined palette.

## Component Rules

- **Button**: Always use the `loading` prop for async operations. Use `variant="destructive"` for dangerous actions (delete, reverse).
- **Input**: Always pass `error` prop when validation fails. Use `prefix`/`suffix` for icons inside inputs.
- **Dialog**: Every destructive action must use `ConfirmDialog` — never browser `confirm()`.
- **Table**: Use the `TR` component for row hover states. Wrap in `overflow-x-auto` on mobile.
- **Toast**: Use `variant` prop — `success` for positive actions, `error` for failures, `warning` for caution.
- **Select**: Use the custom `Select` component from `@/components/ui/select` — never use unstyled native `<select>`.

## UX Patterns

- **Loading states**: Use `Skeleton` components — never show "Loading" text or bare spinners for page-level data.
- **Empty states**: Every list/table must show the custom `NoDataIllustration` SVG (from `@/components/ui/no-data-illustration`) via the `EmptyState` component when there's no data. Never show empty/plain tables.
- **Forms**: Every form field must have a visible `<label>`. Use proper `htmlFor`/`id` associations.
- **Navigation**: Use Next.js `<Link>` or `router.push()` — never `window.location.assign()` for internal navigation.
- **Pagination**: Show record count and page info above the table, not below.
- **Confirmation**: Any fee payment recording, reversal, or deletion must have a confirmation step before executing.
- **Dashboard**: Only show student-level KPI cards (total students, paid, not paid). Do NOT show payment amount KPI cards on the dashboard.
- **Transactions view**: The transactions list lives inside the Reports page (`/reports?tab=transactions`) — NOT on a separate `/transactions` page. Dashboard "View All" must link there.
- **Access denied**: If a user doesn't have permission for a page or tab, show a clear "Access Denied" message — don't redirect or hide the page silently.

## Page Structure

- **Students** (`/students`): Student list + Student attendance (tabs)
- **Academics** (`/academic`): Years & Classes + Exams & Marks (tabs)
- **Staff** (`/staff`): Staff members + Staff Attendance + User Accounts (tabs)
- **Reports** (`/reports`): Reports & Analytics + Transactions + Expenses (tabs)
- No separate `/exams`, `/attendance`, `/transactions`, or `/settings/users` pages — all merged into their parent pages.

## Accessibility

- All icon-only buttons must have `aria-label`.
- Toggle buttons must have `aria-pressed`.
- Dialogs must lock body scroll and trap focus.
- Search results must use `role="listbox"` with `role="option"` on items.
- Breadcrumbs on detail/nested pages.

## File Structure

- UI primitives go in `frontend/components/ui/`.
- App-specific composed components go in `frontend/components/app/`.
- Pages use the `AppShell` component for layout.
- API calls use `apiFetch` from `@/lib/api` — never raw `fetch` for backend calls.

## Don'ts

- Don't add a dark mode toggle for the content area.
- Don't use `window.location.assign()` for navigation.
- Don't use browser `confirm()` / `alert()` / `prompt()`.
- Don't hardcode color hex values in TSX files.
- Don't mix native `<select>` with styled components.
- Don't add external UI libraries (shadcn, MUI, Chakra, etc.) — use the custom component library.
- Don't use the word "collection" — use "fee payment" or "payment" instead.
- Don't show payment amount KPI cards (collected today, monthly total, pending amount) on the dashboard.

## Pre-Delivery Checklist (from UI UX Pro Max)

- [ ] No emojis as icons — use SVG (Lucide icons only)
- [ ] `cursor-pointer` on ALL clickable elements (buttons, links, selects, checkboxes)
- [ ] Hover states with smooth transitions (150-200ms)
- [ ] Light mode: text contrast 4.5:1 minimum (WCAG AA)
- [ ] Focus states visible for keyboard navigation (focus-visible ring)
- [ ] `prefers-reduced-motion` respected (animations disabled)
- [ ] Responsive: 375px, 768px, 1024px, 1440px breakpoints
- [ ] No excessive decoration, complex shadows, or 3D effects
- [ ] Professional color palette: navy sidebar, soft blue accent, white content
