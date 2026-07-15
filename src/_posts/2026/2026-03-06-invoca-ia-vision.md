---
title: Invoca IA vision
layout: layouts/portfolio_detail.njk
date: "2026-03-06T12:00:00-08:00"
tags: portfolio
coverImage: 2026/03/Potential-IA-Tree.png
description: "A project to help customers select classifiers revealed a new direction for the information architecture in general."
ogImage: /assets/images/og/portfolio.png
---
## The situation

One of the main things marketers use Invoca for is paid media optimization: figuring out which ad campaigns, landing pages, direct mail pieces, and online properties are actually driving leads and conversions so they know where to put more budget. That only works if the platform can tell a real lead from a hang-up or a wrong number, which means the underlying call classification has to be right. Investigating how paid media optimization actually worked, in general and specifically for a large enterprise customer I'll call iTelecom, is what pulled me into the data model in the first place.

The actual request was narrower: help customers choose classifiers to help with their paid media use cases. At Invoca, a classifier is any of the things that decide what happened in a call – a rule, a keyword signal, an AI signal, a formula field. Customers were supposed to pick the right one for what they were trying to measure, and mostly couldn't.

## What looked simple wasn't simple

I started by enumerating every kind of classifier and what each was actually used for. There was heavy overlap. The right answer for a given customer scenario wasn't necessarily obvious; it depended on what they were trying to accomplish, how quickly they needed to put it into practice, and on which package tier they'd bought. Two customers with the same goal could need different classifiers because of speed, access, or both.

Working through that produced a working prototype of the interaction patterns Invoca needed to make classifier and report selection sensible: galleries organized by purpose instead of underlying technology, "copying in" a template rather than starting from scratch, drafts as privileged unfinished work, and links showing where an object was actually in use. I published that walkthrough on its own, with Figma Make screens, as [Coordinated Experience Prototype](https://jonplummer.com/2026/03/03/coordinated-experience-prototype/) – no need to re-tell that story here.

## What else the investigation turned up

Building that gallery meant poring over real customer configurations. A need showed up that had nothing to do with classifiers specifically.

![Paid media general workflow](/assets/images/2026/03/Paid-Media-Optimization-General.png)
*Paid media optimization is a fairly simple concept – when a caller calls the call center we can identify the ad campaign via the number they called, and if that's via a web session we can specifically identify the web session that fed them the phone number. We can identify the caller via caller ID, and once we transcribe the call we can run classifiers over it to determine what happened – did they need support, were they a sales lead, did they buy something, how did the human agent do, etc. We can report on these behaviors and send the data to the ad platforms to privilege the campaigns that result in conversions, and we can accept writebacks of actual transaction data if that helps.*

Going through iTelecom's configuration by hand to understand how their paid media optimization actually worked, I found the kind of *cruft* that can build up in any system: lookup tables nobody was using anymore, signals that were configured but never fired, IVR tree branches that led nowhere anyone still cared about. None of it was actively breaking anything, but all of it made the system harder to understand for the people charged with maintaining it.

![Paid media workflow for iTelecom](/assets/images/2026/03/Paid-Media-Optimization-iTC.png)
*ITelecom's paid media optimization workflow is not that much more complicated than the general case, but without a diagram like this to understand how it works one is left to surf through the system and make one's own mental map of the process. this is difficult enough that invoca staff struggled with it and customers didn't bother. As an example, about half of the actions in the call treatmetn were non-ops, old configurations that were hard to kill or hidden in plan sight.*

Most customers didn't have a working grasp of how their own data moved through Invoca. That meant they needed heavy support from their CSM for almost anything – not just classifier selection, but basic questions about their own configuration. On the largest accounts, the ones with more than one CSM assigned, the configurations had grown complex enough that CSMs disagreed with each other about how things actually worked. Some ran periodic audits just to figure out what was safe to delete, because unused fields, signals, and lookup tables made the whole thing harder to reason about. It's similar to the gap the "where used" pattern in the [Coordinated Experience Prototype](https://jonplummer.com/2026/03/03/coordinated-experience-prototype/) was meant to close, but I was running into it at the account level.

Part of the reason: there was no single expression of Invoca's built-in fields anywhere. The in-platform "data dictionary" was really just a list of the custom fields the customer had created, with no information about where any of the data came from or went. [Enhanced Data Dictionary](https://jonplummer.com/2026/04/20/data-dictionary-prototype/) was built to address that lack.

Underneath all of it: most customers didn't have much of a mental model of the Invoca data model. And we weren't helping them understand it.

## Reframing around the customer's model, not ours

I looked at how customers actually understood their own data, focusing on "brand" customers specifically since they're the majority of the customer base and responsible for the anticipated growth of the platform. After speaking to several customers, CSMs, and Sales Engineers, it was clear that we shouldn't expose our internal data model directly to customers.

![Invoca internal data model](/assets/images/2026/03/Omnichannel-Data-Model-v2.png)
*Our own data model was functional, but fine-grained and more complex than customers cared to deal with.*

What came out of that was a proposal for a customer-facing data model: a compatible subset of the real underlying model, scoped to what a customer actually needs to reason about their own data and events. Not a simplification that hides what's really happening – a subset that's still accurate, just preferring the objects that cusotmers actually care about.

![Invoca data model made intelligible to customers](/assets/images/2026/03/Customer-Data-Model.png)
*Customers generally understood their interactions with Invoca in terms of conversations (interactions), customers and agents, groups of customers (segments), and the outcomes of those interactions.*

## From problems to patterns

I laid out the visibility and intelligibility problems customers and CSMs were actually running into, worked out what fixing each one would buy, and ranked them by leverage. The highest-leverage ones all pointed at the same solution: a real data dictionary with provenance, which became [Enhanced Data Dictionary](https://jonplummer.com/2026/04/20/data-dictionary-prototype/), built as a working prototype against one lead customer's real configuration so the argument was concrete rather than hypothetical.

## Reshaping the IA

The customer-facing data model, EDD, and the classifier gallery patterns all pointed at the same conclusion: the platform's information architecture needed to change, not because the existing object-type-oriented structure was wrong, but because it was less detailed than the model customers actually needed. The fix wasn't a redesign from scratch. It was making the existing structure match how customers already thought about their data, at the resolution they actually needed.

That work continued past the prototype stage – refining the arrangement with customers, CSMs, and engineering and product leadership together, since a change like this touches how the platform talks about itself everywhere, not just in one screen.

![Nomenclature vs purpose for classifiers](/assets/images/2026/03/Nomenclature-vs-Purpose-for-Classifiers.png)
*Rearranging classifiers (and other technologies) into groups according to how they were best used revealed a new way of talking about the objects that make up Invoca – and one more intelligible to both customers and the industry.*

![Arrangement of technologies](/assets/images/2026/03/Arrangement-of-Technologies.png)
*When quizzed about where to find important or commonly-used concepts, customers were more successful with this diagram than with the existing Invoca navigation.*

![Invoca IA proposal](/assets/images/2026/03/Potential-IA-Tree.png)
*Rearranging the IA to lean on how customers understood their data and the technologies they interact with made the tree shallower but wider, and put more pressure on coordinating patterns.*

The reshaping didn't stop at the data screens. It reached the platform's overall geography: a main navigation that had outgrown its original shape, a network and profile selector that needed to do more without getting harder to use, the existing accessory nav, and – with Invoca moving toward agentic features – room in the template for an AI agent chat experience that could sit alongside all of it without displacing what people already knew how to find. Making space for a conversational surface without breaking the navigation people already relied on is the same coordinated-interface problem I've written about since: an agent chat pane is only as useful as the intelligibility of the structure underneath it.

!["Platform geography"](/assets/images/2026/03/Platform-Geography.png)
*The wider and shallower navigation structure, plus coming AI chat experiences to help customers dig into their data, implied a subtle rearrangement of the Invoca platform template.*

## Where it landed

Enhanced Data Dictionary went on the roadmap and is in work now; the engineering team is pleased with the markdown specifications I've left their coding agents. New interaction patterns went on the roadmap, some of which are bound up in the dictionary work. The classifier and report gallery patterns went on the roadmap. Some of the broader IA changes were in progress as of June 2026.

## The actual point

This project produced value nobody asked for, twice, at two different scales. Small: a packaging visibility bonus that arose from doing the classifier research properly. Large: a platform-wide position on how Invoca should represent data to its own customers which came of taking "help pick a classifier" seriously enough to go looking at real configurations instead of redesigning the picker UI based on assumptions or anecdotes.

The hard part of design leadership isn't generating the idea; design teams generate ideas constantly. Patient and specific investigation lets you prove a bigger vision is sound before you ask anyone to bet on it. This project is the clearest example I have of that happening at every scale of a single piece of work, from UI details to a platform's information architecture.

Two things that came out of this investigation stand on their own: [Coordinated Experience Prototype](https://jonplummer.com/2026/03/03/coordinated-experience-prototype/) and [Enhanced Data Dictionary](https://jonplummer.com/2026/04/20/data-dictionary-prototype/). This piece connects them, proving that they were never really two separate projects, just two new goals pulled out of the same investigation at two different points.
