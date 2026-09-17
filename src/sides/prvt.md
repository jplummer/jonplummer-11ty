---
title: prvt
description: A self-hosted, privacy-first URL shortener that makes small QR codes for print and forgets every link once its lifetime expires.
date: 2026-08-18
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/prvt/
coverImage: 2026/08/prvt.png
coverPosition: center 15%
status: Self-hosted
githubUrl: https://github.com/jplummer/prvt
ogImage: /assets/images/og/sides.png
---
![Shorten a URL and make a QR code, with privacy in mind.](/assets/images/2026/08/prvt.png)

prvt turns a long URL into a short one that self-destructs after a time you set, without tracking you or the people who follow the link. Paste a URL, pick a lifetime, and it hands back a short link and a QR code you can download as SVG or PNG – no account, no dashboard, nothing to sign up for.

## Why it forgets

The slug-to-destination mapping lives in [Cloudflare Workers KV](https://developers.cloudflare.com/kv/) with an expiration set at creation time; KV deletes it automatically with no trace left behind. Nothing else gets stored either – not who created a link, not who followed it, not how many times, not a single request header. For an incoming link the Worker reads a slug, looks it up, and redirects; that's the entire job. A separate 90-day "cooling off" record keeps an expired slug from being handed to someone else right away, so a link you bookmarked once won't quietly start pointing somewhere new.

## Why alphanumeric, not just short

Shortened URLs use only capital letters and numerals, which lets the QR code be generated in [alphanumeric mode](https://en.wikipedia.org/wiki/QR_code#Encoding), roughly 40% more efficient than mixed-case text. The printed code comes out smaller (less detailed) and easier to scan and reproduce.

## Why AGPL, not MIT

MIT would let anyone take this, run it as a hosted service, and give their users no way to check what it's actually doing with their links. AGPL requires that the source be published. For a tool that exists as an alternative to commercial shorteners that monetize click data, handing out the code without that obligation would have missed the point.

## Status

This runs on [Cloudflare Workers KV](https://developers.cloudflare.com/kv/), self-hosted rather than run as a shared service – clone the repo, fill in your own KV namespace and secrets, `wrangler deploy`.

<h2 id="privacy-and-terms">Privacy and terms</h2>

prvt is a URL shortener I self-host for my own use, not a public service. It keeps no click tracking, no analytics, and no log of who followed a link; every short link disappears on its own once its set lifetime is up. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time. Source is on GitHub under the [GNU Affero General Public License v3](https://github.com/jplummer/prvt/blob/main/LICENSE) – if you run a modified version as a hosted service, that license requires you to publish your source too. See the repository for current terms.
