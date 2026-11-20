# OwlFlow · KSU Campus Intelligence

**OwlFlow** is a local-first campus intelligence and mobility engine for Kennesaw State University. It combines a full cross-campus schedule, Drive + Park, Uber campus drop-off, Big Owl Bus, dining, dorm laundry, advisory alerts, EV charging, bundled parking-camera CV, and conversational Owl AI.

This repository is a deterministic hackathon simulation for Friday, November 20, 2026. It is not an official KSU, Uber, dining, laundry, or Big Owl Bus service.

## Run locally

Requirements: Node.js 20.19 or newer. Node.js 22 is recommended.

```bash
npm install
npm run dev
```

Create the production build:

```bash
npm run build
```

No API key is required. Fast Local mode and initial page load make no API or CDN requests.

## Live demonstration

The bottom **LIVE DEMO** dock drives three reproducible scenarios:

| Scenario | AI decision for `k-bio` | Key evidence |
|---|---|---|
| Normal Morning | Drive + Park | West Deck, about 31 minutes, Filling at about 93% |
| Decks Hit 98% Full | Uber Campus Drop-Off | About 28 minutes, $24–29 simulated fare, Campus Loop curb |
| Rain & Traffic Surge | Big Owl Bus | About 54 minutes, $0 |

Suggested sequence:

1. Start on Monday at 11:15 AM with BIOL 2108 selected.
2. Show the campus-jump and midterm intelligence alerts.
3. Flip all three scenarios and show Drive → Uber → Big Owl Bus without changing Dining or Laundry choices.
4. Select CS 3305 at ETC on Marietta campus. The full schedule remains and laundry is skipped because University Village is on the other campus.
5. Ask Owl AI about ETC, EV charging, laundry, a bus, or the next class. Sending a message does not modify the plan; only an action button does.
6. Open Dorm Laundry and show live machine countdowns plus CV Lost & Found.
7. Open the north-up 2D map and inspect labeled roads, white open-stall dots, parking facilities, glowing EV pins, and Apple/Google directions.
8. Open any camera angle. OwlFlow tries its `/videos/{deckId}-{angle}.mp4` asset, falls back to animated canvas CCTV when unavailable, and runs RGB/edge CV at 4 FPS. Push a level-scoped CV override.
9. Switch to Live Big Owl Bus, choose a moving vehicle, and show load, pass-up risk, status, next-stop ETA, and the official Passio GO! link.

## Workspace

- **Commute & Schedule:** compact arrival/origin controls, full Day/Week schedule, campus intelligence, static AI-ranked commute cards, and an after-arrival stepper.
- **Dining & Menu:** simulated station queues, crowd load, dietary filters, and representative menus for The Commons and Stingers.
- **Dorm Laundry:** two dorms per campus, washer/dryer telemetry, live countdowns, service outages, and CV Lost & Found.
- **Campus Map & Live CV:** north-up 2D dark-satellite SVG mapping, street geometry, painted parking bays, open-stall dots, EV charging, floating availability/directions cards, bundled camera streams with canvas fallback, pixel CV overrides, and smooth simulated Big Owl Bus tracking.

## Owl AI

Owl AI keeps a capped conversational thread while its drawer is mounted. Fast Local calls the real commute, parking, EV, laundry, dining, schedule, alert, and Lost & Found engines. Replies are read-only until the user clicks a typed action.

Optionally enable Gemini in `.env.local`:

```bash
VITE_GEMINI_API_KEY=your_key_here
```

Gemini is called only after a user sends an Owl AI message or explicitly clicks **Verify Frame with Gemini Vision**. Owl AI tries `gemini-2.5-flash` and may fall back to `gemini-2.5-flash-lite`; camera verification uses `gemini-2.5-flash` directly. Both paths send the key through `x-goog-api-key`, validate responses, and leave the local engines active on failure.

## Privacy and simulation boundaries

- Campus coordinates use the supplied OpenStreetMap geometry. Approximate points are labeled.
- Parking counts, CV confidence, EV occupancy, laundry state, bus load, fare, queue, crowd, alerts, and event windows are marked `SIM`.
- Deck cameras resolve to fixed same-origin MP4 paths. Missing or undecodable assets switch to an animated canvas CCTV stream, so no broken media box appears.
- Parking-frame CV samples calibrated stall pixels and an empty-asphalt reference strip locally. It sends one current JPEG frame only when the user explicitly requests Gemini verification; OwlFlow does not store that frame.
- Laundry Lost & Found is object-only simulated detection. No people or faces are stored.
- OwlFlow does not claim access to KSU cameras, laundry machines, transit APIs, or live parking telemetry.
- The app collects no account, license plate, or location history. Browser geolocation runs only after the user clicks the button.

## Engine outline

1. Seed deterministic deck, EV, laundry, dining, and transit values.
2. Apply optional level-scoped CV overrides.
3. Compare Drive + Park, Uber, and Big Owl Bus.
4. Plan ordered campus stops and attach advisory intelligence without changing the commute score.
5. Render one north-up 2D dark-satellite campus layer with parking, EV, camera, and bus overlays, without a map SDK.
6. Route Owl questions through real engine outputs and typed actions.

## Validation

```bash
npm run check
npm run build
```

There is no lint script in `package.json`.
