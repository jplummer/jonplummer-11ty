---
title: "New on the blog: the 404 page guesses what you meant"
layout: layouts/single_post.njk
date: "2026-09-09"
tags: post
draft: true
description: The 404 page now reads the address that failed, compares it against every real page on the site, and offers the closest few – or says plainly that nothing is close.
ogImage: /assets/images/og/2026-09-09-the-404-page-guesses-now.png
---
Almost every 404 here is a near miss. Someone pastes a URL out of a chat client and it arrives truncated, or types a page name from memory and transposes two letters. The address is wrong, but not very wrong – can we figure out what they wanted?

My old 404 page ignored user input. It apologized, listed some recent posts, and asked you to report the broken link. That's pretty common, but not very helpful. Apache serves an error page at whatever URL failed, so the browser knows exactly which address missed.

Now the page tries to make sense of what was entered. A small script compares the failed path against a generated index of every real destination on the site – 257 of them as of today, with titles – and offers the closest few. Different amounts of confidence deserve different copy:

- When one candidate is clearly ahead, the page states it: "You probably want *About*."
- When several are plausible, it asks – "Did you mean one of these?" – above a list of linked titles.
- When nothing is close, it says so: "Nothing here looks close to that address."

That third one is important: sometimes the system isn't confident and shouldn't pretend to be. A page that always produces a guess teaches you to distrust the guesses.

Matching uses two similarity measures. Character trigrams distinguish long post slugs beautifully. Edit distance helps with short page names. `abuot` and `about` share almost no trigrams, but their edit distance is strong Taking the better of the two, plus a rule that treats a truncated path as a prefix, gives us a nice wide scale of match coefficients. The best false match I tested scored 0.417, so I don't call us confident until 0.55. Raise that threshold and good matches drop out, lower it and `/wp-admin/` starts getting suggestions.

I considered redirecting automatically when the match is especially good, but decided against it. Unannounced navigation is the sort of thing [WCAG 3.2.5](https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html) is about, and a wrong guess would take you somewhere unintended with no explanation.

With JavaScript off, the page is exactly what it was before, an apology and a list of recent posts. And the offer to tell me about a broken link stays at the foot of every version – if a bad link sent you here, you're still the only one who knows what you clicked.
