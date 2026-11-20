import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileImage,
  Info,
  LoaderCircle,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
import { PERMITS } from '../data/campuses';
import { DEMO_SIGN_TEXT, interpretParkingSign } from '../engine/signs';
import type { PermitId, SignInterpretation } from '../types';

interface SignScannerProps {
  permitId: PermitId;
  arrival: string;
  onPermitChange: (permitId: PermitId) => void;
}

const VERDICT_META: Record<SignInterpretation['verdict'], { icon: typeof CheckCircle2; label: string }> = {
  allowed: { icon: CheckCircle2, label: 'Likely match' },
  'not-allowed': { icon: XCircle, label: 'Likely restricted' },
  conditional: { icon: ShieldAlert, label: 'Conditions apply' },
  unclear: { icon: AlertTriangle, label: 'Needs review' },
};

export function SignScanner({ permitId, arrival, onPermitChange }: SignScannerProps) {
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ocrError, setOcrError] = useState<string>();
  const [interpretation, setInterpretation] = useState<SignInterpretation>();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const meta = useMemo(
    () => (interpretation ? VERDICT_META[interpretation.verdict] : undefined),
    [interpretation],
  );

  const scanImage = async () => {
    if (!file) return;
    setBusy(true);
    setOcrError(undefined);
    setProgress(0);
    setInterpretation(undefined);
    try {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (message) => {
          if (message.status === 'recognizing text') setProgress(Math.round((message.progress ?? 0) * 100));
        },
      });
      const recognized = result.data.text.trim();
      if (!recognized) throw new Error('No readable text was found. Try a closer, brighter photo.');
      setText(recognized);
      setInterpretation(interpretParkingSign(recognized, permitId, arrival));
    } catch (reason) {
      setOcrError(reason instanceof Error ? reason.message : 'The scan could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const analyzeText = () => {
    if (!text.trim()) return;
    setInterpretation(interpretParkingSign(text, permitId, arrival));
  };

  const useDemo = () => {
    setFile(undefined);
    setText(DEMO_SIGN_TEXT);
    setInterpretation(interpretParkingSign(DEMO_SIGN_TEXT, permitId, arrival));
    setOcrError(undefined);
  };

  return (
    <section className="scanner-view page-enter" aria-labelledby="scanner-title">
      <div className="section-heading scanner-heading">
        <div>
          <span className="eyebrow"><ScanLine size={15} /> On-device OCR assistant</span>
          <h1 id="scanner-title">Read the sign before you risk it.</h1>
        </div>
        <p>OwlPark extracts sign text, compares area wording with your permit, and shows exactly which rule triggered the result.</p>
      </div>

      <div className="scanner-layout">
        <article className="scanner-input-card">
          <div className="form-heading">
            <div><span className="step-kicker">Step 1</span><h2>Capture the complete sign</h2></div>
            <Camera size={27} />
          </div>

          <label className={previewUrl ? 'upload-zone has-preview' : 'upload-zone'}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setFile(event.target.files?.[0])}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Parking sign selected for scanning" />
            ) : (
              <>
                <span className="upload-icon"><Upload size={25} /></span>
                <strong>Take a photo or choose an image</strong>
                <small>Include every line, arrow, color, and time restriction.</small>
              </>
            )}
          </label>

          <button className="primary-button full-width" type="button" onClick={scanImage} disabled={!file || busy}>
            {busy ? <><LoaderCircle className="spin" size={18} /> Reading sign · {progress}%</> : <><ScanLine size={18} /> Scan in this browser</>}
          </button>
          {ocrError && <p className="scan-error" role="alert"><AlertTriangle size={16} /> {ocrError}</p>}

          <div className="or-divider"><span>or paste recognized text</span></div>

          <label className="field scanner-textarea">
            <span><FileImage size={15} /> Sign wording</span>
            <textarea
              value={text}
              onChange={(event) => { setText(event.target.value); setInterpretation(undefined); }}
              rows={7}
              placeholder="KSU CENTRAL PARKING — VALID CENTRAL PERMIT REQUIRED…"
            />
          </label>

          <div className="scanner-actions">
            <button className="secondary-button" type="button" disabled={!text.trim()} onClick={analyzeText}><Sparkles size={17} /> Interpret text</button>
            <button className="text-button" type="button" onClick={useDemo}>Use demo sign</button>
          </div>
        </article>

        <article className="scanner-result-card">
          <div className="form-heading">
            <div><span className="step-kicker">Step 2</span><h2>Permit-aware result</h2></div>
            <ShieldAlert size={27} />
          </div>

          <label className="field">
            <span>Compare against</span>
            <select value={permitId} onChange={(event) => { onPermitChange(event.target.value as PermitId); setInterpretation(undefined); }}>
              {PERMITS.map((permit) => <option key={permit.id} value={permit.id}>{permit.label}</option>)}
            </select>
          </label>

          {interpretation && meta ? (
            <div className={`sign-result verdict-${interpretation.verdict}`}>
              <div className="verdict-heading">
                <span className="verdict-icon"><meta.icon size={25} /></span>
                <div><small>{meta.label}</small><h3>{interpretation.title}</h3></div>
              </div>
              <p>{interpretation.summary}</p>

              <div className="recognized-rules">
                <strong>What triggered this result</strong>
                {interpretation.matchedRules.length ? (
                  <ul>{interpretation.matchedRules.map((rule) => <li key={rule}><CheckCircle2 size={14} /> {rule}</li>)}</ul>
                ) : <span>No decisive rule phrase was recognized.</span>}
              </div>

              <div className="caution-list">
                {interpretation.cautions.map((caution) => <p key={caution}><Info size={14} /> {caution}</p>)}
              </div>
            </div>
          ) : (
            <div className="scan-placeholder">
              <ScanLine size={46} />
              <h3>Your explanation appears here</h3>
              <p>Scan a photograph or use the demo. The result will never claim certainty when the text is incomplete.</p>
            </div>
          )}

          <div className="privacy-callout scanner-privacy">
            <CheckCircle2 size={17} />
            <div>
              <strong>The photograph stays in your browser.</strong>
              <span>The first scan can download the OCR language model. Recognition then runs locally and the image is not uploaded by OwlPark.</span>
            </div>
          </div>
        </article>
      </div>

      <div className="legal-banner">
        <AlertTriangle size={18} />
        <p><strong>This is a decision aid, not parking authorization.</strong> Read every physical sign and follow KSU&apos;s official rules. When uncertain, choose another space or contact Talon One.</p>
        <a href="https://campus.kennesaw.edu/offices-services/parking/parking-information/rules-regulations.php" target="_blank" rel="noreferrer">Official rules</a>
      </div>
    </section>
  );
}
