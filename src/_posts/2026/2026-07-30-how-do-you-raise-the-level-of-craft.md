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

It's simple, full of possible directions to pursue. I should have asked about the actual situation the prospective employer faced so I could address that; after all, it's why they are asking. Instead, I described what I'd actually done. At two different companies, design craft wasn't reaching the shipped product because design, product, and engineering weren't well-aligned. Design work got approved, then thinned out somewhere between specifying and shipping. UX, product, and engineering didn't agree on what quality factors to focus on, what level of quality we were going for, or how we'd notice.

There was no shared definition of quality – ask three people what "good" meant here and you'd get three different, equally defensible answers. There was no agreed bar for how much was enough – whatever shipped fastest won, no matter what anyone said they wanted. And there was no way to repeatably prioritize – no shared sense of which craft fights were worth having this cycle and which could wait. We either fought over everything or let all of it slide, depending on the scrum team's habits.

So I worked on the "product trio" partnership — closer collaboration among product, design, and engineering; shared ownership of what "done" meant; engineering at the table from the beginning. It helped a lot, both times.

## But that's not me

It sounds pretty good, but I did myself a disservice with this answer because it didn't reflect what I would actually do if hired. I explained a fix instead of a process — and a fix that would only apply if the obstacle to craft is the same one I bumped into last time.

Obstacles to craft can appear in several parts of the development lifecycle. Poor partnership between design and engineering is just one potential cause; the actual job in a new org begins with finding out where craft is stalled before reaching for an intervention.

## The better answer – diagnose, intervene, repeat

Diagnosis starts with evidence. Find an actual place quality went missing: a specific screen, a specific release, a specific moment where what shipped doesn't match what was designed or what the team is capable of. List the ways in which we're disappointed with the results, be it fit and finish, workflow, error handling, accessibility, etc. Then work backward: which failure modes explain how we arrived at those results? Often more than one failure mode is operating. The job isn't picking a favorite, it's figuring out which one is doing the most damage right now, in this org, at this moment — because that ranking is what tells you where to spend your first move.

This is the step I skipped in the interview. I didn't bother to investigate. I leapt past the diagnosis.

Intervention comes after diagnosis, and it should be sized to match your confidence in that diagnosis. A lightweight version of the fix — one critique session, one prototype-first spec, one metric added to a dashboard — tells you whether you found the right cause before you commit more budget, headcount, or political capital to a bigger structural move. And it needs a real signal attached, something witnessable, not just vibes.

## Failure modes

* Designer skill level, in general: the designers aren't skilled or aren't delivering.
* Skill variance across designers: some are strong, some aren't, and you need to raise the floor.
* Engineering skill level and skill variance across engineers: similar to that of designers – it often takes front-end expertise to know what to care about and not be intimidated.
* No shared understanding of what "quality" means here: nobody disagrees that craft matters, but they'd give different answers about what it is, what we care about, or how important it is.
* Narrow definition of craft: the org's idea of quality is more specific than it should be. We've been burned by poor error handling but no one is asking for visual polish, accessibility issues have never prevented a sale, etc.
* Mismatched incentives: speed (or scope, or launch date) outranks other quality markers in what actually gets rewarded.
* Specs don't communicate well enough: the dominant way expectations travel (tickets, written specs) conveys function and sequence, not feel or behavioral detail, so craft (or lack) is invisible until something's built.
* Leadership says craft matters but doesn't support it through expectation, evaluation, or investment.
* Poor design/product/engineering partnership: the trio doesn't share ownership of the outcome.
* Quality addressed late instead of early: quality improvement happens as a pass at the end, where it is most likely to be skipped.
* The "we'll fix it later" lie: the org tells itself debt will get repaid, but lacks a plan to do so. A special case of the late-attention pattern, and worth keeping separate because it's an organizational delusion, not just a habit.
* Turnover and reorg effects: unspoken parts of the standard lived in people's heads and left with them.
* Lack of feedback loops: nobody measures craft after shipping, so decline is invisible until something is obviously broken.
* High technical debt or no design system: the development environment makes craft hard to execute.
* Fragmented ownership across teams: each team's slice seems fine, but craft is not being delivered all the same.
* Estimates that never included detail work: distinct from late attention. The polish wasn't cut, it was never planned in the first place.
* Active resistance: someone benefits from the current bar staying low (less work, exposed shortcuts) and pushes back on raising it. Different from leadership lip service as it is peer-level.

## Interventions

Some of these are useful in multiple failure modes.

* Critique: partly "borrow the brains of your fellow designers" and partly group coaching. A way to raise craft (and awareness of same) to a common level, above the average of the group.
* Structured design and code review: a more pointed and direct fix for a lack of a shared understanding of quality, focused on specific hallmarks of quality that need special attention.
* Coaching, training, or pairing: targets skill level directly, individual by individual, distinct from critique's group-calibration effect.
* Hiring bar and hiring process: a slower, structural fix for skill level and variance both by making the quality hallmarks an explicit part of candidate evaluation.
* Shared quality standard, written down and concrete (with real examples, not just adjectives): doesn't fix anything on its own, but useful to any other intervention and critical to goal maintenance.
* Prototypes and working artifacts as the default communication mode: addresses the fact that mocks and specs talk about behavior that is better shown.
* Fixing mismatched incentives: shared quality goals, properly supported, will yield results. Asking product for quality and engineering for speed will create a tug-of-war.
* Trio creation via shared ownership rituals: fixes poor product trio partnership.
* Sequencing the estimate to include craft up front: fixes both late-attention and never-counted-the-work, though they need slightly different treatment. One is a discipline problem (protecting what's already planned), the other is a planning-input problem (getting it into the plan at all).
* An accountable owner for the coordinated, end-to-end experience: fixes fragmented ownership across teams.
* Measurement and feedback instrumentation: usability testing, accessibility audits, quality-bug tracking, behavioral customer success metrics – these fix the lack of feedback loops.
* Documentation and onboarding that transmits the standard: helps with turnover and reorg churn.

and, of course

* Gently taking people aside: if someone is in the way, they will need to be told. Address resistance directly. Yes, this can be a political challenge, but if you have shared goals it will be clear who is dragging their feet.
* Recognizing the org doesn't value it: it may be that we say we want craft but don't actually want to do the work as an organization. If that seems to be so, point it out, backed by your evidence. Make it clear – are we in or out? This is less a fix than it is a plea for honesty, or executive support that might not have materialized yet. It's good to know for sure, one way or the other.

## Repeat?

Opening a bottleneck helps, and it reveals the next bottleneck. You might have an overall low level of designer craft, but raising it doesn't get fully realized in the product; this tells you that there's another obstacle after the obvious one you went after. This is true for any process you might work on. Speeding up the slowest operation in an assembly line helps, and it reveals the next-slowest operation, the next focus of intervention.

Then repeat — not as a formality, but because as you work on the process, and as business conditions change, the diagnosis doesn't hold still. People turn over and take the tacit parts of the quality standard with them. Reorgs sever ownership. Growth outpaces whatever onboarding used to establish the bar. The causes recombine. Sometimes the same one comes back, sometimes a new one takes its place. Raising craft once is a project. Keeping it raised is the same discipline I've written about before under a different name — goal maintenance.

I should have said that. Instead I told a story about the wrong question.
