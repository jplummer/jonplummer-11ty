---
title: Don't show me the lobby
layout: layouts/single_post.njk
date: "2026-05-24"
tags:
  - post
description: Why Monotasker skips the lobby and drops you straight into the work.
ogImage: /assets/images/og/2026-05-24-dont-show-me-the-lobby.png
---
I built Monotasker to solve a specific problem: I have too many home and side projects, and it's easy to get bogged down in the list. Staring at 30 items can be as bad as having no list at all. The app picks one reminder at random and shows it to me, persistently, until I decide I'm done with it or want a new one. That's it. But the interesting part is what happens before we have tasks loaded in the app.

The first thing you do in [Monotasker](https://apps.apple.com/app/monotasker/id6770424713) is tap a checkbox. There's no tutorial, no tour, and no permissions granted yet; just the thing you'll tap every time you use the app. That first tap fires the iOS Reminders permission dialog, not a blurb with a "Connect my Reminders" button – the completion checkbox takes you right to the permission dialog. Checking that box is the main gesture the app is built around.

## The lobby problem

Most apps treat onboarding as a lobby: you're outside the real place, getting oriented before you go in. The screens often have a different visual style: bigger type, illustrations, a progress indicator, two-phase permission requests, and big obvious buttons unlike the controls you'll actually use. So you don't actually learn how to use the app from the lobby. Instead, you tap through explanations of features you haven't used yet and probably won't remember, then you're dropped off in an unfamiliar app that isn't like what you just saw.

The implicit message: "here's what to expect from the app. Remember all of this. Now let's see if you paid attention." Naturally this creates anxiety in a wide swath of users.

That moment of arrival in the actual app requires re-learning. You have to reconcile what you were just told with what's actually in front of you. The controls are smaller, the tone is different, and the decisions you make matter now. Don't screw it up!

Nearly every app has a lobby standing between you and what you came for. Or a tour – a list of things that you'll forget before you need them.

## One interface, not two

The onboarding design I made for Monotasker starts with a single principle: get users into the real interface and have them use it, as fast as pleasantly possible. The centerpiece of Monotasker is a stack of Post-It-style cards, each one with a single task on it and a checkbox. Every onboarding screen uses that same display, the app's actual interfaces and visual language – the gradient background, the same card, the same typography and controls. There is no separate UI derived from the marketing of the product.

When you open the app for the first time you see a card. Once you check the box, grant permission, and land on your first real task, its checkbox appears in the same place, doing the same thing. There's nothing to re-learn.

## The bigger idea

I've written before about [coordinated experience](/2025/07/27/toward-coordinated-experience/) – the idea that a well-designed system guides users through a task completely, without asking them to do work the system could do for them. Onboarding is the same problem one level up. Putting users inside the interface from the first moment removes that work. The permission dialog isn't something that happens before the app – it's something that happens naturally at the right time.

Resist the impulse to design a special onboarding mode with its own visual language: use the real thing, and trust the interface to explain itself.

## A useful test

If your onboarding screens look noticeably different from your app screens, you've probably built a lobby.

That visual break shows that you don't feel your app is self-explanatory – that you must teach people how to use it. Sometimes a little bit of that is unavoidable – a genuinely complex setup may need explicit one-time guidance. But in most cases it means you don't trust the interface to stand on its own.
