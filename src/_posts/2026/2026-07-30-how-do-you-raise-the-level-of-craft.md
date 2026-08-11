---
title: How do you raise the level of craft?
layout: layouts/single_post.njk
date: "2026-07-30T12:00:00-07:00"
tags: post
description: Raising craft isn't one fix – diagnose where quality stalls, intervene sized to your confidence, and repeat as the bottlenecks move.
ogImage: /assets/images/og/2026-07-30-how-do-you-raise-the-level-of-craft.png
---
I flubbed an interview question the other day. Not because I gave a wrong answer, exactly, but because I gave a truthful answer that was too narrow, possibly not suited to the company, and not representative of what I *would* do were I hired.

## The fateful question

> How do you raise the level of craft?

It's simple, full of possible directions to pursue. I should have asked about the live situation the prospective employer faced so I could address that; after all, it's why they are asking. Instead, I described what I'd done in the past. At two different companies, design craft wasn't reaching the shipped product because design, product, and engineering weren't well-aligned. Design work got approved, then thinned out somewhere between specifying and shipping. UX, product, and engineering didn't agree on what quality factors to focus on, what level of quality we were going for, or how we'd notice.

There was no shared definition of quality – ask three people what "good" meant here and you'd get three different, equally defensible answers. There was no agreed bar for how much was enough – whatever shipped fastest won, no matter what anyone said they wanted. And there was no way to repeatably prioritize – no shared sense of which craft fights were worth having this cycle and which could wait. We either fought over everything or let all of it slide, depending on the scrum team's habits.

So I worked on the "product trio" partnership – closer collaboration among product, design, and engineering; shared ownership of what "done" meant; engineering at the table from the beginning. It helped a lot, both times.

## But that's not me

It sounds pretty good, but I did myself a disservice with this answer because it didn't reflect what I would actually do if hired. I explained a fix instead of a process – and a fix that would only apply if the obstacle to craft is the same one I bumped into last time.

Obstacles to craft can appear in several parts of the development lifecycle. Poor partnership between design and engineering is just one potential cause; the job in a new org begins with finding out where craft is stalled before reaching for an intervention.

## The better answer – diagnose, intervene, repeat

Diagnosis starts with evidence. Find a place quality went missing: a specific screen, a release, a moment where what shipped doesn't match what was designed or what the team is capable of. List the ways in which we're disappointed with the results, be it fit and finish, workflow, error handling, accessibility, etc. Then work backward: which failure modes explain how we arrived at those results? Often more than one failure mode is operating. The job isn't picking a favorite, it's figuring out which one is doing the most damage right now, in this org, at this moment – because that ranking is what tells you where to intervene first.

This is the step I skipped in the interview. I didn't bother to investigate. I leapt past the diagnosis.

Intervention comes after diagnosis, and it should be sized to match your confidence in that diagnosis. A lightweight version of the fix – one critique session, a prototype-first spec, a new metric added to a dashboard – tells you whether you found the right cause before you commit more budget, headcount, or political capital to a bigger structural move. And it needs a real signal attached, something witnessable, not just vibes.

## Failure modes

* People and skill
  * Designer skill level, or skill variance across the team
  * Engineering skill level – it often takes front-end expertise to know what to care about or to feel like it's sensible
* No shared definition of quality
  * Nobody disagrees that craft matters, but ask three people what "good" means and you'll get three different answers
  * The org's idea of quality is narrower than it should be – burned by poor error handling but nobody's ever asked for visual polish, for example
  * Specs and tickets convey function and sequence, not feel – craft, or its absence, stays invisible until something's built
* Timing and discipline
  * Quality is addressed late, as a pass at the end, where it's most likely to get skipped
  * The "we'll fix it later" lie – debt the org tells itself it'll repay, with no actual plan, piles up and compounds
  * Estimates that never included the detail work in the first place – not cut, never planned
* Org support
  * Speed (or scope, or date) outranks quality in what actually gets rewarded
  * Leadership says craft matters but doesn't back it with expectation, evaluation, or investment
  * Someone benefits from the bar staying low and pushes back on raising it
* Structural
  * Design, product, and engineering don't share ownership of the outcome
  * Turnover and reorgs – the unspoken parts of the standard lived in people's heads and left with them
  * Nobody measures craft after shipping, so decline is invisible until something's obviously broken
  * Technical debt or poor design system makes craft hard to execute
  * Ownership fragmented across teams – each slice looks okay, but the whole becomes incoherent

## Interventions

Some of these are useful in multiple failure modes; there's not a clean 1:1 mapping.

* Skill-building
  * Critique – borrow the group's brains, praise good examples, coach the group to raise the floor
  * Coaching, training, pairing – targets individuals to raise their skill level and that of the group
  * Hiring bar and process – slower, reduces your need for remedial training but not maintenance or standards
* Making quality visible in work processes
  * A written, concrete quality standard, with real examples instead of adjectives
  * Structured design and code review, aimed at specific quality hallmarks
  * Prototypes and working artifacts as the default way expectations are communicated – behavior is better shown than written about
* Structural fixes
  * Shared ownership rituals for the trio – everyone takes part in delivering quality and fixing problems
  * An accountable owner for the end-to-end experience
  * Estimates that include craft from the start
  * Documentation and onboarding that carries the standard through turnover
* Incentives and measurement
  * Align incentives – asking design for quality but engineering for speed just creates a tug-of-war
  * Usability testing, accessibility audits, quality-bug tracking, customer-facing quality metrics
* Direct
  * Take a person aside – if someone's in the way, they need to hear it
  * Name it plainly if the org doesn't actually want this – less a fix than a request for honesty

## Repeat?

Opening a bottleneck helps, and it reveals the next bottleneck. You might have an overall low level of designer craft, but raising it doesn't get fully realized in the product; this tells you that there's another obstacle after the obvious one you went after. This is true for any process you might work on. Speeding up the slowest operation in an assembly line helps, and it reveals the next-slowest operation, the next focus of intervention.

Then repeat – not as a formality, but because as you work on the process, and as business conditions change, the diagnosis doesn't hold still. People turn over and take the tacit parts of the quality standard with them. Reorgs sever ownership. Growth outpaces whatever onboarding used to establish the bar. The causes recombine. Sometimes the same one comes back, sometimes a new one takes its place. Raising craft once is a project. Keeping it raised is the same discipline I've written about before under a different name – goal maintenance.

I should have said that. Instead I told a story about the wrong question.
