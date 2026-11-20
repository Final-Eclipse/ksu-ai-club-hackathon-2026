export type CampusId = 'kennesaw' | 'marietta';
export type ScenarioId = 'normal' | 'decksFull' | 'rainSurge';
export type CommuteMode = 'drive' | 'uber' | 'shuttle';
export type OccupancyStatus = 'open' | 'filling' | 'full';
export type PlaceKind = 'academic' | 'dining' | 'library' | 'dorm' | 'student-center';
export type DayCode = 'M' | 'T' | 'W' | 'R' | 'F';
export type EngineMode = 'local' | 'gemini';
export type DietaryTag = 'vegetarian' | 'vegan' | 'halal' | 'gluten-free';
export type StopKind = 'arrival' | 'from-class' | 'dining' | 'laundry' | 'class';
export type MachineType = 'washer' | 'dryer';
export type MachineState = 'free' | 'running' | 'done' | 'out-of-order';
export type WorkspaceTabId = 'commute' | 'dining' | 'laundry' | 'campus';
export type ScheduleView = 'day' | 'week';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Footprint {
  w: number;
  d: number;
  h: number;
}

export interface Place {
  id: string;
  campusId: CampusId;
  kind: PlaceKind;
  name: string;
  short: string;
  geo: GeoPoint;
  footprint: Footprint;
  aliases: string[];
  geoApprox?: boolean;
}

export interface Deck {
  id: string;
  campusId: CampusId;
  kind: 'deck' | 'lot';
  name: string;
  short: string;
  geo: GeoPoint;
  footprint: Footprint;
  capacity: number;
  levels: number;
  baysPerLevel: number;
  baseOccupancy: number;
  peakBoost: number;
  geoApprox?: boolean;
}

export interface DropOffPin {
  id: string;
  campusId: CampusId;
  name: string;
  address: string;
  geo: GeoPoint;
  congestion: 'low' | 'medium' | 'high';
}

export interface ShuttleRoute {
  id: string;
  campusId: CampusId;
  name: string;
  remoteLot: string;
  headwayMin: number;
  rideMin: number;
  stopName: string;
  stopGeo: GeoPoint;
}

export interface Campus {
  id: CampusId;
  name: string;
  center: GeoPoint;
  places: Place[];
  decks: Deck[];
  pins: DropOffPin[];
  shuttle: ShuttleRoute;
}

export interface ClassSession {
  id: string;
  campusId: CampusId;
  course: string;
  buildingId: string;
  room: string;
  days: string;
  startMin: number;
  endMin: number;
}

export interface CommuteProfile {
  originLabel: string;
  driveMin: number;
  distanceMi: number;
  originAddress?: string;
  originGeo?: GeoPoint | null;
}

export interface SchedulePreset {
  id: string;
  label: string;
  persona: string;
  campusId: CampusId;
  arrivalMin: number;
  profile: CommuteProfile;
  classes: ClassSession[];
  defaultDay: DayCode;
  arrivalLeadMin: number;
  dormId?: string;
}

export interface UberTripDetails {
  pickupLabel: string;
  pickupGeo: GeoPoint | null;
  dropoffLabel: string;
  dropoffAddress: string;
  dropoffGeo: GeoPoint;
  distanceMi: number;
  rideMin: number;
  deepLink: string;
  params: Record<string, string>;
}

export interface MenuItem {
  name: string;
  station: string;
  calories: number;
  tags: DietaryTag[];
}

export interface DiningStation {
  id: string;
  name: string;
  tags: DietaryTag[];
  baseQueue: number;
  perMin: number;
  menuItems: MenuItem[];
}

export interface DiningHall {
  id: string;
  campusId: CampusId;
  placeId: string;
  name: string;
  short: string;
  geo: GeoPoint;
  stations: DiningStation[];
}

export interface DiningStationReading {
  stationId: string;
  queueMin: number;
  crowdPct: number;
}

export interface PitStopPlan {
  hallId: string;
  hallName: string;
  stationId: string;
  stationName: string;
  menuItem: MenuItem;
  queueMin: number;
  crowdPct: number;
  walkMin: number;
  startMin: number;
  endMin: number;
  fitsBeforeClass: boolean;
}

export interface LaundryRoom {
  id: string;
  campusId: CampusId;
  dormId: string;
  name: string;
  geo: GeoPoint;
  washerCount: number;
  dryerCount: number;
  washerCycleMin: number;
  dryerCycleMin: number;
}

export interface MachineReading {
  id: string;
  roomId: string;
  type: MachineType;
  number: number;
  state: MachineState;
  remainingSec: number;
}

export interface LaundryPlan {
  roomId: string;
  roomName: string;
  machineId: string;
  machineLabel: string;
  waitMin: number;
  cycleMin: number;
  startMin: number;
  finishMin: number;
  finishesBeforeClass: boolean;
  explanation: string;
}

export interface CopilotIntent {
  raw: string;
  campusId: CampusId;
  day: DayCode;
  arrivalMin: number | null;
  classStartMin: number | null;
  buildingId: string | null;
  dormId: string | null;
  needsDining: boolean;
  needsLaundry: boolean;
  dietaryTags: DietaryTag[];
  scenarioId: ScenarioId;
}

export interface JourneyStop {
  id: string;
  kind: StopKind;
  label: string;
  detail: string;
  startMin: number;
  endMin: number;
  geo: GeoPoint;
}

export interface JourneyPlan {
  day: DayCode;
  stops: JourneyStop[];
  totalMin: number;
  hasDining: boolean;
  hasLaundry: boolean;
  explanation: string;
  alerts: CampusAlert[];
  dining?: PitStopPlan;
  laundry?: LaundryPlan;
}

export interface CopilotResult {
  mode: EngineMode;
  intent: CopilotIntent;
  summary: string;
  actions: string[];
  journey?: JourneyPlan;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  occupancyDelta: number;
  occupancyFloor: number | null;
  trafficMult: number;
  walkMult: number;
  uberSurge: number;
  uberExtraWaitMin: number;
  shuttleDelayMin: number;
  shuttleLoadPct: number;
  weather: 'clear' | 'rain';
  traffic: 'normal' | 'heavy';
  crowdMult: number;
}

export interface BayReading {
  id: string;
  label: string;
  capacity: number;
  open: number;
  status: OccupancyStatus;
}

export interface LevelReading {
  level: number;
  capacity: number;
  open: number;
  status: OccupancyStatus;
  bays: BayReading[];
}

export interface DeckReading {
  deckId: string;
  predictedOccupancy: number;
  occupancy: number;
  open: number;
  status: OccupancyStatus;
  levels: LevelReading[];
  bestLevel: number;
  cvConfidence: number;
}

export interface CommuteLeg {
  label: string;
  minutes: number;
}

export interface CommuteOption {
  mode: CommuteMode;
  title: string;
  totalMin: number;
  arriveMin: number;
  slackMin: number;
  legs: CommuteLeg[];
  walkMin: number;
  fareUsd: { low: number; high: number } | null;
  arrivalPoint: { name: string; geo: GeoPoint };
  deck?: { deck: Deck; reading: DeckReading; searchMin: number };
  uber?: { pin: DropOffPin; deepLink: string; waitMin: number; tripDetails: UberTripDetails };
  shuttle?: { route: ShuttleRoute; waitMin: number; loadPct: number };
  tripDetails?: UberTripDetails;
  eligible: boolean;
  score: number;
}

export interface CommuteDecision {
  options: CommuteOption[];
  winner: CommuteMode;
  fallback: 'deckFull' | 'weather' | null;
  explanation: string;
  targetName: string;
}

export interface CvOverride {
  open: number;
  total: number;
  source: string;
  atMs: number;
}

export type CvOverrides = Record<string, Partial<Record<number, CvOverride>>>;
export type CameraAngle = 'NE' | 'NW' | 'SE' | 'SW';

export interface NormalizedBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface VisionBox extends NormalizedBox {
  state: 'open' | 'occupied';
  confidence: number;
}

/** Seconds within a bundled video that one camera view loops over. */
export interface VideoClip {
  start: number;
  end: number;
}

export interface VisionFeed {
  id: string;
  campusId: CampusId;
  deckId: string;
  deckName: string;
  level: number;
  angle: CameraAngle;
  label: string;
  videoSrc: string;
  clip?: VideoClip;
  bayGrid: NormalizedBox[];
  referenceStrip: NormalizedBox;
}

export interface VisionResult {
  boxes: VisionBox[];
  open: number;
  occupied: number;
  total: number;
  confidence: number;
  engine: EngineMode;
}

export interface BusTrackerStop {
  id: string;
  name: string;
  campusId: CampusId;
  geo: GeoPoint;
}

export interface BusTrackerVehicle {
  id: string;
  label: string;
  speed: number;
}

export interface BusRouteCampusPath {
  campusId: CampusId;
  points: GeoPoint[];
}

export interface BusTrackerRoute {
  id: string;
  name: string;
  color: string;
  headwayMin: number;
  paths: BusRouteCampusPath[];
  stops: BusTrackerStop[];
  buses: BusTrackerVehicle[];
}

export interface BusTelemetry {
  busId: string;
  loadPct: number;
  delayMin: number;
  nextStop: string;
  etaMin: number;
}

export type TabId = WorkspaceTabId;
export type CampusMapMode = 'parking' | 'bus';

export interface MapFocus {
  kind: 'deck' | 'spot' | 'ev';
  id: string;
}

export interface CameraSelection {
  deckId: string;
  angle: CameraAngle;
}

export type OwlAction = { id: string; label: string } & (
  | { kind: 'openTab'; tab: TabId }
  | { kind: 'openMap'; mode: CampusMapMode; focus?: MapFocus }
  | { kind: 'openUrl'; url: string }
  | { kind: 'setArrival'; arrivalMin: number }
  | { kind: 'applyPlan'; intent: CopilotIntent }
);

export interface CampusAlert {
  id: string;
  severity: 'info' | 'warn' | 'critical';
  title: string;
  body: string;
  actions: OwlAction[];
}

export interface StreetSegment {
  id: string;
  campusId: CampusId;
  name: string;
  points: GeoPoint[];
  approx: true;
}

export interface EvCharger {
  id: string;
  campusId: CampusId;
  deckId: string;
  name: string;
  level: number;
  ports: number;
  geo: GeoPoint;
  approx: true;
}

export interface EvChargerReading {
  chargerId: string;
  free: number;
  ports: number;
  status: 'available' | 'busy';
}

export interface LostFoundItem {
  id: string;
  roomId: string;
  text: string;
  sinceDay: string;
  sinceMin: number;
  confidence: number;
}

export interface OwlReply {
  answer: string;
  action: OwlAction | null;
  followUps: string[];
  facts: string[];
  engineLabel: string;
}

export interface OwlChatMessage {
  id: string;
  role: 'user' | 'owl';
  text: string;
  reply?: OwlReply;
}

// Compatibility contracts retained for the original OwlPark utility modules.
export type PermitId =
  | 'central'
  | 'east'
  | 'west'
  | 'north'
  | 'south'
  | 'east-economy'
  | 'town-point-economy'
  | 'gutenberg-economy'
  | 'shuttle'
  | 'hourly';
export type Priority = 'balanced' | 'fastest' | 'closest' | 'availability';
export type SemesterPhase = 'normal' | 'opening-weeks' | 'event';
export type MobilityMode = 'standard' | 'step-free';
export type LotKind = 'deck' | 'surface' | 'economy' | 'shuttle' | 'hourly';
export type LotSize = 'small' | 'medium' | 'large';
export type ReportLevel = 'plenty' | 'filling' | 'near-full' | 'full';
export type AvailabilityStatus = 'open' | 'filling' | 'tight' | 'full';
export type ViewId = 'plan' | 'map' | 'reports' | 'schedule' | 'scanner' | 'guide';

export interface MapPoint {
  x: number;
  y: number;
}

export interface BuildingDefinition {
  id: string;
  campusId: CampusId;
  name: string;
  shortName: string;
  aliases: string[];
  point: MapPoint;
  category: 'academic' | 'student-life' | 'library' | 'dining' | 'recreation';
}

export interface ParkingLotDefinition {
  id: string;
  campusId: CampusId;
  name: string;
  shortName: string;
  kind: LotKind;
  size: LotSize;
  point: MapPoint;
  acceptedPermits: PermitId[];
  baseDemand: number;
  covered: boolean;
  evCharging: boolean;
  accessibleSpaces: boolean;
  shuttleMinutes?: number;
  note: string;
}

export interface CampusDefinition {
  id: CampusId;
  name: string;
  shortName: string;
  address: string;
  latitude: number;
  longitude: number;
  officialMapUrl: string;
  buildings: BuildingDefinition[];
  lots: ParkingLotDefinition[];
}

export interface PermitDefinition {
  id: PermitId;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
}

export interface SourceLink {
  label: string;
  detail: string;
  url: string;
}

export interface PlannerState {
  campusId: CampusId;
  destinationId: string;
  permitId: PermitId;
  arrival: string;
  priority: Priority;
  commuteMinutes: number;
  mobilityMode: MobilityMode;
  preferCovered: boolean;
  needsEv: boolean;
  semesterPhase: SemesterPhase;
}

export interface ParkingReport {
  id: string;
  lotId: string;
  level: ReportLevel;
  createdAt: number;
  note?: string;
}

export interface WeatherSnapshot {
  temperatureF: number;
  precipitationProbability: number;
  weatherCode: number;
  condition: string;
  sourceTime: string;
}

export interface LotForecast {
  occupancy: number;
  status: AvailabilityStatus;
  confidence: number;
  activeReportCount: number;
  searchMinutes: number;
  reportSignal?: ReportLevel;
  factors: string[];
}

export interface ParkingRecommendation {
  lot: ParkingLotDefinition;
  forecast: LotForecast;
  walkMinutes: number;
  parkingToDoorMinutes: number;
  totalTripMinutes: number;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface ClassMeeting {
  id: string;
  name: string;
  campusId: CampusId;
  destinationId: string;
  days: number[];
  startTime: string;
  sourceLine: string;
}

export interface ScheduleParseResult {
  meetings: ClassMeeting[];
  ignoredLines: string[];
}

export type SignVerdict = 'allowed' | 'not-allowed' | 'conditional' | 'unclear';

export interface SignInterpretation {
  verdict: SignVerdict;
  title: string;
  summary: string;
  matchedRules: string[];
  cautions: string[];
}
