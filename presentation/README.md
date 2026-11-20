# OwlFlow Hackathon Pitch

This folder contains a five-minute, 16:9 PDF pitch deck tailored to the AI Club Hackathon 2026 judging rubric supplied in opening-ceremony slide 22.

## Files

- `OwlFlow-Hackathon-Pitch-v2.pdf` — 10-slide presentation; slide 2 shows the r/KSU parking post
- `OwlFlow-Hackathon-Pitch.pdf` — original 9-slide presentation, kept unchanged
- `generate-deck.cjs` — editable PDFKit source for the 10-slide version
- `assets/reddit-ksu-parking-post.png` — r/KSU screenshot used on slide 2 of the 10-slide version
- `PITCH_SCRIPT.md` — timed narration, live-demo cues, and judge Q&A
- `package.json` / `package-lock.json` — presentation-only dependencies

## Build

```bash
cd presentation
npm ci
npm run build
```

The command writes `OwlFlow-Hackathon-Pitch-v2.pdf` in this directory. It does not overwrite the original `OwlFlow-Hackathon-Pitch.pdf`.

## Pitch timing

Slide numbers below and in `PITCH_SCRIPT.md` follow the original 9-slide deck. In the 10-slide version, the r/KSU post is slide 2 and each later slide moves down by one.

| Time | Slides | Purpose |
|---|---:|---|
| 0:00–1:00 | 1–2 | Hook and campus impact |
| 1:00–2:00 | 3–4 | Core solution and central AI role |
| 2:00–4:00 | 5 | Live demo, with the slide as a fallback |
| 4:00–5:00 | 6–8 | Creativity, feasibility, measured impact, and ask |
| Appendix | 9 | Sources and claim boundaries |

## Rubric coverage

- **Campus impact, 25:** university parking-time research, university food-waste research, KSU student reach, and student-friction framing
- **Use of AI, 25:** demand forecast, multimodal scoring, browser CV, schedule-aware orchestration, and optional Gemini explanation
- **Feasibility, 20:** data adapters, edge processing, explicit simulation boundary, cost assumptions, safeguards, and staged rollout
- **Creativity, 15:** parking decisions that replan the commute, dining demand/waste link, and schedule-aware laundry with planned notifications
- **Pitch, 15:** one narrative, a two-minute demo sequence, minimal slide text, and a concrete pilot ask

## Claim boundaries

The deck distinguishes shipped prototype behavior from proposed rollout work:

- Built: local deterministic planning, scenario switching, browser parking CV, maps, schedule-aware dining/laundry logic, commute scoring, and Owl AI actions
- Simulated in this branch: live parking occupancy, traffic, weather, bus telemetry, dining queues, menus, laundry telemetry, EV availability, and lost-and-found detections
- Proposed: approved KSU feeds, dining operations forecasting, GroupMe/mobile notifications, secure model proxy, and a 90-day pilot

The dietary filters are presented as preference aids. They must not be described as allergen-safety guarantees.

## Visual and factual sources

The deck uses project-owned map assets from:

- `../public/maps/ksu-kennesaw.png`
- `../public/maps/ksu-marietta.png`

External facts and URLs appear on the sources slide (slide 9 in the original deck, slide 10 in the 10-slide version). The humorous student lines are original paraphrases rather than copied Reddit comments. This preserves the requested tone without presenting uncited comments as research.

Slide 2 of the 10-slide version shows a screenshot of one public r/KSU post as posted. Its caption labels it as one student's account, and the sourced figures on the next slide carry the scale claims.

The model-cost example is illustrative, based on 5,000 requests per day, 1,000 input tokens and 200 output tokens per request, and the Google AI Studio Flash-Lite rates visible on November 20, 2026. Hosting, networking, video processing, taxes, and future price changes are excluded.
