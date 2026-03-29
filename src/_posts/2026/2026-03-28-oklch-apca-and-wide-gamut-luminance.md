---
title: OKLCH, APCA, and why one luminance number may not be enough
layout: layouts/single_post.njk
date: "2026-03-28T12:00:00-07:00"
tags: post
description: Designing in OKLCH but computing APCA via sRGB gamut maps the color before you measure Y. A practical split is Display P3 for wide-gamut readers and sRGB for everyone else.
ogImage: /assets/images/og/2026-03-28-oklch-apca-and-wide-gamut-luminance.png
---
When you author colors in [`OKLCH`](https://www.w3.org/TR/css-color-4/#specifying-oklch-lch-ok), you are using a space with a [larger gamut](https://www.w3.org/TR/css-color-4/#gamut-mapping) than `sRGB`. [APCA](https://readtech.org/ACCESSIBILITY/APCA/) (the Accessible Perceptual Contrast Algorithm) does not read OKLCH directly; it needs estimated screen luminance (the [APCA-W3 docs](https://apcaw3.myndex.com/docs/APCA-W3_FunctionsOverview.html) often call this `Ys`). The reference path goes from `encoded RGB` to `Ys`, then to `Lc`.

If your toolchain does what mine has been doing, mapping OKLCH into sRGB (for example with gamut reduction in [culori](https://culorijs.org/)) and only then deriving `Ys`, you get a number that is faithful to what the OKLCH color becomes on an sRGB pipeline. That is great for lowest-common-denominator contrast checking, but it is *not* the same as asking what happens for someone whose browser and display actually use a wider working gamut that OKLCH is intended to enable.

It's not exactly a problem to merely check the contrast level between RGB values; you *will* get an accessible contrast level by making sure the RGB values satisfy APCA requirements. But you won't know if you also have an accessible level of contrast in the wider gamut. So you probably need to calculate and evaluate both numbers. The challenges are 1) choosing *which* encoding you treat as the main one before you call the luminance helper, and 2) honest reporting when a token is out of sRGB but still in gamut for a common wide space. My thought is that if you are designing in the wider gamut, that's the first thing to check.

## Two audiences, two honest answers

I think I want two luminance outcomes for the same token pair (text and background), at least while I am exploring themes:

1. **Wide-gamut-mapped** — Map the same OKLCH colors to a wider display-referred gamut, such as [Display P3](https://www.w3.org/TR/css-color-4/#predefined-display-p3), compute `Y` with the matching luminance function, then `Lc`. This answers "if the wider chroma actually reaches the eye on a capable display, what does APCA say the contrast ratio is?"
2. **sRGB-mapped** — After gamut mapping to sRGB, compute `Y` (and then `Lc`) the way the current stack already does. This answers "on a typical sRGB-limited path, are we still okay?"

## Which wide space?

Display P3 is the best default for the “wide” branch for this purpose.

- APCA-W3 documents it. The functions overview describes sRGB and Display P3 paths to `Y` (`sRGBtoY`, `displayP3toY`, and related notes about keeping text and background in the same space). That is a practical alignment between spec, code you can call, and intent.
- It matches real hardware and what authors mean by “wide gamut” in CSS. Apple’s ecosystem and a lot of other current phones and laptops are in this neighborhood; CSS `color(display-p3 r g b)` is a first-class way to express it.
- It is wide enough to matter compared to sRGB, but not as aspirational as treating [full Rec. 2020](https://www.itu.int/rec/R-REC-BT.2020/en) as “what everyone sees.” Very few consumer displays cover Rec. 2020; using it as the only “wide” reference can overstate how exotic the stimulus is. P3 sits in a useful middle: meaningfully wider than sRGB, common on premium devices, and named in the APCA API.

Rec. 2020 (or other spaces) can still be a later or secondary column if I ever want a “theoretical upper bound”; for a "sRGB vs wide" report, P3 plus sRGB is the pair I plan to implement first.
