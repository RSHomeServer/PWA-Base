import type { EventRecord } from "../api/types.js";
import { eventBodyFromPayload } from "./event-detail.js";

export type ConversationKind = "agent_thought" | "agent_response";

export interface ConversationMessage {
  id: string;
  kind: ConversationKind;
  timestamp: string;
  text: string;
  eventId: string;
}

export interface ConversationGroup {
  id: string;
  kind: ConversationKind;
  messages: ConversationMessage[];
  startTimestamp: string;
  endTimestamp: string;
}

const CONVERSATION_KINDS = new Set<ConversationKind>(["agent_thought", "agent_response"]);

export function isConversationKind(type: string): type is ConversationKind {
  return CONVERSATION_KINDS.has(type as ConversationKind);
}

/** Pull display text for a thought/response event, or null when empty/non-conversation. */
export function conversationTextFromEvent(ev: EventRecord): string | null {
  if (!isConversationKind(ev.type)) return null;
  const body = eventBodyFromPayload(ev);
  const text = (body ?? ev.summary).trim();
  return text.length > 0 ? text : null;
}

/** Conversation events only, chronological ascending. */
export function filterConversationEvents(events: EventRecord[]): EventRecord[] {
  return events
    .filter((ev) => conversationTextFromEvent(ev) !== null)
    .sort((a, b) => {
      const ta = Date.parse(a.timestamp);
      const tb = Date.parse(b.timestamp);
      if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
}

export function buildConversationMessages(events: EventRecord[]): ConversationMessage[] {
  return filterConversationEvents(events).map((ev) => ({
    id: ev.id,
    kind: ev.type as ConversationKind,
    timestamp: ev.timestamp,
    text: conversationTextFromEvent(ev)!,
    eventId: ev.id,
  }));
}

/** Collapse consecutive same-type messages into expandable groups. */
export function buildConversationGroups(events: EventRecord[]): ConversationGroup[] {
  const messages = buildConversationMessages(events);
  if (messages.length === 0) return [];

  const groups: ConversationGroup[] = [];
  let current: ConversationGroup | null = null;

  for (const message of messages) {
    if (current && current.kind === message.kind) {
      current.messages.push(message);
      current.endTimestamp = message.timestamp;
      continue;
    }

    current = {
      id: message.id,
      kind: message.kind,
      messages: [message],
      startTimestamp: message.timestamp,
      endTimestamp: message.timestamp,
    };
    groups.push(current);
  }

  return groups;
}

/** Text shown in the UI — first message when collapsed, full join when expanded. */
export function groupDisplayText(group: ConversationGroup, expanded: boolean): string {
  if (!expanded && group.messages.length > 1) {
    return group.messages[0]!.text;
  }
  return groupCopyText(group);
}

/** Full group text for clipboard copy. */
export function groupCopyText(group: ConversationGroup): string {
  return group.messages.map((m) => m.text).join("\n\n");
}
