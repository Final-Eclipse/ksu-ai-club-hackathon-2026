import { useMemo } from 'react';
import { Camera, CheckCircle2, Clock3, PackageSearch, ShieldCheck, Shirt, Sparkles, Waves } from 'lucide-react';
import { LOST_AND_FOUND } from '../data/laundry';
import { formatCountdown, planLaundry, readLaundryRoom } from '../engine/laundry';
import { formatClock } from '../engine/time';
import { useNowSeconds } from '../hooks/useNowSeconds';
import type { LaundryRoom } from '../types';
import { DryerMachineIcon, WasherMachineIcon } from './MachineIcons';

interface LaundryBoardProps {
  rooms: readonly LaundryRoom[];
  room: LaundryRoom;
  currentMinute: number;
  classStartMin: number;
  onRoomChange: (dormId: string) => void;
}

export function LaundryBoard({
  rooms,
  room,
  currentMinute,
  classStartMin,
  onRoomChange,
}: LaundryBoardProps) {
  const nowSeconds = useNowSeconds();
  const readings = useMemo(
    () => readLaundryRoom(room, nowSeconds),
    [nowSeconds, room],
  );
  const plan = useMemo(
    () => planLaundry(room, readings, currentMinute, classStartMin),
    [classStartMin, currentMinute, readings, room],
  );
  const lostItems = LOST_AND_FOUND.filter((item) => item.roomId === room.id);

  return (
    <section className="ps-laundry" aria-labelledby="ps-laundry-title">
      <div className="ps-tab-hero">
        <div>
          <p className="ps-kicker">Dorm machine availability</p>
          <h1 id="ps-laundry-title">Start a load. Keep moving.</h1>
          <p>Live seeded machine states make it obvious which washer to use and whether its cycle fits before class.</p>
        </div>
        <div className="ps-laundry-telemetry">
          <span><Camera size={20} /><strong>Edge CV Telemetry · Active (SIM)</strong></span>
          <small>Counts only — no raw student laundry video leaves the room.</small>
        </div>
      </div>

      <div className="ps-dorm-picker" role="group" aria-label="Campus laundry room">
        {rooms.map((candidate) => (
          <button
            type="button"
            key={candidate.id}
            aria-pressed={candidate.id === room.id}
            onClick={() => onRoomChange(candidate.dormId)}
          >
            <Shirt size={16} />
            <span><strong>{candidate.name.replace(' Laundry', '')}</strong><small>{candidate.washerCount} washers · {candidate.dryerCount} dryers</small></span>
          </button>
        ))}
      </div>

      <article className="ps-laundry-plan">
        <span className="ps-laundry-plan__icon"><Sparkles size={22} /></span>
        <div>
          <small>AI LAUNDRY PLAN</small>
          <h2>{plan.machineLabel} · {plan.waitMin ? `${plan.waitMin} min wait` : 'available now'}</h2>
          <p>{plan.cycleMin} min wash · finishes about {formatClock(plan.finishMin)} · class at {formatClock(classStartMin)}</p>
        </div>
        <span className={plan.finishesBeforeClass ? 'ps-fit-chip' : 'ps-fit-chip ps-fit-chip--warn'}>
          {plan.finishesBeforeClass ? 'Finishes before class' : 'Finishes after class starts'}
        </span>
      </article>

      <div className="ps-machine-sections">
        {(['washer', 'dryer'] as const).map((type) => {
          const machines = readings.filter((reading) => reading.type === type);
          const freeCount = machines.filter((reading) => reading.state === 'free').length;
          return (
            <section key={type} className="ps-machine-section" aria-labelledby={`ps-${type}-title`}>
              <div className="ps-machine-section__head">
                <div>{type === 'washer' ? <Waves size={19} /> : <Shirt size={19} />}<span><h2 id={`ps-${type}-title`}>{type === 'washer' ? 'Washers' : 'Dryers'}</h2><small>{freeCount} free of {machines.length}</small></span></div>
                <span className="ps-live-machine"><i /> LIVE · SIM</span>
              </div>
              <div className="ps-machine-grid">
                {machines.map((machine) => {
                  const stateLabel = machine.state === 'out-of-order'
                    ? 'Out of Service'
                    : machine.state;
                  return (
                    <article key={machine.id} className={`ps-machine ps-machine--${machine.state}`}>
                      <div className="ps-machine__top">
                        <span className="ps-machine__glyph">{type === 'washer' ? <WasherMachineIcon /> : <DryerMachineIcon />}</span>
                        <strong>{type === 'washer' ? 'W' : 'D'}{machine.number}</strong>
                      </div>
                      <strong className="ps-machine__state">{stateLabel}</strong>
                      <small>
                        {machine.state === 'running' || machine.state === 'done'
                          ? formatCountdown(machine.remainingSec)
                          : machine.state === 'free'
                            ? 'Ready now'
                            : 'Maintenance required'}
                      </small>
                      {machine.state === 'running' && <Clock3 size={14} />}
                      {machine.state === 'free' && <CheckCircle2 size={14} />}
                      {machine.state === 'out-of-order' && <span className="ps-out-service">Out of Service</span>}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <article className="ps-lost-found">
        <div className="ps-lost-found__head"><span><PackageSearch size={20} /></span><div><small>EDGE OBJECT DETECTION · SIM</small><h2>CV Lost &amp; Found</h2></div><strong>{lostItems.length}</strong></div>
        <div className="ps-lost-found__items">
          {lostItems.map((item) => <div key={item.id}><span><PackageSearch size={16} /></span><p>{item.text} · Located since {item.sinceDay}, {formatClock(item.sinceMin)} (SIM)</p><strong>{Math.round(item.confidence * 100)}%</strong></div>)}
        </div>
        <p>Object detection only — no people or faces stored (SIM)</p>
      </article>

      <div className="ps-laundry-privacy"><ShieldCheck size={16} /><span><strong>Privacy by design.</strong> Aggregate machine states only; no faces, identities, or raw footage are stored.</span></div>
      <p className="ps-sim-disclosure">Machine states are deterministic demo simulations, not a connection to campus laundry equipment.</p>
    </section>
  );
}
