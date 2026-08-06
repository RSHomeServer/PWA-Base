# @platform/export

Browser download helpers shared by platform sites. Pure TypeScript — no React dependency.

## Public import

```typescript
import { downloadText, downloadBlob, downloadCanvasPng } from "@songara/pwa-base/export";
// or workspace: import { … } from "@platform/export";
```

## Usage

```typescript
import { downloadText, downloadBlob, downloadCanvasPng } from "@platform/export";

// Plain text or CSV
downloadText("results.csv", "x,y\n1,2\n", "text/csv;charset=utf-8");

// Arbitrary blob (e.g. generated JSON)
downloadBlob("config.json", new Blob([JSON.stringify(data)], { type: "application/json" }));

// Canvas / WebGL frame capture
const canvas = document.querySelector("canvas");
if (canvas) {
  downloadCanvasPng("visualization.png", canvas);
}
```

Each helper creates a temporary object URL, triggers a programmatic anchor click, and revokes the URL. `downloadCanvasPng` uses the canvas `toBlob` API with MIME type `image/png`.
