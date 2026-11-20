import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  LoaderCircle,
  RotateCcw,
  ScanLine,
  Video,
} from 'lucide-react';
import { getVisionFeed } from '../data/cameras';
import { geminiAvailable } from '../engine/gemini';
import { formatClockWithSeconds } from '../engine/time';
import {
  analyzeFrameGemini,
  analyzeFrameLocal,
  getVisionLevel,
} from '../engine/vision';
import { useNowSeconds } from '../hooks/useNowSeconds';
import type {
  CameraSelection,
  CvOverride,
  DeckReading,
  Scenario,
  VideoClip,
  VisionFeed,
  VisionResult,
} from '../types';

interface VisionCameraPanelProps {
  camera: CameraSelection;
  readings: readonly DeckReading[];
  scenario: Scenario;
  minute: number;
  override?: CvOverride;
  onPush: (deckId: string, level: number, result: VisionResult) => void;
  onClear: (deckId: string, level: number) => void;
  onBack: () => void;
}

const CAMERA_WIDTH = 960;
const CAMERA_HEIGHT = 540;
const DETECTION_INTERVAL_MS = 250;
const CLIP_SEEK_TOLERANCE_S = 0.25;

function formatClipTime(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function keepWithinClip(video: HTMLVideoElement, clip: VideoClip | undefined): void {
  if (!clip || video.seeking || video.readyState < HTMLMediaElement.HAVE_METADATA) return;
  if (video.currentTime >= clip.end || video.currentTime < clip.start - CLIP_SEEK_TOLERANCE_S) {
    video.currentTime = clip.start;
  }
}

function initialVisionResult(feed: VisionFeed): VisionResult {
  const boxes = feed.bayGrid.map((box) => ({
    ...box,
    state: 'open' as const,
    confidence: 0.5,
  }));
  return {
    boxes,
    open: boxes.length,
    occupied: 0,
    total: boxes.length,
    confidence: 0.5,
    engine: 'local',
  };
}

function textHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + (value.charCodeAt(index) || 0)) >>> 0;
  }
  return hash;
}

function drawParkedCar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  headlights: boolean,
): void {
  const insetX = width * 0.1;
  const insetY = height * 0.13;
  context.fillStyle = 'rgb(5 8 12 / .55)';
  context.fillRect(x + insetX + 3, y + insetY + 5, width - insetX * 2, height - insetY * 2);
  context.fillStyle = color;
  context.fillRect(x + insetX, y + insetY, width - insetX * 2, height - insetY * 2);
  context.fillStyle = 'rgb(178 205 220 / .58)';
  context.fillRect(x + width * 0.22, y + height * 0.22, width * 0.56, height * 0.2);
  context.fillStyle = 'rgb(7 10 14 / .72)';
  context.fillRect(x + width * 0.2, y + height * 0.64, width * 0.6, Math.max(2, height * 0.08));
  if (headlights) {
    context.fillStyle = '#FFF4B8';
    context.shadowColor = '#FFF4B8';
    context.shadowBlur = 12;
    context.fillRect(x + width * 0.18, y + height * 0.78, Math.max(2, width * 0.14), 3);
    context.fillRect(x + width * 0.68, y + height * 0.78, Math.max(2, width * 0.14), 3);
    context.shadowBlur = 0;
  }
}

function drawFallbackFrame(
  canvas: HTMLCanvasElement,
  feed: VisionFeed,
  scenario: Scenario,
  minute: number,
  elapsedMs: number,
): void {
  if (canvas.width !== CAMERA_WIDTH) canvas.width = CAMERA_WIDTH;
  if (canvas.height !== CAMERA_HEIGHT) canvas.height = CAMERA_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) return;

  const gradient = context.createLinearGradient(0, 0, 0, CAMERA_HEIGHT);
  gradient.addColorStop(0, '#303640');
  gradient.addColorStop(0.23, '#20262D');
  gradient.addColorStop(1, '#151A20');
  context.fillStyle = gradient;
  context.fillRect(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);

  context.fillStyle = '#11161C';
  context.fillRect(0, 0, CAMERA_WIDTH, 88);
  context.fillStyle = '#47515D';
  context.fillRect(0, 84, CAMERA_WIDTH, 4);
  context.fillStyle = '#1C232A';
  context.fillRect(0, 236, CAMERA_WIDTH, 96);
  context.strokeStyle = 'rgb(253 187 48 / .5)';
  context.lineWidth = 3;
  context.setLineDash([24, 18]);
  context.beginPath();
  context.moveTo(0, 285);
  context.lineTo(CAMERA_WIDTH, 285);
  context.stroke();
  context.setLineDash([]);

  const seed = textHash(`${feed.id}|${scenario.id}`);
  const grainPhase = Math.floor(elapsedMs / 90);
  for (let index = 0; index < 120; index += 1) {
    const x = (index * 83 + grainPhase * 19 + seed) % CAMERA_WIDTH;
    const y = 90 + ((index * 47 + grainPhase * 7 + seed) % (CAMERA_HEIGHT - 100));
    const shade = 44 + ((index * 29 + seed) % 35);
    context.fillStyle = `rgb(${shade} ${shade + 3} ${shade + 6} / .16)`;
    context.fillRect(x, y, 2, 2);
  }

  context.strokeStyle = 'rgb(235 239 242 / .62)';
  context.lineWidth = 2;
  const occupancyTarget = scenario.id === 'decksFull' ? 9 : scenario.id === 'rainSurge' ? 8 : 6;
  const timeBucket = Math.floor(minute / 15);
  const carColors = ['#667585', '#9CA3AF', '#7F3030', '#254A78', '#454752'] as const;

  feed.bayGrid.forEach((box, index) => {
    const x = box.x * CAMERA_WIDTH;
    const y = box.y * CAMERA_HEIGHT;
    const width = box.w * CAMERA_WIDTH;
    const height = box.h * CAMERA_HEIGHT;
    context.strokeRect(x, y, width, height);
    const occupied = (index * 7 + seed + timeBucket) % 10 < occupancyTarget;
    if (!occupied) return;
    const color = carColors[(index + seed) % carColors.length] ?? carColors[0];
    drawParkedCar(context, x, y, width, height, color, index % 5 === 0);
  });

  const movingX = ((elapsedMs * 0.075 + seed) % (CAMERA_WIDTH + 180)) - 90;
  const movingY = 303 + Math.sin(elapsedMs / 820) * 4;
  context.fillStyle = '#202733';
  context.fillRect(movingX - 38, movingY - 15, 76, 30);
  context.fillStyle = '#8EA7B9';
  context.fillRect(movingX - 20, movingY - 11, 40, 10);
  context.fillStyle = '#FFF4B8';
  context.shadowColor = '#FFF4B8';
  context.shadowBlur = 18;
  context.beginPath();
  context.arc(movingX + 36, movingY - 7, 4, 0, Math.PI * 2);
  context.arc(movingX + 36, movingY + 7, 4, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  if (scenario.weather === 'rain') {
    context.strokeStyle = 'rgb(185 220 255 / .22)';
    context.lineWidth = 1;
    for (let index = 0; index < 36; index += 1) {
      const x = (index * 71 + grainPhase * 13) % CAMERA_WIDTH;
      const y = (index * 43 + grainPhase * 17) % CAMERA_HEIGHT;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - 7, y + 18);
      context.stroke();
    }
  }

  context.fillStyle = 'rgb(4 8 12 / .78)';
  context.fillRect(18, 16, 285, 48);
  context.fillStyle = '#FDBB30';
  context.font = '800 16px ui-monospace, SFMono-Regular, Menlo, monospace';
  context.fillText(`${feed.angle} · L${feed.level} · FALLBACK CCTV`, 32, 45);
}

function copyCurrentFrame(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement | null,
  fallback: HTMLCanvasElement | null,
  videoReady: boolean,
): boolean {
  if (videoReady && video) {
    // Skip frames while a clip loop seeks instead of analyzing the hidden fallback canvas.
    if (video.seeking || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false;
    context.drawImage(video, 0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
    return true;
  }
  if (!fallback || fallback.width === 0 || fallback.height === 0) return false;
  context.drawImage(fallback, 0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
  return true;
}

export function VisionCameraPanel({
  camera,
  readings,
  scenario,
  minute,
  override,
  onPush,
  onClear,
  onBack,
}: VisionCameraPanelProps) {
  const feed = getVisionFeed(`${camera.deckId}-${camera.angle.toLowerCase()}`);
  const level = getVisionLevel(readings, feed.deckId, feed.level);
  const [result, setResult] = useState<VisionResult>(() => initialVisionResult(feed));
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('Starting bundled camera stream and local pixel CV…');
  const nowSeconds = useNowSeconds();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const fallbackAnimationRef = useRef<number | null>(null);
  const detectorAnimationRef = useRef<number | null>(null);
  const videoReadyRef = useRef(false);
  const emaScoresRef = useRef<number[]>([]);
  const verifyControllerRef = useRef<AbortController | null>(null);
  const verifyingRef = useRef(false);
  const heldDetectionFramesRef = useRef(0);

  useEffect(() => {
    videoReadyRef.current = false;
    emaScoresRef.current = [];
    heldDetectionFramesRef.current = 0;
    setVideoReady(false);
    setVideoFailed(false);
    setVerifying(false);
    setResult(initialVisionResult(feed));
    setMessage('Starting bundled camera stream and local pixel CV…');
    verifyControllerRef.current?.abort();
    verifyControllerRef.current = null;
    verifyingRef.current = false;
  }, [feed]);

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => backRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onBack();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onBack]);

  useEffect(() => {
    const canvas = fallbackCanvasRef.current;
    if (!canvas) return undefined;
    const render = (elapsedMs: number) => {
      drawFallbackFrame(canvas, feed, scenario, minute, elapsedMs);
      fallbackAnimationRef.current = window.requestAnimationFrame(render);
    };
    fallbackAnimationRef.current = window.requestAnimationFrame(render);
    return () => {
      if (fallbackAnimationRef.current !== null) {
        window.cancelAnimationFrame(fallbackAnimationRef.current);
        fallbackAnimationRef.current = null;
      }
    };
  }, [feed, minute, scenario]);

  useEffect(() => {
    const canvas = analysisCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = CAMERA_WIDTH;
    canvas.height = CAMERA_HEIGHT;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return undefined;
    let lastDetectionMs = Number.NEGATIVE_INFINITY;

    const detect = (elapsedMs: number) => {
      detectorAnimationRef.current = window.requestAnimationFrame(detect);
      // Per-frame check keeps clip loops tight; onTimeUpdate covers throttled background tabs.
      if (videoRef.current) keepWithinClip(videoRef.current, feed.clip);
      if (elapsedMs - lastDetectionMs < DETECTION_INTERVAL_MS) return;
      lastDetectionMs = elapsedMs;
      if (verifyingRef.current) return;
      if (heldDetectionFramesRef.current > 0) {
        heldDetectionFramesRef.current -= 1;
        return;
      }

      try {
        context.clearRect(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
        const copied = copyCurrentFrame(
          context,
          videoRef.current,
          fallbackCanvasRef.current,
          videoReadyRef.current,
        );
        if (!copied) return;
        const imageData = context.getImageData(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
        const analysis = analyzeFrameLocal(feed, imageData, emaScoresRef.current);
        emaScoresRef.current = analysis.emaScores;
        setResult(analysis.result);
      } catch {
        videoReadyRef.current = false;
        setVideoReady(false);
        setVideoFailed(true);
        setMessage('Bundled MP4 could not be decoded. Animated canvas CCTV fallback is active.');
      }
    };

    detectorAnimationRef.current = window.requestAnimationFrame(detect);
    return () => {
      if (detectorAnimationRef.current !== null) {
        window.cancelAnimationFrame(detectorAnimationRef.current);
        detectorAnimationRef.current = null;
      }
    };
  }, [feed]);

  useEffect(() => () => {
    verifyControllerRef.current?.abort();
    verifyControllerRef.current = null;
    verifyingRef.current = false;
  }, []);

  const verifyWithGemini = async () => {
    const canvas = analysisCanvasRef.current;
    const context = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !context) {
      setMessage('The current frame is not ready for Gemini verification.');
      return;
    }

    verifyingRef.current = true;
    setVerifying(true);
    setMessage('Gemini 2.5 Flash is verifying the current frame…');
    context.clearRect(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
    if (!copyCurrentFrame(context, videoRef.current, fallbackCanvasRef.current, videoReadyRef.current)) {
      verifyingRef.current = false;
      setVerifying(false);
      setMessage('The current frame is not ready for Gemini verification.');
      return;
    }

    const jpeg = canvas.toDataURL('image/jpeg', 0.82).split(',')[1] ?? '';
    if (!jpeg) {
      verifyingRef.current = false;
      setVerifying(false);
      setMessage('The current frame could not be encoded for Gemini verification.');
      return;
    }

    verifyControllerRef.current?.abort();
    const controller = new AbortController();
    verifyControllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const verified = await analyzeFrameGemini(jpeg, feed, controller.signal);
      if (verifyControllerRef.current !== controller) return;
      setResult(verified);
      heldDetectionFramesRef.current = 20;
      setMessage('Gemini 2.5 Flash verified this frame. Live local CV resumes in 5 seconds.');
    } catch {
      if (verifyControllerRef.current !== controller) return;
      setMessage('Gemini verification was unavailable. The 4 FPS local pixel detector remains active.');
    } finally {
      window.clearTimeout(timeout);
      if (verifyControllerRef.current === controller) {
        verifyControllerRef.current = null;
        verifyingRef.current = false;
        setVerifying(false);
      }
    }
  };

  const streamLabel = videoReady
    ? 'BUNDLED MP4'
    : videoFailed
      ? 'CANVAS FALLBACK'
      : 'CONNECTING';

  return (
    <section className="ps-camera-viewer" aria-labelledby="ps-camera-viewer-title">
      <div className="ps-camera-viewer__head">
        <button ref={backRef} type="button" onClick={onBack}>← Back to Map</button>
        <div>
          <small>Live deck computer vision</small>
          <h2 id="ps-camera-viewer-title">{feed.deckName} · Camera {feed.angle} · Level {feed.level}</h2>
        </div>
        <span><i /> {streamLabel}</span>
        <time>{formatClockWithSeconds(nowSeconds)}</time>
      </div>

      <div className="ps-camera-stream-meta">
        <span>
          <Video size={14} /> {feed.videoSrc}
          {feed.clip && ` · loop ${formatClipTime(feed.clip.start)}–${formatClipTime(feed.clip.end)}`}
        </span>
        <span><ScanLine size={14} /> Pixel CV · 4 FPS · RGB + edge EMA</span>
      </div>

      <div className="ps-camera-stage">
        <canvas
          ref={fallbackCanvasRef}
          className="ps-camera-fallback"
          role="img"
          aria-label={`Animated fallback CCTV stream for ${feed.deckName} camera ${feed.angle}`}
        >
          Animated parking deck camera fallback.
        </canvas>
        <video
          key={feed.id}
          ref={videoRef}
          className={videoReady ? 'ps-camera-video ps-camera-video--ready' : 'ps-camera-video'}
          src={feed.clip ? `${feed.videoSrc}#t=${feed.clip.start}` : feed.videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label={`Bundled ${feed.deckName} camera ${feed.angle} video`}
          onTimeUpdate={(event) => keepWithinClip(event.currentTarget, feed.clip)}
          onLoadedData={() => {
            videoReadyRef.current = true;
            setVideoReady(true);
            setVideoFailed(false);
            setMessage('Bundled MP4 is live. Local pixel CV analyzes four frames per second.');
            const playPromise = videoRef.current?.play();
            if (playPromise) void playPromise.catch(() => undefined);
          }}
          onError={() => {
            videoReadyRef.current = false;
            setVideoReady(false);
            setVideoFailed(true);
            setMessage('Bundled MP4 is unavailable. Animated canvas CCTV fallback and pixel CV are active.');
          }}
        />
        <div className="ps-vision-boxes" aria-label="Live parking detections">
          {result.boxes.map((box, index) => (
            <i
              key={`${feed.id}-box-${index}`}
              className={`ps-vision-box ps-vision-box--${box.state}`}
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
              }}
            >
              <span>{box.state === 'open' ? 'OPEN' : 'CAR'} {Math.round(box.confidence * 100)}%</span>
            </i>
          ))}
        </div>
        <span className="ps-camera-scanline" aria-hidden="true" />
      </div>
      <canvas ref={analysisCanvasRef} className="ps-vision-canvas" aria-hidden="true" />

      <div className="ps-camera-stats">
        <div><strong>{result.open} OPEN / {result.occupied} CAR</strong><small>{result.total}-stall calibrated camera view</small></div>
        <div><strong>Level {level.level}: {level.open} / {level.capacity} open</strong><small>Effective OwlFlow level reading</small></div>
        <div><strong>{Math.round(result.confidence * 100)}%</strong><small>{result.engine === 'gemini' ? 'Gemini 2.5 Flash' : 'Pixel CV EMA'} confidence</small></div>
      </div>

      <p className="ps-vision-message" role="status">{message} Frame pixels stay in this browser.</p>
      <div className="ps-camera-actions">
        <button type="button" onClick={() => onPush(feed.deckId, level.level, result)}>
          <CheckCircle2 size={15} /> Push Detected Spots to OwlFlow
        </button>
        {geminiAvailable() && (
          <button type="button" disabled={verifying} onClick={() => { void verifyWithGemini(); }}>
            {verifying ? <LoaderCircle className="ps-spin" size={14} /> : <Cloud size={14} />}
            Verify Frame with Gemini Vision
          </button>
        )}
        {override && (
          <button type="button" onClick={() => onClear(feed.deckId, level.level)}>
            <RotateCcw size={14} /> Clear level override
          </button>
        )}
      </div>
    </section>
  );
}
