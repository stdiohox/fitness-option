import { z } from "zod";

export const MAX_TURNS = 16;
export const MAX_MESSAGE_CHARS = 600;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(MAX_MESSAGE_CHARS),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const AgentRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(MAX_TURNS),
  /** Simulated "today", e.g. "Wednesday 30 September 2026", so bookings land on the demo calendar. */
  // Strict format: this string goes into the system prompt, so it must not carry free text.
  todayLabel: z.string().regex(/^[A-Za-z]+,? \d{1,2} [A-Za-z]+ \d{4}$/),
});
export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export const BookingSchema = z.object({
  firstName: z.string().min(1).max(40),
  /** 0 = today, 1 = tomorrow ... */
  daysFromToday: z.number().int().min(0).max(14),
  time: z.string().max(20),
  interest: z.string().max(60),
});
export type Booking = z.infer<typeof BookingSchema>;

export const AgentReplySchema = z.object({
  reply: z.string().min(1).max(700),
  booking: BookingSchema.nullable(),
});
export type AgentReply = z.infer<typeof AgentReplySchema>;

export interface AgentResponse extends AgentReply {
  source: "claude" | "scripted";
}
