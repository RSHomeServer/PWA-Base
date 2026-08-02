# Scene assets

## Placement

All props are placed via **Placement Surfaces + occupied cells**.
There are no authored world coordinates on props.

See `packages/site-birthday/src/scene/placement.ts` — single source of truth.

## Visual language

The Bedroom uses one **procedural isometric** language (`PropIllustration`).
No imported Kenney or placeholder rasters — catalog `image` fields are `null`.

## Active assets

All active assets live in `packages/site-birthday/src/scene/assets/catalog.ts`
(structure + furniture + decoration + keepsakes). Library thumbnails are
generated via `assetThumbnail()` when no raster exists.

Room proportions: `BEDROOM_ROOM.roomLength` in
`packages/site-birthday/src/scene/bedroom/bedroomScene.ts`.
Visible structure: floor + left wall + back wall (dollhouse cutaway).
