---
name: Native tabs on web
description: Cross-platform Expo tab layout behavior for the STUDYNUT preview
---

The liquid-glass NativeTabs implementation must only be selected on iOS. The web preview should use the classic tab layout even when the glass capability check reports true outside iOS.

**Why:** The mobile web preview rendered a blank page when the NativeTabs branch was allowed to run on web, while Metro and the bundle remained healthy.

**How to apply:** Keep the platform guard around the NativeTabs capability check when changing the tab layout or upgrading Expo.