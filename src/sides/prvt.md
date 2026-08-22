---
title: prvt
description: A self-hosted, privacy-first URL shortener that makes small QR codes for print and forgets every link once its lifetime expires.
date: 2026-08-21
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/prvt/
status: Self-hosted, in personal use
githubUrl: https://github.com/jplummer/prvt
ogImage: /assets/images/og/sides.png
---
prvt turns a long URL into a short one that self-destructs after a lifetime you set, from a day to four weeks – no click tracking, no analytics, no log of who followed the link. It keeps short URLs in QR alphanumeric mode, which produces the smallest possible printed QR codes.

It runs on Cloudflare Workers and KV, and it's meant to be self-hosted rather than used as a shared public service – see the repo for setup instructions.

<h2 id="privacy-and-terms">Privacy and terms</h2>

prvt is a URL shortener I self-host for my own use, not a public service. It keeps no click tracking, no analytics, and no log of who followed a link; every short link disappears on its own once its set lifetime is up. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time. Source is on GitHub under the [GNU Affero General Public License v3](https://github.com/jplummer/prvt/blob/main/LICENSE) – if you run a modified version as a hosted service, that license requires you to publish your source too. See the repository for current terms.
