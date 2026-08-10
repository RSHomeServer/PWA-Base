# `@platform/preview-react-webcam`

**Preview** thin integration around [react-webcam](https://github.com/mozmorris/react-webcam).

> **Unstable.** Prefer `@songara/pwa-base/preview/react-webcam` from sibling apps.

```bash
pnpm add react-webcam
```

Permission prompts and stream teardown stay app-owned. Compose with
`@songara/pwa-base/browser` probes where useful.

## Intended Stable home

`@songara/pwa-base/browser` camera helpers, then deprecate `/preview/react-webcam`.

## Licence note

react-webcam is MIT. Consumers install the peer themselves.
