---
title: Quality moves from specification to iteration
layout: layouts/single_post.njk
date: "2026-06-19T12:00:00-07:00"
tags: post
description: AI-assisted development doesn't just speed things up – it changes where quality lives.
ogImage: /assets/images/og/2026-06-19-quality-moves.png
---
In the old system, quality required specification and inspection.

You wrote down what "good" looked like: every state, every edge case, every pixel. Or at least every one you could think of. Then you built. Then you checked whether the thing matched what you wrote.

This method was logical; building software was expensive, so you needed to get decisions right before the slow and costly part started. You placed your bet in the spec. If your bet was wrong, or the implementation drifted from the spec, you had defects and waste. Quality was a gate at the end of the process.

That system is now breaking apart, and not because anyone decided to lower their standards.

## Quality is now a rhythm

When building speeds up (and it has, dramatically) the math changes. You don't need to specify tightly in advance to avoid expensive rework, because rework isn't expensive anymore. You can ship something, see how it actually behaves, and improve it. Ship again. See again. Improve again.

Quality now isn't a gate, it's a rhythm. You ship something real, and user behavior tells you what's wrong. People show you the use cases you didn't imagine. Behavior you thought was clear turns out to be confusing. The edge case you didn't spec shows up as a support ticket.

This process catches problems the old system didn't because it uses real signals rather than guesses, but you have to be paying attention. You need your product to surface problems through analytics, user feedback, and instrumented interfaces; a fast build cycle that doesn't make user behavior visible is just shipping risky, half-informed things faster.

This is why coordinated experience matters *more* in the AI era. A coordinated product – in which users are led to complete their work end-to-end without going off-system – generates usable feedback. You can see where people get stuck and where the same tasks keep getting done wrong. A fragmented product generates noise: you can't tell if the confusion is in the interface or in the workflow, if the user gave up or adapted. Good design isn't just the output of the quality loop. It's what makes the loop possible.

## Iteration begins before launch

Before launch, UX's job is to establish what "good" feels like through a working prototype, not a document describing it. Fast build cycles without a clear target still produce something, but it tends to be whatever an engineer would have built on their own. Iteration starts with the first protoype. That prototype gets sharper faster when it's tested with real users early. Not a formal study, just enough contact to find out if your read on the problem was right before the loop starts.

After launch, UX people are in the loop rather than filing tickets. The label that's been confusing users, the microinteraction that never felt right – a designer who can open the codebase, find the relevant component, and ship a fix doesn't need to win arguments about engineering time. You stop *requesting* quality and start *producing* it.

Most teams still think about quality as something you get right before you ship. The ones that will build the best products are learning to think about it as something you get more right each time you ship.
