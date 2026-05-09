# Travel Planner

Responsive web app for planning trips. Single-user, local-only (no backend, no auth).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB — needed for blob/file storage)

## Data Model

### Trip
- id, name, destination, startDate, endDate, coverPhoto (blob, optional)

### BubbleEvent
- id, tripId, title, date, type (EventType), icon, notes, attachments (File blobs)

### EventType
- Default: `flight | accommodation | activity | task | other`
- Custom: user-defined with custom label + icon + color

## Core Features

1. **Trip list** — cards: cover photo + name + destination + dates
2. **Trip timeline** — single horizontal lane, roadmap-style bubbles
   - Visual separator marks where trip actually starts (pre-trip vs trip)
   - Bubble surface: icon + type + title + date
   - Tap bubble → detail modal: notes + file attachments
3. **Drag to reorder** — dragging a bubble updates its date to match new position
4. **Event types** — defaults + user-defined custom types
5. **PDF export** — trip summary for sharing

## Key Decisions

- Order driven by date; drag reorder updates the event date
- IndexedDB (Dexie) over localStorage — required for file/blob attachments
- No auth, no backend for MVP
- Mobile-responsive

## Commands

```bash
npm run dev     # dev server
npm run build   # production build
npm run lint    # lint
```
