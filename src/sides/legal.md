---
title: Privacy and terms
description: Privacy policy and terms of use covering the apps and hardware projects listed at jonplummer.com/sides.
date: 2026-08-21T00:00:00.000Z
layout: base.njk
tags: page
permalink: /sides/legal/
ogImage: /assets/images/og/sides-legal.png
---
This page covers every project listed at [/sides](/sides/): Monotasker, Pointer-AR, the menu bar death clock, and Parker. It's one policy for all of them because none of them do much, and what little they do is described below, project by project.

## Privacy

None of these projects run ads, sell data, share data with third parties, or ask you to create an account. Where a project mentions "anonymous telemetry," that means aggregate counts only – how often a feature gets used, not who used it. There's no device identifier attached, no IP address retained, and no way to trace an event back to a person.

**Monotasker** reads and edits your Reminders through Apple's on-device Reminders API. That data never leaves your device except through Apple's own iCloud sync, which you control. Monotasker sends anonymous telemetry as described above and nothing else.

**Pointer-AR** uses your camera and location on-device, to figure out where to point the augmented-reality overlay. Neither is sent anywhere. It sends anonymous telemetry as described above. A later version will talk to a paired physical robot over Bluetooth or Wi-Fi – that's a direct connection between your phone and your own hardware, not a connection to me or anyone else.

**The menu bar death clock** makes no network connections at all today. A later version may download public actuarial tables to improve its life-expectancy estimate; that's a one-way download of public data, not a transmission of anything about you.

**Parker** doesn't have an app. It's a garage sensor with its own onboard software, updated over the air. It isn't planned to send telemetry, though a future version might send anonymous usage counts if that turns out to be useful for reliability.

If any of that changes for a given project – new data collection, a new third party, anything – this page gets updated and the date at the top moves.

## Terms of use

These are personal, mostly-solo projects, offered as-is, without warranty of any kind. I built them to solve my own problems and I maintain them when I have time to.

Each project is released under its own license, which may not be the same from one project to the next. Check the `LICENSE` file in the project's GitHub repository for current terms – that's the source of truth, not this page.

## Questions or feedback

Each project page links to its GitHub issues, which is the best way to report a bug or ask a question. If a project doesn't have a public repository yet, or you'd rather not use GitHub, reach me directly at [jon@jonplummer.com](mailto:jon@jonplummer.com).
