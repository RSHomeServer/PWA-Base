import { useEffect, useMemo, useRef, useState } from "react";
import { Button, IconButton } from "@platform/ui";
import { Markdown } from "@platform/markdown";
import "@platform/markdown/styles.css";
import {
  buildConversationGroups,
  groupCopyText,
  groupDisplayText,
  type ConversationGroup,
} from "../lib/conversation.js";
import type { EventRecord } from "../api/types.js";
import { formatTimestamp } from "../lib/format.js";
import styles from "../pages/pages.module.css";

export interface ConversationViewProps {
  events: EventRecord[];
  /** When true, auto-scroll to the latest message as events arrive. */
  live?: boolean;
}

export function ConversationView({ events, live = false }: ConversationViewProps) {
  const groups = useMemo(() => buildConversationGroups(events), [events]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!live || groups.length === 0) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [groups.length, live, groups[groups.length - 1]?.id]);

  if (groups.length === 0) {
    return <p className={styles.muted}>No agent thoughts or responses recorded for this run.</p>;
  }

  async function copyGroup(group: ConversationGroup) {
    try {
      await navigator.clipboard.writeText(groupCopyText(group));
      setCopiedId(group.id);
      window.setTimeout(() => setCopiedId((prev) => (prev === group.id ? null : prev)), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  return (
    <div ref={scrollRef} className={styles.conversationScroll} aria-label="Agent conversation">
      <ol className={styles.conversationList}>
        {groups.map((group) => {
          const expanded = expandedGroups[group.id] ?? false;
          const collapsible = group.messages.length > 1;
          const label = group.kind === "agent_thought" ? "Thought" : "Response";
          const toneClass =
            group.kind === "agent_thought"
              ? styles.conversationGroupThought
              : styles.conversationGroupResponse;

          return (
            <li
              key={group.id}
              className={[styles.conversationGroup, toneClass].filter(Boolean).join(" ")}
            >
              <div className={styles.conversationGroupHead}>
                <div className={styles.conversationGroupMeta}>
                  <span className={styles.conversationKind}>{label}</span>
                  <time dateTime={group.startTimestamp}>{formatTimestamp(group.startTimestamp)}</time>
                  {collapsible && group.endTimestamp !== group.startTimestamp ? (
                    <span className={styles.conversationGroupRange}>
                      → {formatTimestamp(group.endTimestamp)}
                    </span>
                  ) : null}
                  {collapsible ? (
                    <span className={styles.conversationGroupCount}>
                      {group.messages.length} messages
                    </span>
                  ) : null}
                </div>
                <IconButton
                  label={copiedId === group.id ? "Copied" : "Copy message"}
                  size="sm"
                  variant="subtle"
                  onClick={() => void copyGroup(group)}
                >
                  {copiedId === group.id ? "✓" : "⎘"}
                </IconButton>
              </div>

              <div className={styles.conversationMarkdown}>
                {collapsible && expanded ? (
                  group.messages.map((message) => (
                    <article key={message.id} className={styles.conversationMessage}>
                      <time
                        className={styles.conversationMessageTime}
                        dateTime={message.timestamp}
                      >
                        {formatTimestamp(message.timestamp)}
                      </time>
                      <Markdown variant="compact">{message.text}</Markdown>
                    </article>
                  ))
                ) : (
                  <Markdown variant="compact">{groupDisplayText(group, expanded)}</Markdown>
                )}
              </div>

              {collapsible ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className={styles.conversationExpandBtn}
                  onClick={() => toggleGroup(group.id)}
                >
                  {expanded
                    ? "Collapse"
                    : `Expand ${group.messages.length - 1} more ${label.toLowerCase()}${group.messages.length - 1 === 1 ? "" : "s"}`}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
