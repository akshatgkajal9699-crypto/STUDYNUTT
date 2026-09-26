---
name: Expo package maturity
description: Workspace package-firewall behavior affecting Expo SDK dependency selection.
---

For Expo SDK 57 work, select the newest compatible package version that has cleared the workspace release-age policy instead of bypassing the firewall. Some SDK 57 packages may have a newer version published within the blocked window while an earlier patch remains installable.

**Why:** The firewall intentionally rejected newly published SDK 57 patches during this build, while mature patch versions installed successfully and preserved the SDK compatibility range.

**How to apply:** When adding Expo modules, check release dates and use a mature explicit patch version if the latest compatible version is blocked; do not add firewall exclusions just to force installation.