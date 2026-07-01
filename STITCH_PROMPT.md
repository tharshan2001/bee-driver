# Bee Driver App — Master UI/UX Prompt (for Stitch / Figma AI Generation)

> Paste this entire document into Stitch (or any AI Figma-generation tool) as a single project brief.
>
> **⚠️ CRITICAL: Read "Common Mistakes Stitch Makes" below BEFORE generating.** These are known misinterpretations that must be explicitly avoided.

---

## Common Mistakes Stitch Makes (enforce these rules)

1. **Sunflower Yellow is `#FFC107`** — NOT `#a33e00`. The prompt uses `#FFC107` everywhere. Stitch has a history of mapping this to a brown/dark value. If you see anything brighter or duller, STOP and fix.
2. **ALL icons must use 1.5px stroke-weight OUTLINE style.** Never use `FILL 1` or filled-variable icons. The `location_on` Material Icon, in particular, MUST be outline, not filled.
3. **Toggle switch thumb is a SQUARE** (16x16px with 2px border-radius at most, not `rounded-full`). The track is rectangular with 2px border-radius. Never circular.
4. **Status stamps are PERFECT CIRCLES** (40x40px, 20px radius, rotated -6°, 2px colored ring, uppercase mono text centered inside). Never render them as rectangular bordered boxes with a CSS `transform: rotate()` — they must be actual circles.
5. **Card/button border-radius is exactly 4px.** Not 2px, not 8px, not rounded. Exactly `border-radius: 4px` on cards, buttons, inputs, and modals.
6. **Ink Faded is `#5C5648`** — a medium desaturated brown. NOT `#CFCAC0` (too light to read).
7. **Shadows are SUBTLE:** `box-shadow: 0 1px 6px rgba(34, 31, 26, 0.06)`. NOT stamped/hard shadows like `2px 2px 0px 0px`.
8. **Mobile-ONLY layout.** Do NOT generate desktop sidebar nav, desktop top header, or multi-column tablet layouts. This is a portrait mobile app (max-width 430px).
9. **Every order ID, LKR amount, phone number, and timestamp uses IBM Plex Mono.** This is non-negotiable. If any of these render in a sans-serif font, regenerate.
10. **Waybill notch is at 44px from card top.** Not 56px. The tear-line dashed border sits at 44px with two semicircular die-cut notches (16px diameter) that expose the Kraft background behind it.
11. **Do NOT invent statuses.** The only valid delivery statuses are: PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED, FAILED_PERMANENT, APPROVED, REJECTED. Do not add "ATTEMPTED" or any other status.
12. **Toggle active track color is Sunflower Yellow (`#FFC107`), not green.** Green is only for success/completion states.

---

## 0. How to Use This Prompt

Generate in this order for best consistency:
1. **Design System** (Section 1) — colors, type, radius, spacing, shadows, shared components
2. **Navigation Shell** (Section 3) — tab bar + screen flow, so every screen is generated against the same chrome
3. **Screens** (Section 2) — one at a time, in the listed order, referencing the design system each time
4. **Motion & Interaction** (Section 4) — apply these transition/easing/haptic rules to every screen
5. **States** (Section 5) — loading/empty/error variants per screen

---

## 1. App Overview & Design System

**App:** Bee Driver — a delivery-driver mobile app for managing parcels, tracking earnings, logging expenses, and viewing performance stats.
**Platform:** iOS & Android, mobile portrait only (max-width 430px).

### Concept: "The Waybill"

A Bee Driver isn't using a lifestyle app — they're checking a digital version of their parcel manifest, one-handed, in sun glare, between stops. The identity is built from real courier paperwork: kraft tags, ink stamps, tracking numbers, tear-lines — not a soft rounded mascot app. The signature element is an **ink-stamped status badge** (rotated circle, 40x40px, 2px slightly rough-edged ring) standing in for the generic flat pill every delivery app uses, and **monospace data** (order IDs, amounts, timestamps) used everywhere a real waybill would print them.

### Color Palette (exact hex — no deviations)

| Token | Hex | Use |
|---|---|---|
| Kraft | `#EDE6D3` | Page background — parcel-tag paper tone |
| Paper | `#FAF7F0` | Card / surface fill — warm off-white, never pure white |
| Ink | `#221F1A` | Primary text, headlines, primary icons |
| Ink Faded | `#5C5648` | Secondary body text — NOT too light |
| Ink Muted | `#928C7C` | Captions, placeholders, dividers |
| **Sunflower Yellow** | **`#FFC107`** | **The one CTA/accent color. Never use `#a33e00` or any darker brown.** |
| Sunflower Deep | `#D4A000` | Pressed CTA state |
| Sunflower Tint | `#FFF3CD` | Accent card fills, active-tab backing |
| Manifest Green | `#2F6F4E` | Delivered / approved / online stamp |
| Manifest Green Tint | `#E1ECE3` | Success card/badge backing |
| Customs Red | `#B23A2E` | Failed / rejected / urgent stamp |
| Customs Red Tint | `#F3E2DE` | Danger card/badge backing |
| Transit Amber | `#C97F1E` | In-transit / pending-action stamp |
| Transit Amber Tint | `#F2E5CC` | Amber badge backing |
| Border | `#DCD3BC` | Default hairline borders, dashed tear-lines |
| Overlay | `rgba(34,31,26,0.55)` | Modal backdrops |

### Typography

| Role | Typeface | Style |
|---|---|---|
| Display (headlines, hero numbers) | **Space Grotesk**, Bold/700 | Confident, geometric — used with restraint, never for body copy |
| Body (all reading text) | **IBM Plex Sans**, Regular 400 / Medium 500 | Humanist, holds up at small size |
| Data / utility (IDs, amounts, timestamps, tracking numbers) | **IBM Plex Mono**, Regular/Medium | Every order #, LKR amount, phone number, and time-ago renders in mono — this is what makes it read as real logistics data |

| Style | Size | Weight | Face |
|---|---|---|---|
| Hero number (earnings, stats) | 32px | Bold | Space Grotesk |
| Section title | 20px | Bold | Space Grotesk |
| Card title | 16px | Medium | IBM Plex Sans |
| Body | 14–15px | Regular | IBM Plex Sans |
| Data field (ID/amount/time) | 13–15px | Medium | IBM Plex Mono |
| Caption / label | 11–12px | Medium, uppercase, +0.5px tracking | IBM Plex Sans |
| Button label | 15px | Medium | IBM Plex Sans |

### Shape Language (deliberately not "rounded everywhere")

- **Cards:** exactly 4px border-radius — flat, paper-like, not bubble-rounded. The waybill is a stiff paper tag, not a soft app card.
- **Buttons:** 4px border-radius, rectangular — confident and stamped, not pill-shaped.
- **Status stamps (StampBadge):** perfect circle (40x40px, `border-radius: 50%` or 20px), rotated -6°, 2px ink-colored ring with a deliberately uneven/hand-stamped edge. Uppercase mono text (9–10px) centered inside. This is the one element allowed full-roundness — because real ink stamps are round.
- **Inputs:** 4px border-radius, bottom-border-emphasized (1.5px Ink border on focus) rather than full box outlines — like writing on a form line.
- **Toggle thumb:** SQUARE — 16x16px with max 2px border-radius. Track is rectangular with 2px border-radius. Nothing about the toggle is circular.
- **Tear-line divider:** dashed 1.5px `Border` rule at 44px from card top, with two small semicircle "die-cut" notches (16px wide, 32px tall each) cut into the card's left and right edges at that position, exposing the Kraft background behind.
- **Avatars:** square with 4px border-radius (ID-badge photo), not circular. 48px (list) or 80px (profile).
- **Availability / status dots:** square (8x8px), `border-radius: 1px`.
- **Tab bar active tick:** a small 3px-tall Sunflower Yellow tick mark above the icon, `width: 24px`, `border-radius: 2px` (slightly rounded rectangle, not circular pill).

### Spacing

- Page padding: 16–20px
- Card padding: 16px, with the tear-line header zone occupying the top 44px
- Gap between cards: 10px (slightly looser — paper stacked, not glued)
- Section gap: 24px

### Shadows & Texture

- Cards: `box-shadow: 0 1px 6px rgba(34, 31, 26, 0.06)` — almost no shadow. Depth comes from the Kraft-vs-Paper color contrast, like paper sitting on a desk.
- FAB: `box-shadow: 0 3px 12px rgba(34, 31, 26, 0.18)` — the one element allowed a real shadow, since it visually "lifts" off the page.
- Optional: subtle paper-grain noise texture (2–3% opacity) on the Kraft background.

### Shared Components

**WaybillCard** — `Paper` fill, 4px border-radius, 1px `Border` hairline, faint shadow. Top 44px is the header zone (separated by a dashed tear-line with two semicircle notch cutouts at left/right edges). Variants:
- `default`: Paper fill, used for most cards
- `accent`: Sunflower Yellow Tint fill, for 1–2 cards per screen that need emphasis (Live Tracking, Welcome)

**StampBadge** (replaces pill badges) — small rotated circle (-6°), 40x40px, 2px ink-textured ring, centered uppercase mono text at 9–10px, color per status:

| Status | Ring / Text | Tint behind stamp (square, behind circle) |
|---|---|---|
| PENDING | Ink Muted | none |
| ASSIGNED | Manifest Green | Manifest Green Tint |
| PICKED_UP | Transit Amber | Transit Amber Tint |
| IN_TRANSIT | Transit Amber | Transit Amber Tint |
| DELIVERED | Manifest Green | Manifest Green Tint |
| FAILED | Customs Red | Customs Red Tint |
| FAILED_PERMANENT | Customs Red | Customs Red Tint |
| APPROVED | Manifest Green | Manifest Green Tint |
| REJECTED | Customs Red | Customs Red Tint |

**Compact variant** (for dense list rows): small 6px square tick of the status color + uppercase mono label (11px, no circle). No rotation.

### Design Principles (apply to every screen)

1. Page background is always `Kraft` (`#EDE6D3`); cards are always `Paper` (`#FAF7F0`). The material contrast carries the depth — not shadow, not rounded-corner softness.
2. `Sunflower Yellow` (`#FFC107`) is the **sole** CTA color — never used for status (green/amber/red own status, via stamps).
3. Radius stays 4px everywhere except the StampBadge circle (50%) and tab tick mark (2px) — sharp, paper-like, not bubble-rounded.
4. Every order ID, LKR amount, phone number, and timestamp renders in IBM Plex Mono — this single rule makes the app feel like real logistics tooling.
5. Space Grotesk is reserved for hero numbers and section titles only — never body copy, never buttons.
6. Icons: simple line-weight icons (1.5px stroke, Material Symbols OUTLINE style), Ink color when inactive, Sunflower Yellow when active. NEVER use filled/`FILL 1` icon style.
7. Modals slide up with a torn-edge top (zig-zag or notch cut at the top border, not a clean rounded sheet).
8. Tab bar extends into the safe area on notch devices.

---

## 2. Screens (generate in this order)

### 2.1 Splash Screen
`Kraft` background. Centered: a 96px square "stamp" mark — the Bee Driver logo rendered as an ink-stamped emblem (rotated -4°, rough ring edge, 2px Ink border, `border-radius: 4px` for the outer container), not a soft circular mascot bubble. Below it: "BEE DRIVER" in Space Grotesk Bold, 22px, `Ink`, tight tracking. Below that: "PARCEL MANIFEST SYSTEM" in IBM Plex Mono, 10px, uppercase, `Ink Muted`, +1px tracking — reads like a printed form title. Thin horizontal rule (1px `Border`, 120px wide) beneath. Auto-transitions after ~1.5s.

### 2.2 Login Screen
`Kraft` background, centered, keyboard-avoiding. Small stamp emblem (48px) top of form, off-center-left rather than fully centered, like a letterhead. Title "Sign in" (Space Grotesk Bold, 24px, `Ink`). Subtitle "Enter your driver credentials" (IBM Plex Sans, 14px, `Ink Faded`). Fields: label (11px uppercase mono, `Ink Muted`) above each input; input is bottom-border only (1.5px `Border`, becomes `Ink` on focus, `border-radius: 0` on top/left/right, 4px on bottom), no box fill — like writing directly on the page. Validation text in `Customs Red`, 12px mono. Full-width "Sign In" button: `Sunflower Yellow` fill, 4px border-radius, `Paper` text, IBM Plex Sans Medium 15px; 50% opacity when disabled.

### 2.3 Dashboard (Tab 1)
- **Header:** `Paper` fill, bottom hairline `Border`. Left: "Dashboard" (Space Grotesk Bold, 18px). Right: bell + profile icons (1.5px stroke OUTLINE style, `Ink`), unread bell gets a small `Sunflower Yellow` square dot (8x8px, 1px border-radius), no badge bubble.
- **Welcome WaybillCard:** header zone reads "DRIVER ID: BD-9921" in mono caption style on the tear-line; body: "Welcome back" (14px `Ink Faded`) / driver name (Space Grotesk Bold 22px) / today's date in mono caption. No mascot illustration — instead a small route-line sketch (thin Sunflower Yellow dashed path with two dots) sits right-aligned, evoking a delivery route.
- **Availability WaybillCard** (accent variant when online): left "STATUS" caption + large status word in Space Grotesk (`Manifest Green` "ONLINE" / `Customs Red` "OFFLINE" / `Transit Amber` "ON DELIVERY"); right: toggle switch — track is rectangular (`width: 48px, height: 24px, border-radius: 2px`), `Border` color when off, `Sunflower Yellow` when on; thumb is SQUARE 16x16px (`border-radius: 2px`), Paper fill. Disabled during active delivery.
- **Live tracking WaybillCard:** location-pin icon (OUTLINE, Sunflower Yellow, 1.5px stroke), "Live Tracking" label, small square dot (8x8px, 1px border-radius, Manifest Green) + "Sharing location" (mono caption, Ink Faded).
- **Quick actions row:** 3 equal WaybillCard stubs, no fill differentiation beyond icon color — Deliveries (package icon, Sunflower Yellow), New Expense (receipt icon, Transit Amber), My Stats (bar-chart icon, Manifest Green); icon 24px line-weight OUTLINE, label 11px uppercase mono beneath.
- **Recent deliveries:** section header "RECENT" (mono caption, Ink Muted) + "View all" link in Sunflower Yellow. List rows as compact items (not full WaybillCards): mono order ID top-left, customer name beneath (14px), StampBadge (compact variant: 6px square tick + uppercase mono label) + mono time-ago right-aligned. Rows separated by 1px Border hairline.

### 2.4 Deliveries List (Tab 2)
Header: `Paper`, "Deliveries" (Space Grotesk Bold 18px) + bell icon. Filter row styled as **tabs with an underline**, not pill chips: All / ASSIGNED / PICKED_UP / IN_TRANSIT / DELIVERED / FAILED (11px uppercase mono, `Ink Muted`); active tab gets a 2px Sunflower Yellow underline (`height: 3px, width: 100%, border-radius: 2px`) and `Ink` text, inactive is `Ink Muted` with no underline — like ledger column headers. List of compact delivery rows: mono order ID + StampBadge (compact: 6px square tick + label) + customer name + address line in Ink Faded. 10px gap, staggered fade-in. Pull-to-refresh, infinite scroll.

### 2.5 Delivery Detail (push from list)
`Kraft` background, staggered WaybillCard entry.
- **Customer card:** square 48px ID-badge avatar (Sunflower Yellow Tint fill, initials in mono), name (16px Medium), district (12px Ink Faded), tappable phone number in mono Manifest Green, address line with small pin icon.
- **Order info card:** key-value rows where every value (Order #, Total, Paid, Outstanding) renders in IBM Plex Mono — Paid in Manifest Green, Outstanding in Customs Red; keys in 12px uppercase `Ink Muted` caption style. Rows separated by 1px dashed Border rules.
- **Items card:** "ITEMS (N)" mono caption header; rows of item name (IBM Plex Sans) / qty (mono) / line total (mono), separated by 1px dashed Border rules.
- **Status timeline card:** vertical line with SQUARE (not circular) status markers (12x12px, 2px border-radius) per stamp color, status name (Medium 14px), timestamp in mono caption, optional note in Ink Faded.
- **Action buttons** (full-width, 4px border-radius): flow-specific "Mark Picked Up" → "Start Transit" → "Complete Delivery", all Sunflower Yellow fill; "Report Issue" is an outlined button (Customs Red 1.5px border, Customs Red text, Paper fill) — opens bottom sheet.
- **Delivery proof** (if delivered): photo + signature thumbnails styled as small attached "clipped" tags (slight rotation, shadow), tappable to expand.
- **Driver notes card** (if present), body text in Ink Faded.
- **Report Issue modal:** bottom sheet with torn/notched top edge, Paper fill. Title "Report an Issue" (Space Grotesk Bold 18px). Multiline textarea (bottom-border style). "Submit Report" — Customs Red fill button, 4px border-radius. "Cancel" as plain text link.

### 2.6 Delivery Complete (4-step wizard)
Progress indicator: dashed horizontal line with 4 square waypoint markers; completed = Sunflower Yellow fill, current = Sunflower Yellow outline, upcoming = Border outline. Step header: icon (OUTLINE) + title (Space Grotesk 18px) + subtitle (13px Ink Faded).
1. **Photo** — dashed-border (`Border`, 1.5px, 4px border-radius) upload area, 180px height, camera icon + "Add photo" in mono caption; preview with rotated "clipped tag" styling, "Remove" link.
2. **Signature** — signature pad on Paper surface with single guideline, 1px Border frame, 4px border-radius, 250px height; Clear/Save text links; preview with "Clear & redo."
3. **Notes** — textarea, bottom-border style, placeholder "Add any notes about this delivery…"
4. **Review** — summary rows, each with square check (Manifest Green) or cross (Customs Red), label in mono caption.

Bottom nav: "Back" (outlined button, Border, 4px border-radius) + "Next" / "Submit" (Sunflower Yellow fill, 4px border-radius).

### 2.7 Alerts (Tab 3)
"Mark all read" link, Sunflower Yellow, right-aligned, mono caption style, shown only if unread exist. List of compact rows: unread items get a solid 3px Sunflower Yellow left edge + Medium-weight title; read items are plain weight, no edge. Each row: small line-weight OUTLINE icon by alert type (warning/delivery/system/info, `Ink` stroke, never filled), title, 2-line message in Ink Faded, mono time-ago bottom-right, small Sunflower Yellow square dot (8x8px) for unread. Pull-to-refresh. Empty state: simple line-drawing of empty inbox tray, "No alerts" (Space Grotesk), "You're all caught up" (13px Ink Faded).

### 2.8 More (Tab 4)
Header "More" (Space Grotesk Bold 18px). Menu rows: 40px square icon tile (Sunflower Yellow Tint fill, OUTLINE icon, 1.5px stroke, no filled icons) + label (15px Medium) + right chevron (thin line, Ink Muted):
- Profile (person icon)
- Expenses (receipt icon)
- Statistics (bar-chart icon)

### 2.9 Profile (push)
Header: square 80px ID-badge avatar (Sunflower Yellow Tint, initials in mono, 4px border-radius), small camera-overlay tile bottom-right, "Edit" link in Sunflower Yellow. Form: First Name, Last Name, Phone, License — bottom-border inputs, mono uppercase labels, editable only in edit mode. "Save changes" button (Sunflower Yellow fill, 4px border-radius) shown only while editing. Static info: Email / Driver ID / Member Since as key-value mono rows, divided by dashed lines. "Change password" row (key icon + chevron). "Log out" row, centered, Customs Red text.

### 2.10 Change Password (push)
`Kraft` background. Three stacked bottom-border secure inputs: Current Password, New Password, Confirm New Password, mono uppercase labels. "Change Password" button (Sunflower Yellow fill, 4px border-radius).

### 2.11 Expenses (push)
Filter tabs (underline style, matching Deliveries): All / PENDING / APPROVED / REJECTED. List of compact rows: category icon (OUTLINE) + description (14px Medium), category + date in mono caption, amount in IBM Plex Mono Bold 16px right-aligned, StampBadge (compact). Pull-to-refresh. Empty state: line-drawing of empty receipt, "No expenses logged", "Tap + to add one". Square 56px FAB (Sunflower Yellow fill, white "+", 4px border-radius), bottom-right, with real drop shadow.

### 2.12 Create Expense (push from FAB)
Category selector — bottom-border field showing current category + chevron. Amount field in mono, large (24px), with "LKR" prefix. Description textarea, bottom-border style. Date selector — bottom-border field, opens picker. Optional receipt upload: dashed-border tile or preview with "Remove." "Submit Expense" button (Sunflower Yellow fill, 4px border-radius).

### 2.13 Stats (push)
Total Deliveries WaybillCard: route icon, label (13px Ink Faded), hero value (Space Grotesk Bold 32px, Ink). Side-by-side Completed (Manifest Green value) / Failed (Customs Red value) cards. Total Earnings: hero value in IBM Plex Mono Bold (precise financial figure), Manifest Green, "LKR" caption prefix. Rating card: star icon, value in Transit Amber. Delivery Performance card: two horizontal progress bars — Completion (Manifest Green fill) and Failure (Customs Red fill), 6px height, 2px border-radius, Border-tinted track, percentage in mono right-aligned. Pull-to-refresh.

---

## 3. Navigation Structure

**Bottom tab bar** — `Paper` fill, 1px `Border` top hairline, height 56px + safe-area inset. Each tab: icon (1.5px stroke OUTLINE, 22px) above an 11px uppercase mono label. Inactive: `Ink Muted`. Active: `Sunflower Yellow` icon + label, with a small `Sunflower Yellow` tick mark above the icon (24px wide, 3px tall, border-radius: 2px) — like a hole-punched ticket indicating the active stop. NOT a filled pill background.

| Tab | Icon |
|---|---|
| Dashboard | grid_view (OUTLINE) |
| Deliveries | package_2 (OUTLINE) |
| Alerts | notifications (OUTLINE) |
| More | menu (OUTLINE) |

**Screen flow:**
```
Root Stack
├── Splash → auto-transitions
├── Login (unauthenticated)
└── App (Tab Navigator)
    ├── Dashboard → Delivery Detail → Delivery Complete, Profile, Alerts, Create Expense, Stats
    ├── Deliveries List → Delivery Detail → Delivery Complete
    ├── Alerts
    └── More → Profile → Change Password, Expenses → Create Expense, Stats
```

Push screens: `Paper` header with back chevron, title in Space Grotesk Bold 17px.

---

## 4. Motion & Interaction

### Transitions
- **Screen push (tab → detail):** slide-in from right, 280–320ms, ease-out curve. Outgoing screen slightly dims/parallax-shifts left.
- **Tab switches:** instant content swap — only the active tick/icon animates (120ms scale + color fade).
- **Modals / bottom sheets:** slide up with slight overshoot (spring, damping ~0.85), backdrop fades in. Dismiss = reverse, 200ms.
- **Back gesture:** edge swipe-to-go-back on iOS with live-tracked drag.

### Micro-interactions
- **Buttons:** scale to 0.97 + slight opacity drop on press, spring back on release.
- **Cards (tappable):** subtle scale-down (0.98) + shadow lift reduction on press.
- **Toggles:** thumb slides with spring easing, track color cross-fades.
- **Tab bar icon:** small bounce/scale-up (1.0 → 1.15 → 1.0) when selected, ~250ms.
- **Pull-to-refresh:** rotating dashed-circle "stamp" indicator (matches StampBadge motif) that rotates proportionally to pull distance, snaps back with spring — not a generic spinner.
- **FAB:** rotates 45° into an "x" when related sheet is open.

### Content appearance
- **Skeleton screens:** shimmer animation sweeping left-to-right, ~1.2s loop, for any list/card content.
- **Staggered fade/slide-in:** list items animate with 40–60ms stagger between each.
- **Optimistic UI:** small actions (mark read, toggle) update UI instantly, reconcile silently.
- **Image loading:** blur-up or skeleton placeholder while photos load, fade to full over ~200ms.

### Haptics
- Light tap: button press, toggle flip, tab switch
- Medium: successful submission, pull-to-refresh trigger
- Error (double-buzz): failed validation, failed submission

---

## 5. Visual States (generate as variants per relevant screen)

- **Loading:** per-screen skeletons — pulsing `Border`-colored bars inside 4px-radius WaybillCard shapes (e.g. 5 skeleton rows on list screens) or rotating dashed-stamp indicator in Sunflower Yellow
- **Empty:** centered simple line-drawing illustration (not emoji), title in Space Grotesk 18px `Ink`, subtitle 14px `Ink Faded`
- **Error:** line-drawing warning icon, message in 16px `Ink Faded`, "Retry" button (Sunflower Yellow fill, 4px border-radius)

---

*End of corrected prompt — paste into Stitch.*
