---
title: "Prioritizing accessibility (conference talk)"
layout: layouts/portfolio_detail.njk
date: "2022-11-01T12:00:00-08:00"
tags: portfolio
coverImage: 2022/11/conference-talk-prioritizing-accessibility-page-12.png
description: "Connect by Cayuse 2022 talk on moving accessibility from audit-and-fix to designing it in through the design system, and why we said no to overlays."
ogImage: /assets/images/og/2022-11-01-conference-talk-prioritizing-accessibility.png
---
Connect by Cayuse is the company's annual customer conference, held online in October 2022. This was my Day 3 session, co-presented with Heather Ward, the product manager responsible for initiatives that cut across products, including accessibility. Our customers – universities and research institutions – have a legal duty to give their staff accessible tools, which makes our accessibility status their problem. The talk reports on that status and on how we were changing the practices behind it.

The argument in the middle is the most important part. The process I inherited was audit-and-fix: ship, have a third party audit it, triage the Accessibility Compliance Report (here mistakenly called the VPAT), fix, ship again. It works and it's measurable, but nothing in it stops you making the same mistake next time, and it's "inspecting quality in" rather than building it in. The change was to route audit findings into the design system, so that a problematic button or dropdown or modal that is improved is fixed everywhere it's used, in every product, from then on. The design system is a key accessibility mechanism. The other position that still holds true: accessibility overlays don't work, so I can't recommend them.

![conference-talk-prioritizing-accessibility page 1](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-1.png)
*Page 1: I'm Jon Plummer, director of user experience design at Cayuse. With me is Heather Ward, the product manager in charge of initiatives that cut across products, like globalization and accessibility. I'll present; Heather is responsible for some of the smarter things I might say, and she'll watch the chat and answer questions as we go.*

![conference-talk-prioritizing-accessibility page 2](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-2.png)
*Page 2: We'll talk about: What accessibility is and why we care. What our process for improving it has been over the past year and how it's evolving. An enabling technology we've introduced that should help us make progress faster and more consistently. A brief aside about a quick fix some organizations try that we will not be trying. And what we think our results will look like.*

![conference-talk-prioritizing-accessibility page 3](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-3.png)
*Page 3: Accessibility is commonly thought of as making your product available to people with disabilities, and our thoughts then turn to the deaf, the blind, wheelchair users, and the special things we might do to accommodate them. We prefer to think of it as doing our work in a way that's inclusive of everyone: making information, activities, and environments sensible, meaningful, and usable for as many people as possible. Good accessibility practice tends to make the experience better for everyone.*

![conference-talk-prioritizing-accessibility page 4](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-4.png)
*Page 4: Not every disability affects a person's ability to operate a browser, but difficulties with vision, hearing, cognition, and dexterity do, often profoundly. Clear statistics are hard to come by; the UN fact sheet on persons with disabilities is a decent source, corroborated by the World Health Organization. About 3.5% of the world reports a visual disability, 5.9% a hearing disability – more people than live in the United States – and 2.7% a cognitive disability. Dexterity numbers are hard to find. And these are people who consider themselves to have a disability. I wear an assistive device on my face (my glasses) and don't count myself, so the real numbers are larger.*

![conference-talk-prioritizing-accessibility page 5](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-5.png)
*Page 5: Microsoft's inclusive design graphic makes the point. Some disabilities are permanent, some temporary, some situational. When I hurt my knee, getting in and out of the shower was a chore, but I didn't consider myself disabled. Any of us might find our health, our work situation, or just the conditions around us making one of our faculties harder to use than it once was. So the group we're designing for is much larger than the statistics on the previous slide. It's everyone.*

![conference-talk-prioritizing-accessibility page 6](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-6.png)
*Page 6: Inclusive design is also legally required. This list, too small to read, is 25 laws in various countries that either explicitly require accessible environments, tools, websites, and applications, or forbid discrimination on the basis of disability. There are more than 40 laws, regulations, and guidelines in all, mostly in North America and Western Europe, but India, China, Korea, Taiwan, Japan, and Israel are on the list too.*

![conference-talk-prioritizing-accessibility page 7](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-7.png)
*Page 7: Compliant with what? For web-based software the gold standard is the W3C's Web Content Accessibility Guidelines, WCAG, and 11 of the 25 laws mention it explicitly. So it's a reasonable way to gauge the health of an accessibility practice.*

![conference-talk-prioritizing-accessibility page 8](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-8.png)
*Page 8: Our accessibility statement, on the website, is a promise to customers that we have a process and are making continuous progress toward our chosen standard. Specifically: we use third parties to audit our work against WCAG, we use those audits to prioritize fixes, and we report periodically on the results.*

![conference-talk-prioritizing-accessibility page 9](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-9.png)
*Page 9: This is a note I go over with my designers from time to time. It's possible to make software that's completely WCAG compliant that people still struggle with, and software that isn't fully compliant that people use easily and pleasantly. Measuring compliance is convenient because the guidelines are objective and you can check them off. But a user-centered approach that considers how a variety of people will use the thing, and tests it with them, matters more for practical accessibility. You can see the tension in the words themselves: a VPAT is a Voluntary Product Accessibility Template, and WCAG's last word is Guidelines. They aren't strictures. They say what accessibility goal to reach, and there are many ways to reach it.*

![conference-talk-prioritizing-accessibility page 10](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-10.png)
*Page 10: The process in place when I arrived: ship a new version, have our third-party partner audit it and produce a VPAT, triage what they found into "fix now" and "fix next," make the fixes, ship again. It's cyclical, it measures our improvement over time, it uses experts, we can say definitively that an issue is resolved, and we can focus investment on the biggest items. But nothing in it prevents making the same mistake again, the lead time to an accessible result is long, and it remedies problems rather than producing something accessible at its core. It "inspects quality in."*

![conference-talk-prioritizing-accessibility page 11](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-11.png)
*Page 11: The process does work. Several apps have been through multiple audits; our Human Ethics product went from 115 identified issues to 35 across three audits, a 70% reduction in one calendar year.*

![conference-talk-prioritizing-accessibility page 12](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-12.png)
*Page 12: The goal now is to design accessibility in rather than inspect it in. Audit feedback is categorized, so we can find the themes with the most problems and go after those. Instead of just repairing what the audit found, we improve the design system: the patterns and components, the behavior we write for buttons and dropdowns and menus in general. Then the next thing built from those parts has that area of concern lopped off, in every product. It's more work, it needs more documentation and more adaptation from design, engineering, and QA, and when a problem reaches the wild the fix cycle is just as long. But the number of recurring issues drop, new work is more likely to be accessible from the start, some issues are caught before they could ever reach an audit, and the whole team learns instead of waiting for bad news.*

![conference-talk-prioritizing-accessibility page 13](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-13.png)
*Page 13: The enabling technology here is the design system, which we hope soon becomes a pattern library. Every application has the same basic pieces – menus, tables, buttons, navigation – and each one needs to be well-specified: its color, its type, its behavior, how a screen reader and other assistive technologies address it. Nail those down, build from them, and what we produce is more likely to be of high quality, experientially and accessibly. Groups of them become patterns and shared features. It's not only for accessibility; style and even language usage fit here. The intent is a kit of parts of ever-increasing quality.*

![conference-talk-prioritizing-accessibility page 14](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-14.png)
*Page 14: The maturity model from design system to pattern library. You start with brand guidelines and component styles, then behavior, then delivering designs from the kit, and soon it's to engineering's advantage to share code for the same parts. We have most components defined, most behaviors defined, most components grouped into patterns, and guidelines for which to use when. We're pushing into getting them expressed in code so engineers can share them. As with all good things, there's more to do.*

![conference-talk-prioritizing-accessibility page 15](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-15.png)
*Page 15: The quick fix we will not be trying: the accessibility overlay. If you've seen a little stick figure in a circle in the corner of a website, that's one. Companies pay dearly for them, and they claim to make an inaccessible site accessible through machine-learning magic. They don't. They need user interaction to start working. They can't fix the most common issues – unlabeled buttons and fields, keyboard navigation, missing alternative content – which only proper authoring fixes. They tend to interfere with the assistive technology people already use, because that technology relies on the page's source code, which the overlay leaves unchanged. Their alternative controls are usually worse than what people have. And they aren't holding up legally: the market leader has been sued repeatedly, and so have companies that deployed it.*

![conference-talk-prioritizing-accessibility page 16](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-16.png)
*Page 16: Practitioners agree. In WebAIM's 2021 survey a supermajority of accessibility practitioners rated overlays not very effective or not effective at all. We've chosen not to implement one, and we hope your organization won't either.*

![conference-talk-prioritizing-accessibility page 17](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-17.png)
*Page 17: Where we stand. Third-party audits put Cayuse apps at WCAG 2.0 AA with some exceptions, the current legal standard in most countries. Each version builds on the last – 2.1 adds small screens, touch, and mobile – and more "A"s means more stringent requirements. We're working toward "2.1 A" by mid-2023, and "2.1 AA," which most organizations prefer, by the end of 2023. WCAG 3.0 is in draft. Accessibility is a moving target and a continuous commitment: as the success criteria evolve, our practice and our target will move with them, so that everyone, whatever their capabilities, can use our software.*

![conference-talk-prioritizing-accessibility page 18](/assets/images/2022/11/conference-talk-prioritizing-accessibility-page-18.png)
*Page 18: Thank you.*

If you like, you may [watch the recording on YouTube](https://www.youtube.com/watch?v=rucBlvKpSUo) (23 minutes). The deck was Google Slides in a work account that's gone, so the pages below are captured from the recording.
