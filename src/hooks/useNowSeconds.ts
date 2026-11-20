import { useSyncExternalStore } from 'react';

let currentSeconds = Math.floor(Date.now() / 1000);
let timer: number | null = null;
const listeners = new Set<() => void>();

function emitTick(): void {
  const nextSeconds = Math.floor(Date.now() / 1000);
  if (nextSeconds === currentSeconds) return;
  currentSeconds = nextSeconds;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) timer = window.setInterval(emitTick, 1000);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number {
  return currentSeconds;
}

function getServerSnapshot(): number {
  return 0;
}

export function useNowSeconds(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
