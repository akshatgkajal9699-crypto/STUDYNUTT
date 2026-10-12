---
name: Expo static-export assets
description: Metro bundle asset metadata formats and static-export verification
---

Static export asset parsing must accept quoted object keys and whitespace in Metro's serialized asset metadata, then rewrite the same `httpServerLocation` values in the bundle. A successful bundle can still silently omit every static asset if these matchers only support unquoted minifier output.

**Why:** Expo SDK 57's Metro output preserved quoted asset-object keys, so the old regex matched no assets even though both platform bundles succeeded.

**How to apply:** After Metro or Expo SDK changes, verify the export reports a nonzero copied-asset count and that each bundle's asset URLs resolve to files in the static output.
