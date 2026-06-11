---
title: The Invoca Design System, its new product owner, and expectations of you (talk)
layout: layouts/portfolio_detail.njk
date: "2025-02-14T12:00:00-08:00"
tags: portfolio
coverImage: 2025/02/invoca-design-system-page-1.png
description: "Orienting the cross-functional team to a new method of design system governance."
ogImage: /assets/images/og/portfolio.png
---
Nowadays this presentation would be similar, but emphasize changes to the design system and pattern library that were meant to improve its intelligibility to both humans and AI agents for AI-assisted coding and design purposes.

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-1.png" alt="invoca-design-system page 1">
  <figcaption>Page 1: I’m here to talk a little about the Invoca Design System, a little more about an important change we’re making to help with the management of the design system, and a little bit more than that about some expectations we have about how YOU will behave regarding the design system, some of which are going to be familiar and some of which might not have been well-expressed before. But I suspect it’ll all seem sensible once it’s laid out.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-2.png" alt="invoca-design-system page 2">
  <figcaption>Page 2: From here I might say IDS or “the design system” or even “the pattern library.” Oh look, I already mentioned the agenda. I couldn’t find appropriate stock photos in the new and small set of approved photos, alas.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-3.png" alt="invoca-design-system page 3">
  <figcaption>Page 3: This is a presentation and a document, so I’ll try not to read everything, ‘cause I know you will. When we say “design system” some people say “what’s that” but they might be familiar with “Titan Core” or color or spacing tokens or components in Figma, or wonder how to figure out what components we’re using via Figma…</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-4.png" alt="invoca-design-system page 4">
  <figcaption>Page 4: The Figma library of components, and Titan Core, and the documentation for each, are all parts of the Invoca Design System. And these things should match, but they don’t really, not yet. And there’s an example of that mismatch on this slide, actually – so many button styles in Titan Core! Much fewer in Figma and no confusion between secondary and dimmed buttons! Something to fix. You’ll note that some controls, some components are atomic, or small, like buttons, and some are amalgamations of smaller pieces into larger patterns, molecules if you will, or even compounds, like the date picker. That’s enough of the atoms/molecules/compounds metaphor – it falls apart if you examine it too closely.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-5.png" alt="invoca-design-system page 5">
  <figcaption>Page 5: I’m not going to go into detail about how Titan Core is built or what’s in there or how exactly to make best use of it – Danny will step into that zone in his talk that’s coming the 26th. You’ll have received an invitation to this talk recently. Great, we have a design system. It’s supposed to help us. But how?</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-6.png" alt="invoca-design-system page 6">
  <figcaption>Page 6: The design system is meant to help us design and build garden-variety interfaces with greater speed, consistency, and ease, and help us make cross-platform usability, accessibility, and styling improvements by acting on the design system and letting system-conformant code benefit from the design system changes. That’s great for Invoca, but what about users, the people who pay us to do this work?</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-7.png" alt="invoca-design-system page 7">
  <figcaption>Page 7: We think of it partly in terms of benefit to users – if the things we make are made out of familiar parts, that are usable and accessible and behave like similar parts elsewhere, and a part of our UI in one place behaves like a part of our UI in another place, AND if those UI are self-explanatory, then user friction is reduced. The design system helps with much of that, but it’s still up to us to make things that make sense to the people that are trying to operate them.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-8.png" alt="invoca-design-system page 8">
  <figcaption>Page 8: Here’s the thing. We’re here to serve our customers. Every scrap of effort in R&D ultimately is meant to improve the customer’s ability to accomplish something they need or forestall an interruption to that ability. The design system aims to take away some of our own toil so that we can be more generous with our time and attention and help those customers more. That is our job.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-9.png" alt="invoca-design-system page 9">
  <figcaption>Page 9: Here is some perspective from Mike. I won’t read all of it, but for me the highlights are: Existing web components are deprecated in favor of core components. Atlas works on the design system and lots of other dev enablement stuff. The UX team governs additions to the library (it was news to me that he felt that way late last year).</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-10.png" alt="invoca-design-system page 10">
  <figcaption>Page 10: Mike has also crunched the numbers and finds that as we do better adopting and judiciously extending the design system, it produces real savings.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-11.png" alt="invoca-design-system page 11">
  <figcaption>Page 11: I mentioned the Figma library and Titan Core as being two major parts of the design system – a fully mature design system has other parts as well, all in service of accomplishing design and front-end workflow and interface building. If you look at OUR maturity, we’re pretty underdeveloped in these areas here and have strides to make in components and the relationship between Figma and Titan Core. But that’s a sensible place to be given the conditions in which we are working. We don’t need to cover this entire diagram just yet. We do need to do better in the middle. So, what are our goals?</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-12.png" alt="invoca-design-system page 12">
  <figcaption>Page 12: Well, we’d like to be better, UX and engineering, at using what we have and avoiding customization when it’s not helpful. We’d like to make the transition from Figma to Titan Core to be seamless, gapless. We’d like to streamline stuff we have that’s over-complicated, like the button situation – the gap is there because the button system is too fancy and we’d like to lean it out. And we’d like to be more consistent in our maintenance and improvement of the design system. Nicole, who has been pursuing it as essentially a long-running passion/discretionary effort project is great, but the arrangement where no one is really in charge and no amount of effort is really dedicated isn’t fair and isn’t as effective as we’d like. So the implied goals here are (read em). So we have a plan, and that’s to designate someone in UX to be the product owner of the design system.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-13.png" alt="invoca-design-system page 13">
  <figcaption>Page 13: And that person will be Brittany, at first. Since we want to raise the level of knowledge and attention in UX, we’re going to rotate. We’re going to try a six-month term to start, with the person spending half of their effort on the design system, managing the design system roadmap and backlog, negotiating with Atlas, being a resource, helping herself and Atlas make the design system serve us and our customers better. And she’s started already! Some of you might have been approached by Brittany to get your understanding of and difficulties with the design system, and she’s learning a lot. Thanks for your help. It’s important to note that…</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-14.png" alt="invoca-design-system page 14">
  <figcaption>Page 14: this isn’t a proposal, it’s a pilot. The six people you see here have chewed on this and come up with this plan, and we will see how it goes and adjust as needed. You might remember I mentioned Nicole earlier…</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-15.png" alt="invoca-design-system page 15">
  <figcaption>Page 15: And praise be to Nicole (and Danny!) for getting us this far. It’s not that common for Enterprise SaaS orgs of our size to have design systems that are even this mature, unless they are basically just renting them from somewhere else. But now that we are rotating, Nicole is not responsible for the design system. She can help, she can be a trusted advisor, but her level of involvement is hers to manage. Even that little bit of clarity is probably helpful. And it’ll help her and all of us too as she can be more available to initiatives and enhancements, more strategic, not stretched quite so thin. And I, of course, am here to help Brittany get the most out of this new responsibility. Which means we need to clarify some expectations between UX and Atlas, since we have one PO and not maybe sort of two…</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-16.png" alt="invoca-design-system page 16">
  <figcaption>Page 16: You’ll note that these expectations are essentially the same between the PO and Atlas – both will watch for exceptions and offer alternatives, both are resources to teams, they negotiate changes together, just as scrum team trios would. We also ask that the PO be involved in de-legacy project, so we can avoid needless customization in those. And, critically, right in the middle of these lists, Atlas contributes to the IDS backlog but the PO is in charge of managing and adapting. There are also expectations one ring out from here, expectations of UX and engineering…</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-17.png" alt="invoca-design-system page 17">
  <figcaption>Page 17: And most of this will be familiar, some of this we are doing already. But the key thing here, not probably well-explained before, is that we should avoid custom, detached solutions, but that doesn’t mean NEVER. Sometimes there’s a good reason. Sometimes the available patterns don’t help us meet user needs well enough and we have to go beyond. This is okay if we’re sure! There are a couple of things to remember here.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-18.png" alt="invoca-design-system page 18">
  <figcaption>Page 18: Don’t pattern in advance. Example: we thought we might need some wizard parts, which don’t exist in the design system, for Signal AI Studio, so we made some. And guess what – it was 100% wasteful – they are not being used at all. But if we aren’t making patterns so we can then use them, are we stuck? Nope.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-19.png" alt="invoca-design-system page 19">
  <figcaption>Page 19: “We don’t have a pattern for that so we can’t do it” is NOT A THING. Our job is to meet customer needs, to make the user’s work easier to accomplish. If we are actually doing that, the platform will naturally lead the design system because we will naturally find things we need to do that the design system doesn’t do yet. And that’s OK. The important thing is to be careful, judicious about going beyond the design system. It’s not open season, it’s careful season. If we find we need to do that new thing again and again, it’s an emerging pattern and we can add it to the design system and enjoy the benefits of that later.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-20.png" alt="invoca-design-system page 20">
  <figcaption>Page 20: So the trio has a role to play in all this as well. I’m not sure these expectations have ever really been voiced, so here we go. The trio should prefer to make things out of existing components. But the trio will trip over things where it’s hard to meet customer needs well doing that. To borrow from Orwell’s Six Rules for Writing, meeting customer needs is more important than strict adherence, if the customer isn’t sufficiently helped by adherence. So it’s a trio negotiation. Discuss the user need and how to meet it, use the resources available to you if you need help, then make a decision. PM makes the scope call if need be.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2025/02/invoca-design-system-page-21.png" alt="invoca-design-system page 21">
  <figcaption>Page 21: Ask me questions!</figcaption>
</figure>

[Download full PDF](/assets/pdfs/2025/02/Invoca-Design-System.pdf)
