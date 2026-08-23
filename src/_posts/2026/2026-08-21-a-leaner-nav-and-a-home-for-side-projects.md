---
title: "New on the blog: a leaner top nav, and a home for side projects"
layout: layouts/single_post.njk
date: "2026-08-21"
tags: post
description: The header nav is down to four destinations, the footer is now a full site map, and side projects like Monotasker and Pointer-AR have a home at /sides.
ogImage: /assets/images/og/2026-08-21-a-leaner-nav-and-a-home-for-side-projects.png
---
Two changes to the site today: the nav split into a leaner header and a full footer map, and side projects got a home of their own.

## A leaner header, a fuller footer

The header nav had grown into a flat list of everything. I trimmed it to the four destinations I actually want someone to find first: `/home`, `/about`, `/now`, `/portfolio`. The `/home` link is conditional – if you are at home I don't show it. The links there also remind you how to access those pages directly.

Everything else moved to the footer, which used to be one line – copyright and a link to `/colophon`. It's now a real site map, grouped into four sections: **Start here** repeats the header, **Also read** covers `/wisdom` and the new `/sides` below, **How this site works** has `/colophon`, `/changelog`, and `/technologies`, and **Labs** has `/color` and `/type`. Nothing got deleted – `/wisdom` just moved from the header to the footer, since it's not something I expect people to check from every page the way they might `/about` or `/now`.

## /sides – a home for side projects

I've been building small apps and hardware on my own time – [Monotasker](https://apps.apple.com/us/app/monotasker/id6770424713) and [prvt](https://prvt.pw) are the ones that have actually shipped; a few more are in progress. Each of those needs somewhere to store a privacy policy, relvant links, a place for someone to leave a bug report. None of that belongs in my [portfolio](/portfolio/), which is there to make the case for me, not for the projects themselves.

So they get their own section: [/sides](/sides/). Right now that's [Monotasker](/sides/monotasker/) (shipped), [Pointer-AR](/sides/pointer-ar/) (an AR app pointing at the ISS and a few other things that are usually below the horizon), a menu bar death clock (paused, name still TBD), Parker (a garage parking sensor with no app at all), and three older tools I'd never gotten around to writing up: [Lister](/sides/lister-php/), the [Plain English service](/sides/plain-english-service/), and [prvt](/sides/prvt/). Each page carries its own privacy and terms section, specific to what that project actually does, instead of pointing at one shared policy for everything.

Watch this space – real screenshots and icons are still missing from most of these, and there's more in progress than what's listed. It's a start.
