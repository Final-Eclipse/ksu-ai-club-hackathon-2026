import { FileInput, Sparkles, Upload } from 'lucide-react';
import { parseSchedule, SCHEDULE_EXAMPLES } from '../engine/schedule';
import type { Campus, ClassMeeting } from '../types';
import { useState } from 'react';

interface ScheduleImporterProps {
  campus: Campus;
  onImport: (meetings: ClassMeeting[]) => void;
}

export function ScheduleImporter({ campus, onImport }: ScheduleImporterProps) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('Paste a line with course, days, time, and building.');

  return (
    <div className="ps-importer">
      <div className="ps-importer__heading">
        <span><FileInput size={16} /> Import schedule text</span>
        <button
          type="button"
          onClick={() => {
            setText(SCHEDULE_EXAMPLES[campus.id]);
            setMessage(`${campus.name} demo schedule loaded.`);
          }}
        >
          <Sparkles size={14} /> Use demo
        </button>
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label="Schedule text"
        placeholder="BIOL 2108 | MWF 12:30 PM | Science Building | Room SC 109"
        rows={3}
      />
      <div className="ps-importer__footer">
        <span role="status">{message}</span>
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            const result = parseSchedule(text);
            if (!result.meetings.length) {
              setMessage('No classes resolved. Check the day, time, and building name.');
              return;
            }
            onImport(result.meetings);
            setMessage(`${result.meetings.length} classes parsed${result.ignoredLines.length ? ` · ${result.ignoredLines.length} lines need review` : ''}.`);
          }}
        >
          <Upload size={14} /> Sync classes
        </button>
      </div>
    </div>
  );
}
