---
title: Usage-Chan
description: A Stack-Chan desk robot repurposed to show live Claude usage against the five-hour and seven-day rate-limit windows, pulled straight from the API's own response headers.
date: 2026-09-07
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/usage-chan/
status: In development
coverImage: 2026/09/usage-chan-desk.jpg
githubUrl: https://github.com/jplummer/usage-chan
ogImage: /assets/images/og/sides.png
---
![94% left, and OpenUsage on my Mac agrees.](/assets/images/2026/09/usage-chan-desk.jpg)

I have a [Stack-Chan](https://github.com/meganetaaan/stack-chan) sitting on my desk. It's a small robot body built around an [M5Stack CoreS3](https://docs.m5stack.com/en/core/CoreS3) board – a face, a servo neck, a speaker – and I've never used it for anything. Most of the open-source builds for it are voice assistants running on OpenAI or Gemini, wake word included. I haven't decided if I want a robot to talk to, but if I do, it'll run on whatever model I already use for everything else; Stack-Chan's own bundled options were never the draw. Either way, I do want to know how close I am to Claude's usage limit before I hit it mid-task, and Stack-Chan's display might be perfect for that.

So I call it Usage-Chan. A Stack-Chan, repurposed, showing five-hour and seven-day usage against my quota.

The data turned out to be more interesting than the hardware. There's no way to poll a Claude Pro or Max plan's remaining messages. That number isn't published anywhere. The Console's usage API exists, but it wants an org-level admin key, which is the wrong kind of credential to put on a WiFi-connected microcontroller sitting on a desk. What actually works: a single, nearly free API call returns your live rate-limit state in its response headers – `anthropic-ratelimit-unified-5h-utilization`, `-7d-utilization`, and their reset times. Claude Code reads these on every request internally but doesn't show them to you.

I'm not the first to try this. [Clawdmeter](https://github.com/HermannBjorgvin/Clawdmeter), [claude-usage-stick](https://github.com/oauramos/claude-usage-stick), and [ClaudeGauge](https://github.com/dorofino/ClaudeGauge) each solve similar problems in different ways. Clawdmeter relays data over Bluetooth from a Mac daemon, and has a useful idea inside of it – track the rate of change of usage over a five-minute window, convert that into a mood, and show the mood with animation. ClaudeGauge goes after dollar spend and Claude Code's git activity, which meant routing around a Cloudflare fingerprint problem on claude.ai's web app. Claude-usage-stick hits api.anthropic.com directly, with no such trouble. claude-usage-stick is the most similar to my hardware and need: no host computer, no phone app, just an ESP32 connected to WiFi, using a Claude Code OAuth token encrypted via a PIN.

Usage-Chan cribs heavily from claude-usage-stick. I'm borrowing (for now) its networking and security code – the API call, the header parsing, the encrypted token storage, the WiFi setup – and writing a new display layer for Stack-Chan's screen instead. No face yet, no servo yet, just bars and numbers working well before anything more interesting happens.

Stats come up live on the screen – five-hour and seven-day utilization, read straight from the same numbers Claude Code uses internally – and agree with [OpenUsage](https://github.com/robinebers/openusage) running on my Mac.

## What's on screen

The bar graph's right edge is both the moment the window resets and the moment your quota runs out – you're heading toward it either way, so the only real question is which one arrives first. A diamond marks where an even, steady pace would put you right now; behind it is calm no matter how little is left, ahead of it is worth noticing.

The seven-day window stays a single quiet line underneath. It moves about 1% per 100 minutes, so a second bar for it would just be furniture – it only grows into one once the server says it's actually the limit that's going to stop you.

## Hardware

An M5Stack CoreS3 – ESP32-S3, 16MB flash, 8MB PSRAM, 320×240 IPS touchscreen – which is the front face of Stack-Chan. It works on a bare CoreS3 too; the servo neck, mic, speaker, and touch pads that make a CoreS3 into a Stack-Chan go unused in phase one.

## Status

Phase one is done. Live five-hour and seven-day bars, reset countdowns, and a visible state for when the numbers can't be trusted rather than a stale guess dressed up as a live one. Numbers cross-checked against OpenUsage running on my Mac – they agree. Published as a public repo, MIT, warts and all.

## Repo content

```text
src/
  main.cpp          boot order, PIN loop, WiFi, poll timer
  hal.cpp/.h        CoreS3 bring-up, touch buttons, battery, brightness
  ui.cpp/.h         every screen, drawn into a PSRAM sprite
  config.h          constants
  api.*, crypto.*, provision.*, settings.*, certs.*, app_state.h
                    vendored from claude-usage-stick, MIT
docs/
  setup.md          first-time setup, start to finish
  using.md          living with it: controls, config, failure states
  design-decisions.md  what this is for, and why it isn't other things
  data-inventory.md what the device can and can't ever know
  display-notes.md  the black screen story in full
  hardware-notes.md buttons, Grove ports, what's actually on the face
  flashing.md       what gets written to the device, and how
  attribution.md    which file came from where
```

`main.cpp`, `hal.cpp`, `ui.cpp`, `config.h`, and the fetch task are new. `api`, `crypto`, `provision`, `settings`, and `certs` are claude-usage-stick's own files, carried over close to unchanged – [`docs/attribution.md`](https://github.com/jplummer/usage-chan/blob/main/docs/attribution.md) maps exactly which.

## Getting started

Get a token on your own machine – it's good for a year:

```bash
claude setup-token
```

Save it someplace secure.

Build and flash following [`docs/flashing.md`](https://github.com/jplummer/usage-chan/blob/main/docs/flashing.md), which covers what actually gets written to the device and what it overwrites. First boot has no configuration data, so the device opens its own WiFi network – `UsageChan-XXXX`, password on screen – and a captive portal at http://192.168.4.1 once you join it.

Copy the token to your clipboard before joining that network. The device's own WiFi takes over your connection, so anything you still need to look up is out of reach until setup finishes – the one awkward moment in the whole flow. Fill in your home WiFi, paste the token, and pick a four-digit PIN. The device encrypts the token with that PIN and writes it to flash; the PIN itself is never stored anywhere, and it's asked for again at every boot.

Full detail, including what to do when something goes sideways, is in [`docs/setup.md`](https://github.com/jplummer/usage-chan/blob/main/docs/setup.md).

<h2 id="privacy-and-terms">Privacy and terms</h2>

Usage-Chan doesn't have an app or a server of its own. It holds a Claude Code OAuth token, AES-256-GCM encrypted at rest with a key derived from a PIN you set on the device, and uses it to make direct calls to api.anthropic.com. There's no over-the-air update path and nothing phones home – the only network traffic is that direct call, on a schedule you set. Nothing about the token or your usage data passes through a third party or gets logged anywhere else. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time, though I'll try to give notice. Source is on GitHub under the [MIT License](https://github.com/jplummer/usage-chan/blob/main/LICENSE) – both my own copyright and claude-usage-stick's, since this builds directly on it. `docs/attribution.md` maps which file came from where.
