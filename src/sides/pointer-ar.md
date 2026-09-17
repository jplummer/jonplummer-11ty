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

## Different targets mean different math

A landmark on Earth is easy: a fixed latitude and longitude, converted from the globe's [WGS84](https://en.wikipedia.org/wiki/World_Geodetic_System) shape into a compass bearing and elevation angle at your position. That elevation will always be down at least a little bit since the Earth curves away from you in all directions. The Sun, Moon, and planets move relative to your position (and the Earth turns under them), so [JPL's published orbital elements](https://ssd.jpl.nasa.gov/planets/approx_pos.html) are used instead. These are accurate to roughly a degree, probably fine for pointing a phone. One catalog entry is magnetic north itself, computed from NOAA's [2025 World Magnetic Model](https://www.ncei.noaa.gov/products/world-magnetic-model) rather than borrowed straight from the compass chip – the real field direction at your specific location.

Satellites are their own problem. The ISS and Hubble move fast and low, so Pointer-AR pulls current orbital elements from [CelesTrak](https://celestrak.org) and refreshes them every 30 minutes, propagating position with simplified Kepler math instead of the fuller [SGP4](https://en.wikipedia.org/wiki/Simplified_perturbations_models) model professional trackers use. CelesTrak calls this out as "km-class" accuracy, a deliberately looser tolerance than SGP4, and good enough for pointing a phone at something that big. The James Webb Space Telescope doesn't orbit anything nearby – it drifts around a [gravitationally balanced point](https://en.wikipedia.org/wiki/Lagrange_point) a million miles out – so instead of propagating an orbit, the app asks NASA's [JPL Horizons service](https://ssd.jpl.nasa.gov/horizons/) directly where it is from your location, refreshed hourly.

## A robotic sibling?

Pointer-AR is also the software proof-of-concept of a second project: a stationary robot that will point a finger continuously at the ISS, using the same orbital math, with no phone required once it's set up. Parts for the first prototype are sitting on my bench. If that works out, it may become a kit – bill of materials, printable parts, and assembly instructions – for anyone who wants to assemble their own.

## Status

Pointer-AR is not yet on the App Store. I'll update this page when it is.

<h2 id="privacy-and-terms">Privacy and terms</h2>

Pointer-AR uses your camera and location on-device to figure out where to point the augmented-reality overlay. Neither is sent anywhere. It doesn't send telemetry today, and the first shipping version probably won't either. A later version will talk to a paired physical robot over Bluetooth or Wi-Fi – a direct connection between your phone and your own hardware, not a connection to me or anyone else. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time, though I'll try to give notice. Source is on GitHub under the [PolyForm Noncommercial License 1.0.0](https://github.com/jplummer/pointer-ar/blob/main/LICENSE) – see the repository for current terms. If this ships through the Apple App Store, the compiled app you download there will also be governed by Apple's standard terms, and shouldn't be redistributed outside Apple's platforms.
