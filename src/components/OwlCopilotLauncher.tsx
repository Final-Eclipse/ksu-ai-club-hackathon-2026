import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { OwlContext } from '../engine/copilot';
import type { OwlAction } from '../types';
import { CopilotBar } from './CopilotBar';

interface OwlCopilotLauncherProps {
  context: OwlContext;
  alertCount: number;
  onAction: (action: OwlAction) => void;
}

export function OwlCopilotLauncher({ context, alertCount, onAction }: OwlCopilotLauncherProps) {
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const animationFrame = window.requestAnimationFrame(() => {
      drawerRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    });
    const close = () => {
      setOpen(false);
      launcherRef.current?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (drawerRef.current?.contains(event.target) || launcherRef.current?.contains(event.target)) return;
      close();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <>
      <button ref={launcherRef} type="button" className="ps-owl-launcher" aria-label="Ask Owl AI · Best move right now" aria-expanded={open} aria-controls="ps-owl-dialog" onClick={() => setOpen((value) => !value)}>
        <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M8 14 5 6l9 5a17 17 0 0 1 12 0l9-5-3 8a15 15 0 1 1-24 0Z" fill="currentColor" /><circle cx="14" cy="20" r="5" fill="var(--ps-gold)" /><circle cx="26" cy="20" r="5" fill="var(--ps-gold)" /><circle cx="14" cy="20" r="2" fill="var(--ps-gold-ink)" /><circle cx="26" cy="20" r="2" fill="var(--ps-gold-ink)" /><path d="m17 26 3 3 3-3" fill="var(--ps-gold)" /></svg>
        <span><strong>Ask Owl AI</strong><small>· Best move right now</small></span>
        {alertCount > 0 && <b className="ps-owl-alert-count" aria-label={`${alertCount} active campus alerts`}>{alertCount}</b>}
      </button>

      <div ref={drawerRef} id="ps-owl-dialog" className="ps-owl-drawer" role="dialog" aria-modal="true" aria-labelledby="ps-owl-dialog-title" hidden={!open}>
        <div className="ps-owl-drawer__head"><div><span id="ps-owl-dialog-title">Owl AI · KSU Campus Intelligence</span><small>Conversational answers grounded in the active plan</small></div><button type="button" aria-label="Close Owl AI" onClick={() => { setOpen(false); launcherRef.current?.focus(); }}><X size={17} /></button></div>
        <CopilotBar context={context} onAction={onAction} />
      </div>
    </>
  );
}
