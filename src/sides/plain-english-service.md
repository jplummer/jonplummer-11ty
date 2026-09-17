---
title: Plain English service
description: A macOS Service that flags uncommon words in selected text, inspired by Randall Munroe's Thing Explainer and the Up-Goer Five word list.
date: 2026-08-01
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/plain-english-service/
status: Paused
githubUrl: https://github.com/jplummer/plain-english-service
ogImage: /assets/images/og/sides.png
---
Select text anywhere on macOS, run "Find Uncommon Words" from the Services menu, and it checks every word against a combined dictionary of the 10,000 most common English words plus conversational vocabulary from TV and movie scripts. What's left over is the interesting part – jargon, names, technical terms, five-dollar words, anything outside of plain English. Inspired by Randall Munroe's [Thing Explainer](https://xkcd.com/thing-explainer/) and the [Up-Goer Five text editor](https://splasho.com/upgoer5/).

## Why a Service, not an app

A macOS Service runs alongside whatever you're already writing in – Mail, a Google Doc in Safari, a Word file – no separate window, no copy-paste into a checker. Select the text, run the command, see the results. That matters because jargon gets caught where you're actually writing it, not in a tool you have to remember to open later.

## Why word lists, not a readability score

Most plain-language tools score a whole passage – sentence length, syllable count, the [Fog index](https://en.wikipedia.org/wiki/Gunning_fog_index), the [Flesch-Kincaid grade level](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests). That tells you a paragraph is hard to read without telling you what made it hard. Checking word by word against a frequency list does the opposite: it can't judge whether your sentences hang together, but it can point at "utilize" or "leverage" directly and let you reconsider the actual word.

## Status

You can use it today, but only by building and running it from Xcode. I plan to package it as something you can install, then improve how it explains its results – right now it lists the uncommon words next to your text rather than highlighting them. It also doesn't yet say why the word is a problem or suggest a plainer one.

<h2 id="privacy-and-terms">Privacy and terms</h2>

The Plain English service runs entirely on your own machine. Selected text is checked against a local word list and never leaves your device – there's no network connection of any kind, no ads, no data collection, and no sharing with third parties. It isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time. Source is on GitHub under the [MIT License](https://github.com/jplummer/plain-english-service/blob/main/LICENSE) – see the repository for current terms.
