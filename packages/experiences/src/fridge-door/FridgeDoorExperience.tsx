import { useState } from "react";
import type { FridgeDoorInstance, FridgeItem } from "../types.js";
import { ExperienceShell } from "../theme/ExperienceShell.js";
import styles from "./FridgeDoorExperience.module.css";

function MagnetGlyph({ label }: { label: string }) {
  if (label === "♥" || label === "❤" || label.toLowerCase() === "heart") {
    return (
      <svg viewBox="0 0 32 32" className={styles.magnetGlyph} aria-hidden>
        <path
          d="M16 27 C16 27 4 19 4 12 C4 8 7 6 10 6 C13 6 15 8 16 10 C17 8 19 6 22 6 C25 6 28 8 28 12 C28 19 16 27 16 27 Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (label === "★" || label.toLowerCase() === "star") {
    return (
      <svg viewBox="0 0 32 32" className={styles.magnetGlyph} aria-hidden>
        <path
          d="M16 3 L19.5 12 L29 12 L21.5 18 L24.5 27 L16 21.5 L7.5 27 L10.5 18 L3 12 L12.5 12 Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return <span className={styles.magnetFace}>{label}</span>;
}

function DrawingArt() {
  return (
    <svg className={styles.drawingArt} viewBox="0 0 64 40" aria-hidden>
      <circle cx="32" cy="18" r="10" fill="#f0b060" stroke="#d48840" strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 32 + Math.cos(a) * 13;
        const y1 = 18 + Math.sin(a) * 13;
        const x2 = 32 + Math.cos(a) * 18;
        const y2 = 18 + Math.sin(a) * 18;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#e09850"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        );
      })}
      <path d="M8 34 Q20 28 32 34 Q44 40 56 32" fill="none" stroke="#8ab0d0" strokeWidth="2" />
    </svg>
  );
}

function ItemCard({
  item,
  active,
  onSelect,
}: {
  item: FridgeItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.item}
      data-kind={item.kind}
      data-active={active ? "true" : "false"}
      style={{
        left: `${item.x ?? 40}%`,
        top: `${item.y ?? 40}%`,
        ["--rot" as string]: `${item.rotationDeg ?? 0}deg`,
        ["--item-color" as string]: item.color ?? "#fff8ef",
      }}
      onClick={onSelect}
      aria-pressed={active}
    >
      {item.kind === "magnet" ? <MagnetGlyph label={item.label} /> : null}
      {item.kind === "postcard" ? (
        <>
          <span className={styles.stamp} aria-hidden />
          <span className={styles.itemLabel}>{item.label}</span>
          {item.body ? <span className={styles.itemBody}>{item.body}</span> : null}
        </>
      ) : null}
      {item.kind === "ticket" ? (
        <>
          <span className={styles.ticketStub} aria-hidden />
          <span className={styles.itemLabel}>{item.label}</span>
          {item.body ? <span className={styles.itemBody}>{item.body}</span> : null}
        </>
      ) : null}
      {item.kind === "drawing" ? (
        <>
          <DrawingArt />
          <span className={styles.itemLabel}>{item.label}</span>
          {item.body ? <span className={styles.itemBody}>{item.body}</span> : null}
        </>
      ) : null}
      {item.kind === "note" || item.kind === "reminder" ? (
        <>
          <span className={styles.itemLabel}>{item.label}</span>
          {item.body ? <span className={styles.itemBody}>{item.body}</span> : null}
        </>
      ) : null}
      {item.kind === "magnet" && item.body ? (
        <span className={styles.srOnly}>{item.body}</span>
      ) : null}
      {item.kind !== "magnet" ? <span className={styles.pin} aria-hidden /> : null}
    </button>
  );
}

export function FridgeDoorExperience({ instance }: { instance: FridgeDoorInstance }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(instance.items[0]?.id ?? null);
  const selected = instance.items.find((i) => i.id === selectedId) ?? null;

  return (
    <ExperienceShell
      instance={instance}
      actions={
        <button type="button" className={styles.action} onClick={() => setOpen((v) => !v)}>
          {open ? "Close the door" : "Peek inside"}
        </button>
      }
    >
      <div className={styles.kitchen}>
        <div className={styles.wall} aria-hidden />
        <div className={styles.windowLight} aria-hidden />
        <div className={styles.counter} aria-hidden />
        <div className={styles.fridge} data-open={open ? "true" : "false"}>
          <div className={styles.fridgeBody}>
            <div className={styles.brandBadge} aria-hidden>
              HOME
            </div>
            <div className={styles.freezerLine} />
            <div className={styles.interior} aria-hidden={!open}>
              <div className={styles.shelf}>
                <span className={styles.jar} />
                <span className={styles.jar} data-tall="true" />
              </div>
              <div className={styles.shelf}>
                <span className={styles.carton} />
              </div>
              <p>Quiet shelves. The story lives on the door.</p>
            </div>
          </div>
          <div className={styles.door}>
            <div className={styles.doorSkin}>
              <div className={styles.enamelShine} aria-hidden />
              <div className={styles.gasket} aria-hidden />
              <div className={styles.handle} />
              <div className={styles.face} aria-label="Fridge face with memories">
                {instance.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    active={item.id === selectedId}
                    onSelect={() => setSelectedId(item.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <aside className={styles.caption} aria-live="polite">
          {selected ? (
            <>
              <p className={styles.captionKind}>{selected.kind}</p>
              <h2>{selected.kind === "magnet" && selected.body ? selected.body : selected.label}</h2>
              {selected.kind !== "magnet" && selected.body ? <p>{selected.body}</p> : null}
              <p className={styles.captionHint}>Swap the keepsakes — rewrite the household story.</p>
            </>
          ) : (
            <p>Select a magnet, note, or ticket.</p>
          )}
        </aside>
      </div>
    </ExperienceShell>
  );
}
