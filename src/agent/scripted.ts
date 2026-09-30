// Scripted fallback for the enquiry agent, used when no ANTHROPIC_API_KEY is configured or the API fails.
// It answers the common questions from the same knowledge as Claude and walks a lead to a trial booking.

import { GYM } from "../data/facts";
import { PLANS } from "../data/sample";
import { formatNaira } from "../lib/format";
import { timetableText } from "./knowledge";
import type { AgentReply, Booking, ChatMessage } from "./types";

// Every prompt that expects a specific answer ends with one of these, so the step can be read back
// from the last bot message — including after a re-prompt.
const ASK_NAME = "What's your first name so I can book you in?";
const ASK_DAY = "Which day suits you for the free trial — today, tomorrow, or a day this week?";

const WEEKDAY_PATTERNS: readonly RegExp[] = [
  /\bsun(day)?\b/,
  /\bmon(day)?\b/,
  /\btue(s|sday)?\b/,
  /\bwed(nesday)?\b/,
  /\bthu(r|rs|rsday)?\b/,
  /\bfri(day)?\b/,
  /\bsat(urday)?\b/,
];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const NOT_A_NAME = new Set([
  "yes", "yeah", "ok", "okay", "sure", "no", "hi", "hello", "hey", "how", "what", "when", "where", "why",
  "is", "can", "i", "the", "please", "thanks", "thank",
]);

function matches(text: string, ...patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/** Parses "today", "tomorrow" or a weekday name into days from today. */
export function parseDaysFromToday(text: string, todayWeekday: number): number | null {
  const lower = text.toLowerCase();
  if (/\b(tomorrow|tmrw|tmr)\b/.test(lower)) return 1;
  if (/\b(today|tonight|right now)\b/.test(lower)) return 0;
  const index = WEEKDAY_PATTERNS.findIndex((pattern) => pattern.test(lower));
  if (index === -1) return null;
  const offset = (index - todayWeekday + 7) % 7;
  return offset === 0 ? 7 : offset;
}

function parseTime(text: string): string {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (match) return `${match[1]}${match[2] ? `:${match[2]}` : ""}${match[3]?.toLowerCase()}`;
  if (/\bmorning\b/i.test(text)) return "morning";
  if (/\b(evening|after work)\b/i.test(text)) return "evening";
  return "";
}

function guessInterest(messages: ChatMessage[]): string {
  const all = messages.filter((m) => m.role === "user").map((m) => m.text.toLowerCase()).join(" ");
  if (matches(all, /\b(weight|lose|slim|belly|fat)\b/)) return "Weight loss";
  if (matches(all, /\b(aerobics?|dance|step)\b/)) return "Aerobics classes";
  if (matches(all, /\b(tabata|hiit|insanity)\b/)) return "Tabata";
  if (matches(all, /\b(kickboxing|boxing)\b/)) return "Kickboxing";
  if (matches(all, /\b(strength|muscle|weights)\b/)) return "Strength training";
  return "General fitness";
}

/** Returns a plausible first name, or null for replies that clearly aren't one ("how much?", "yes"). */
function extractName(text: string): string | null {
  if (text.includes("?")) return null;
  const stripped = text.replace(/^(my name is|my name's|i am|i'm|it's|its|this is|call me|na)\s+/i, "").trim();
  const first = (stripped.split(/\s+/)[0] ?? "").replace(/[^\p{L}'-]/gu, "");
  if (first.length < 2 || NOT_A_NAME.has(first.toLowerCase())) return null;
  return first.charAt(0).toUpperCase() + first.slice(1, 40);
}

function answerQuestion(text: string): string | null {
  if (matches(text, /\b(price|prices|cost|how much|fees?|plans?|naira|subscription)\b/, /₦/)) {
    const monthly = PLANS.find((plan) => plan.id === "monthly");
    return `Monthly membership is ${formatNaira(monthly?.priceNgn ?? GYM.monthlyFeeNgn)} — full gym, all classes and the sauna. We also do Quarterly, Annual and Classes-only plans.`;
  }
  if (matches(text, /\b(open|opening|hours?|close|closing)\b/, /\bwhat time\b/)) {
    return `We're open ${GYM.hours} — every day, with morning and evening classes 💪🏽`;
  }
  if (matches(text, /\b(class|classes|aerobics?|tabata|dance|kickboxing|step|insanity|schedule|timetable)\b/)) {
    return `We run ${GYM.classes.join(", ")}. This week: ${timetableText().split(", ").slice(0, 4).join(", ")} and more.`;
  }
  if (matches(text, /\b(where|location|address|located|directions?)\b/)) {
    return `We're in ${GYM.area} 📍 I'll send our location pin here on WhatsApp once your trial is booked.`;
  }
  if (matches(text, /\b(sauna|equipment|machines?|treadmills?|facilit(y|ies))\b/)) {
    return "We have a strength room, a cardio room, a treadmill & cycling room, and a sauna 🔥";
  }
  return null;
}

const WANTS_TRIAL = /\b(trial|try|book|join|register|sign up|come in|yes|yeah|ok|okay|sure)\b/;
const GREETING = /\b(hi|hello|hey|good (morning|afternoon|evening))\b/;

function bookingReply(firstName: string, days: number, time: string, interest: string, todayWeekday: number): AgentReply {
  const booking: Booking = { firstName, daysFromToday: days, time, interest };
  const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `on ${WEEKDAY_NAMES[(todayWeekday + days) % 7]}`;
  return {
    reply: `You're booked, ${firstName}! Free trial ${when}${time ? ` (${time})` : ""} at Fitness Options, Aguda 🎉 Bring water and trainers. Enjoy your body ❤️💙`,
    booking,
  };
}

export function scriptedReply(messages: ChatMessage[], todayWeekday: number): AgentReply {
  const lastText = messages[messages.length - 1]?.text ?? "";
  const text = lastText.toLowerCase();
  const previousBot = [...messages].reverse().find((m) => m.role === "assistant")?.text ?? "";
  const alreadyBooked = messages.some((m) => m.role === "assistant" && m.text.startsWith("You're booked"));

  // Step: waiting for a name.
  if (previousBot.endsWith(ASK_NAME)) {
    const firstName = extractName(lastText);
    if (!firstName) return { reply: `Sorry, I didn't catch that. ${ASK_NAME}`, booking: null };
    return { reply: `Nice to meet you, ${firstName}! ${ASK_DAY}`, booking: null };
  }

  // Step: waiting for a day. The name is read back from our own "Nice to meet you, X!" message.
  if (previousBot.endsWith(ASK_DAY)) {
    const nameMessage = [...messages].reverse().find((m) => m.role === "assistant" && m.text.startsWith("Nice to meet you, "));
    const firstName = nameMessage?.text.match(/^Nice to meet you, ([^!]+)!/)?.[1] ?? "friend";
    const days = parseDaysFromToday(text, todayWeekday);
    if (days === null) return { reply: `No wahala! ${ASK_DAY}`, booking: null };
    return bookingReply(firstName, days, parseTime(lastText), guessInterest(messages), todayWeekday);
  }

  // Questions are answered first, so "what time do classes start?" gets an answer, not a booking flow.
  const answer = answerQuestion(text);
  if (!alreadyBooked && WANTS_TRIAL.test(text)) {
    return { reply: answer ? `${answer} Let's get you a free trial! ${ASK_NAME}` : `Lovely! ${ASK_NAME}`, booking: null };
  }
  if (answer) {
    return { reply: alreadyBooked ? answer : `${answer} Would you like to try us free first? ❤️💙`, booking: null };
  }
  if (GREETING.test(text)) {
    return {
      reply: "Hello! 👋 Welcome to Fitness Options, Aguda — enjoy your body ❤️💙 I can tell you about prices, classes and opening hours, or book you a free trial.",
      booking: null,
    };
  }
  return {
    reply: `Thanks for your message! I can help with prices, classes, opening hours, or book you a free trial. For anything else, our team will reply on ${GYM.phoneDisplay}.`,
    booking: null,
  };
}
