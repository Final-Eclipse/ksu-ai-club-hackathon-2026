import { useEffect, useRef, useState } from 'react';
import { Bot, Check, LoaderCircle, Send, Sparkles, Trash2 } from 'lucide-react';
import { OWL_SUGGESTIONS, answerLocal, askOwlGemini } from '../engine/copilot';
import { geminiAvailable } from '../engine/gemini';
import type { OwlContext } from '../engine/copilot';
import type { EngineMode, OwlAction, OwlChatMessage, OwlReply } from '../types';

interface CopilotBarProps {
  context: OwlContext;
  onAction: (action: OwlAction) => void;
}

export function CopilotBar({ context, onAction }: CopilotBarProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<OwlChatMessage[]>([]);
  const [engine, setEngine] = useState<EngineMode>(() => geminiAvailable() ? 'gemini' : 'local');
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const messageCounter = useRef(0);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    messageCounter.current += 1;
    const userMessage: OwlChatMessage = { id: `user-${messageCounter.current}`, role: 'user', text: question };
    const local = answerLocal(question, context);
    setQuery('');
    setLoading(true);
    let reply: OwlReply = local;

    if (engine === 'gemini') {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        reply = await askOwlGemini(
          question,
          messages,
          local.facts,
          local.action ? [local.action] : [],
          context,
          controller.signal,
        );
      } catch {
        reply = { ...local, engineLabel: 'Gemini unavailable → Owl Local' };
      } finally {
        window.clearTimeout(timeout);
        controllerRef.current = null;
      }
    }

    messageCounter.current += 1;
    const owlMessage: OwlChatMessage = { id: `owl-${messageCounter.current}`, role: 'owl', text: reply.answer, reply };
    setMessages((current) => [...current, userMessage, owlMessage].slice(-20));
    setLoading(false);
  };

  const lastReply = messages.slice().reverse().find((message) => message.role === 'owl')?.reply;
  const suggestions = lastReply?.followUps.length ? lastReply.followUps : [...OWL_SUGGESTIONS];

  return (
    <section className="ps-copilot ps-copilot--chat" aria-labelledby="ps-copilot-title">
      <div className="ps-copilot__topline">
        <div><span className="ps-copilot__icon"><Bot size={18} /></span><span><strong id="ps-copilot-title">Owl AI</strong><small>Conversational KSU campus intelligence</small></span></div>
        <div className="ps-owl-engine" role="group" aria-label="Owl engine">
          <button type="button" aria-pressed={engine === 'local'} onClick={() => setEngine('local')}>Fast Local</button>
          <button type="button" aria-pressed={engine === 'gemini'} disabled={!geminiAvailable()} onClick={() => setEngine('gemini')}>Live Gemini</button>
        </div>
      </div>

      <div className="ps-chat-log" role="log" aria-live="polite" aria-label="Owl AI conversation">
        {messages.length ? messages.map((message) => {
          const reply = message.reply;
          const action = reply?.action;
          return (
            <article key={message.id} className={`ps-chat-message ps-chat-message--${message.role}`}>
              <span>{message.role === 'user' ? 'You' : 'Owl'}</span>
              <p>{message.text}</p>
              {reply && <footer><small>{reply.engineLabel}</small>{action && (action.kind === 'openUrl' ? <a href={action.url} target="_blank" rel="noopener noreferrer">{action.label}</a> : <button type="button" onClick={() => onAction(action)}>{action.label}</button>)}</footer>}
            </article>
          );
        }) : (
          <div className="ps-chat-empty"><Sparkles size={22} /><p>Ask about your fastest route, EV charging, laundry, dining, buses, Lost &amp; Found, or next class.</p></div>
        )}
        {loading && <div className="ps-chat-thinking"><LoaderCircle className="ps-spin" size={15} /> Owl is checking live plan facts…</div>}
      </div>

      <div className="ps-chat-suggestions">
        {suggestions.slice(0, 4).map((suggestion) => <button type="button" key={suggestion} onClick={() => { send(suggestion).catch(() => undefined); }}>{suggestion}</button>)}
      </div>

      <form className="ps-copilot__form ps-chat-form" onSubmit={(event) => { event.preventDefault(); send(query).catch(() => undefined); }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Ask Owl AI" placeholder="Ask about your next move…" />
        <button type="submit" disabled={loading || !query.trim()}>{loading ? <LoaderCircle className="ps-spin" size={16} /> : <Send size={16} />}<span>Send</span></button>
      </form>

      <div className="ps-chat-footer"><span><Check size={13} /> Context is read-only until you click an action.</span>{messages.length > 0 && <button type="button" onClick={() => setMessages([])}><Trash2 size={13} /> Clear chat</button>}</div>
    </section>
  );
}
