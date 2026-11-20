import { useState } from 'react';
import type { Dispatch } from 'react';
import {
  ArrowDownToLine,
  CarFront,
  Check,
  Clock3,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Route,
  Sparkles,
} from 'lucide-react';
import { CAMPUSES } from '../data/campuses';
import { DAY_OPTIONS } from '../data/days';
import { resolveOrigin } from '../data/origins';
import { PRESETS } from '../data/presets';
import { classesForDay, findScheduleGaps, toClassSessions } from '../engine/schedule';
import { formatClock, parseClock, toHHMM } from '../engine/time';
import type { Campus } from '../types';
import type { PlanAction, PlanState } from '../state/plan';
import { ScheduleImporter } from './ScheduleImporter';

interface PlannerProps {
  state: PlanState;
  dispatch: Dispatch<PlanAction>;
  campus: Campus;
}

export function Planner({ state, dispatch, campus }: PlannerProps) {
  const [locationStatus, setLocationStatus] = useState('Use My Location');
  const [originText, setOriginText] = useState('');
  const [originHint, setOriginHint] = useState('');
  const dayClasses = classesForDay(state.classes, state.selectedDay);
  const gaps = findScheduleGaps(state.classes, state.selectedDay);
  const applyTypedOrigin = () => {
    const label = originText.trim();
    if (!label) {
      setOriginHint('Enter a city or address first.');
      return;
    }
    const preset = resolveOrigin(label);
    dispatch({ type: 'setOrigin', label, geo: preset?.geo ?? null });
    setOriginHint(preset ? `${preset.label} coordinates applied.` : 'approx — pickup uses current location');
  };

  return (
    <section className="ps-planner ps-planner--compact" aria-labelledby="ps-schedule-title">
      <div className="ps-section-label"><span>01</span> Commute &amp; Schedule</div>
      <div className="ps-planner-quickbar">
        <div className="ps-compact-campus" role="group" aria-label="Campus context">
          {(Object.keys(CAMPUSES) as Array<keyof typeof CAMPUSES>).map((campusId) => (
            <button type="button" key={campusId} aria-pressed={state.campusId === campusId} onClick={() => dispatch({ type: 'setCampus', campusId })}>
              <MapPin size={13} /> {CAMPUSES[campusId].name.replace(' Campus', '')}
            </button>
          ))}
        </div>
        <div className="ps-compact-presets" role="group" aria-label="Sample schedules">
          {PRESETS.map((preset) => (
            <button type="button" key={preset.id} aria-pressed={state.presetId === preset.id} onClick={() => dispatch({ type: 'applyPreset', presetId: preset.id })}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ps-planner-compact-grid">
        <aside className="ps-planner-controls">
          <div className="ps-compact-control">
            <span className="ps-control-label"><Clock3 size={14} /> Reach campus by</span>
            <div className="ps-time-stepper">
              <button type="button" aria-label="Move arrival 15 minutes earlier" onClick={() => dispatch({ type: 'setArrival', arrivalMin: state.arrivalMin - 15 })}><Minus size={15} /> 15</button>
              <label><span className="ps-sr-only">Campus arrival time</span><input type="time" value={toHHMM(state.arrivalMin)} onChange={(event) => { const minute = parseClock(event.target.value); if (minute !== null) dispatch({ type: 'setArrival', arrivalMin: minute }); }} /><strong>{formatClock(state.arrivalMin)}</strong></label>
              <button type="button" aria-label="Move arrival 15 minutes later" onClick={() => dispatch({ type: 'setArrival', arrivalMin: state.arrivalMin + 15 })}><Plus size={15} /> 15</button>
            </div>
            <div className="ps-origin-summary"><CarFront size={16} /><span><small>Origin</small><strong>{state.profile.originLabel}</strong><em>{state.profile.driveMin} min · {state.profile.distanceMi} mi baseline</em></span></div>
          </div>

          <div className="ps-compact-control">
            <span className="ps-control-label"><LocateFixed size={14} /> Custom origin</span>
            <form className="ps-compact-origin" onSubmit={(event) => { event.preventDefault(); applyTypedOrigin(); }}>
              <input value={originText} onChange={(event) => setOriginText(event.target.value)} placeholder="Type a city or address — e.g. Alpharetta, GA" aria-label="Custom origin" />
              <button type="submit">Set</button>
            </form>
            <button
              className="ps-location-button"
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  setLocationStatus('Location unavailable');
                  setOriginHint('This browser does not provide geolocation. Your previous origin is unchanged.');
                  return;
                }
                setLocationStatus('Locating…');
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const latitude: unknown = position.coords.latitude;
                    const longitude: unknown = position.coords.longitude;
                    if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                      setLocationStatus('Use My Location');
                      setOriginHint('The browser returned invalid coordinates. Your previous origin is unchanged.');
                      return;
                    }
                    dispatch({ type: 'setOrigin', label: 'Current location', geo: { lat: latitude, lng: longitude } });
                    setLocationStatus('Current location applied');
                    setOriginHint('Precise pickup coordinates applied for this session.');
                  },
                  () => {
                    setLocationStatus('Use My Location');
                    setOriginHint('Location permission was denied. Your previous origin is unchanged.');
                  },
                  { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
                );
              }}
            ><LocateFixed size={14} /> {locationStatus}</button>
            {originHint && <p className="ps-origin-hint" role="status">{originHint}</p>}
          </div>

          <details className="ps-import-details ps-import-details--rail">
            <summary><ArrowDownToLine size={14} /> Import another schedule</summary>
            <ScheduleImporter campus={campus} onImport={(meetings) => { const converted = toClassSessions(meetings); dispatch({ type: 'importClasses', classes: converted.classes, notes: converted.notes }); }} />
          </details>
          {state.importNotes.length > 0 && <div className="ps-import-notes" role="status"><Route size={14} /><div><strong>Import notes</strong>{state.importNotes.map((note) => <span key={note}>{note}</span>)}</div></div>}
        </aside>

        <div className="ps-schedule-panel">
          <div className="ps-schedule-panel__head">
            <div><p className="ps-kicker">Full-week schedule</p><h2 id="ps-schedule-title">Classes and usable gaps</h2></div>
            <div className="ps-schedule-toolbar">
              <div className="ps-day-week" role="group" aria-label="Schedule range"><button type="button" aria-pressed={state.scheduleView === 'day'} onClick={() => dispatch({ type: 'setScheduleView', view: 'day' })}>Day</button><button type="button" aria-pressed={state.scheduleView === 'week'} onClick={() => dispatch({ type: 'setScheduleView', view: 'week' })}>Week</button></div>
              {state.scheduleView === 'day' && <div className="ps-day-pills" role="group" aria-label="Weekday">{DAY_OPTIONS.map((day) => <button type="button" key={day.code} title={day.label} aria-label={day.label} aria-pressed={state.selectedDay === day.code} onClick={() => dispatch({ type: 'setDay', day: day.code })}>{day.short}</button>)}</div>}
            </div>
          </div>

          {state.scheduleView === 'day' ? (
            <div className="ps-day-schedule">
              <div className="ps-day-schedule__heading"><span>{DAY_OPTIONS.find((day) => day.code === state.selectedDay)?.label}</span><strong>{dayClasses.length} classes</strong></div>
              {dayClasses.map((session) => {
                const sessionCampus = CAMPUSES[session.campusId];
                const place = sessionCampus.places.find((candidate) => candidate.id === session.buildingId);
                const followingGap = gaps.find((gap) => gap.startMin === session.endMin);
                return (
                  <div className="ps-schedule-sequence" key={session.id}>
                    <button type="button" className="ps-class-block" aria-pressed={state.selectedClassId === session.id} onClick={() => dispatch({ type: 'selectClass', classId: session.id })}>
                      <span><strong>{formatClock(session.startMin)}</strong><small>{formatClock(session.endMin)}</small></span>
                      <span><small>{session.days} · {sessionCampus.name}</small><strong>{session.course}</strong><small>{place?.short ?? session.buildingId} · {session.room}</small></span>
                      {state.selectedClassId === session.id && <Check size={17} />}
                    </button>
                    {followingGap && <button type="button" className="ps-free-gap" onClick={() => { dispatch({ type: 'setArrival', arrivalMin: followingGap.startMin }); dispatch({ type: 'setDiningEnabled', enabled: followingGap.durationMin >= 40 }); dispatch({ type: 'setLaundryEnabled', enabled: followingGap.durationMin >= 65 }); }}><Sparkles size={13} /> {followingGap.durationMin} min gap · {followingGap.fitLabel}</button>}
                  </div>
                );
              })}
              {!dayClasses.length && <p className="ps-empty-schedule">No classes scheduled for this day.</p>}
            </div>
          ) : (
            <div className="ps-week-schedule">{DAY_OPTIONS.map((day) => <section key={day.code}><button type="button" onClick={() => dispatch({ type: 'setDay', day: day.code })}>{day.label}</button>{classesForDay(state.classes, day.code).map((session) => { const sessionCampus = CAMPUSES[session.campusId]; const place = sessionCampus.places.find((candidate) => candidate.id === session.buildingId); return <button type="button" key={session.id} onClick={() => { dispatch({ type: 'setDay', day: day.code }); dispatch({ type: 'selectClass', classId: session.id }); }}><strong>{session.course}</strong><span>{formatClock(session.startMin)}</span><small>{place?.short ?? session.buildingId} · {sessionCampus.id === 'kennesaw' ? 'K' : 'M'}</small></button>; })}</section>)}</div>
          )}
        </div>
      </div>
    </section>
  );
}
