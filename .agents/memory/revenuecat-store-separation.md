---
name: RevenueCat store separation
description: Keeps STUDYNUT Test Store purchases separate from live App Store and Google Play billing.
---

Use the RevenueCat Test Store key only in development. The connected RevenueCat project currently exposes a Test Store app but no matching production App Store or Play Store apps. Existing production environment values do not match the connected project's setup.

**Why:** Using a Test Store key in a published app would make checkout a simulated test purchase, not a real store transaction. Store-specific products and seven-day trials also need to be configured in the corresponding store.

**How to apply:** Before enabling live purchases, verify the RevenueCat project and app mapping, obtain the app's registered iOS bundle ID and Android package name, create/link the store products, and use the matching production public API keys. Show a free-trial claim only when RevenueCat reports an actual introductory offer.
