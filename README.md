# Travel Planner

Responsive web app for planning trips. Single-user, local-only — no backend, no auth.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB) — for file/blob storage

## Features

- **Trip list** — cards with cover photo, destination, dates
- **Trip timeline** — horizontal roadmap-style bubbles, pre-trip vs trip separator
- **Drag to reorder** — reordering a bubble updates its date
- **Event types** — built-in + user-defined with custom label, icon, color
- **PDF export** — shareable trip summary

## Data stored locally

All data lives in IndexedDB (no network requests). Trips, events, and file attachments are stored in the browser.

## Dev

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```
