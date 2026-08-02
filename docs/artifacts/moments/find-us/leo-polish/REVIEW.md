# Leo polish — review notes

Live: https://memories.songara.uk/moment  
Artifacts: this folder

## Iterations

1. Locked Leo frame (artwork aspect = PNG 608∶504), `preserveAspectRatio="none"` on overlay, Euler `sketchPath`, cursor:default, clean lion extract.
2. Inpainted star punch-outs; brighter amber strokes; expanded frame.
3. Fixed dash rendering (`pathLength={1}`); light blur on lion; desktop/wide/mobile captures.

## Screenshot review

| Shot | Notes |
| --- | --- |
| iter1-02 mid-sketch | Consecutive sickle path; warm amber; no lion yet (expected) |
| iter1-03 complete | Lion behind stars; sickle in mane; hind triangle toward tail |
| iter1-04 hover | Completed stars remain hoverable |
| iter2 wide | Same relative lock as desktop |
| iter3 mobile | Same relative lock in portrait stage |

## Remaining weaknesses

- Anatomical pin of every star to Ref B joints is still approximate (frame fit, not landmark solver).
- Overlay retains some soft internal texture from parchment extraction.
- Sagittarius untouched this pass (by design).
