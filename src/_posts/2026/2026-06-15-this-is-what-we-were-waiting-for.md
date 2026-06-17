---
title: This is what we were waiting for
layout: layouts/single_post.njk
date: "2026-06-15T12:00:00-07:00"
tags: post
description: There's a story going around that AI is squeezing designers out. But UX can emerge from this moment more useful and powerful than ever.
ogImage: /assets/images/og/2026-06-15-this-is-what-we-were-waiting-for.png
---
There's a story going around that AI is squeezing designers out. That faster build cycles mean less room for design process. That when anyone can generate a working UI in an afternoon, the UX role shrinks to quality control at best.

I've heard this from hiring managers who are genuinely uncertain what shape their teams should take. I've heard it from UX people trying to figure out how their process and expectations need to change, and mourning (a little) a way of working that's going away – even if they didn't love it. It's a reasonable worry given what's visibly happening. But the mourning isn't.

The software development lifecycle is changing in ways that can make UX more useful, more capable, and more directly powerful than at any point in the discipline's history. The question is whether UX people, and the organizations that employ them, will change how they work to capture what's now possible.

## The loop, and where UX used to live

Product development is a loop. You understand a customer need, generate concepts, validate them, design, build, test, launch, measure, and do it again. Every team runs this loop differently, but the shape is the same.

For most of UX's history our effort in that loop was clustered at the start of each cycle. Research happened early to set design direction and legitimize further investment. Wireframes came next, then higher-fidelity mockups. Then specifications – documents that tried to capture enough detail about intended behavior, visual treatment, states, edge cases, and interaction patterns that engineers could implement the design faithfully with minimal wasted effort. Then waiting: waiting to see what came back, waiting to file feedback, waiting to see what feedback got prioritized.

The reason UX was front-loaded was practical: building software was expensive. You needed to get decisions made before the costly part started because changing things later cost even more. Specifications were how design thinking became engineering action.

It was not a great system, but understandable given the conditions. It generated friction – structural and interpersonal – that anyone who's worked on a UX team will recognize. It also fought against the agility that most organizations insisted they wanted; the more an organization front-loaded design to reduce engineering waste, the more they drifted toward waterfall.

Here's what that friction looked like up close.

**Complaints of "gold-plating."** "That's too fancy to build" is a complaint every designer has heard. Sometimes it was legitimate – a genuinely expensive interaction that wasn't worth the implementation time. But just as often, it was a design opinion dressed up as a cost argument. When design and build were separated by a handoff, UX people had no real recourse.

**Weakness in accessibility.** UX teams got better and better at specifying accessible behavior. Alternate content, focus order, contrast ratios, touch target sizes – we could write tight specs covering all of it. And then implementations came back that missed half of it, because accessibility in practice lives in front-end code details that are easy to get wrong, and engineering teams without strong front-end investment often didn't get them right. At some point both sides quietly gave up. Users with assistive technology and power users suffered for it.

**Poor teaming.** Specs were meant to be complete enough that development could be planned and completed efficiently. But the focus on efficiency was so intense that any coordination cost felt like waste. Engineers who encountered an edge case, an ambiguity, or a decision the spec didn't cover would make a call on their own rather than ask. Asking felt like overhead. The effect of avoiding that coordination was that the design and the shipped product drifted apart – and nobody was satisfied.

**Calls to "lock" the spec.** PM and UX people learn things during development. A conversation with a customer reveals that the feature scope is wrong. A usability test shows that the designed interaction doesn't work the way anyone expected. A technical constraint turns up that makes the original design impractical. In a healthy process, you absorb that learning and adjust. But the old model made adjusting expensive. Engineering had already invested time in the original spec. Changing it mid-build felt like waste, so teams developed a norm: lock the spec before development starts. This was anti-agile by design, saving discoveries for later rather than acting on them as they emerged. Learnings piled up in a backlog of future versions that often never shipped. The team that could have been thinking together was sorting itself into specifiers and implementers, with the implementers increasingly taking orders and the specifiers increasingly generating paperwork.

UX people complained about these effects constantly, and rightly. They were driven by corporate conditions. Change them and the job changes.

## What changed

Build got fast. Not a little faster, dramatically faster, and still accelerating. AI-assisted development means that a senior engineer who used to take two weeks to implement a complex feature might take two days. A designer with moderate technical fluency and good AI tooling can prototype a working interaction in an afternoon that would have taken a week of engineering time a few years ago. Entire interactive patterns that once required careful negotiation between design and engineering can now be generated, revised, and iterated on in hours.

Since building is fast, the defensive posture that the old model required starts to relax. You can design something, build it quickly, find out it's 70% right, throw out the 30% that isn't working, and rebuild it without quite the level of sunk-cost pain as before. The pressure to negotiate away the small things that make something actually good – the things that would have been dismissed as gold plating – can finally lift. The "that's too fancy" argument loses its teeth when the fancy thing can be demonstrated in a prototype that took a designer an afternoon.

What didn't change is just as important. We still need to understand customers and come up with ways of meeting their needs. We still need to involve them in choosing the way forward, and we still need to exercise product judgment – to know that an idea is good, or when it needs to be tested before anyone commits to it. We still need to measure our work and revisit it according to how it performs. None of that changes. What is going away is the need for the design overhead: the specs, the handoff documentation, the waiting, the re-explaining. UX effort gets reorganized around customer understanding, concept generation, judgment, and quality, and that reorganization is exactly what UX people always said they wanted.

## The job UX always wanted

### Prototypes instead of specs

The most visible shift is in what UX produces. A spec was a description of a thing. A prototype *is* the thing – or close enough that the difference is small. When a working prototype and a shipped feature are days apart rather than a month apart, the prototype becomes the center of team discussion and often the most efficient path to implementation.

A prototype closes the interpretation gap. A spec says "on hover, the button shifts to this darker shade of the primary color." A prototype shows exactly what that looks like, in context, in motion, in the actual browser. There's nothing to interpret. The chance for drift between design intent and implementation shrinks dramatically.

A prototype also sells in ways a spec rarely did, to customers, executives, and engineers alike. I built a prototype a while back that proposed automatically filling in one field based on what a user was entering into another. In the old regime, that idea would have had a hard time. I would have had to specify exactly what the behavior should be across every edge case before building it, and the complexity of that spec would have made it feel expensive before anyone had seen it work. Instead, I built a simple prototype, showed a good clean behavior, and let people experience the "oh, that's helpful" feeling directly. I also showed a handful of alternative approaches I'd built and discarded – which would have been too costly to do under the old model. It made the thinking visible. It showed that I'd explored the space and arrived at a good answer, rather than just asserting that the answer was right.

The prototype was also less precious than a spec in a specific and useful way. A detailed spec, once written, is freighted with someone's careful labor. Questioning it can feel like criticizing the effort or the person. A prototype is obviously a starting point; it invites questions. The conversation moves from "is this the right idea" to "how do we make this even better."

And there's one more thing. Seeing a non-engineer produce a working behavior changes how engineers think about its difficulty; the demonstration resets the cost estimate.

### More time with customers, less time in documents

The hours that used to go into specifications can go somewhere better. Customer contact is the highest-leverage activity in UX: it's where you learn whether your model of the user's problem is accurate, where you find out what you got wrong, where you discover the unexpected needs that become the next round of ideas. Most UX teams have had less of it than they wanted. The constraint was time, and a lot of that time was going into documentation.

Some of that time is available now. A UX team that was spending 50% of its capacity on specs can put some of that time into customer interviews, lightweight concept tests, usability sessions with real users. The quality of the design work gets better because it's grounded in more direct contact with the people it's for. And the prototypes that come out of that contact can be validated with customers directly – not as pictures of functionality but as things that work well enough to try.

### Owning quality rather than requesting it

Every UX practitioner has quality tickets they filed that never got fixed.

In the old model, UX owned the design, engineering owned the implementation. Quality lived in the gap between them, and UX's primary tool for trying to close that gap was the bug report. You saw a problem, you filed a ticket, the ticket went into a backlog, the backlog got triaged. Your ticket competed with features, infrastructure work, and other bugs for priority. A lot of the time – especially for small usability issues, accessibility problems, and polish details – your ticket lost. The thing that you caught before launch just sat there for two years until old tickets were cleaned up, then it was forgotten. Sometimes you'd finally get it fixed, only to see the same class of problem introduced somewhere else the following sprint.

When UX practitioners have AI tools that lower the barrier to working in code, this changes. If you know enough to open a codebase, find the relevant component, make a targeted change, and submit a pull request, you can fix things yourself. The label that's been confusing users for eight months? Fix it in the code, write a clear commit message, open a PR. The color contrast issue that keeps showing up in accessibility audits? Find it in the design system, correct it, ship it. The microinteraction that's been janky since launch? Tweak the animation timing, test it, merge it. Fed up with a site-wide spacing inconsistency? Fix it once in the component, watch it propagate everywhere.

UX people move from quality advocates to quality owners. From people who describe problems and hope they get fixed, to people who see problems and then fix them.

### The design system as infrastructure you control

The most powerful version of this shift is at the design system level. A well-maintained design system, whose source of truth lives in code, is a high-leverage place for a UX person to work. Changes to the design system propagate everywhere. Improve focus state behavior and you've improved accessibility for every keyboard user at once. Add a microinteraction to the card component and it's in every card in the product after one merge. It turns quality from a campaign into ongoing maintenance.

This is also the real answer to the accessibility problem. Accessibility that lives in a spec is only as good as the implementation that follows it. Accessibility that lives in the design system in code – in the components themselves, in the tokens, in the patterns – ships correctly every time the component is used. UX people who own the design system in code aren't hoping accessibility gets implemented right. They're making it structurally hard to implement wrong.

There's a special payoff here for mature products. Long-lived platforms accumulate experience debt the same way they accumulate technical debt – interactions that were "good enough for now" when they were built, interfaces predating the design system, inconsistencies that everyone noticed but nobody could justify fixing. When build was expensive, retiring that debt was a luxury that rarely made the cut. When build is fast, it becomes doable. Teams using the design system faithfully can work through years of accumulated drift systematically, shipping improvements continuously rather than waiting for a redesign.

### Pushing for more

UX people have long been trained to scope things down. Pick the MVP. Defer the nice-to-haves. Don't design things that won't get built. That discipline made sense when engineering time was the scarce resource. When a feature that used to take three weeks takes three days, the calculation changes. Ideas that used to die as "too fancy" deserve a second look. Not because they got simpler, but because building them got fast.

## The speed problem

Let's acknowledge a real fear: that as engineering moves faster, designers and PMs get left behind. Not fired, necessarily. Bypassed. The engineer who commercializes a PM's rough prototype, skipping design entirely and delivering something half-baked to customers. The PM who has already decided what the customer needs and doesn't make room for the designer's input, because coordination has a cost and certainty feels faster. The engineer who ships a passion project into production on their own. The organization that claims to be metrics-driven but can't find the time to do the research or agree on the measures.

These happen more often than we'd like to admit. As shipping velocity increases they'll become more common, or more tempting.

UX doesn't need to get faster at the things it has always done – to produce Figma files more quickly, to run usability tests on a tighter timeline, to write shorter specs. UX needs to contribute to the pace in different ways. A designer who can drop a working prototype into a conversation before the PM locks in a decision is fast. A designer who can fix a quality issue in the codebase the same afternoon they notice it is fast. A designer who can roll out a design system improvement across the whole product in one PR is fast. None of that looks like the old version of UX speed. All of it keeps UX in the room.

## The tools make this possible

The reasonable objection to most of what I've described is that it assumes UX practitioners have technical skills that many do not. That's fair. "Just learn to code" has always been lazy advice – and as development environments have grown more complex the barrier has been going up, not down.

What's different now is the on-ramp. AI coding tools – Cursor, Claude, GitHub Copilot and their successors – mean that a designer who learns the basics of how their codebase is structured can do meaningful work in it without being an experienced engineer. You don't need to know how to architect a system; you need to know enough to find the right file, make a targeted change, and understand what broke if something goes wrong. That is much easier than it used to be, and it will get easier still.

More importantly, working in code with AI assistance helps build technical fluency. The AI explains what it's doing. You learn the patterns, you ask questions. You develop a mental model of the codebase, of what's hard and what's easy, of how your design decisions interact with engineering. Designers who work this way don't just pick up some CSS – they gain a fundamentally different relationship to the medium they are now designing in. Rising fluency makes every future conversation with an engineer more productive, every future design decision better informed.

## What this means if you're a demoralized UX person

If you're a UX practitioner who's been feeling like AI is making your role smaller, it's time to adapt – and I think you'll be happier once you do.

The things that are getting harder – maybe disappearing – are the things that were frustrating anyway. The spec nobody read quite right. The accessibility ticket that sat in the backlog for three sprints. The "that's too fancy" conversation you couldn't win. The feeling of being on the outside of decisions, taking orders, delivering work, watching it get implemented imperfectly, filing feedback, and starting over.

What's opening up is the opposite. Being in the room where the decisions get made, because you're the one with the prototype. Fixing the things that bothered you, because now you can. Having your hands on the layer where quality actually lives. Spending time with customers instead of in specifications. Contributing to the pace rather than being outrun by it.

The job that was supposed to be about understanding customers and creating great experiences – and that spent too much time on paperwork and pleading – has a path back to what it should have been.

## What this asks of UX leaders

All of this is available. None of it is automatic.

The teams that will capture these opportunities have UX leaders who understand that new conditions demand new behaviors. That means building teams with technical fluency, or raising the fluency of existing teams. It means shifting capacity away from documentation and toward customer contact and working prototypes. It means establishing UX ownership of the design system in code as a strategic priority. It means coaching UX practitioners to see themselves as people who build and fix things, and helping organizations understand what that makes possible.

The design orgs that keep running the old model – that value UX for the Figma files and the spec documents, that still think "design is done, now we build" – will watch their designers get bypassed and eventually questioned. Not because UX became less valuable. Because they never helped UX become what it should be.

We were made for this. The tools just took a while to catch up.
