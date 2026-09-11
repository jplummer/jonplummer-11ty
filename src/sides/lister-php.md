---
title: Lister
description: A self-hosted PHP directory listing app, no database or CMS required, that I run at misc.jonplummer.com.
date: 2026-08-03
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/lister-php/
coverImage: 2026/08/lister.png
status: Self-hosted
githubUrl: https://github.com/jplummer/lister-php
ogImage: /assets/images/og/sides.png
---
![Drop this into a folder of files on your web server to provide easy access to them.](/assets/images/2026/08/lister.png)

Lister renders a clean directory listing for a folder of files – no database or CMS. It exists because I wanted somewhere to drop a file and share a link without standing up anything heavier.

It's built for low-traffic, personal file sharing. You can set a flag to log IP addresses to block bots from hammering on the site, but that's light protection rather than hosting-grade rate limiting.

<h2 id="privacy-and-terms">Privacy and terms</h2>

Lister is a script I run myself at [misc.jonplummer.com](https://misc.jonplummer.com/); if you want to use it you don't have to do anything fancy, just drag it into a folder on a PHP-enabled web host. It doesn't use cookies or track visitors. An optional guardrail logs request counts by IP address to slow down abusive traffic – that's the only thing it retains, and only for as long as the log needs it. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time. Source is on [GitHub](https://github.com/jplummer/lister-php), MIT licensed as noted in the repository's README – see there for current terms.
