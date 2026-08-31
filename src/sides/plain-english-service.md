---
title: Plain English service
description: A macOS Service that flags uncommon words in selected text, inspired by Randall Munroe's Thing Explainer and the Up-Goer Five word list.
date: 2026-08-01
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/plain-english-service/
status: In development
githubUrl: https://github.com/jplummer/plain-english-service
ogImage: /assets/images/og/sides.png
---
Select text anywhere on macOS, run "Find Uncommon Words" from the Services menu, and it checks every word against a combined dictionary of the 10,000 most common English words plus conversational vocabulary from TV and movie scripts. What's left is the uncommon stuff – jargon, names, anything outside plain English.

It works today, but only by building and running it from Xcode. Packaging it as something you can just install is still ahead.

<h2 id="privacy-and-terms">Privacy and terms</h2>

The Plain English service runs entirely on your own machine. Selected text is checked against a local word list and never leaves your device – there's no network connection of any kind, no ads, no data collection, and no sharing with third parties. It isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time. Source is on GitHub under the [MIT License](https://github.com/jplummer/plain-english-service/blob/main/LICENSE) – see the repository for current terms.
