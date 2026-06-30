# Waybill Design System — Bee Driver

## Concept

A delivery-driver app built from real courier paperwork: kraft tags, ink stamps, tracking
numbers, tear-lines. The signature element is an **ink-stamped status badge** (rotated
circle, 2px ring, mono text) and **monospace data** (order IDs, amounts, timestamps)
used everywhere a real waybill would print them. Sharp corners (4px), paper-like cards,
one Courier Orange CTA.

## Colors

| Token           | Hex       | Use                           |
|-----------------|-----------|-------------------------------|
| Kraft           | `#EDE6D3` | Page background               |
| Paper           | `#FAF7F0` | Card / surface fill           |
| Ink             | `#221F1A` | Primary text, headlines       |
| Ink Faded       | `#5C5648` | Secondary body text           |
| Ink Muted       | `#928C7C` | Captions, placeholders        |
| Courier Orange  | `#FF6A13` | The one CTA/accent color      |
| Courier Deep    | `#C8500C` | Pressed CTA state             |
| Courier Tint    | `#FFE3CC` | Accent card fills             |
| Manifest Green  | `#2F6F4E` | Delivered/approved/online     |
| Manifest Tint   | `#E1ECE3` | Success card/badge backing    |
| Customs Red     | `#B23A2E` | Failed/rejected/urgent        |
| Customs Tint    | `#F3E2DE` | Danger card/badge backing     |
| Transit Amber   | `#C97F1E` | In-transit/pending-action     |
| Amber Tint      | `#F2E5CC` | Amber badge backing           |
| Border          | `#DCD3BC` | Hairline borders              |
| Overlay         | `rgba(34,31,26,0.55)` | Modal backdrops      |

## Typography

| Role           | Face              | Style                     |
|----------------|-------------------|---------------------------|
| Display        | Space Grotesk 700 | Hero numbers, section titles |
| Body           | IBM Plex Sans 400/500 | All reading text       |
| Data/utility   | IBM Plex Mono 500 | IDs, amounts, timestamps  |

| Style       | Size   | Weight | Face           |
|-------------|--------|--------|----------------|
| Section title | 20px | Bold   | Space Grotesk  |
| Card title  | 16px   | Medium | IBM Plex Sans  |
| Body        | 14–15px| Regular| IBM Plex Sans  |
| Data field  | 13–15px| Medium | IBM Plex Mono  |
| Caption     | 11–12px| Medium | IBM Plex Sans  |
| Button label| 15px   | Medium | IBM Plex Sans  |

## Shape

- Cards & buttons: **4px radius** (paper-like, not bubble-rounded)
- StampBadge: perfect circle (40px, `borderRadius: 20`), rotated -6°, 2px ring
- Inputs: 4px radius, bottom-border-emphasized on focus
- Toggle thumb: square (16px, `borderRadius: 2`)
- Avatars: square with 4px radius, not circular
- Status dots: square 8x8px

## Spacing

- Page padding: 16–20px
- Card padding: 16px, header tear-line at 44px
- Gap between cards: 10px
- Section gap: 24px

## Shadows

- Cards: `shadowOpacity: 0.06, shadowRadius: 6, offset: {0,1}`
- FAB: `shadowOpacity: 0.18, shadowRadius: 12, offset: {0,3}`

## Shared Components

### WaybillCard
Paper fill, 4px radius, 1px Border hairline, faint shadow. Top 44px header zone
separated by dashed tear-line with two semicircle notch cutouts.
Variants: `default` (Paper), `accent` (Courier Tint).

### StampBadge
40px circle, rotated -6°, 2px ring, centered uppercase mono 9–10px.
Compact variant: 6px square tick + uppercase mono label.

Status colors: PENDING=Ink Muted, ASSIGNED=Manifest Green, PICKED_UP=Transit Amber,
IN_TRANSIT=Transit Amber, DELIVERED=Manifest Green, FAILED=Customs Red,
FAILED_PERMANENT=Customs Red, APPROVED=Manifest Green, REJECTED=Customs Red.

### Tab Bar
Paper fill, Border top hairline. Active tab: Courier Orange tick above icon
(24×3px, 2px radius) + Courier Orange icon/label.
