# OwlFlow Hackathon Pitch Script

## Before presenting

- Add your real informal-survey count to the spoken hook if you have one. Do not invent a sample size. The deck currently says only that your conversations revealed the same pattern.
- Keep slide 5 open as a backup if the live demo fails.
- Use **Fast Local** during judging so the demo does not depend on an API key or network latency.
- The humorous student lines are original paraphrases with Reddit-style energy. They are not direct quotations or survey evidence.
- Practice once with a timer. The intended pacing is 1 minute problem, 1 minute solution, 2 minutes demo, and 1 minute feasibility/close.

## 0:00–0:10 — Slide 1: OwlFlow

> College schedules are fixed, but campus conditions are not. OwlFlow gives every student one coordinated answer: when to leave, how to get here, where to park or transfer, when to eat, and whether laundry fits before the next class.

## 0:10–0:50 — Slide 2: Campus impact

> Students do not experience parking, dining, and laundry as separate products. They experience all three as lost time. A Utah Valley University student study found that finding campus parking took about eleven minutes on average. University of Maryland research found dining-hall plate waste equal to five to fourteen percent of food served. KSU has more than fifty-one thousand students across two campuses, so even small improvements can reach a large community.
>
> Our own conversations kept returning to the same uncertainty: “Will I find a spot? Is the line worth it? Is a washer actually open?” OwlFlow targets that uncertainty rather than adding another static campus page.

## 0:50–1:10 — Slide 3: Core solution

> A student gives OwlFlow the one constraint that matters most: the next class. OwlFlow combines that schedule with campus conditions and produces one journey. It selects Drive and Park, Uber, or Big Owl Bus; finds a dining option that fits the available time and preferences; and recommends a laundry cycle only when it can finish before class. When one signal changes, the whole plan recomputes.

## 1:10–1:30 — Slide 4: AI is core

> AI is the decision layer, not a decorative chatbot. The local engine forecasts demand, scores each commute by lateness, cost, walking, and load, detects parking occupancy in the browser at four frames per second, and schedules dining and laundry around class. Fast Local works privately without token cost. Gemini is optional for natural-language explanation and a user-triggered vision check, with the local answer as fallback.

## 1:30–3:30 — Slide 5: Live demo

### Demo cue 1 — Change the commute

1. Start on **Commute & Schedule** with the default BIOL schedule and **Normal Morning**.
2. Point out the **Drive + Park** recommendation and West Deck.
3. Select **Decks Hit 98% Full**. Point out that the winner changes to **Uber**.
4. Select **Rain & Traffic Surge**. Point out that the winner changes to **Big Owl Bus**.

> This is not one answer repeated three ways. The engine reacts to occupancy, traffic, weather, cost, walking, and the deadline set by class.

### Demo cue 2 — Close the feedback loop

1. Return to **Normal Morning**.
2. Open **Campus Map**, select a deck, and open a camera angle.
3. Let the detector display its OPEN/CAR regions, then choose **Push Detected Spots to OwlFlow**.
4. Show that the deck reading and recommendation share the updated state.
5. Open **Owl AI** and ask: **“Where is an open EV charger?”** Use its typed map action.

> The camera demo uses the prototype’s included deterministic fallback. In a KSU pilot, the same adapter would receive approved camera counts. Owl AI reads the same plan facts and offers explicit actions rather than silently changing the student’s plan.

If the app fails, narrate the three rows on slide 5: normal conditions choose Drive and Park; full decks choose Uber; rain and traffic choose Big Owl Bus.

## 3:30–4:05 — Slide 6: Creativity

> OwlFlow connects details that campus tools usually leave separate. Parking occupancy can change the entire commute, not just reveal a stall. Dining combines schedule, walking, queue, menu, and preferences such as halal or vegan; aggregated demand could later help Dining prepare the right amount at each station. Laundry becomes a schedule problem: choose a machine whose cycle fits, then add GroupMe or mobile notifications instead of another wasted trip downstairs.

## 4:05–4:40 — Slide 7: Feasibility

> Today’s build is local-first and reproducible, with simulated operational feeds. We would pilot one deck, one dining hall, and one residence hall. Camera processing should happen at the edge so KSU receives counts and events, not stored video. Fast Local has no model-token cost. As an illustrative ceiling, five thousand short Gemini Flash-Lite requests per day cost about ninety cents in tokens at the November 2026 posted rates; hosting and video traffic are separate. Production also moves the model key behind a server, adds quotas, and treats dietary results as preference guidance, not an allergen guarantee.

## 4:40–5:00 — Slide 8: Close

> We will measure before and after: parking-search minutes, on-time arrival, dining wait, wasted laundry trips, forecast error, and food overproduction. Our ask is a ninety-day KSU pilot with access to approved feeds for one deck, one dining hall, and one residence hall. OwlFlow means less guessing and more living. Give every Owl the best next move.

## Likely judge questions

### “Is the campus data live?”

Not in this hackathon branch. The prototype uses deterministic adapters so every judge sees the same behavior. The rollout replaces them one at a time with approved camera counts, official menu updates, laundry-vendor telemetry, and transit data.

### “What makes this AI instead of a set of screens?”

A shared inference and scoring layer turns changing signals into a coordinated journey. Parking CV can alter occupancy, occupancy can change the commute winner, and the selected route changes the time available for dining and laundry. Optional Gemini explains decisions; it does not supply the core recommendation.

### “How do you protect privacy?”

The current local mode keeps planning and CV in the browser. A pilot should process camera occupancy at the edge, transmit counts rather than raw video, require explicit permission for location or vision, avoid face recognition, and put any model key behind a quota-controlled server.

### “How does Dining benefit?”

An opt-in, aggregated demand forecast can estimate station-level demand by time and preference. Dining can compare forecasts with actual production and waste, then adjust preparation. This is a rollout feature, not a claim about the current hardcoded menu prototype.

### “How will you know it works?”

Establish a baseline, run the focused pilot, then compare median search/wait time, on-time arrival, wasted laundry trips, forecast error, and food overproduction. The team should report measured outcomes rather than projected savings.
