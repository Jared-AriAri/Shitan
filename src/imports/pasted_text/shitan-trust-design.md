Create an ultra-premium, production-ready, responsive, mobile-first PWA UI/UX design system and complete interactive screen flow in Figma for a private mutual-aid trust platform named **“Shitan Trust — United for Good.”**

The final product must feel like a real installable fintech application rather than a traditional responsive website.

Design it primarily for smartphones and progressively enhance the experience for tablet and desktop.

## 1. Product Experience

Shitan Trust is a private mutual-aid and charitable contribution platform designed for friends, acquaintances, trusted allies and invited community members.

Users can:

* Discover active causes.
* Contribute money or physical goods.
* Upload proof of payment or delivery.
* Follow validated contributions through a transparent public ledger.
* Review evidence showing how resources were ultimately used.
* Share participation through branded social proof cards.

Administrators can:

* Review incoming contribution reports.
* Verify bank transfers and physical contributions.
* Approve, reject or request corrections.
* Manage causes.
* Publish final impact evidence.
* Monitor overall trust activity.

The experience must communicate:

**Trust, transparency, discretion, financial-grade credibility, generosity and premium craftsmanship.**

---

# 2. Product Format

Design this product as a:

**Responsive Mobile-First Progressive Web App (PWA)**

Primary reference viewport:

**390 × 844px — iPhone 15 / 16 Pro**

Also demonstrate responsive behavior for:

* 320–375px compact smartphones.
* 390–430px modern smartphones.
* 768px tablet.
* 1024px small desktop/tablet landscape.
* 1440px desktop dashboard.

Do not simply shrink desktop layouts for mobile.

Create dedicated mobile interaction patterns optimized for one-handed use.

---

# 3. PWA Application Shell

Create a persistent application shell.

## Mobile

Use:

* Compact top app bar.
* Safe-area-aware spacing.
* Fixed bottom navigation.
* Sticky action areas when appropriate.
* Bottom sheets instead of desktop-style centered modals.
* Large touch areas of at least 44–48px.
* Thumb-friendly primary actions.
* Smooth page transitions.

Suggested bottom navigation:

**Inicio**
**Causas**
**Ledger**
**Impacto**
**Perfil**

For Admin / Adminmaster roles, dynamically expose:

**Admin**

or an elevated admin shortcut.

Respect:

`safe-area-inset-top`

and

`safe-area-inset-bottom`

for modern iPhones.

## Desktop

Use:

* Premium sidebar or top navigation.
* Expanded information density.
* Split layouts.
* Multi-column dashboard views.
* Persistent administrative navigation.

Do not use the mobile bottom navigation on desktop.

---

# 4. Visual Identity & Design Tokens

## Aesthetic Direction

High-end private banking meets humanitarian fintech.

Keywords:

* Discreet luxury
* Institutional trust
* Private wealth management
* Humanitarian impact
* Financial transparency
* Premium dark-mode interface
* Minimalistic
* Elegant
* Serious but emotionally warm

Avoid:

* Crypto aesthetics.
* Neon gradients.
* Gaming UI.
* Generic SaaS dashboards.
* Excessively bright colors.
* Heavy glassmorphism.

Use restrained depth, subtle lighting and sophisticated contrast.

---

# 5. Color System

## Core

Canvas / Background:

`#0B132B`
`#0F172A`

Surface / Cards:

`#1E293B`

Elevated Surface:

Create a slightly lighter slate token.

Borders:

`#334155`

## Platinum

Primary Text:

`#F8FAFC`

Secondary Silver:

`#E2E8F0`

Muted Silver:

`#CBD5E1`

## Semantic Colors

Validated / Success:

`#10B981`

In-Kind Logistics:

`#38BDF8`

In Review:

`#F59E0B`

Rejected / Error:

`#EF4444`

Create accessible opacity and background variations for every semantic color.

Maintain WCAG-friendly contrast.

---

# 6. Typography

Primary:

**Inter**

or

**Plus Jakarta Sans**

Use a sophisticated financial hierarchy.

Create type tokens for:

* Display
* H1
* H2
* H3
* Section heading
* Body
* Small
* Caption
* Label
* Button
* Financial value

Financial sums, transaction IDs and important numerical information should use:

* Tabular figures.
* Monospaced or semi-monospaced numeric treatment where appropriate.

Numbers must feel precise and financial-grade.

---

# 7. Spacing & Layout Tokens

Build the system using Auto Layout.

Use an 8pt-oriented spacing system with tokens including:

* 4px
* 8px
* 12px
* 16px
* 24px
* 32px
* 40px
* 48px
* 64px

Mobile horizontal margins:

Approximately 16–20px.

Cards:

12px / 16px radius.

Use subtle:

* 1px borders.
* Shadows.
* Inner highlights.
* Depth separation.

Avoid excessive rounding.

---

# 8. Screen 1 — Home / Causes Directory

Create a premium mobile application home screen.

## Header

Display:

Shitan Trust silver emblem.

**Shitan Trust**

Subtitle:

**United for Good**

Include user avatar/profile trigger.

Display role when relevant:

* Donante
* Admin
* Adminmaster

Use a compact mobile app bar rather than a traditional website navbar.

---

## Impact Summary

Create an elegant financial overview.

Primary metric:

**Total acumulado**

Example:

`$184,750 MXN`

Secondary metrics:

* Causas activas.
* Causas completadas.
* Aportaciones verificadas.

Mobile:

Use horizontal swipeable metric cards or a well-structured compact grid.

Desktop:

Expand into analytical cards.

---

## Filter System

Use scrollable segmented filter chips on mobile:

* Todas
* Salud / Médicas
* Despensas
* Especie
* Completadas

Selected filters must have a visible active state.

---

## Cause Cards

Design high-value campaign cards.

Each card contains:

* High-quality cover image.
* Category badge.
* Time remaining.
* Cause status.
* Title.
* Concise emotional description.

### Financial Tracker

Show:

`$28,400 / $50,000 MXN`

Percentage:

`57%`

Use a premium animated progress bar.

### In-Kind Tracker

Examples:

`Despensas 4 / 10`

`Cobijas 10 / 10`

Completed goals receive a success indicator.

### Actions

Primary:

**Aportar**

Secondary:

**Ver causa**

On mobile, prioritize one clear primary action.

---

# 9. Screen 2 — Cause Detail

Create an immersive cause detail page.

## Hero

Include:

* Campaign gallery.
* Cause title.
* Category.
* Active/completed status.
* Organizer verification.
* Deadline.
* Share action.

Use horizontal gallery gestures on mobile.

---

## Story

Present the beneficiary background and reason for the campaign using highly readable typography.

Use progressive disclosure so long text does not overwhelm mobile users.

---

## Live Goal Progress

Show financial and physical goals prominently.

Updates should visually appear capable of updating in real time.

---

# 10. Bank Transfer Protocol

Create a highly trustworthy banking information card.

Include:

* Bank.
* Beneficiary.
* CLABE.
* Suggested concept/reference.
* Optional account information.

Primary interaction:

**Copiar CLABE**

After tapping:

Display a premium floating toast:

**CLABE copiada**

Include success icon and subtle animation.

Design the CLABE using tabular formatting and high readability.

---

# 11. Contribution Flow

On mobile, open the contribution experience as a full-height bottom sheet or dedicated app screen.

Do not use a small desktop modal.

Selector:

**Aporte económico**

**Aporte en especie**

---

## Economic Contribution

Currency input:

`$ MXN`

Quick amount chips:

`$500`

`$1,000`

`$2,500`

`Otro`

---

## In-Kind Contribution

Fields:

* Product description.
* Quantity stepper.
* Optional notes.

---

## Donor Identity

Fields:

* Nombre completo / Alias.
* Correo electrónico.
* Teléfono opcional.

Include:

**Ocultar mi nombre en el Ledger público**

Explain subtly:

The administrator can still view contributor identity privately.

---

# 12. Proof Upload

Create a mobile-first upload component.

Allow:

* Select photo.
* Take photo.
* Drag & drop on desktop.

After upload show:

* Thumbnail.
* Filename.
* Upload progress.
* Success indicator.
* Replace action.
* Delete action.

Design states for:

* Uploading.
* Uploaded.
* Failed.
* Retry.

CTA:

**Registrar y enviar comprobante**

Use a sticky bottom CTA on mobile when appropriate.

---

# 13. Submission Confirmation

After submission:

Show a premium success screen.

State:

**Aporte enviado a revisión**

Explain:

The contribution will appear publicly only after verification.

Include:

* Cause.
* Declared amount/item.
* Submission ID.
* Date/time.
* Status: Pendiente.

Actions:

**Ver estado**

**Volver a la causa**

---

# 14. Screen 3 — Public Transparency Ledger

Title:

**Libro Mayor de Transparencia**

Subtitle explaining that only validated contributions are publicly displayed.

Create a trust/integrity badge.

---

## Live Ledger

Display chronological validated contributions.

Each transaction contains:

* Donor name.

or

**Aportador Anónimo**

* Exact date/time.
* Cause.
* Contribution type.
* Verification status.

Money:

`+$2,500 MXN`

Use Emerald.

Physical goods:

Use Azure tag.

Include:

**Validado por Shitan**

with verified shield.

---

## Transaction Expansion

Allow cards to expand.

Expanded state may contain:

* Contribution details.
* Verification time.
* Cause destination.
* Sanitized voucher preview.

Sensitive bank or personal information must appear automatically blurred/redacted.

Never expose raw sensitive financial data publicly.

---

# 15. Impact Evidence Wall

Create a visually powerful section demonstrating how the aid was delivered.

Cards include:

* Delivery photos.
* Medicine purchases.
* Grocery deliveries.
* Supplier invoices.
* Medical receipts.
* Closure reports.

Create before/after or cause/result storytelling when appropriate.

Completed causes receive:

**Ciclo completado**

badge.

---

# 16. Screen 4 — Adminmaster Dashboard

Create a significantly more information-dense desktop interface while keeping a functional mobile admin version.

Header:

**Panel de Conciliación**

User:

**Shitan Adminmaster**

Pending counter:

Example:

`7 pendientes`

---

# 17. Administrative Navigation

Desktop sidebar:

* Resumen
* Conciliación
* Causas
* Evidencias
* Ledger
* Usuarios
* Configuración

Mobile:

Use an Admin navigation drawer or dedicated Admin section.

---

# 18. Reconciliation Queue

Create an inbox-inspired review experience.

Each pending contribution contains:

* Donor.
* Target cause.
* Contribution type.
* Declared amount/item.
* Date.
* Submission ID.
* Proof thumbnail.
* Current status.

Desktop:

Use split view.

Left:

Pending contribution queue.

Right:

Contribution inspection panel.

Mobile:

Open each review as a full-screen detail view.

---

# 19. Voucher Inspector

Provide:

* Large preview.
* Zoom.
* Rotate.
* Fit-to-screen.
* Download/view action only for authorized administrators.

Include private internal notes.

Example field:

**Referencia bancaria confirmada**

---

# 20. Admin Actions

Primary success action:

**Aprobar y registrar en Ledger**

Secondary destructive:

**Rechazar**

Third option:

**Solicitar corrección**

Require confirmation for destructive actions.

After approval:

Animate state change and instantly reflect the contribution in the Ledger and campaign totals.

Use optimistic UI patterns where appropriate.

---

# 21. Cause Manager

Create screens/modal/drawer for:

* Nueva causa.
* Editar causa.
* Pausar causa.
* Cerrar causa.

Fields:

* Title.
* Story.
* Category.
* Financial goal.
* In-kind goals.
* Deadline.
* Cover image.
* Gallery.
* Beneficiary information.

Allow multiple physical goals.

Example:

Cobijas — 10 unidades.

Despensas — 20 unidades.

Medicamentos — 5 unidades.

---

# 22. Evidence Manager

Allow administrators to upload:

* Photos.
* PDFs.
* Receipts.
* Supplier invoices.
* Closure report.

Show upload and moderation states.

---

# 23. Screen 5 — Social Proof Celebration

After an approved or submitted contribution, offer an elegant celebration experience.

Use restrained confetti.

Do not make it playful or childish.

Create exportable vertical:

**9:16 Story Card**

Text:

**Yo me sumé a [Nombre de la causa]**

**Shitan Trust**

**United for Good**

Include:

* Elegant campaign imagery.
* Platinum branding.
* QR code.
* Campaign URL.
* Optional anonymity-safe contribution acknowledgment.

Actions:

**Compartir**

**WhatsApp**

**Guardar imagen**

---

# 24. Dynamic Application States

Design the application as if connected to a real-time backend.

Include explicit variants for:

* Loading.
* Skeleton.
* Empty.
* Success.
* Error.
* Offline.
* Reconnecting.
* Disabled.
* Pending.
* Validated.
* Rejected.
* Requires correction.

Create realistic transitions between these states.

---

# 25. Real-Time Interactions

Visually demonstrate:

* Campaign totals updating after approval.
* Ledger entries appearing after validation.
* Pending admin counter updating.
* Upload progress.
* Form submission.
* Toast notifications.
* Copy-to-clipboard.
* Filter transitions.
* Animated progress bars.
* Expandable transaction records.

Use subtle motion inspired by premium fintech applications.

---

# 26. PWA-Specific Experience

Create designs for:

## Install Prompt

**Agregar Shitan Trust a tu pantalla de inicio**

Include app icon and concise explanation.

## Splash Screen

Dark Obsidian background.

Centered Shitan Trust silver emblem.

**United for Good**

## Offline State

Display:

**Sin conexión**

Explain that previously loaded information remains available where possible.

Add:

**Reintentar conexión**

## Connection Recovery

Show subtle toast:

**Conexión restaurada**

## Update Available

Optional discreet PWA banner:

**Hay una nueva versión disponible**

Action:

**Actualizar**

---

# 27. Mobile Interaction Requirements

The mobile experience is the highest priority.

Use:

* One-handed navigation.
* Bottom navigation.
* Sticky primary actions.
* Swipeable content when appropriate.
* Bottom sheets.
* Thumb-friendly controls.
* 44–48px minimum tap areas.
* Safe-area padding.
* Avoid horizontal page overflow.
* Avoid tiny text.
* Avoid compressed desktop tables.

For financial tables on mobile, transform rows into cards rather than forcing horizontal scrolling whenever possible.

---

# 28. Responsive Behavior

Use true responsive composition.

Do not simply resize frames.

Demonstrate how layouts transform between mobile and desktop.

Examples:

Mobile:

Single column.

Desktop:

2–3 column compositions.

Mobile admin:

Cards.

Desktop admin:

Queue + detail split-panel.

Mobile causes:

Vertical feed.

Desktop causes:

Grid.

Mobile forms:

Full-width controls.

Desktop forms:

Structured columns.

---

# 29. Interaction Prototype

Create clickable prototype connections for the primary flow:

Home

→ Cause Detail

→ Aportar

→ Select Contribution Type

→ Upload Voucher

→ Submit

→ Pending Confirmation

→ Admin Review

→ Approve

→ Ledger Updated

→ Cause Progress Updated

→ Impact Evidence

→ Social Share

Prototype navigation must feel like a real application.

---

# 30. Components

Create reusable Figma components and variants for:

* Buttons
* Icon buttons
* Inputs
* Currency inputs
* Text areas
* Selects
* Toggles
* Segmented controls
* Chips
* Status badges
* Cause cards
* Progress bars
* In-kind trackers
* Metric cards
* Transaction cards
* Ledger rows
* Upload components
* Toasts
* Bottom sheets
* Dialogs
* Navigation
* App bar
* Bottom navigation
* Admin sidebar
* Skeleton loaders
* Empty states
* Error states

Every relevant component should include:

* Default
* Hover
* Active
* Focus
* Disabled
* Loading
* Error
* Success

---

# 31. Figma Structure

Organize the file into pages:

**00 — Foundations**

**01 — Components**

**02 — Mobile App**

**03 — Desktop**

**04 — Admin**

**05 — Prototype**

**06 — PWA States**

Use:

* Variables.
* Color tokens.
* Spacing tokens.
* Typography styles.
* Component properties.
* Auto Layout.
* Variants.

Everything should be developer-handoff ready.

---

# 32. Final Quality Target

The finished product should look credible enough to be presented as:

* A production fintech product.
* A private banking application.
* A premium social-impact platform.
* A real PWA ready to be implemented using Next.js, Tailwind CSS, Supabase and Vercel.

Prioritize mobile usability above decorative complexity.

The interface should feel:

**Private.**

**Secure.**

**Transparent.**

**Human.**

**Premium.**

**Fast.**

The user should immediately feel:

**“I can see where the help comes from, where it goes, and who verified it.”**
