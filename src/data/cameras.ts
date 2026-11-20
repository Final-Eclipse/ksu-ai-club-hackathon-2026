import { CAMPUSES } from './campuses';
import type { CameraAngle, NormalizedBox, VideoClip, VisionFeed } from '../types';

export const CAMERA_ANGLES: readonly CameraAngle[] = ['NE', 'NW', 'SE', 'SW'];

interface CameraFootage {
  videoSrc: string;
  clip?: VideoClip;
  bayGrid: readonly NormalizedBox[];
  referenceStrip: NormalizedBox;
}

const MULTI_VIEW_GARAGE = './videos/parking_video3.mp4';
const LEVEL_P2_GARAGE = './videos/parking_video5.mp4';

// Both videos are 640x360 garage CCTV. parking_video3.mp4 cuts between four
// cameras, so each angle loops a single view. Stall boxes and the empty-floor
// reference strip are calibrated against frames of that view.
const CAMERA_FOOTAGE: Record<CameraAngle, CameraFootage> = {
  // "CAM 07 · Garage Level P2": three empty painted stalls and two cars in the far row.
  NE: {
    videoSrc: LEVEL_P2_GARAGE,
    bayGrid: [
      { x: 0.38, y: 0.66, w: 0.18, h: 0.16 },
      { x: 0.55, y: 0.565, w: 0.085, h: 0.05 },
      { x: 0.585, y: 0.49, w: 0.09, h: 0.035 },
      { x: 0.385, y: 0.355, w: 0.04, h: 0.03 },
      { x: 0.505, y: 0.34, w: 0.035, h: 0.028 },
    ],
    referenceStrip: { x: 0.58, y: 0.76, w: 0.12, h: 0.08 },
  },
  // "back garage": pickup, sedan behind the pillar, and SUV along the far wall.
  NW: {
    videoSrc: MULTI_VIEW_GARAGE,
    clip: { start: 86.6, end: 105.5 },
    bayGrid: [
      { x: 0.44, y: 0.15, w: 0.14, h: 0.13 },
      { x: 0.636, y: 0.125, w: 0.028, h: 0.065 },
      { x: 0.715, y: 0.15, w: 0.05, h: 0.09 },
    ],
    referenceStrip: { x: 0.45, y: 0.38, w: 0.18, h: 0.08 },
  },
  // "Camera 01": close-up row with four parked cars.
  SE: {
    videoSrc: MULTI_VIEW_GARAGE,
    clip: { start: 15.6, end: 49.8 },
    bayGrid: [
      { x: 0.14, y: 0.1, w: 0.3, h: 0.2 },
      { x: 0.57, y: 0.04, w: 0.22, h: 0.12 },
      { x: 0.6, y: 0.32, w: 0.32, h: 0.45 },
      { x: 0.03, y: 0.5, w: 0.28, h: 0.4 },
    ],
    referenceStrip: { x: 0.38, y: 0.42, w: 0.08, h: 0.14 },
  },
  // "front gate": a Jeep backs out of the first stall near the end of the loop.
  SW: {
    videoSrc: MULTI_VIEW_GARAGE,
    clip: { start: 128.3, end: 144.9 },
    bayGrid: [
      { x: 0.27, y: 0.22, w: 0.18, h: 0.2 },
      { x: 0.46, y: 0.07, w: 0.2, h: 0.21 },
      { x: 0.62, y: 0.16, w: 0.075, h: 0.17 },
      { x: 0.8, y: 0.24, w: 0.17, h: 0.3 },
    ],
    referenceStrip: { x: 0.2, y: 0.5, w: 0.2, h: 0.12 },
  },
};

function cameraLevel(levels: number, angle: CameraAngle): number {
  if (angle === 'NE') return levels;
  if (angle === 'NW') return Math.max(1, levels - 1);
  if (angle === 'SE') return Math.min(2, levels);
  return 1;
}

export const CAMERAS: readonly VisionFeed[] = Object.values(CAMPUSES).flatMap((campus) =>
  campus.decks.flatMap((deck) =>
    CAMERA_ANGLES.map((angle) => {
      const level = cameraLevel(deck.levels, angle);
      const footage = CAMERA_FOOTAGE[angle];
      return {
        id: `${deck.id}-${angle.toLowerCase()}`,
        campusId: deck.campusId,
        deckId: deck.id,
        deckName: deck.name,
        level,
        angle,
        label: `${deck.name} · L${level} · ${angle} elevation`,
        videoSrc: footage.videoSrc,
        ...(footage.clip ? { clip: { ...footage.clip } } : {}),
        bayGrid: footage.bayGrid.map((box) => ({ ...box })),
        referenceStrip: { ...footage.referenceStrip },
      };
    }),
  ),
);

export function getVisionFeed(feedId: string): VisionFeed {
  const feed = CAMERAS.find((candidate) => candidate.id === feedId);
  const fallback = CAMERAS[0];
  if (!fallback) throw new Error('OwlFlow requires at least one bundled camera feed.');
  return feed ?? fallback;
}
