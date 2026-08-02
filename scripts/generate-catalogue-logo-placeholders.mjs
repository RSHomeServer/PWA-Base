/**
 * Write a simple branded monogram SVG into logos.
 * These are placeholders — replace with official marks under the same filenames.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const dir = join(process.cwd(), "apps/platform/public/logos");
mkdirSync(dir, { recursive: true });

const marks = [
  ["qbt", "QB", "#1E90FF"],
  ["overseerr", "OV", "#5643FA"],
  ["radarr", "RD", "#FFC230"],
  ["sonarr", "SN", "#3FC9F3"],
  ["lidarr", "LD", "#00CC66"],
  ["prowlarr", "PR", "#E5A00D"],
  ["filebrowser", "FB", "#3B82F6"],
  ["dozzle", "DZ", "#22D3EE"],
  ["portainer", "PT", "#13BEF9"],
  ["kuma", "KM", "#5CDD8B"],
  ["netdata", "ND", "#00AB44"],
  ["chrome", "CH", "#4285F4"],
  ["guacamole", "GQ", "#5B8C5A"],
  ["notes", "NT", "#111827"],
];

for (const [id, letters, color] of marks) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${id}">
  <rect width="64" height="64" rx="14" fill="${color}"/>
  <text x="32" y="38" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="20" font-weight="700" fill="#fff">${letters}</text>
</svg>
`;
  writeFileSync(join(dir, `${id}.svg`), svg);
  console.log("wrote", id);
}
