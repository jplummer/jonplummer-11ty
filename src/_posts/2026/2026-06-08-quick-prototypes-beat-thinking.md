---
title: Quick prototypes beat thinking your way to one answer
layout: layouts/single_post.njk
date: "2026-06-08T12:00:00-07:00"
tags: post
description: Using AI to build many small prototypes, then selecting and iterating from there, beats trying to think your way to one right answer.
ogImage: /assets/images/og/2026-06-08-quick-prototypes-beat-thinking.png
---
A product team needed to decide *if and how* to provide a little convenience around an `API Name` when their user enters a `Display Name`. Small interaction, lots of edge cases: when does auto-fill stop? What if the user clears the API field? What if they edit it once and change their mind? When do we stop trying to keep the two fields in sync?

In the old way of working, a designer would think about the possibilities, propose something to the team, there'd be an argument, if you're *lucky* a prototype would be shown to customers, and eventually someone's idea would "win". That's slow, unreliable, and too dependent on the loudest voices in the room.

## What I did instead

I asked an AI coding agent to build a behavior test bed: twelve concrete implementations of the same two fields, side by side, plus a thirteenth card for the behavior I ended up suggesting. Same validation rules everywhere. Same transform options (preserve case, lowercase, snake_case, camelCase). Each card wires up the Display Name field to API Name differently; always update, update only if blank, sticky while matching, suggest-don’t-fill, explicit lock toggle, debounced update, and so on.

Rejected options stay hidden until you click `Reveal rejected options`. The favorite sits on top. Every card has reset, hide, debug state, and shared config at the bottom of the page.

Building a dozen working variants took less time than the initial team discussion would have taken to schedule, and rejecting half of them was nearly instant. More importantly, team members and customers could try them, and engineers could see the underlying code. People could type the same Display Name into every card and feel which behavior was helpful while being the least surprising. And in doing so they could have their assumptions tested.

(You'll note that this is the [single diamond](https://jonplummer.com/2022/11/09/single-diamond-the-basic-form-of-the-creative-process/) creative process happening with the help of AI: generate, evaluate, repeat as needed.)

## The interactive demo

Try typing in a Display Name on a few cards. Touch the transform radio buttons. Click "Reveal rejected options" to see the full set I generated before narrowing down. (There are some ideas in there that are only obviously bad in retrospect.)

<p class="post-demo-popout"><a href="/assets/demos/auto-api-name/index.html" target="_blank" rel="noopener">see demo in a new tab</a></p>

<div class="post-demo-embed">
  <iframe
    class="post-demo-embed-frame"
    src="/assets/demos/auto-api-name/index.html"
    title="Auto API name behavior test bed — twelve field-sync behaviors plus a favorite"
    loading="lazy"
  ></iframe>
</div>

The favorite combines live auto-update while you type, severing the link when Display Name blurs or when you edit API Name, and restoring auto-update when API Name is cleared. That beat simpler “lock on blur” variants because it matches how people recover from mistakes without trapping them in manual mode forever.

## Why this beats the one-right-answer meeting

* Speed: fifteen minutes with an agent produced twelve working behaviors, not a slide with a flowchart, ready to show to customers.
* Reach: we explored debouncing, explicit locks, suggestion-only patterns, and sticky matching – ideas that rarely survive a whiteboard session intact. There was no "sounds fancy" or "that's too difficult" getting in the way early.
* Documentation: the HTML *is* the spec. Each option is a named object with a one-line description and setup code. configuration, validation, and transform logic live in one place. When an engineer goes to implement the selected behavior, they are not translating a paragraph or squinting at a mockup; they are reading the prototype.
* Honest comparison: side-by-side beats “imagine option seven.” The reveal/hide UI also records the decision process: here is what we tried, here is what we kept.

## When to use this method

It fits small, fuzzy interaction decisions where the cost of being wrong is low but the surprise factor is high and quality matters — linked fields, undo behavior, empty states, confirmation timing. It does not replace research or accessibility review. It replaces guessing.

Next time you feel a spec meeting circling the same opinions, make a test bed instead. Generate breadth first. Pick and refine second. Leave a good artifact so the next person understands why.
