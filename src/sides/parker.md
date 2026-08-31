---
title: Parker
description: A DIY garage parking sensor built around an infrared time-of-flight sensor, lighting up when the car is pulled in just far enough.
date: 2026-08-19
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/parker/
coverImage: 2026/08/parker-prototype.jpg
coverPosition: 55% 47%
coverZoom: 2
status: In development
githubUrl: https://github.com/jplummer/parker
ogImage: /assets/images/og/sides.png
---
![A couple boards taped to the garage shelving. It works, mostly.](/assets/images/2026/08/parker-prototype.jpg)

An infrared Time-of-Flight sensor, an indicator light, and a button, telling you when your car is in the right spot in the garage — no more tennis ball on a string.

Originally scoped as a possible MakerWorld crowdsource project, and simpler than the ISS pointer bot idea.

## Status

Every state and edge in the state machine has been confirmed on real hardware through desk testing. Real-garage testing against an actual car is the current activity — code.py can now log to an on-board file so it can run untethered, taped to a wall, with nothing plugged in to watch.

See garage-parking-indicator-design.md for the full design doc: state machine, distance parameters, power strategy trade-offs, and a running bring-up/troubleshooting log. That doc is the source of truth for how and why this thing works the way it does — this README is just the front door.

## How it works

The device sits in the garage watching for a car. Hold the button while the car is parked exactly where you want it, and it calibrates to that distance. After that, it stays low-power while the bay is empty or the car's correctly parked, wakes up as a car approaches, and gives feedback for three situations: approaching, correctly parked, and parked too far.

A future version replaces the single status LED with a row of LEDs that converge as the car gets closer, going solid green once it's in the right spot. Not built yet — see the design doc's next-steps section.

## Hardware (phase 1)

* Adafruit QT Py S3, 2MB PSRAM, STEMMA QT (product 5700)
* Adafruit VL53L1X Time of Flight sensor, STEMMA QT breakout (product 3967)
* STEMMA QT / Qwiic cable
* USB-C cable

No breadboard, no soldering, no external LEDs or button yet — everything in phase 1 runs off what's already on the dev board.

## Repo content

`garage-parking-indicator-design.md` — the design doc. State machine, parameters, power strategy, bring-up notes, troubleshooting log.
`code.py` — the state machine, written for CircuitPython. Bench-validated; real-garage testing in progress.
`boot.py` — enables on-board logging to log.txt for runs with no computer attached. See design doc "On-board logging" for how it works and how to get the log back out.
`bench_test.py` — minimal hardware smoke test. Confirms the sensor answers over the STEMMA QT bus and prints distance readings, with no state machine logic. Run this before `code.py` on any new board to isolate hardware problems from logic problems.
`.gitignore` — excludes firmware binaries, compiled libraries, settings.toml, and the usual OS/editor cruft.

## Getting started

* Flash CircuitPython onto the QT Py S3 (see the design doc's bring-up notes — there's a known bootloader/partition gotcha on the 4MB flash variant that looks like a USB problem but isn't).
* `circup install adafruit_vl53l1x neopixel`
* Connect the VL53L1X over STEMMA QT.
* Copy `bench_test.py`'s contents to `code.py` on the CIRCUITPY drive and confirm distance readings over serial.
* Swap in the real `code.py` and start testing against an actual car.

Full detail on each step, plus what to do when something goes wrong, is in the design doc.

## License

Licensed under PolyForm Noncommercial 1.0.0.

<h2 id="privacy-and-terms">Privacy and terms</h2>

Parker doesn't have an app. It's a garage sensor with its own onboard software, updated over the air. It isn't planned to send telemetry, though a future version might send anonymous usage counts if that turns out to be useful for reliability. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time, though I'll try to give notice. Source is on [GitHub](https://github.com/jplummer/parker); license terms will be added there as the project matures.
