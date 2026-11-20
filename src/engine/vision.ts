import { requestGeminiFlashPayload } from './gemini';
import type {
  CvOverride,
  DeckReading,
  LevelReading,
  NormalizedBox,
  VisionBox,
  VisionFeed,
  VisionResult,
} from '../types';

interface PixelFeature {
  red: number;
  green: number;
  blue: number;
  edge: number;
}

export interface LocalVisionAnalysis {
  result: VisionResult;
  emaScores: number[];
}

const OCCUPIED_THRESHOLD = 0.23;
const EMA_ALPHA = 0.36;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function insetBox(box: NormalizedBox, insetX: number, insetY: number): NormalizedBox {
  return {
    x: box.x + box.w * insetX,
    y: box.y + box.h * insetY,
    w: box.w * (1 - insetX * 2),
    h: box.h * (1 - insetY * 2),
  };
}

function luminance(red: number, green: number, blue: number): number {
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function sampleBox(imageData: ImageData, box: NormalizedBox): PixelFeature {
  const startX = Math.max(0, Math.floor(box.x * imageData.width));
  const startY = Math.max(0, Math.floor(box.y * imageData.height));
  const endX = Math.min(imageData.width, Math.ceil((box.x + box.w) * imageData.width));
  const endY = Math.min(imageData.height, Math.ceil((box.y + box.h) * imageData.height));
  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let edgeTotal = 0;
  let edgeSamples = 0;
  let samples = 0;
  const stride = 3;

  for (let y = startY; y < endY; y += stride) {
    for (let x = startX; x < endX; x += stride) {
      const index = (y * imageData.width + x) * 4;
      const red = imageData.data[index] ?? 0;
      const green = imageData.data[index + 1] ?? 0;
      const blue = imageData.data[index + 2] ?? 0;
      redTotal += red;
      greenTotal += green;
      blueTotal += blue;
      samples += 1;

      const currentLuminance = luminance(red, green, blue);
      if (x + stride < endX) {
        const rightIndex = (y * imageData.width + x + stride) * 4;
        edgeTotal += Math.abs(currentLuminance - luminance(
          imageData.data[rightIndex] ?? 0,
          imageData.data[rightIndex + 1] ?? 0,
          imageData.data[rightIndex + 2] ?? 0,
        ));
        edgeSamples += 1;
      }
      if (y + stride < endY) {
        const downIndex = ((y + stride) * imageData.width + x) * 4;
        edgeTotal += Math.abs(currentLuminance - luminance(
          imageData.data[downIndex] ?? 0,
          imageData.data[downIndex + 1] ?? 0,
          imageData.data[downIndex + 2] ?? 0,
        ));
        edgeSamples += 1;
      }
    }
  }

  if (samples === 0) return { red: 0, green: 0, blue: 0, edge: 0 };
  return {
    red: redTotal / samples,
    green: greenTotal / samples,
    blue: blueTotal / samples,
    edge: edgeTotal / Math.max(1, edgeSamples),
  };
}

function occupancyScore(feature: PixelFeature, reference: PixelFeature): number {
  const redDelta = feature.red - reference.red;
  const greenDelta = feature.green - reference.green;
  const blueDelta = feature.blue - reference.blue;
  const rgbDistance = Math.hypot(redDelta, greenDelta, blueDelta) / 441.673;
  const edgeLift = Math.max(0, feature.edge - reference.edge) / 72;
  const brightnessLift = Math.max(
    0,
    luminance(feature.red, feature.green, feature.blue)
      - luminance(reference.red, reference.green, reference.blue),
  ) / 255;
  return clamp01(rgbDistance * 1.55 + edgeLift * 0.55 + brightnessLift * 0.45);
}

export function analyzeFrameLocal(
  feed: VisionFeed,
  imageData: ImageData,
  previousEma: readonly number[] = [],
): LocalVisionAnalysis {
  const reference = sampleBox(imageData, feed.referenceStrip);
  const emaScores = feed.bayGrid.map((box, index) => {
    const feature = sampleBox(imageData, insetBox(box, 0.14, 0.1));
    const rawScore = occupancyScore(feature, reference);
    const previous = previousEma[index];
    return previous === undefined
      ? rawScore
      : previous * (1 - EMA_ALPHA) + rawScore * EMA_ALPHA;
  });
  const boxes: VisionBox[] = feed.bayGrid.map((box, index) => {
    const score = emaScores[index] ?? 0;
    const occupied = score >= OCCUPIED_THRESHOLD;
    const distance = Math.abs(score - OCCUPIED_THRESHOLD);
    return {
      ...box,
      state: occupied ? 'occupied' : 'open',
      confidence: clamp01(0.62 + distance * 1.55),
    };
  });
  const open = boxes.filter((box) => box.state === 'open').length;
  const confidence = boxes.length > 0
    ? boxes.reduce((sum, box) => sum + box.confidence, 0) / boxes.length
    : 0;

  return {
    emaScores,
    result: {
      boxes,
      open,
      occupied: boxes.length - open,
      total: boxes.length,
      confidence,
      engine: 'local',
    },
  };
}

function geminiText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = Reflect.get(payload, 'candidates');
  if (!Array.isArray(candidates)) return null;
  const first = candidates[0];
  if (!first || typeof first !== 'object') return null;
  const content = Reflect.get(first, 'content');
  if (!content || typeof content !== 'object') return null;
  const parts = Reflect.get(content, 'parts');
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    if (!part || typeof part !== 'object') continue;
    const text = Reflect.get(part, 'text');
    if (typeof text === 'string') return text;
  }
  return null;
}

function parsedVisionResult(value: unknown): VisionResult | null {
  if (!value || typeof value !== 'object') return null;
  const rawBoxes = Reflect.get(value, 'boxes');
  const rawConfidence = finiteNumber(Reflect.get(value, 'confidence'));
  if (!Array.isArray(rawBoxes) || rawConfidence === null) return null;
  const resultConfidence = clamp01(rawConfidence);
  const boxes: VisionBox[] = [];

  for (const candidate of rawBoxes) {
    if (!candidate || typeof candidate !== 'object') return null;
    const rawX = finiteNumber(Reflect.get(candidate, 'x'));
    const rawY = finiteNumber(Reflect.get(candidate, 'y'));
    const rawWidth = finiteNumber(Reflect.get(candidate, 'w'));
    const rawHeight = finiteNumber(Reflect.get(candidate, 'h'));
    const rawBoxConfidence = finiteNumber(Reflect.get(candidate, 'confidence'));
    const state = Reflect.get(candidate, 'state');
    if (rawX === null || rawY === null || rawWidth === null || rawHeight === null) return null;
    if (state !== 'open' && state !== 'occupied') return null;
    const x = clamp01(rawX);
    const y = clamp01(rawY);
    boxes.push({
      x,
      y,
      w: Math.min(clamp01(rawWidth), 1 - x),
      h: Math.min(clamp01(rawHeight), 1 - y),
      state,
      confidence: rawBoxConfidence === null ? resultConfidence : clamp01(rawBoxConfidence),
    });
  }

  const open = boxes.filter((box) => box.state === 'open').length;
  return {
    boxes,
    open,
    occupied: boxes.length - open,
    total: boxes.length,
    confidence: resultConfidence,
    engine: 'gemini',
  };
}

export async function analyzeFrameGemini(
  frameJpegBase64: string,
  feed: VisionFeed,
  signal?: AbortSignal,
): Promise<VisionResult> {
  const reply = await requestGeminiFlashPayload(
    {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: frameJpegBase64,
              },
            },
            {
              text: `Verify parking occupancy in this current frame from ${feed.label}. Return normalized boxes for visible parking stalls. Classify every box as open or occupied and include confidence from 0 to 1.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            boxes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  w: { type: 'number' },
                  h: { type: 'number' },
                  state: { type: 'string', enum: ['open', 'occupied'] },
                  confidence: { type: 'number' },
                },
                required: ['x', 'y', 'w', 'h', 'state', 'confidence'],
              },
            },
            confidence: { type: 'number' },
          },
          required: ['boxes', 'confidence'],
        },
      },
    },
    signal,
  );
  const text = geminiText(reply.payload);
  if (!text) throw new Error(`${reply.model} returned no vision JSON.`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${reply.model} returned invalid vision JSON.`);
  }
  const result = parsedVisionResult(parsed);
  if (!result) throw new Error(`${reply.model} returned an invalid vision result.`);
  return result;
}

export function createCvOverride(result: VisionResult): CvOverride {
  return {
    open: result.open,
    total: result.total,
    source: 'cv',
    atMs: Date.now(),
  };
}

export function getVisionLevel(
  readings: readonly DeckReading[],
  deckId: string,
  levelNumber: number,
): LevelReading {
  const reading = readings.find((candidate) => candidate.deckId === deckId);
  const level = reading?.levels.find((candidate) => candidate.level === levelNumber);
  if (!level) throw new Error(`Missing level ${levelNumber} reading for ${deckId}.`);
  return level;
}
