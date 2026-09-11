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
![A couple small circuit boards taped to the garage shelving.](/assets/images/2026/08/parker-prototype.jpg)
*A couple boards taped to the garage shelving. It works!*

An infrared Time-of-Flight sensor, an indicator light, and a button tell you when your car is in the right spot in the garage. No more tennis ball on a string.

I'm thinking this might eventually be a MakerWorld crowdsource project, and one markedly simpler than the [ISS pointer bot](/sides/pointer-ar/) idea.

## How it works

Hold the button while the car is parked exactly where you want it, and it calibrates to that distance. After that, it stays low-power while the bay is empty or the car's correctly parked, wakes up as a car approaches, and gives feedback for three situations: approaching, correctly parked, and parked too far in.

A future version may replace the single status LED with a row of LEDs that converge as the car gets closer, going solid green once it's in the right spot.

## Status

I've confirmed every state and edge in the state machine, on real hardware, through desk testing and by taping the boards up in the garage. And my real-garage testing is helped now by logging – `code.py` writes distance measurements and states to an on-board file for later analysis.

See [garage-parking-indicator-design.md](https://github.com/jplummer/parker/blob/main/garage-parking-indicator-design.md) for the full design doc: state machine, distance parameters, power strategy trade-offs, and a running bring-up/troubleshooting log. That explains how and why this thing works the way it does.

## What's on the wall – hardware phase 1

* [Adafruit QT Py S3](https://learn.adafruit.com/adafruit-qt-py-esp32-s3/overview), 2MB PSRAM, STEMMA QT (product 5700)
* [Adafruit VL53L1X](https://learn.adafruit.com/adafruit-vl53l1x/overview) Time of Flight sensor, STEMMA QT breakout (product 3967)
* STEMMA QT / Qwiic cable
* USB-C cable

Everything in phase 1 runs off what's already on the dev board and can be assembled without soldering. That's ideal for a project like this that I hope others will be able to source and assemble easily.

## What's next

* Explore alternate Time-of-Flight and/or ultrasonic sensors so the device can see the garage door open and the car coming from farther away
* Explore alternate display options
* Refine parking and leaving behaviors
* Design enclosure options, including one with a battery
* Refine behavior further to handle a battery-dependent power budget
* Write up a BOM and instructions
* Publish

## License

Licensed under PolyForm Noncommercial 1.0.0.

<h2 id="privacy-and-terms">Privacy and terms</h2>

Parker doesn't have an app. It's a garage sensor with its own onboard software, updated over the air. It isn't planned to send telemetry, though a future version might send anonymous usage counts if that turns out to be useful for reliability. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time, though I'll try to give notice. Source is on [GitHub](https://github.com/jplummer/parker); license terms will be added there as the project matures.
