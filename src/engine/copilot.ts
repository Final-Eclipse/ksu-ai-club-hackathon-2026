import { CAMPUSES } from '../data/campuses';
import { EV_CHARGERS } from '../data/evChargers';
import { KSU_KNOWLEDGE, KSU_KNOWLEDGE_LABEL } from '../data/ksuKnowledge';
import { LOST_AND_FOUND } from '../data/laundry';
import { decideCommute, getCommuteOption } from './commute';
import { planDining } from './dining';
import { haversineMeters } from './geo';
import { geminiAvailable, requestGemini, requestGeminiPayload } from './gemini';
import { planLaundry } from './laundry';
import { formatClock, parseClock } from './time';
import type {
  Campus,
  CampusAlert,
  CampusId,
  ClassSession,
  CommuteDecision,
  CommuteProfile,
  CopilotIntent,
  CopilotResult,
  CvOverrides,
  DayCode,
  DeckReading,
  DietaryTag,
  DiningHall,
  DiningStationReading,
  EvChargerReading,
  LaundryRoom,
  MachineReading,
  OwlAction,
  OwlChatMessage,
  OwlReply,
  Place,
  Scenario,
} from '../types';

export const OWL_SUGGESTIONS = [
  'How do I get to ETC fastest right now?',
  'Where is an open EV charger?',
  'Do I have time for laundry?',
  "What's my best move right now?",
] as const;

export const COPILOT_CHIPS = OWL_SUGGESTIONS;

export interface CopilotContext {
  day: DayCode;
  campusName: string;
  targetName: string;
  scenarioLabel: string;
  arrivalLabel: string;
}

export interface OwlContext {
  campus: Campus;
  day: DayCode;
  arrivalMin: number;
  scenario: Scenario;
  profile: CommuteProfile;
  nextClass: ClassSession | null;
  target: Place;
  decision: CommuteDecision;
  readings: readonly DeckReading[];
  allReadings: readonly DeckReading[];
  cvOverrides: CvOverrides;
  evReadings: readonly EvChargerReading[];
  diningHall: DiningHall;
  diningReadings: readonly DiningStationReading[];
  laundryRoom: LaundryRoom;
  laundryReadings: readonly MachineReading[];
  alerts: readonly CampusAlert[];
  classes: readonly ClassSession[];
}

function detectedDay(text: string): DayCode | null {
  const normalized = text.toLowerCase();
  if (/\bmonday\b/.test(normalized)) return 'M';
  if (/\btuesday\b/.test(normalized)) return 'T';
  if (/\bwednesday\b/.test(normalized)) return 'W';
  if (/\bthursday\b/.test(normalized)) return 'R';
  if (/\bfriday\b/.test(normalized)) return 'F';
  return null;
}

function detectedTimes(text: string): number[] {
  const matches = text.match(/\b(?:noon|\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/gi) ?? [];
  return matches.flatMap((match) => {
    const minute = parseClock(match);
    return minute === null ? [] : [minute];
  });
}

function detectCampus(text: string): CampusId {
  return /\bmarietta\b|\batrium\b|\bengineering technology center\b|\betc\b|\bq building\b/i.test(text)
    ? 'marietta'
    : 'kennesaw';
}

function detectPlace(text: string): Place | null {
  const normalized = text.toLowerCase();
  const places = Object.values(CAMPUSES)
    .flatMap((campus) => campus.places)
    .slice()
    .sort((a, b) => {
      const longestA = Math.max(a.name.length, a.short.length, ...a.aliases.map((alias) => alias.length));
      const longestB = Math.max(b.name.length, b.short.length, ...b.aliases.map((alias) => alias.length));
      return longestB - longestA;
    });
  return places.find((place) =>
    [place.name, place.short, ...place.aliases].some((name) => normalized.includes(name.toLowerCase())),
  ) ?? null;
}

function detectDorm(text: string, campusId: CampusId): string | null {
  const normalized = text.toLowerCase();
  const dorm = CAMPUSES[campusId].places
    .filter((place) => place.kind === 'dorm')
    .find((place) => [place.name, place.short, ...place.aliases].some((name) => normalized.includes(name.toLowerCase())));
  return dorm?.id ?? null;
}

function detectDietaryTags(text: string): DietaryTag[] {
  const normalized = text.toLowerCase();
  const tags: DietaryTag[] = [];
  if (normalized.includes('vegetarian')) tags.push('vegetarian');
  if (normalized.includes('vegan')) tags.push('vegan');
  if (normalized.includes('halal')) tags.push('halal');
  if (/gluten[ -]?free/.test(normalized)) tags.push('gluten-free');
  return tags;
}

function detectScenario(text: string): CopilotIntent['scenarioId'] {
  if (/pouring|rain|storm|traffic surge/i.test(text)) return 'rainSurge';
  if (/decks? (?:are |is )?full|parking (?:is )?full|98%/i.test(text)) return 'decksFull';
  return 'normal';
}

export function parseIntentLocal(text: string, fallbackDay: DayCode = 'M'): CopilotIntent {
  const place = detectPlace(text);
  const campusId = place?.campusId ?? detectCampus(text);
  const times = detectedTimes(text);
  const classMatch = text.match(/class\s+(?:starts?\s+)?at\s+(noon|\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  const classTimeText = classMatch?.[1];
  const classStartMin = classTimeText ? parseClock(classTimeText) : times[1] ?? null;
  const arrivalMatch = text.match(/(?:arriv\w*|get to campus)[^\d]*(noon|\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  const arrivalTimeText = arrivalMatch?.[1];
  const arrivalMin = arrivalTimeText ? parseClock(arrivalTimeText) : times[0] ?? null;
  const needsDining = /lunch|dinner|breakfast|dining|eat|meal|vegetarian|vegan|halal|gluten[ -]?free/i.test(text);
  const needsLaundry = /laundry|washer|dryer|wash clothes/i.test(text);
  return {
    raw: text,
    campusId,
    day: detectedDay(text) ?? fallbackDay,
    arrivalMin,
    classStartMin,
    buildingId: place?.id ?? null,
    dormId: detectDorm(text, campusId),
    needsDining,
    needsLaundry,
    dietaryTags: detectDietaryTags(text),
    scenarioId: detectScenario(text),
  };
}

function actionForDecision(decision: CommuteDecision): OwlAction | null {
  const winner = getCommuteOption(decision, decision.winner);
  if (winner.mode === 'uber' && winner.uber) return { id: 'owl-open-uber', label: 'Open in Uber →', kind: 'openUrl', url: winner.uber.deepLink };
  if (winner.mode === 'drive' && winner.deck) return { id: 'owl-open-deck', label: 'View Open Spots on Map →', kind: 'openMap', mode: 'parking', focus: { kind: 'deck', id: winner.deck.deck.id } };
  if (winner.mode === 'shuttle') return { id: 'owl-open-bus', label: 'Go to Bus Map', kind: 'openMap', mode: 'bus' };
  return null;
}

function localReply(answer: string, facts: string[], action: OwlAction | null, followUps: string[]): OwlReply {
  return { answer, facts, action, followUps: followUps.slice(0, 3), engineLabel: 'Owl Local · 3 ms' };
}

function routeReply(question: string, context: OwlContext, place: Place): OwlReply {
  const campus = CAMPUSES[place.campusId];
  const deckIds = new Set(campus.decks.map((deck) => deck.id));
  const readings = context.allReadings.filter((reading) => deckIds.has(reading.deckId));
  const decision = decideCommute({
    campus,
    target: { name: place.name, geo: place.geo },
    classStartMin: context.nextClass?.startMin ?? context.arrivalMin + 60,
    arrivalMin: context.arrivalMin,
    profile: context.profile,
    scenario: context.scenario,
    readings,
  });
  const winner = getCommuteOption(decision, decision.winner);
  const alternative = decision.options
    .filter((option) => option.eligible && option.mode !== winner.mode)
    .slice()
    .sort((a, b) => a.totalMin - b.totalMin)[0];
  const express = place.campusId !== context.campus.id
    ? ' Since it is on the other campus, check the Kennesaw–Marietta Express before leaving.'
    : '';
  const answer = `${winner.title} is fastest to ${place.short} at ${winner.totalMin} min, arriving about ${formatClock(winner.arriveMin)}.${alternative ? ` ${alternative.title} is the next option at ${alternative.totalMin} min.` : ''}${express}`;
  return localReply(answer, [decision.explanation, question], actionForDecision(decision), ['Show the parking map', 'What is the bus load?', 'When is my next class?']);
}

export function answerLocal(question: string, context: OwlContext): OwlReply {
  const normalized = question.toLowerCase();
  const place = detectPlace(question);
  if (/get to|fastest|route|directions/.test(normalized) || place) {
    return routeReply(question, context, place ?? context.target);
  }

  if (/\bev\b|charger|charging/.test(normalized)) {
    const candidates = EV_CHARGERS.flatMap((charger) => {
      const reading = context.evReadings.find((item) => item.chargerId === charger.id);
      return reading && reading.free > 0 ? [{ charger, reading, distance: haversineMeters(charger.geo, context.target.geo) }] : [];
    });
    const nearest = candidates.slice().sort((a, b) => a.distance - b.distance)[0];
    if (!nearest) return localReply('The simulated context has no charger with a free port right now.', ['EV availability is simulated.'], null, ['Show parking instead']);
    return localReply(`${nearest.charger.name} is nearest to ${context.target.short}, with ${nearest.reading.free} of ${nearest.reading.ports} ports free (SIM).`, [`${Math.round(nearest.distance)} m straight-line distance`, KSU_KNOWLEDGE_LABEL], { id: 'owl-show-ev', label: 'Show EV chargers on map', kind: 'openMap', mode: 'parking', focus: { kind: 'ev', id: nearest.charger.id } }, ['How long is the walk?', 'Show my best parking deck']);
  }

  if (/laundry|washer|dryer/.test(normalized)) {
    const classStart = context.nextClass?.startMin ?? context.arrivalMin + 60;
    const plan = planLaundry(context.laundryRoom, context.laundryReadings, context.arrivalMin, classStart);
    const margin = classStart - plan.finishMin;
    const answer = `${plan.finishesBeforeClass ? 'Yes' : 'Not safely'} — ${plan.machineLabel} ${plan.waitMin ? `opens in ${plan.waitMin} min` : 'is free'}; a ${plan.cycleMin}-min wash finishes at ${formatClock(plan.finishMin)}${context.nextClass ? `, leaving ${margin} min before ${context.nextClass.course}` : ''}.`;
    return localReply(answer, [plan.explanation], { id: 'owl-open-laundry', label: 'Open Dorm Laundry', kind: 'openTab', tab: 'laundry' }, ['What was left in Lost & Found?', 'Can I fit lunch too?']);
  }

  if (/lost|found|hoodie|basket/.test(normalized)) {
    const items = LOST_AND_FOUND.filter((item) => item.roomId === context.laundryRoom.id);
    const first = items[0];
    const answer = first ? `${items.length} items are in ${context.laundryRoom.name} CV Lost & Found (SIM). The latest listed item is: ${first.text}.` : `No simulated Lost & Found items are listed for ${context.laundryRoom.name}.`;
    return localReply(answer, items.map((item) => item.text), { id: 'owl-open-lost', label: 'Open Dorm Laundry', kind: 'openTab', tab: 'laundry' }, ['Do I have time for laundry?']);
  }

  if (/\bbus\b|shuttle|pass-up|passio/.test(normalized)) {
    const shuttle = getCommuteOption(context.decision, 'shuttle');
    const load = shuttle.shuttle?.loadPct ?? 0;
    return localReply(`Big Owl Bus is at ${load}% passenger load (SIM), with ${load > 85 ? 'high pass-up risk' : 'no current pass-up alert'}; this trip takes about ${shuttle.totalMin} min.`, [KSU_KNOWLEDGE[0] ?? '', KSU_KNOWLEDGE[2] ?? ''], { id: 'owl-bus-map', label: 'Go to Bus Map', kind: 'openMap', mode: 'bus' }, ['What is my fastest option?', 'Where does the Express stop?']);
  }

  if (/parking|deck|open spot/.test(normalized)) {
    const drive = getCommuteOption(context.decision, 'drive');
    if (!drive.deck) return localReply('No parking deck result is available in the current context.', [], null, []);
    return localReply(`${drive.deck.deck.name} has ${drive.deck.reading.open} open spaces at ${Math.round(drive.deck.reading.occupancy * 100)}% occupancy (SIM); Level ${drive.deck.reading.bestLevel} has the most openings.`, [context.decision.explanation], { id: 'owl-parking-map', label: 'View Open Spots on Map →', kind: 'openMap', mode: 'parking', focus: { kind: 'deck', id: drive.deck.deck.id } }, ['Where is an EV charger?', 'Compare with Uber']);
  }

  if (/dining|lunch|eat|menu|food/.test(normalized)) {
    const plan = planDining(context.diningHall, context.arrivalMin, context.scenario, [], context.campus.center, context.target.geo, context.nextClass?.startMin ?? context.arrivalMin + 60);
    return localReply(`${plan.stationName} has the shortest matching line at ${plan.queueMin} min (SIM); ${plan.menuItem.name} is ${plan.menuItem.calories} calories and ${plan.fitsBeforeClass ? 'fits before class' : 'makes the class window tight'}.`, [`${plan.crowdPct}% simulated crowd load`], { id: 'owl-open-dining', label: 'Open Dining & Menu', kind: 'openTab', tab: 'dining' }, ['Show vegetarian options', 'Can laundry fit too?']);
  }

  if (/next class|class next|where.*class/.test(normalized)) {
    const session = context.nextClass;
    return session
      ? localReply(`${session.course} starts at ${formatClock(session.startMin)} in ${context.target.name}, room ${session.room}; the current AI route arrives at ${formatClock(getCommuteOption(context.decision, context.decision.winner).arriveMin)}.`, [`${session.campusId} campus`], null, ['What is the fastest route?', 'Can I fit lunch?'])
      : localReply('No next class is available in the current schedule.', [], null, []);
  }

  if (detectedTimes(question).length) {
    const intent = parseIntentLocal(question, context.day);
    return localReply(`I parsed ${intent.arrivalMin === null ? 'your current arrival' : formatClock(intent.arrivalMin)} and ${intent.classStartMin === null ? 'the next class' : `a ${formatClock(intent.classStartMin)} class`}. Review it before applying the change.`, [JSON.stringify(intent)], { id: 'owl-apply-intent', label: 'Apply to my plan', kind: 'applyPlan', intent }, ['What is my best move after that?']);
  }

  return localReply(`${context.decision.explanation} I can also check parking, buses, EV charging, dining, laundry, Lost & Found, and cross-campus timing.`, [context.decision.explanation], actionForDecision(context.decision), [...OWL_SUGGESTIONS].slice(0, 3));
}

function parsedGeminiReply(payload: unknown, actions: readonly OwlAction[]): { answer: string; action: OwlAction | null; followUps: string[] } | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = Reflect.get(payload, 'candidates');
  if (!Array.isArray(candidates)) return null;
  const first = candidates[0];
  if (!first || typeof first !== 'object') return null;
  const content = Reflect.get(first, 'content');
  if (!content || typeof content !== 'object') return null;
  const parts = Reflect.get(content, 'parts');
  if (!Array.isArray(parts)) return null;
  const part = parts[0];
  if (!part || typeof part !== 'object') return null;
  const text = Reflect.get(part, 'text');
  if (typeof text !== 'string') return null;
  let parsed: unknown;
  try { parsed = JSON.parse(text) as unknown; } catch { return null; }
  if (!parsed || typeof parsed !== 'object') return null;
  const answer = Reflect.get(parsed, 'answer');
  const actionId = Reflect.get(parsed, 'actionId');
  const followUps = Reflect.get(parsed, 'followUps');
  if (typeof answer !== 'string' || !Array.isArray(followUps)) return null;
  const action = typeof actionId === 'string' ? actions.find((candidate) => candidate.id === actionId) ?? null : null;
  return {
    answer: answer.trim().slice(0, 600),
    action,
    followUps: followUps.filter((item): item is string => typeof item === 'string').slice(0, 3),
  };
}

function compactContext(context: OwlContext): string {
  const data = {
    campus: context.campus.name,
    day: context.day,
    arrival: formatClock(context.arrivalMin),
    scenario: context.scenario.label,
    nextClass: context.nextClass ? { course: context.nextClass.course, campus: context.nextClass.campusId, start: formatClock(context.nextClass.startMin), building: context.target.name } : null,
    commute: context.decision.options.map((option) => ({ mode: option.mode, totalMin: option.totalMin, arrive: formatClock(option.arriveMin), slack: option.slackMin, eligible: option.eligible, fare: option.fareUsd, open: option.deck?.reading.open, load: option.shuttle?.loadPct })),
    decks: context.readings.map((reading) => ({ id: reading.deckId, open: reading.open, occupancy: Math.round(reading.occupancy * 100) })),
    ev: context.evReadings,
    laundry: { room: context.laundryRoom.name, free: context.laundryReadings.filter((machine) => machine.state === 'free').length },
    dining: context.diningReadings,
    alerts: context.alerts.map((alert) => ({ severity: alert.severity, title: alert.title })),
    schedule: context.classes.map((session) => ({ course: session.course, campus: session.campusId, days: session.days, start: formatClock(session.startMin) })),
    knowledge: { label: KSU_KNOWLEDGE_LABEL, facts: KSU_KNOWLEDGE },
  };
  return JSON.stringify(data).slice(0, 3000);
}

export async function askOwlGemini(
  question: string,
  history: readonly OwlChatMessage[],
  facts: readonly string[],
  actions: readonly OwlAction[],
  context: OwlContext,
  signal?: AbortSignal,
): Promise<OwlReply> {
  const actionIds = [...actions.map((action) => action.id), 'none'];
  const priorTurns = history.slice(-6).map((message) => ({ role: message.role === 'user' ? 'user' : 'model', parts: [{ text: message.text }] }));
  const reply = await requestGeminiPayload({
    systemInstruction: { parts: [{ text: "You are Owl AI inside OwlFlow, a Kennesaw State campus assistant. Answer in at most 3 short sentences of plain text, using only facts and numbers in CONTEXT (simulated live data). If CONTEXT lacks the answer, say so. Never invent counts, times, prices or KSU policies. Choose the most useful actionId or 'none'." }] },
    contents: [...priorTurns, { role: 'user', parts: [{ text: `${question}\n\nCONTEXT ${compactContext(context)}\n\nLOCAL FACTS ${facts.join(' | ')}` }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          actionId: { type: 'string', enum: actionIds },
          followUps: { type: 'array', maxItems: 3, items: { type: 'string' } },
        },
        required: ['answer', 'actionId', 'followUps'],
      },
    },
  }, signal);
  const parsed = parsedGeminiReply(reply.payload, actions);
  if (!parsed) throw new Error(`${reply.model} returned invalid Owl JSON.`);
  return { ...parsed, facts: [...facts], engineLabel: `Gemini · ${reply.model} · 1.2 s` };
}

export async function runCopilot(text: string, context: CopilotContext, signal?: AbortSignal): Promise<CopilotResult> {
  const intent = parseIntentLocal(text, context.day);
  const summary = `OwlFlow parsed ${intent.arrivalMin === null ? context.arrivalLabel : formatClock(intent.arrivalMin)} for ${CAMPUSES[intent.campusId].name}.`;
  const fallback: CopilotResult = { mode: 'local', intent, summary, actions: [] };
  if (!geminiAvailable()) return fallback;
  try {
    const reply = await requestGemini(text, `${context.campusName} | ${context.targetName} | ${context.scenarioLabel}`, signal);
    return { mode: 'gemini', intent, summary: reply.text, actions: [] };
  } catch (error) {
    if (signal?.aborted) throw error;
    return fallback;
  }
}
