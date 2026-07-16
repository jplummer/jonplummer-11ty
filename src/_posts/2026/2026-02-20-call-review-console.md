---
title: Call review console
layout: layouts/portfolio_detail.njk
date: "2026-02-20T12:00:00-08:00"
tags: portfolio
coverImage: 2026/02/New_Calls_List.png
description: Call center quality managers couldn't find the right calls to use to coach their agents. We fixed that.
ogImage: /assets/images/og/portfolio.png
---
## The situation

Call center quality managers have a needle-in-a-haystack problem. Thousands of calls, but one coaching session per agent per week with time to talk over a few calls at most. The tools to find the right calls to review didn't exist in the Invoca platform, so we built them.

At its core, Invoca is conversation intelligence software: tools that help analyze conversations between businesses and their customers. One high-stakes job in any call center is quality management: a manager finding the right calls to review, scoring agents against a rubric, and using those calls to coach agent performance. Before Call Review Console, managers sampled calls at random, hoping to catch a teachable moment or an example of good behavior. That made their coaching inconsistent and low-bandwidth and the preparation for that coaching arduous and ineffective.

## My role

I led the UX team on this project as Director of UX. Call Review Console was a major product launch spanning multiple engineering teams and several months of contentious work. I was responsible for overall design direction, managed the designers on the feature, and mentored the product manager.

## The challenge

Reviewing calls to find teachable moments was a time-consuming, hit-or-miss affair. Before building anything, we wanted to understand how managers actually found and prioritized calls using our existing interface. The answer: they hunted fruitlessly for calls in the dimly-remembered date range of something they overheard, or they sampled calls at random. They found it too time consuming to take a targeted approach.

![Call review before CRC](/assets/images/2026/02/Old_Calls_List.png)
*The original calls list required QA managers to manually click through calls in order to see if each one was potentially coachable. Little attention had been paid to bringing user attention to calls that might be of interest since this view was built before Invoca decided to target contact centers. Filters were available but hidden under the "+" button near the top of the screen, and many customers did not use that button per our usage statistics.*

![Old call review process](/assets/images/2026/02/Old_Call_Review_Process.png)
*The calls list interface lent itself to a slow and laborious review process that might not turn up any interesting calls at all.*

## How we worked

As we spoke to contact center customers large and small we learned that this unsatisfying process was essentially the same regardless of the experience level of the QA manager, the size of the department, the industry, or whether the agents were high-turnover or long-tenured. Every dimension that we expected might affect customer behavior, didn't. The process needed to be made more informative and straightforward for all of them.

![Vision of a new call review process](/assets/images/2026/02/New_Call_Review_Process.png)
*In particular, users needed to be led to operate the most useful filters, and be able to see from skimming the list which calls might be interesting, rather than having to click each one to learn about it.*

We also learned that while customers often had several signals (behavioral classifiers) and at least one scorecard configured based on those signals, it was difficult to find calls based on those scores – the value of those scorecards was essentially buried.

It was clear from the research that customers needed a small handful of improvements:

* Clearly visible filters with the most commonly-useful filters exposed by default
* Metadata on each call in the list to help them scan the list for calls of interest, especially agent name, scorecard score, and call duration
* The ability to filter and sort on scorecard scores

These weren't trivial to produce. The current design system minimized the visibility of filters in favor of leaving lots of space for data. The current calls list minimized the space given to the list, and those list items were unintelligible on their own.

Competitive and para-competitive analysis revealed a well-established filtering pattern that we could make use of, widely seen in both consumer and B2B workflows.

![B2C example of filter sidebar as primary UI](/assets/images/2026/02/Kayak_Competitive.png)
People have experience with sidebar filtering, also known as faceted search, in travel and eCommerce contexts.

![B2B example of filter sidebar as primary UI](/assets/images/2026/02/Gong_Competitive.png)
The fact that other conversational analysis platforms were using this pattern made it feel like a safe bet to product leadership.

Putting this into practice was straightforward but introduced new filter patterns to the Invoca platform, putting some strain in the design system. This was later resolved when sidebar filtering proved useful elsewhere.

When we learned that our transcript quality was high enough that we could introduce generated summaries of calls, the new list view became even more scannable:

![Call Review Console](/assets/images/2026/02/New_Calls_List_2.png)
*The centerpiece of Call Review Console is a call list with prominent filters and metadata for each call. (Right column reserved for a future playlist feature.)*

The old call list squeezed the list and spent most page real estate on the details of a single call. Since the new list view focused solely on richer list items, we needed a new call detail page. Here managers would review the transcripts see how the scorecard was scored, correct those judgements if needed, listen to the call, make comments, etc. All of these capabilities were available in the original call list, but many were buried or otherwise not obvious.

![Call Review Console](/assets/images/2026/02/Call_Detail.png)
*A new Call Detail view focused user attention on the individual call they had chosen to review, brought them the relevant scorecards and signals, and allowed them to comment.*

We paid attention to small conveniences too, such as:

* making it easy to copy a direct link to an individual call for sharing on other platforms
* making it easy to download the call audio for inclusion in an agent's personnel file
* allowing a manager to page through their search results from the call detail page
* recapping the contents of the list view list item at the top of the call detail to preserve context

## Getting there wasn't clean

A critical decision was made by product leadership, informed by the local engineering team, at the beginning of this project: to deliver a call-center-focused call review experience by building a new UI alongside the existing calls list rather than reworking it. This was attractive to product management because it was believed that this would be the quicker path to launch, and because we could focus on serving contact center folks rather than also having to figure out how to accommodate marketers. Since marketers were the primary users of Invoca, disrupting their workflows would be especially dangerous.

The call-center-focused engineering scrum team agreed, but there was great disconcert elsewhere in the engineering organization. Objections from outside the project team would come up repeatedly during development, requiring product and design leaders such as myself to repeatedly practice goal maintenance - the habit of returning attention to users, and the value we were hoping to bring them, to manage or dispel internally-focused objections. (I mention goal maintenance in my recent post about product vision: [Vision isn't magic](https://jonplummer.com/2026/07/09/vision-is-not-magic/).) Goal maintenance also proved critical as the engineering team's local management changed hands twice during the project, and the head of call center product management also left.

Another wrinkle: engineering teams at Invoca were not used to having their work reviewed by UX people. Often they did not ask questions of UX at all, just plowing through implementation and making decisions on their own that deserved trio discussion. And when we pointed out that UX wanted not just to see demos but comment on them, objections of "raising a gate" and "wasteful delay" arose. SPAN metrics to the rescue – once we showed that UX questions were typically answered within hours, and by short discussion if need be, the correct framing emerged: "it's like code review, but for UX."

## There was more to do

Post-launch we kept improving Call Review Console, allowing people to

* search and filter on comments
* mark a call as reviewed so managers didn't duplicate effort, and filter on this fact
* in the list view, see which calls they had not yet looked at in this session
* in the list view, which call they were just visiting the detail view of
* see sentiment scores
* fill in scorecard values manually

## What came of it

Initial customer response was enthusiastic, with key customers reporting that they were able to spend less time and deliver higher-quality feedback to their call center agents. Usage of the original list view dropped to less than half. Sales engineers reported a lift of 12% that they largely attribute to Call Review Console, though this is anecdotal and there are many confounds. Over the year and a half following Call Review Console's initial launch, sales to contact center customers grew from ~$4MM to $12MM+ ARR.

*I've been loving the beta and now my agents know where they stand, hint hint.*<br>*—Call Center Leader at a national automotive retailer*

*Oh my. Gimme a minute to soak it in. This is nice.*<br>*—QM Manager at a major health network*

## Why this kind of interface matters

Call review is, at its core, a verification interface. A manager is checking what the system observed – an AI-analyzed conversation – and deciding whether it's right. the machine is helping them, and they are helping the machine.

As AI takes on more of the observation layer in enterprise software, the interfaces that let humans check, score, and act on what AI found become critical. Getting that design right is the challenge we were solving at Invoca. It's one that's only going to get more common.
