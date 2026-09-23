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
![Stack-Chan, you've changed!](/assets/images/2026/09/usage-chan-desk.jpg)
*94% left, and OpenUsage on my Mac agrees.*

I have a [Stack-Chan](https://github.com/meganetaaan/stack-chan) sitting on my desk. It's a small robot body built around an [M5Stack CoreS3](https://docs.m5stack.com/en/core/CoreS3) board, and I haven't used it for a darn thing. Most of the open-source builds for it are voice assistants running on OpenAI or Gemini, wake word, "expressive" face, cutesy voice, and all. I haven't decided if I want to speak to an LLM, but if I do, I'll just talk to the computer and whatever model is my favorite; Stack-Chan's bundled model options (Qwen and DeepSeek) were never the draw. Either way, I do want to know how close I am to Claude's usage limits before I hit them mid-task, and Stack-Chan's display might be perfect for that.

So I call it Usage-Chan. A Stack-Chan repurposed, showing five-hour and seven-day usage against my Claude quota. It agrees with [OpenUsage](https://github.com/robinebers/openusage) on my Mac so well that I've stopped running OpenUsage. (It's nice, though – you should try it.)

The data turned out to be more interesting than the hardware. There's no way to poll a Claude Pro or Max plan's remaining messages; that number isn't published anywhere, mainly because it isn't how Anthropic thinks about usage or billing. The Console's usage API exists, but it wants an org-level admin key, which is the wrong kind of credential to put on a WiFi-connected microcontroller sitting on a desk. Instead, a single, nearly free API call returns your live rate-limit state in its response headers – `anthropic-ratelimit-unified-5h-utilization`, `-7d-utilization`, and their reset times. [Claude Code](https://code.claude.com/docs) reads these on every request internally but doesn't show them to you unless you ask.

I'm not blazing a new trail here: [Clawdmeter](https://github.com/HermannBjorgvin/Clawdmeter), [claude-usage-stick](https://github.com/oauramos/claude-usage-stick), and [ClaudeGauge](https://github.com/dorofino/ClaudeGauge) each solve similar problems in different ways. Clawdmeter relays data over Bluetooth from a Mac daemon, and has a fun idea inside of it – track the rate of change of usage over a five-minute window, convert that into a mood, and show the mood with animation. ClaudeGauge goes after dollar spend and Claude Code's git activity, which means routing around a Cloudflare fingerprint problem on claude.ai's web app. claude-usage-stick hits api.anthropic.com directly, with no such trouble, and it's the most similar to my hardware and need: no host computer, no phone app, just an ESP32 connected to WiFi using a Claude Code OAuth token encrypted via a PIN.

So, Usage-Chan cribs heavily from claude-usage-stick. I'm borrowing its networking and security code – the API call, the header parsing, the encrypted token storage, the WiFi setup – and writing a new display layer for Stack-Chan's screen instead. Bars and numbers have to work well before anything less essential happens – that, and the setup process, which is a moment of truth for any product.

## Hardware

An M5Stack CoreS3 – ESP32-S3, 16MB flash, 8MB PSRAM, 320×240 IPS touchscreen – is the front face of Stack-Chan. A bare CoreS3 would be perfect for this; Stack-Chan is that plus a two-servo neck, mic, speaker, camera, and touch pads, all unused *so far*.

## What's on screen

![Two screens side by side. On the left the old horizontal layout, with the big percentage and smaller captions crowding around the bar they belong to. On the right the vertical layout with plenty of room for the same labels.](/assets/images/2026/09/usage-chan-horizontal-vs-vertical.png)
*Left, horizontal bars cause captions to compete for width. Right, vertical bars mean vertically short captions can divide up the available height more easily.*

Two bars on a landscape screen ordinarily want to lie down, and usually the shape of the data is a good guide to layout. Here that instinct got in the way of explaining what's on the bars. The bar carries the most important signal, but around it sit the title, the reset time that marks its endpoint, and how much budget is left.

Captions are short lines of text: wide, and hardly tall at all. Packing them around a horizontal bar is a puzzle because each caption takes up most of one side of the bar. Stand the bar up and the captions stop fighting. Since each is a dozen pixels tall, a 240-pixel-high column holds several with room left over. It also gives the captions room to change length – `3:40pm` isn't the same width as `in 2d 14h` – and even move along the bar if needed.

So, there are two bottom-anchored columns now – a thin one for the seven-day window, a wide one for the five-hour, and we can shift emphasis according to which limit is going to stop you. The height of the bar is what's left. The bottom edge is where you hit your quota. I give up a little precision – a bar 320 pixels wide reads more finely than one 240 pixels tall – but I just need a sense of where I am against where I ought to be.

A diamond marks where an even, steady burn would put you right now, and a word beside it says how far off you are – `well ahead` through `well behind`. You can tell if your burn rate is faster than your quota would allow (you're ahead), or if you can act a little more freely (you're behind).

## Extra usage

![Two screens. On the left a blue vessel with a dollar sign straddling the bar's end edge; on the right an empty vessel with a red X on the same edge.](/assets/images/2026/09/usage-chan-overage.png)
*Paying for extra usage, or blocked due to hitting the cap. The mark sits on the edge when your quota is exhausted.*

I especially wanted to know when I had run off the end and started consuming real dollars. When billing starts because you're past your quota, the bar becomes a vessel: an inner stroke around the track, a fill for whatever the extra allowance has left, and a `$` straddling the bar's end edge. Or a red X if you have hit the quota and don't have money to spend on more usage.

The blocked case works today. The paying case might not, because I haven't caused an overage to verify it. I don't fully understand the overage numbers yet, either. `overage-reset` reads 2026-10-01 00:00 UTC, so the allowance resets on the first of the month, which is not a visible place on either of the bars; the pace diamond on any bar might sit in the wrong place. I added logging to Usage-Chan and, paradoxically, hope to hit the limit someday!

## A simulator that is the spec

[`docs/sim/`](https://github.com/jplummer/usage-chan/tree/main/docs/sim) is the device's screen in a browser. It carries the device's own text bitmaps and a transcription of [LovyanGFX](https://github.com/lovyan03/LovyanGFX)'s shape routines, so `screens.js` is a line-for-line port of `ui.cpp`. This means I can simulate the device fairly faithfully without going through a flash/reboot/re-login cycle. That's worth about 30 seconds each iteration, gives me pictures to chew on, and lets me play with sliders and whatnot to simulate different conditions. `explore.html` keeps the iterations and their reasoning – seven sections of it now, which is the closest thing this project has to a design history.

## Making Figma match the device

The device's fonts aren't system fonts; they're [Adafruit GFX](https://learn.adafruit.com/adafruit-gfx-graphics-library) bitmap fonts compiled into the firmware, and I didn't have a way to actually use those in Figma. Simulating them with Inter wasn't exact enough. I drew a headline that fit nicely in Figma but on the device it was 14 pixels wider, which on a 320×240 screen is a big difference. Iterating on this detail was painful.

When I raised that with Claude, it suggested generating TTFs of the device's own fonts. [`tools/fonts2ttf.py`](https://github.com/jplummer/usage-chan/blob/main/tools/fonts2ttf.py) reads the glyph bitmaps straight out of the simulator's font data and builds 12 real TTFs with [fontTools](https://fonttools.readthedocs.io/), named to match what the device code uses. Install them and a text box matches what the panel will actually draw. (Three discrepancies survive between LovyanGFX's rasterizer and the TTF, all two pixels or less, close enough for a jazz band.)

I also stopped working in Figma's default 2x layout and moved to 1x. Pixel art at this size is easy enough by hand, and working at 1x makes it much easier to stay on-grid. Double-resolution assets aren't any use on a device this low-tech.

## Icons stopped being translated and started being exported

The first icons were rebuilt by Claude from my vectors in Figma: read a curve's radius, guess where the lines go, render it, diff it against the real thing, adjust, repeat. The WiFi glyph took four rounds of numerical fitting and still landed two percent off. This wasn't smart or efficient; these are pictures, and a picture's natural form on a device like this is a bitmap. So it falls to me to design the things and have Claude export and use them directly.

The new workflow is that [`tools/icons2c.py`](https://github.com/jplummer/usage-chan/blob/main/tools/icons2c.py) asks for PNGs from Figma and writes the C header and the simulator's data from one set of bits. [`tools/verify-icons.js`](https://github.com/jplummer/usage-chan/blob/main/tools/verify-icons.js) renders a real dashboard, lifts each icon off of the layout, and compares it against its PNG – checking that there are zero differing pixels, across every icon, so the simulator (and thus the device) reproduces the layout faithfully: the right icon for each state, in the right place. These run when [`tools/fetch-icons.sh`](https://github.com/jplummer/usage-chan/blob/main/tools/fetch-icons.sh) pulls the frames over Figma's REST API. I edit the frame, run the command, and build. This *is* efficient.

Three things I learned from this:

The computer and the device use different display technologies, so previewing visuals on-device is critical. Define colors, review on device, then trust that using those colors in Figma will work.

More technically, if a script compares icons or screens, be careful with how you count pixels. Switching from Figma's plugin export to its REST API quietly caused half of the icon set to be redrawn – same frames, same code, but one glyph came back with 44% more pixels lit up. In sRGB the two export paths disagreed by up to 36 pixels out of 1024. In linear light they agree exactly.

Don't move bytes through a text channel. Base64 arrived corrupt twice – right length, but one byte wrong. A zlib checksum caught it; the length check I'd picked never could have. `curl` straight to disk, and there's nothing to verify.

## The control column

![Eight WiFi glyphs in two rows of four. The top row keeps the full shape at every strength, outlining the arcs the signal doesn't reach. The bottom row draws only the arcs it has, down to a single dot.](/assets/images/2026/09/usage-chan-signal-levels.png)
*The same four signal levels, drawn two ways. I'm still deciding where this should appear and how it should behave.*

Three circles down the right-hand side: menu, signal, refresh. They started as solid discs standing in for icons, and they read as three lamps on a screen whose main job is a number and a bar. Drawing the real glyphs took most of that brightness away by itself. But I'm undecided whether or not I want them here, and they are more distracting than I expected. Expect changes!

The refresh one is the one I keep looking at. It's a ring that closes clockwise as the poll interval runs down – empty means a fetch just happened, full means one is about to. While the request is in flight it becomes a spinner. After a failed attempt it goes solid with an X cut out of it for five seconds, and then the countdown comes back in the warning color and stays there until something succeeds. The five seconds announce the event; the color is what's still true afterward.

![Five circles at six times size: an empty ring, a half-filled one, a ring of eight dots with one missing, a solid circle with an X cut out of it, and a half-filled ring in yellow.](/assets/images/2026/09/usage-chan-refresh-states.png)
*Counting down, counting down, fetching, failed, and still failing.*

It replaced an `updated 47s ago` line that wrapped awkwardly and talked about what happened in the past rather than what will happen in the future; what you want to know is when the next reading is coming. This indicator is important but I don't like it – it's too big and bright for the tertiary job it is doing. Expect changes!

Building an indicator turns out to be a good way to find out the math is wrong! The refresh ring needed to know when the next attempt was due, but retries were scheduled off the last *successful* fetch – a value that only resets when a fetch works – so a failing device asked again on every pass of the main loop, hammering an API endpoint that's protected by rate limits. You get nothing! It's fixed now.

## Smoke

![Two dimmed screens, each with a rounded panel in the middle. One reads "no network", the other "API not answering", and both give the age of what's behind them.](/assets/images/2026/09/usage-chan-smoke.png)
*The numbers are still there, just not current.*

Two conditions can't get better on their own: we lost WiFi, so the next fetch can't possibly succeed, or three API calls in a row have failed with the radio up, so we don't know when we'll get data next. We throw a scrim over the screen and put a lozenge on it with an icon, a caption, and the age of what's underneath. (I'm not sure this is the right approach – the data might still be useful. Should I be covering it up?)

One failed fetch is barely an event. The numbers are exactly as true as they were a second before, and a two-and-a-half-minute-old reading is what (on average) this screen shows anyhow. So a single failure gets only the refresh ring's X, and the numbers stay in plain view.

## Four taps instead of 40

The PIN entry screen I borrowed from claude-usage-stick dialed each digit with two touch zones – up to nine taps for a digit, plus a confirmatory tap, so you could have to tap up to 40 times to enter your PIN. This is awkward but survivable when the device boots once, a bit of friction no one will like. When I'm working on the screen and previewing on-device I'm rebooting every few minutes, so implementing this improvement now is a convenience for me as much as anyone.

![A ten-key pad filling the screen, with four dots along the top and two of them filled.](/assets/images/2026/09/usage-chan-keypad.png)

So I pulled the fix forward from a later polish phase. It's a keypad: four taps, and the fourth digit submits the PIN, so there's no confirmation tap.

## Working this out with Claude

I built all of this pairing with [Claude Code](https://code.claude.com/docs), and learned to have Claude help me diagnose workflow problems as we went. None of the tools mentioned above were planned; each came out of talking about how the work was going while we talked about what to build. The move was thinking and talking about my thinking, noticing the third time I'd done something by hand and asking how we might be more efficient or make things easier.

It isn't a frictionless process. Claude told me `fontTools` was installed when it had checked the wrong place. It told me to read a serial log that we hadn't built yet. It made two arguments for leaving a design alone that served Claude's convenience, not the user's.

I'm in charge of what the screen is for, what the bar means, which of two treatments to keep. Building an apparatus for trying the options and simulating the conditions the UI has to handle costs little now, which makes iterating faster and makes me more confident in my choices. I'd never have hand-written as detailed a simulator, certainly would not have thought to generate the fonts, and an icon verifier would have felt like overkill on a project this size.

## Status

Phase one is done – numbers make it to the screen – and has been running live since early September. The repo is public, MIT, warts and all.

What's still open is written down in [`plan.md`](https://github.com/jplummer/usage-chan/blob/main/plan.md). Which spinner? What does a more sedate refresh timer look like? Where does the pace diamond belong once the overage bar is figured out? And, of course, meaningful improvements to the setup process: on-screen instructions, an on-screen menu, a web-based settings panel, etc. Watch this space.

## Getting started

Get a token on your own machine – it's good for a year:

```bash
claude setup-token
```

Save it someplace secure. I put mine in my password keeper.

Build and flash following [`docs/flashing.md`](https://github.com/jplummer/usage-chan/blob/main/docs/flashing.md), which covers what actually gets written to the device and what it overwrites. First boot has no configuration data, so the device opens its own WiFi network – `UsageChan-XXXX`, password on screen – and a captive portal at http://192.168.4.1 once you join it.

Copy the token to your clipboard before joining that network. The device's own WiFi takes over your connection, so anything you still need to look up is out of reach until setup finishes – the one awkward moment in the whole flow. (I plan to fix that.) Fill in your home WiFi, paste the token, and pick a four-digit PIN. The device encrypts the token with that PIN and writes it to flash; the PIN itself is never stored anywhere, and it's asked for again at every boot.

Full detail, including what to do when something goes sideways, is in [`docs/setup.md`](https://github.com/jplummer/usage-chan/blob/main/docs/setup.md).

<h2 id="privacy-and-terms">Privacy and terms</h2>

Usage-Chan doesn't have an app or a server of its own. It holds a Claude Code OAuth token, AES-256-GCM encrypted at rest with a key derived from a PIN you set on the device, and uses it to make direct calls to api.anthropic.com. There's no over-the-air update path and nothing phones home – the only network traffic is that direct call, on a schedule you set. Nothing about the token or your usage data passes through a third party or gets logged anywhere else. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time, though I'll try to give notice. Source is on GitHub under the [MIT License](https://github.com/jplummer/usage-chan/blob/main/LICENSE) – both my own copyright and claude-usage-stick's, since this builds directly on it. `docs/attribution.md` maps which file came from where.
