# Birthday creative direction review

**Task type:** Experience design review (not implementation)  
**Date:** 2026-07-27  
**Contract:** root `CURSOR.md`  
**Concept gallery:** [`concepts/index.html`](./concepts/index.html)

This document is the durable deliverable for the multidisciplinary review. It deliberately challenges the assumption that handcrafted miniature 3D (especially Snow Globe / R3F) is the right primary craft for Birthday.

---

## Executive Summary

After multiple Memory Experience Library passes, **miniature 3D scenes are not producing the emotional quality bar**. That is useful product learning, not a personal failure of craft.

The existing Birthday **lantern ritual** (HTML/CSS, one click, handwritten wish, slow rise into night, clear ending) remains emotionally stronger than the Snow Globe / Music Box / Fridge prototypes because it is a **complete emotional arc with one verb**, not a **museum object to admire**.

**Recommended pivot:** Birthday’s visual identity should be a **Paper, Light & Night** language — seal, letter, candle, lantern, constellation-as-drawing, photograph-as-object — executed in **DOM/CSS/SVG motion**. Abandon photoreal / GLTF / R3F as the Birthday opening and identity craft. Keep Memory Experiences as an optional R&D cabinet if useful, but do not let them drive Birthday.

**Single next implementation task (highest confidence):** elevate the existing `LanternField` into a **dedicated full-viewport Birthday chapter ritual** (or opening beat) with richer anticipation, handwritten typography, and a clearer ending beat — no new experience kind, no Three.js.

---

## Deliverable 1 — Critical review of the Memory Experience Library

### What genuinely works

- **Shared “Cabinet of Keepsakes” art direction** (walnut, brass, Fraunces/Literata) is coherent and premium on paper.
- **Music Box (CSS)** is directionally right for Cursor: lid, figurine, short lullaby, tactile open — still thin emotionally, but the medium fits.
- **Fridge Door (DOM)** proves parameterisation without WebGL; magnets/notes are legible as *content containers*.
- **Parameterisation idea** (one stage, many instances) is sound *if* the stage is emotionally complete.
- **Honest WebGL fallback path** eventually acknowledged environment reality (Cursor/Mesa).

### What feels unfinished

- Snow Globe centrepieces read as **placeholders** (procedural props, toy GLTFs) next to copy that promises museum craft.
- Glass, snow, and milk-glass mood rarely read as intended; craft often collapses to **dark sphere + base + weak interior**.
- Catalogue framing (“Landmark under milk glass”, “parameterisation proof”) sounds like **demo documentation**, not a keepsake you feel.
- Shake / lid / magnet taps are **gestures without story payoff**.

### What feels over-engineered

- R3F + GLTF + attributions + PWA exclusions + WebGL probe + dual craft paths for a **shake-a-globe** beat.
- Birthday opening vision that chains night → constellation → spiral → globe → box — **cinematic ambition stacked on unproven craft**.
- Treating “free licensed GLTF under glass” as proof of emotional quality.

### What feels emotionally engaging

- Moments that imply **someone left this for you**: handwritten-adjacent type, night sky, slow fade, finite wish count (“Every wish is on its way”).
- Lantern chapter’s **hint line** and completion state — ritual language, not product UI.
- Music Box’s short melody (when it works) — time-bounded gift.

### What feels technically impressive but emotionally flat

- Successful Playwright WebGL screenshots of Paris/tree globes.
- Cool/warm lighting mood swaps.
- Instance JSON + registry architecture.
- Constellation-as-points inside a 3D dome when the **story is the drawing of the dedication**, not the glass physics.

**Verdict:** The library currently optimises for **stage craft and parameterisation**. Birthday needs **ritual craft and emotional arcs**. Those are different products.

---

## Deliverable 2 — Why the lantern succeeds

Implementation reference: `packages/site-birthday/src/components/LanternField.tsx` + CSS (~150 lines of motion).

| Dimension | What it does |
| --- | --- |
| **Interaction** | One verb: *touch the dark*. No mode switches, no camera literacy. |
| **Anticipation** | Hint invites; wish text fades in after the lantern appears — delayed reveal. |
| **Timing / pacing** | ~6.5s rise — slow enough to feel ceremonial, not gamey. |
| **Emotional payoff** | Metaphor is ancient and clear: wish → light → sky → gone. |
| **Visual simplicity** | Glow + small body + italic line. No competing detail. |
| **Ending** | Finite wishes; copy changes to completion; optional callback. Arc closes. |
| **Complexity** | Extremely low. Reliability high. Works in Cursor’s browser. |

**Why it beats the globe prototypes:** the lantern asks the user to **do a meaningful act**; the globe asks them to **inspect an object**. Inspection without awe feels unfinished. A simple act with a clear metaphor feels complete even when graphics are humble.

**Not about technology:** the same emotional grammar could be candle, seal, match, or ribbon. HTML/CSS is the *evidence* of fit-to-Cursor, not the *cause* of emotion — but it correlates strongly with what we can finish beautifully.

---

## Deliverable 3 & 4 — Concept catalogue (~20), ranked

Scores: **Impact** = estimated emotional visual impact (1–10). **Confidence** = Cursor can execute beautifully in DOM/CSS/SVG (1–10). **Rank score** ≈ 0.45×Impact + 0.55×Confidence (execution-weighted).

| Rank | Title | Emotional objective | Interaction | Complexity | Impact | Confidence | Notes |
| --- | --- | --- | ---: | --- | ---: | ---: | --- |
| 1 | **Sky Lantern Wish** | Hope released into night | Click sky → lantern + wish rises | Low | 9 | 10 | Already proven in Birthday |
| 2 | **Wax Seal Letter** | Private intimacy | Break seal → unfold paper | Low | 9 | 9 | Partial code exists; strengthen ritual |
| 3 | **Single Candle Wish** | Intention then release | Blow / click flame → smoke + line | Low | 9 | 9 | Classic birthday grammar |
| 4 | **Trace the Constellation** | Recognition / dedication | Touch stars in order → lines + name | Med | 8 | 8 | 2D SVG — not 3D globe |
| 5 | **Polaroid Lift** | Sudden tenderness | Lift photo from stack | Low | 8 | 8 | Real photo content later |
| 6 | **Strike a Match** | Beginning / permission | Drag/click strike → room lights | Low | 8 | 8 | Strong opening beat |
| 7 | **Ribbon Untie** | Giftedness | Untie → note revealed | Low | 8 | 8 | Prototype in gallery |
| 8 | **String Lights** | Gathering warmth | Light bulbs one-by-one | Low | 7 | 9 | Completion chorus |
| 9 | **Pressed Flower Page** | Time preserved | Open book → flower + caption | Low | 8 | 8 | Quiet, scrapbook-adjacent but focused |
| 10 | **Window Condensation** | Soft closeness | Wipe fog → message | Med | 7 | 7 | Mood-heavy |
| 11 | **Paper Boat Send** | Letting go | Launch boat on water → fades | Med | 7 | 7 | Needs water craft care |
| 12 | **Matchbook Calendar Tear** | Threshold of a year | Tear page → reveal | Low | 7 | 8 | Good chapter transition |
| 13 | **Curtain Draw** | Invitation indoors | Pull curtain → scene | Low | 6 | 8 | Supporting transition |
| 14 | **Music Box Lid (ritual)** | Nostalgia in a phrase | Open once → melody + line | Med | 7 | 7 | Keep CSS; cut catalogue chrome |
| 15 | **Voice Ribbon / Note** | Presence of a voice | Pull ribbon → audio plays | Med | 8 | 6 | Audio UX risk |
| 16 | **Rain on Skylight** | Contemplation | Watch / tap drip → memory | Med | 6 | 7 | Easy to feel empty |
| 17 | **Pocket Watch Open** | Shared time | Open cover → inscription | Med | 6 | 6 | Object-inspection trap |
| 18 | **CSS Snow Globe shake** | Wonder-in-a-jar | Shake → snow | Med | 6 | 5 | Metaphor strong; craft often flat |
| 19 | **Fridge of magnets** | Everyday love | Rearrange items | Med | 5 | 8 | Wrong tone for Birthday identity |
| 20 | **R3F Museum Miniature** | Awe at craft | Orbit / admire | High | 4 | 3 | Reject as identity |

### Rejected / weak (do not pursue as Birthday identity)

| Idea | Why reject |
| --- | --- |
| Photoreal / GLTF snow globe opening | High ambition, low Cursor confidence; WebGL env fragility; emotionally flat when imperfect |
| Multi-landmark parameterisation demos as Birthday chapters | Proves engineering, not feeling |
| Heavy particle WebGL skies | Noise without ritual |
| Fridge door as hero metaphor | Domestic catalogue, not ceremonial night |
| Pocket watch / ornate object admire | Same failure mode as globe — look, don’t participate |
| Long cinematic camera spiral requiring believable glass | Depends on the craft we cannot consistently finish |

### Top 5 — Birthday visual identity

These five should **define** the Birthday application:

1. **Sky Lantern Wish** — signature ritual of release / future  
2. **Wax Seal Letter** — signature ritual of intimacy / past words  
3. **Single Candle Wish** — signature ritual of birthday itself  
4. **Trace the Constellation** — signature ritual of dedication / “us” (2D)  
5. **Polaroid Lift** — signature ritual of memory / photographs  

**Supporting transitions (not identity heroes):** match strike, ribbon untie, string lights, curtain.

---

## Deliverable 5 — Concept prototypes

Rough interactive gallery (10 stages) was used during the 2026-07 review to compare ritual clarity side-by-side. The gallery HTML has been removed from the repository; the ranked intent below remains the durable record.

Captured intent per prototype: lantern, candle, letter, constellation trace, polaroid, ribbon, rain wipe, string lights, pressed flower, match.

---

## Recommended Visual Language — “Paper, Light & Night”

1. **Night as stage** — deep ink backgrounds; stars as sparse punctuation, not particle storms.  
2. **One light source** — candle, lantern, match, or desk lamp; amber as emotion, not decoration.  
3. **Paper as sacred surface** — cream stock, deckled edges optional, handwriting / italic / script for intimacy.  
4. **One object in frame** — if removing chrome still tells the story, the chrome was wrong.  
5. **Imperfection allowed** — slight sway, smoke, seal crack; avoid CGI gloss.  
6. **Typography hierarchy** — display for titles; *script/italic for the thing someone “wrote”*.  
7. **Finite sets** — N wishes, N stars, N bulbs — completion is emotional.  
8. **No museum glass as the hero** — containment metaphors only if CSS-simple and secondary.

---

## Recommended Interaction Language

| Pattern | Rule |
| --- | --- |
| **One verb** | Touch / break / blow / lift / untie / strike / trace |
| **Anticipation beat** | 200–800ms before the “message” fully appears |
| **Slow payoff** | 4–8s ceremonial motion; never snappy UI |
| **Clear end** | Copy or light state that says “this ritual is complete” |
| **Content is the payload** | Wish text, letter line, photo, dedication — craft serves words/media |
| **Works without WebGL** | DOM/CSS/SVG first; audio optional and progressive |
| **Reduced motion** | Still show the message; skip the journey |

---

## Creative Director Review

The previous direction confused **craft ambition** with **emotional design**. A Birthday site is not a Three.js showreel. It is a sequence of **kept promises and small ceremonies**.

Memory Experiences taught us: Cursor (and this environment) can ship **tasteful CSS/SVG rituals** reliably; it struggles to ship **believable miniature 3D** that survives screenshot honesty and real browsers.

**Do not** keep spending Birthday milestones on snow-globe glass fidelity. **Do** treat the lantern as the north star grammar and clone that grammar across letter, candle, constellation-draw, and photo.

The opening vision in `docs/guides/birthday-experience.md` (spiral into a snow globe then keepsake box) should be **rewritten**: night and constellation remain; the “container” should be **paper, box-of-letters, or candlelit desk** — not photoreal glass.

### Specialist consensus (parallel reviews)

Creative Director and UX/Motion/Interaction agents independently agreed: abandon R3F as Birthday identity; keep Lantern + Seal + 2D Constellation + Candle. Soft disagreement: UX ranks Seal / photo-lift above Lantern as *identity engines* (Lantern as chapter climax); CD ranks Lantern polish as the immediate next bet. **Polaroid Lift** in the Top 5 is the photo-ritual *slot* (lift photo + find note), not a cloudy “develop” effect.

---

## Recommendation to ChatGPT

### What was learnt

- Emotional success correlated with **ritual completeness + metaphor clarity + low craft risk**, not with rendering sophistication.  
- Users (and reviewers) correctly punish **screenshots that don’t match the real viewing environment**.  
- Parameterised “cabinet” stages invite **demo language** (“proof”, “instance”) that kills intimacy.  
- The lantern’s ~6s rise and delayed wish copy is a reusable **timing template**.

### What should be abandoned

- R3F / GLTF snow globe as Birthday intro or identity craft.  
- Further investment in handcrafted miniature 3D scenes as the quality strategy.  
- Milestone plans that assume believable glass refraction + spiral camera as prerequisites for wonder.  
- Fridge-as-identity (keep only if a casual “kitchen memories” aside is desired later).

### What should be pursued next

- **Paper, Light & Night** identity.  
- Top 5 rituals above, starting from existing lantern + seal letter code.  
- Constellation as **SVG draw ritual**, not globe interior.  
- Content packs that author *wishes, lines, photos*, not centrepiece mesh paths.

### Single next implementation task (highest confidence)

**Polish and centre the Lantern Wish ritual as a full Birthday emotional beat** (full-viewport chapter or opening segment): richer anticipation, better handwriting presentation, sound-optional soft whoosh, unmistakable completion — still HTML/CSS, still `LanternField` lineage.

Success criteria: a cold reader feels something before they notice the tech; works in Cursor’s browser with a clean console; no Three.js.

Only after that lands: implement **Single Candle Wish** or strengthen **Wax Seal Letter** with the same grammar.

---

## Lessons Learned (platform)

1. Prefer **emotional DoD** (“ritual completes; message lands”) over **technical DoD** (“WebGL context created”).  
2. Validate in the **same browser the stakeholder uses**.  
3. CSS/SVG ritual > unfinished 3D > no experience.  
4. Catalogue/showcase sites are dangerous taste anchors for intimate apps.  
5. Ambition should live in **writing and timing**, not in renderer choice.

---

## Concept Gallery

The interactive concept gallery was retired with obsolete review screenshots. This document is the retained creative-direction record.

---

## Validation of this review task

- Multidisciplinary critique completed (Creative Director + UX/Motion/Interaction framing; FE confidence baked into scores).  
- ~20 concepts ranked; weak concepts explicitly rejected.  
- Top 5 identity set chosen.  
- 10 rough interactive prototypes shipped as concept art.  
- No Snow Globe expansion; no new Three.js scenes; no runtime redesign.  
- Direction doc is the source of truth for follow-on Birthday work.
