---
title: Don't show me the lobby
layout: layouts/single_post.njk
date: "2026-05-24"
tags:
  - post
description: Why Monotasker skips the lobby and drops you straight into the work.
ogImage: /assets/images/og/2026-05-23-2026-05-24-dont-show-me-the-lobby.png
---
The first thing you do in [Monotasker](https://apps.apple.com/app/monotasker/id6770424713) is tap a checkbox. No tutorial, no tour. And no permissions granted yet. Just the thing you'll tap every time you use the app.

That first tap fires the iOS Reminders permission dialog. Not a blurb with a "Connect my Reminders" button – the completion checkbox. The same gesture the app is built around.

I built Monotasker to solve a specific problem: I have too many side projects, and it's easy to get bogged down in the list. Staring at 30 items can be as bad as having no list at all. The app picks one reminder at random and shows it to you, persistently, until you decide you're done with it or want a new one. That's it.

The more interesting design decision pays off before you ever load your tasks.

## The lobby problem

Most apps treat onboarding as a lobby. You're outside the real place, getting oriented before you go in. The screens have a different visual style: bigger type, illustrations, a progress indicator, two-phase permission requests. Big obvious buttons, not the controls you'll actually use. You tap through explanations of features you haven't used yet. Then you arrive.

The implicit message: "here's what to expect from the app. Remember all of this. Now let's see if you paid attention."

That moment of arrival requires re-learning. You have to reconcile what you were just told with what's actually in front of you. The controls are smaller. The tone is different. The decisions you make matter now.

Nearly every app has a lobby standing between you and what you came for. Or a tour – a list of things that you'll forget before you need them.

## One interface, not two

The onboarding design I made for Monotasker starts with a single principle: get users into the real interface and have them use it, as fast as pleasantly possible. Every onboarding screen uses the app's main visual language – the gradient background, the post-it-style task card, the same typography. No separate marketing UI.

The onboarding screen shows a card that explains the concept in one sentence, with one visible control: a completion checkbox in the upper-left corner of the card. Tapping that checkbox fires the system permission dialog.

Why it works: that card and its checkbox are the centerpiece of the app. Not a metaphor for it, not a stand-in. When you grant permission and land on your first real task, the checkbox appears in the same place, doing the same thing. There's nothing to re-learn. The gesture that gets you using the app is the gesture the app runs on.

## The bigger idea

I've written before about [coordinated experience](https://jonplummer.com/2025/07/27/toward-coordinated-experience/) – the idea that a well-designed system guides users through a task completely, without asking them to do work the system could do for them. Onboarding is the same problem one level up. Most onboarding asks users to remember what the tutorial explained, then go find those things once they arrive.

Putting users inside the interface from the first tap removes that work. The permission dialog isn't something that happens before the app – it's something that happens naturally at the right time. The empty state is the real experience, waiting for input.

Resist the impulse to design a special onboarding mode with its own visual language. Use the real thing. Trust the interface to explain itself.

## A useful test

If your onboarding screens look noticeably different from your app screens, you've probably built a lobby.

The visual break signals a gap between "what we say the app does" and "what the app actually does." Sometimes that gap is unavoidable – a genuinely complex setup may need explicit guidance. But in most cases it means you don't trust the interface to stand on its own.

The first screen is already the app. It might as well look like it.
