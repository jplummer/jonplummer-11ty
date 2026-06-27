---
title: Monotasker iOS app
layout: layouts/portfolio_detail.njk
date: "2025-06-05"
tags: portfolio
coverImage: 2026/06/onboarding.png
description: "My first iOS app crushes the paradox of choice."
ogImage: /assets/images/og/portfolio.png
---
My personal project list had become daunting. 30 active items, all legitimate, none obviously more important than the others. Open the list, feel the weight of it, close it, do something else. The list was accurate and demoralizing.

The fix was simple: show me one thing. Pick it at random. Keep showing it until I decide it's done.

## The app

Monotasker connects to iOS Reminders and shows you a single task, picked at random from the list of your choice. You can complete it or ask for a different one.

That's the entire product.

![One task. That's it.](/assets/images/2026/06/taskFocus.png)

The randomization is deliberate. Looking at the list can trigger avoidance – any of the 30 items would do, but choosing between them is what stalls you. Randomization, and hiding the other tasks, sidesteps the stall.

## The first screen is the real app

Most apps treat onboarding as a lobby. You go through it before you enter the real place – bigger type, illustrations, a progress indicator, a different visual style. Then you arrive, and what you see doesn't quite match what you just read.

Monotasker skips the lobby.

The first screen is the real app. An onboarding card – same gradient, same sticky-note layout, same typography as every task card you'll ever see – explains the concept in one sentence. In the upper-left corner is a completion checkbox.

![Onboarding uses the day-to-day UI, not some lengthy walkthrough.](/assets/images/2026/06/onboarding.png)

The checkbox in the upper-left corner of a task card is the gesture the entire app runs on. The first time you use it, it asks for access to Reminders. Every time after that, it marks a task complete. There's nothing to re-learn, nothing to try to remember for later. Arrival and understanding happen at the same time.

I've written more about this in [Don't show me the lobby](https://jonplummer.com/2026/05/24/dont-show-me-the-lobby/).

## The shuffle mechanic

Not every random task is right for right now. If it's raining and the app gives you "paint the fence," you need a different card.

![A rejected task gets shuffled back into the stack.](/assets/images/2026/06/shuffle.png)

A shuffle icon at the bottom of the card handles this. Tapping it visibly returns the current card to the stack – not discarded, just back in the deck. That distinction matters; the app is giving you a new draw, and the one you passed on isn't lost. The list stays random. You're not building a cherry-picked queue of convenient tasks.

## How it was built

I directed the development using Claude and Cursor rather than writing Swift myself. Working with the iOS Remiders service is tricky for novices like me. The combination of clear design intent and a coding agent doing the implementation made this app possible. Writing a polished iOS app from scratch with an object model I don't understand would have taken months and probably never shipped. With AI handling the Swift, I could stay at the level of product decisions. Importantly, I started from a fairly detailed spect that I had Claude co-write, interviewing me about my intent and concerns and poking holes in my thinking. We built up a fairly detailed behavioral spec before attempting to code anything so the full scope of the project could be understood.

This is the same approach I use when prototyping for professional work: I'm fluent enough in code to specify precisely what I want, steer direction, and catch errors, and it's helpful to have the agent asking me questions as we go. The judgment stays mine. The keystrokes don't have to.

A lot of additional effort went to animation, visual polish, and accessibility. Getting text scaling right, so the layout holds when a user has chosen a large font, took real iteration. Making the app sensible to VoiceOver users required repeated manual testing on a device; there's no substitute for it. Making dark mode distinct from light mode and nice on its own is not just a matter of flipping brightness values. These are some of the details where an app goes from "it's fine" to "this is nice," and they don't surface in a spec. You find them by using the thing.

[Monotasker is available on the App Store](https://apps.apple.com/us/app/monotasker/id6770424713).
