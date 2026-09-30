import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { SampleBadge, VerifiedBadge } from "../../components/SampleBadge";
import { askAgent } from "../../agent/client";
import { MAX_MESSAGE_CHARS, MAX_TURNS, type Booking, type ChatMessage } from "../../agent/types";
import { GYM } from "../../data/facts";
import { dateFromDay, formatDay, weekdayOf } from "../../lib/dates";
import { useDemoStore } from "../../state/store";

interface ChatBubble extends ChatMessage {
  id: number;
}

const GREETING: ChatBubble = {
  id: 0,
  role: "assistant",
  text: "Hi! 👋 Welcome to Fitness Options, Aguda. Ask me about prices, classes or opening hours — or I can book you a free trial ❤️💙",
};

const QUICK_REPLIES = ["How much is it per month?", "What classes do you run?", "What time do you open?", "Can I try it free?"];

type AgentSource = "claude" | "scripted" | null;

export function Enquiries() {
  const { demo, bookTrial } = useDemoStore();
  const [messages, setMessages] = useState<ChatBubble[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [source, setSource] = useState<AgentSource>(null);
  const [booking, setBooking] = useState<(Booking & { trialDay: number }) | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Bumped by "New chat" so a reply that arrives for the old conversation is dropped.
  const sessionRef = useRef(0);
  const bubbleIdRef = useRef(1);
  const sendingRef = useRef(false);
  const bookedRef = useRef(false);

  // Scroll the chat itself (not the page) so the newest bubble is always in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, pending]);

  const turnsLeft = MAX_TURNS - messages.length;

  const send = async (text: string) => {
    const trimmed = text.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!trimmed || sendingRef.current || turnsLeft < 2) return;
    sendingRef.current = true;
    const session = sessionRef.current;
    const next: ChatBubble[] = [...messages, { id: bubbleIdRef.current++, role: "user", text: trimmed }];
    setMessages(next);
    setDraft("");
    setPending(true);
    inputRef.current?.focus();
    const todayLabel = dateFromDay(demo.today).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    try {
      const result = await askAgent(
        next.map(({ role, text: body }) => ({ role, text: body })),
        todayLabel,
        weekdayOf(demo.today),
      );
      if (session !== sessionRef.current) return;
      setMessages((current) => [...current, { id: bubbleIdRef.current++, role: "assistant", text: result.reply }]);
      setSource(result.source);
      // One booking per conversation; a ref (not state) so the check can't read a stale closure.
      if (result.booking && !bookedRef.current) {
        bookedRef.current = true;
        setBooking({ ...result.booking, trialDay: demo.today + result.booking.daysFromToday });
        bookTrial({
          name: result.booking.firstName,
          source: "WhatsApp",
          daysFromToday: result.booking.daysFromToday,
          time: result.booking.time,
          interest: result.booking.interest,
        });
      }
    } finally {
      if (session === sessionRef.current) setPending(false);
      sendingRef.current = false;
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(draft);
  };

  const restart = () => {
    sessionRef.current++;
    sendingRef.current = false;
    bookedRef.current = false;
    setPending(false);
    setMessages([GREETING]);
    setBooking(null);
    setSource(null);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">WhatsApp enquiry agent</p>
          <h1 className="display mt-1 text-4xl sm:text-5xl">Every enquiry answered in seconds</h1>
          <p className="mt-2 max-w-2xl text-ink-2">
            Try it as a prospect would. The agent answers from Fitness Options' real details and books free trials
            straight into the pipeline — at 6am or midnight.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section aria-label="Chat as a prospect" className="overflow-hidden rounded-[2rem] border-8 border-ink bg-ink shadow-xl">
          <header className="flex items-center gap-3 bg-brand-blue px-4 py-3 text-white">
            <span className="grid size-10 place-items-center rounded-full bg-white text-sm font-bold text-brand-red" aria-hidden="true">
              FO
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Fitness Options</p>
              <p className="text-xs text-white/80">{pending ? "typing…" : "WhatsApp Business · demo"}</p>
            </div>
            <button type="button" onClick={restart} className="rounded-full px-3 py-1 text-xs font-semibold text-white/90 hover:bg-white/10">
              New chat
            </button>
          </header>

          <div className="flex h-[30rem] flex-col bg-[#efe9df]">
            <ol
              ref={listRef}
              role="log"
              aria-label="Conversation"
              tabIndex={0}
              className="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
            >
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={`rise max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-sm ${
                    message.role === "user" ? "self-end rounded-br-md bg-brand-blue-soft text-ink" : "self-start rounded-bl-md bg-card text-ink"
                  }`}
                >
                  {message.role === "assistant" && <span className="sr-only">Fitness Options: </span>}
                  {message.text}
                </li>
              ))}
              {pending && (
                <li aria-hidden="true" className="self-start rounded-2xl rounded-bl-md bg-card px-3.5 py-2 text-sm text-muted shadow-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse [animation-delay:150ms]">●</span>
                    <span className="animate-pulse [animation-delay:300ms]">●</span>
                  </span>
                </li>
              )}
            </ol>

            <div className="flex gap-2 overflow-x-auto px-3 pb-2">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={pending || turnsLeft < 2}
                  onClick={() => void send(reply)}
                  className="shrink-0 rounded-full border border-brand-blue/30 bg-card px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue-soft disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>

            {turnsLeft < 2 && (
              <p role="status" className="px-4 pb-2 text-xs text-ink-2">
                This demo chat is full — press <strong>New chat</strong> to start again.
              </p>
            )}

            <form onSubmit={onSubmit} className="flex gap-2 border-t border-line/60 bg-[#f6f2ea] p-3">
              <label htmlFor="chat-input" className="sr-only">
                Message Fitness Options
              </label>
              <input
                ref={inputRef}
                id="chat-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={MAX_MESSAGE_CHARS}
                placeholder={turnsLeft < 2 ? "Chat limit reached — start a new chat" : "Type a message"}
                disabled={turnsLeft < 2}
                autoComplete="off"
                className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-card px-4 text-sm"
              />
              <button type="submit" disabled={pending || !draft.trim() || turnsLeft < 2} className="btn btn-primary px-4 disabled:opacity-50">
                Send
              </button>
            </form>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="card p-5" aria-labelledby="owner-view">
            <h2 id="owner-view" className="font-semibold">What the owner sees</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-2">Agent</dt>
                <dd className="font-medium">
                  {source === "claude" && "Live AI (Claude)"}
                  {source === "scripted" && "Scripted replies (no AI key set)"}
                  {source === null && "Waiting for the first message"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-2">Reply time</dt>
                <dd className="font-medium">Seconds, 24/7</dd>
              </div>
            </dl>

            <div role="status">
            {booking ? (
              <div className="rise mt-5 rounded-xl border border-good/30 bg-good-soft p-4">
                <p className="text-sm font-semibold text-good">Free trial booked → added to Pipeline</p>
                <p className="mt-2 text-lg font-semibold">{booking.firstName}</p>
                <p className="text-sm text-ink-2">
                  {formatDay(booking.trialDay)}
                  {booking.time ? ` · ${booking.time}` : ""} · {booking.interest || "General fitness"}
                </p>
                <Link to="/app/pipeline" className="mt-3 inline-block text-sm font-semibold text-brand-blue underline underline-offset-4">
                  See it in the pipeline
                </Link>
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">
                When the prospect agrees to a free trial, the booking appears here and in the pipeline.
              </p>
            )}
            </div>
          </section>

          <section className="card p-5" aria-labelledby="knows-heading">
            <h2 id="knows-heading" className="font-semibold">What the agent knows</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-2">
              <li className="flex flex-wrap items-center gap-2">
                <VerifiedBadge /> Hours ({GYM.hours}), ₦18,000 monthly fee, facilities, classes, WhatsApp number
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <SampleBadge /> Quarterly / annual / classes-only prices, class times, the free-trial offer
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted">
              It never invents an address, price or link — anything it doesn't know, it hands to the team.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
