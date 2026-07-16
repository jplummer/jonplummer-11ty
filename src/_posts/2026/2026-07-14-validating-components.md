---
title: Danielle asks about "validating components"
layout: layouts/single_post.njk
date: "2026-07-14T12:00:00-07:00"
tags: post
description: It's tempting to try to prove that your design system components are good. But you can't test a button out of context.
ogImage: /assets/images/og/2026-07-14-validating-components.png
---
Danielle asks:

> Does anyone have experience doing research on design systems? Specifically, validating existing components? Would love to learn from anyone who has done something similar, or could point me to resources like articles, etc.

There are three topics here:

1. testing components and patterns to demonstrate their fitness and find problems to fix
2. preventing errors when authoring components
3. preventing errors when building things that use those components

In re the first, I've seen usability or accessibility problems surface that could be traced to a component and then fixed there, but I've not found a way to validate components out of context. You can put a bunch of components on a plausibly-constructed page and run `axe-core` over it to get some light accessibility auditing of those components, but that doesn't cover a ton, it just rules out egregious mistakes.

You might have better luck testing *patterns* rather than *components* because a pattern has a natural context for the interaction: a larger assembly such as a file upload widget, with its various behaviors and states, can be put into a testable workflow (or just observed in a real workflow in the wild) and its problems detected and sorted out at the pattern and component level.

Second, if you are worried about catching mistakes when *authoring* new components, contracts might be your friend – for example, every `INPUT` element should have label association, error association, focus-visible, touch target size, zoom/reflow, etc. and an agent skill could be written to watch for those things when a PR hits the design system in code.

When Gov.UK publishes design system updates they sometimes have a blurb about what they've learned about that component. For example, see the "research on this component" heading on [https://design-system.service.gov.uk/components/details/](https://design-system.service.gov.uk/components/details/). Another example: [this DWP Design System page about filters](https://design-system.dwp.gov.uk/contribute/filters) has a list of theories about a filter component, with some tests. Note that the context is critical.

Third, you can have instructions in your design system in code for the agents that build with it to help them fulfill your quality standards, assuming you've documented these in a place the agents and humans will find them. These same instructions can be used to evaluate new or changed work before a PR is merged.
