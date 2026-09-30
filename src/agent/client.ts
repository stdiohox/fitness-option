import { AgentReplySchema, MAX_TURNS, type AgentResponse, type ChatMessage } from "./types";
import { scriptedReply } from "./scripted";

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Asks the Claude-backed agent; if it isn't configured or fails, answers with the scripted agent
 * so the demo never dead-ends in front of a client.
 */
export async function askAgent(messages: ChatMessage[], todayLabel: string, todayWeekday: number): Promise<AgentResponse> {
  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Only the recent turns are sent; the server caps history length.
      body: JSON.stringify({ messages: messages.slice(-MAX_TURNS), todayLabel }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.ok) {
      const parsed = AgentReplySchema.safeParse(await response.json());
      if (parsed.success) return { ...parsed.data, source: "claude" };
      console.warn("Agent returned an unexpected shape; using scripted reply");
    } else if (response.status !== 503) {
      console.warn(`Agent request failed (${response.status}); using scripted reply`);
    }
  } catch (error) {
    console.warn("Agent request error; using scripted reply", error);
  }
  return { ...scriptedReply(messages, todayWeekday), source: "scripted" };
}
