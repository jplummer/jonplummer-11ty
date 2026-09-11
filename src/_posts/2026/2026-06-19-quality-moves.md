---
title: Quality moves from specification to iteration
layout: layouts/single_post.njk
date: "2026-06-19T12:00:00-07:00"
tags: post
description: AI-assisted development doesn't just speed things up – it changes where quality is produced.
ogImage: /assets/images/og/2026-06-19-quality-moves.png
---
In the old system, quality required specification and inspection. We wrote down what "good" looked like: every state, every edge case, every pixel. Or at least every state and edge case we could think of; engineering would find more, of course. Then we built, adapting to the difficulties of development and handling the "new" problems as they arose. Then we checked whether the thing matched our specs, and were disappointed.

This method was logical; building software was expensive, so we needed to get decisions nailed down before the slow and costly part started. We placed our bet in the spec. If our bet was wrong, or the implementation drifted from the spec, we had defects and waste. Quality was a gate at the end of the process. The Quality Assurance engineers were embattled inspectors, struggling to get their work done at the end of the process when pressure to launch was at its highest and most irrational.

We can put that system out of business now, and not by lowering our standards.

## Quality becomes a habit

When building speeds up, the economics change. We don't need to specify tightly in advance to avoid expensive rework, because rework isn't so expensive. We can ship something, see how it actually behaves, and improve it. Now we can have [what agile promised](/2025/10/08/how-to-sprint/) and most orgs couldn't actually deliver. But since building is cheap, it's tempting to [make the user be the first test](/2024/02/18/beta-is-not-a-release-type/). That's not smart either.

Getting quality right used to mean passing an inspection before we shipped. Now it means iterating before and after shipping.

Before shipping, we prototype a concept and check it with customers. UX's job is to establish how the product works through a working prototype, not a document describing it. Does our *concept* of how the product should work deliver the *benefit* in a way that the user can recognize, accomplish, and enjoy? Fast build cycles without a clear target still produce something, but it tends to be whatever an engineer would have built on their own, and the engineer is not the user. Iteration starts with the first prototype. That prototype gets sharper faster when it's tested with real users early. Not a formal study, just enough contact to find out if your read on the problem was right before the loop starts.

## Iteration continues after launch

Then we ship something real and user behavior tells us what's wrong. After shipping, people show us the use cases we didn't imagine. The edge case we didn't address, or the confusing behavior we thought was clear, shows up as calls and support tickets.

This process catches problems the old system didn't because it uses real signals rather than guesses, but we have to be paying attention – we need our product to make problems visible through analytics, user feedback, and instrumented interfaces. A fast build cycle that is poorly instrumented is just shipping risky, half-informed things faster and then learning fewer lessons from them.

A coordinated product, in which users are led to complete their work without going outside of the system, increases the amount of usable feedback. In a coordinated product we can more easily see where people get stuck and where the same tasks keep getting done wrong. A fragmented product generates noise in the statistics: one can't tell if the confusion is in the interfaces or in the workflow, if the user gave up or adapted. This is why [coordinated experience](/2025/07/27/toward-coordinated-experience/) matters *more* in the AI era; it's harder to iterate, in a data-driven way, on an incomplete or uncoordinated experience. Good design isn't just the output of this quality cycle, it helps feed the cycle.

After launch, UX people are in the loop rather than filing tickets. Faced with a label that's been confusing users, or a microinteraction that stole user attention, a designer who can open the codebase, find the relevant component, and put a fix in a pull request doesn't need to win arguments about engineering time. We can stop *requesting* quality and start *producing* it.

Most teams still think about quality as refinement done before shipping, something inspected in. This has been wrong since [Deming](https://deming.org/explore/fourteen-points/) and Drucker; the orgs that will build the best products are starting to think about it as something they build into the concept, check early and get more right each time they ship.
