# Apple-Inspired Minimalist Design — Bee Driver

## Concept

A delivery-driver app with Apple-level polish: clean white surfaces, generous whitespace,
a single accent color (Sunflower Yellow), and purposeful typography. Every element is
a deliberate reduction — no paper metaphors, no stamps, no kraft texture. Instead:
real depth from shadows (not borders), system-styled pill badges, and typography
that follows Apple's hierarchy: large bold headlines, medium subheads, regular body,
and muted captions.

## Colors

| Token           | Hex       | Use                           |
|-----------------|-----------|-------------------------------|
| Background      | `#FFFFFF` | Page background               |
| Surface         | `#F5F5F7` | Grouped/inset section fill    |
| Elevated        | `#FFFFFF` | Cards, sheets, popovers       |
| Text Primary    | `#1D1D1F` | Headlines, body text          |
| Text Secondary  | `#86868B` | Subheadings, metadata         |
| Text Tertiary   | `#AEAEB2` | Captions, placeholders        |
| Text on Color   | `#FFFFFF` | Text on accent/dark bg        |
| Sunflower Yellow| `#FFC107` | The one accent color          |
| Sunflower Deep  | `#D4A000` | Pressed CTA state             |
| Sunflower Tint  | `#FFF3CD` | Light accent fills            |
| Manifest Green  | `#2F6F4E` | Delivered/approved/online     |
| Green Tint      | `#E1ECE3` | Success badge backing         |
| Customs Red     | `#B23A2E` | Failed/rejected/urgent        |
| Red Tint        | `#F3E2DE` | Danger badge backing          |
| Transit Amber   | `#C97F1E` | In-transit/pending-action     |
| Amber Tint      | `#F2E5CC` | Amber badge backing           |
| Separator       | `#E5E5EA` | Hairline separators (rare)    |
| Overlay         | `rgba(0,0,0,0.35)` | Modal backdrops      |

## Typography

| Role              | Face              | Weight  | Size  |
|-------------------|-------------------|---------|-------|
| Screen title      | Space Grotesk     | Bold    | 28px  |
| Section title     | Space Grotesk     | Bold    | 22px  |
| Card title        | IBM Plex Sans     | Medium  | 16px  |
| Body              | IBM Plex Sans     | Regular | 15px  |
| Button / CTA      | IBM Plex Sans     | Medium  | 15px  |
| Caption           | IBM Plex Sans     | Regular | 13px  |
| Data / mono       | IBM Plex Mono     | Medium  | 13–15 |

Letter-spacing: body +0, captions +0.3, buttons +0.5.

## Shape & Depth

| Element       | Radius | Elevation (shadow) |
|---------------|--------|-------------------|
| Cards         | 10px   | 0 2px 12px rgba(0,0,0,0.08) |
| Buttons       | 10px   | none              |
| Badges (pills)| 6px    | none              |
| Inputs        | 10px   | none              |
| Modal/sheets  | 14px   | top rounded only   |
| FAB           | 14px   | 0 4px 16px rgba(0,0,0,0.15) |

- Cards use **shadow only** (no border) — the shadow provides the separation.
- Toggle thumb is **round** or pill-shaped.
- Avatars are **circular** (48px) for consistency with Apple patterns.
- Status dots are **circular** 8px.

## Spacing

- Page padding: 16px horizontal
- Section gap: 32px
- Card padding: 16px
- Gap between cards: 12px
- List row height: 56–64px

## Apple-Minimalist Principles

1. **No borders where shadow suffices.** Cards, list rows, and containers use elevation
   (shadow + background) to separate from the surface. Lines only used as hairline
   separators between list items.
2. **One accent color.** Sunflower Yellow appears only on CTAs, active tab state,
   and interactive elements. Statuses use their own semantic colors.
3. **Typography is the hierarchy.** Size and weight differences between screen title,
   section title, body, and caption are the primary wayfinding mechanism —
   not boxes, borders, or colored backgrounds.
4. **Generous whitespace.** 32px between sections, 16px horizontal padding,
   minimum 12px touch targets. Content breathes.
5. **Micro-interactions.** Fade-in on screen mount, subtle scale on card press,
   smooth tab transitions. Nothing decorative — only functional motion.

## Shared Components

### WaybillCard → Card
White bg, 10px radius, shadow-only (no border). Optional `accent` variant uses
Courier Tint fill. No tear-line, no notch.

### StampBadge → Badge
Apple-style pill badge: rounded rectangle (`borderRadius: 6`), 1px tint-colored ring,
mono uppercase 10px text. Compact variant: circular 6px dot + mono uppercase label.

### Tab Bar
White background. Active tab: filled icon + `#1D1D1F` label. Inactive: outline
icon + `#AEAEB2`. No tick mark, no top border.
