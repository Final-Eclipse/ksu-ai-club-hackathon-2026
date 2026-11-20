import { CAMPUSES } from './campuses';
import type { CameraAngle, NormalizedBox, VisionFeed } from '../types';

export const CAMERA_ANGLES: readonly CameraAngle[] = ['NE', 'NW', 'SE', 'SW'];

const EMPTY_ASPHALT_REFERENCE: NormalizedBox = {
  x: 0.42,
  y: 0.475,
  w: 0.16,
  h: 0.07,
};

function cameraBayGrid(angle: CameraAngle): NormalizedBox[] {
  const boxes: NormalizedBox[] = [];
  const mirrored = angle === 'NW' || angle === 'SW';

  for (let row = 0; row < 2; row += 1) {
    const columns = 12;
    const startX = row === 0 ? 0.09 : 0.025;
    const stepX = row === 0 ? 0.069 : 0.081;
    const width = row === 0 ? 0.052 : 0.061;
    const y = row === 0 ? 0.185 : 0.655;
    const height = row === 0 ? 0.18 : 0.235;

    for (let column = 0; column < columns; column += 1) {
      const visualColumn = mirrored ? columns - column - 1 : column;
      boxes.push({
        x: startX + visualColumn * stepX,
        y,
        w: width,
        h: height,
      });
    }
  }

  return boxes;
}

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
      return {
        id: `${deck.id}-${angle.toLowerCase()}`,
        campusId: deck.campusId,
        deckId: deck.id,
        deckName: deck.name,
        level,
        angle,
        label: `${deck.name} · L${level} · ${angle} elevation`,
        videoSrc: `/videos/${deck.id}-${angle}.mp4`,
        bayGrid: cameraBayGrid(angle),
        referenceStrip: { ...EMPTY_ASPHALT_REFERENCE },
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
