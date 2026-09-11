---
title: Pointer-AR
description: An iOS augmented-reality app that points your phone at the ISS, Hubble, Webb, planets, and the Seven Wonders of the World, wherever on Earth they actually are.
date: 2026-08-20
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/pointer-ar/
coverImage: 2026/08/pointer-ar.png
coverPosition: center 40%
status: In development
githubUrl: https://github.com/jplummer/pointer-ar
ogImage: /assets/images/og/sides.png
---
![A virtual arrow, overlaid on real life, pointing at a thing](/assets/images/2026/08/pointer-ar.png)

Pointer-AR uses your phone's camera, compass, and location to show you exactly where to look for the ISS, Hubble, the James Webb Space Telescope, the planets, and the Seven Wonders of the World. It's funny to be reminded that most terrestrial landmarks are down from where you are and that Mecca is in an unexpected direction.

It's also the software proof of concept for a larger project: a stationary robotic pointer that tracks the ISS continuously, no phone required. Parts for the first prototype are on order. If that works out, it may become a kit – bill of materials, printable parts, and assembly instructions – for anyone who wants to build their own.

Pointer-AR is not yet on the App Store. I'll update this page when it is.

<h2 id="privacy-and-terms">Privacy and terms</h2>

Pointer-AR uses your camera and location on-device to figure out where to point the augmented-reality overlay. Neither is sent anywhere. It doesn't send telemetry today, and the first shipping version probably won't either. A later version will talk to a paired physical robot over Bluetooth or Wi-Fi – a direct connection between your phone and your own hardware, not a connection to me or anyone else. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time, though I'll try to give notice. Source is on GitHub under the [PolyForm Noncommercial License 1.0.0](https://github.com/jplummer/pointer-ar/blob/main/LICENSE) – see the repository for current terms. If this ships through the Apple App Store, the compiled app you download there will also be governed by Apple's standard terms, and shouldn't be redistributed outside Apple's platforms.
