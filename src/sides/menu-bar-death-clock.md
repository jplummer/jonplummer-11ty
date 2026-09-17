---
title: Menu bar death clock
description: A macOS menu bar app that counts down to your statistical life expectancy, or up from your date of birth. Name still TBD.
date: 2026-08-02
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/menu-bar-death-clock/
status: Paused
githubUrl: https://github.com/jplummer/death-clock-menu-bar
ogImage: /assets/images/og/sides.png
---
A small macOS menu bar app counts down to your statistical life expectancy ([memento mori](https://en.wikipedia.org/wiki/Memento_mori)) or up from your date of birth ([memento vivere](https://citewise.net/memento-vivere-meaning/)), sitting quietly in the menu bar the whole time.

## Why the menu bar

A death clock needs to be ever-present; the idea only works as ambient information, the way a wall clock works but on a longer time horizon. macOS's menu bar is the closest thing to that: always visible, never in the way, gone the moment you stop looking at it. A widget would work but would get stuck behind things and still need to be checked, even though it would be always-open.

## One number, two readings

Countdown and count-up are the same idea told two ways: one measures what's left, the other what's already spent. I built both because I wasn't sure which framing would actually change how I used a day. So far neither has, but count-up is more comforting and optimistic.

## Status

The current build uses a fixed US life-expectancy estimate based on age and sex. A later version might download [public actuarial tables](https://www.ssa.gov/oact/STATS/table4c6.html) to sharpen that estimate by age, sex, and country.

I started this, then set it aside for other projects. The name is a placeholder – it'll get a better one before it feels shippable.

<h2 id="privacy-and-terms">Privacy and terms</h2>

The menu bar death clock makes no network connections at all today. A later version may download public actuarial tables to improve its life-expectancy estimate – a one-way download of public data, not a transmission of anything about you. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, paused, offered as-is, without warranty of any kind. Source is on GitHub under the [PolyForm Noncommercial License 1.0.0](https://github.com/jplummer/death-clock-menu-bar/blob/main/LICENSE) – see the repository for current terms. I may pick it back up, change it, or leave it as-is indefinitely.
