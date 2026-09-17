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

## What actually gets uploaded

Just three things: `index.php`, `.htaccess`, and the `lister/` directory. Inside that directory, `api.php` handles expanding a folder without a full page reload, `preview.php` shows a modal preview of a text file or PDF without downloading it, and an optional `admin.php` covers the few security settings discussed below. File-type icons come from Google's Material Symbols, matched to extensions via [dyne/file-extension-list](https://github.com/dyne/file-extension-list) instead of a list I'd have to maintain by hand. (I started with emoji but they were too playful.) Drop a README into your folder and it renders inline below the file listing, via [Parsedown](https://github.com/erusev/parsedown).

## What it won't show you

Lister hides your own dotfiles, OS cruft (`.DS_Store`, `Thumbs.db`), and anything that looks like a secret – `.env`, `private.key`, `id_rsa` and its siblings, `known_hosts`, `*.pem`. If you drop a folder onto a server having forgotten what's in it, this helps keep a stray credentials file from becoming a public listing.

## Why the guardrail, not real rate limiting

It's tricky to do a lot of anti-abuse work with a drag-and-drop installation. Limited throttling is on by default: 30 requests a minute per IP, a five-minute timeout, and a log entry if you go beyond that. It's meant for a quiet personal site and not engineered to survive real abuse – if you expect heavy traffic your host's own controls are the right tool, and the above can be switched off with one config flag. When on, a bare `curl` gets rejected as a bot; testing locally means a real browser or spoofing a User-Agent.

## Status

It's running today at [misc.jonplummer.com](https://misc.jonplummer.com/), needs PHP 8.x and Apache with `mod_php`, and ships with deploy and teardown scripts for anyone comfortable driving them from a terminal – though dragging three files into a folder is the whole install for everyone else.

<h2 id="privacy-and-terms">Privacy and terms</h2>

Lister is a script I run myself at [misc.jonplummer.com](https://misc.jonplummer.com/); if you want to use it you don't have to do anything fancy, just drag it into a folder on a PHP-enabled web host. It doesn't use cookies or track visitors. An optional guardrail logs request counts by IP address to slow down abusive traffic – that's the only thing it retains, and only for as long as the log needs it. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time. Source is on [GitHub](https://github.com/jplummer/lister-php), MIT licensed as noted in the repository's README – see there for current terms.
