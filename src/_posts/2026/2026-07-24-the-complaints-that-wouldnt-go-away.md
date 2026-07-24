---
title: The complaints that wouldn't go away
layout: layouts/single_post.njk
date: "2026-07-24T12:00:00-07:00"
tags: post
description: Design system compliance at Invoca was real and rising. The complaints about people not following it didn't move. An audit and a controlled test revealed why – and it matters twice as much now that agents are writing the UI.
ogImage: /assets/images/og/2026-07-24-the-complaints-that-wouldnt-go-away.png
---
Building is easy, taste is hard. That line's been going around design and engineering circles for a while now, and it's true – for a team. A single designer with good instincts can make fast, sound "taste" calls all day. A team can't run on one person's taste, and it can't run on group vibes either. It needs a standard people can actually check their work against. I watched a team have exactly that – an established design system – prove their compliance with it was real and rising, and still be dissatisfied by the results. Fixing that took an investigation.

## Fixing the basics

When I arrived at Invoca as the product design director, the complaints were familiar to anyone who's led a design org: accusations that UX was "gold-plating" things, though nobody could point to evidence of it. Developers barely following mockups, sometimes not opening Figma at all. Engineers who didn't come to designers with questions and chafed at the suggestion that UX should review things that were about to ship. Product managers running shuttle diplomacy: working with their designer and their engineers separately, because the two groups weren't really talking to each other.

I fixed the relationships, restored the connection between design and engineering, built strong product trios: design, product, and engineering making key decisions together instead of over a PM's shoulder. I put the detail degments of UX practice into the scrum sprints instead of running apart from them. Designers' design system compliance rose sharply, and I could show it. Engineering managers started telling me it finally felt like UX and engineering were pulling in the same direction.

And yet! Complaints about people not following the design system didn't go away. Designers found their very compliant mockups were not realized in code. Questions were coming back to the UX team, but not about the front-end implementation. The relationships were better, but the results weren't improving much.

## Getting real

So we decided to find out what was actually happening instead of continuing to argue about it. I made the call to audit UX deliverables directly – not to defend the compliance numbers, but to make sure they were real. [Jake Rowe](https://jakerowedesigns.com), our IDS product owner, made a gutsier call: watch the engineers actually work. He built a mockup he knew was 100% compliant with the design system, and asked engineers to let him see them build from it.

What that revealed had nothing to do with designers slacking off or engineers ignoring instructions. Though they sometimes claimed otherwise, engineers weren't actually familiar with Figma or Dev Mode, where the components and variants were clearly pointed out; they'd never learned how to look there or understand what they were seeing. But the difficulty went beyond this skills issue: some primitive values and other magic numbers persisted in the design system in Figma AND the design system in code, and not always the same ones. Some values were captured in tokens on one side, some on the other, some not at all, and there was drift between these two sets. Component naming didn't always match between the two. Variants didnt' always exist in both places. Teams had built up their own private sense of which deviations were fine and which weren't, with no shared answer. Some components existed only in Figma, or only in code, never both. And underneath all of it, engineers described feeling such pressure to ship quickly that they were reluctant to stop and ask a question that might slow them down.

None of that was a compliance problem. It was a trust problem – between two systems that were supposed to be one system, and between two groups of people who didn't really know how the other actually worked.

## The intervention

What we did about it took leadership air cover from me and our director of dev enablement. Stop adding new components until the ambiguity underneath them was resolved. Make production code the source of truth instead of Figma, since that's what the majority (engineers) defaulted to anyway whenever the two disagreed. Reduce the decision-making load by cutting typography from eleven overlapping styles down to five, each named for how it is used. Build the components that only existed on one side into both. And build something we hadn't had before: an actual way to measure whether a piece of AI-generated output matched the system, instead of arguing about it by feel.

This work would have helped regardless. It mattered twice over because of when it happened. Agentic coding was catching on at the same time, which meant more of our UI was about to be generated by something with no ability to guess what a designer meant or a developer would choose – it would just read whatever the system told it and go. And Invoca had been quietly narrowing its front-end development capacity for years. Fewer front-end specialists meant fewer people left who could bridge design system ambiguities with judgment. More AI-generated code meant more code being written by something with no judgment to bridge with at all. The gap Jake and I closed wasn't optional cleanup. It was the difference between a system that mostly works because a person catches the edge cases, and a system that has to have far fewer edge cases. Over time we got code compliance up to 89% – not a number meant to impress anyone, a new baseline to beat.

## Especially now

That's the case for doing this work now, whether or not you've got our exact numbers to chase. Any company building with agentic coding tools is going to need its design system to do double or triple duty: readable by the people who use it, the coding agents they run, and by the agents composing UI from it. That means resolving the same ambiguities we found: one source of truth, not two that drift apart. Names that mean the same thing everywhere. A real way to measure whether output matches the standard, not a feeling about whether it does.

A design system was never just a component library. It's the shared language a team uses to turn intent into working software – for people, and now for agents too.
