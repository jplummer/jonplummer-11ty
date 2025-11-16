---
title: Make MVPs experiments again
layout: single_post.njk
date: "2023-11-17T12:00:00-08:00"
tags: post
description: "There seems to be broad agreement within engineering leadership that MVP is (or should be) a philosophy of experimentation and hypothesis testing. An MVP"
---
## Background

There seems to be broad agreement within engineering leadership that MVP is (or should be) a **philosophy of experimentation and hypothesis testing**. An MVP should seek to validate a hypothesis. Literature discusses a Minimum Viable Product as the cheapest and fastest possible experiment that can answer a business question.

Yet our cross-functional teams seem often to be treating MVP as meaning “the first release” or, worse, “the first kind of quick get-it-out-there release” of a feature, improvement, or change. Some passion projects make it to general availability without cross-functional attention. Still other items wind up in the product with a “beta” flag and are not revisited. And rarely is data collected from these to determine if they are successful. We console ourselves with the idea that these are experimental but we often don’t behave as if we are actually experimenting. So we aren’t in these cases fulfilling the idea that an MVP is intended to collect validated learning about customers with minimal effort. What’s worse, we infrequently return to these releases to improve them, withdraw them, or build upon them.

## Problem

The ultimate effect of the above is that there are items we call experiments, half-baked, scattered around the platform, and we have little understanding of their fitness to task for our customers and users. As a result
- Things that should be either deprecated or improved lead to an incoherent and unusable experience for our users, making demos (sales) more difficult and depressing user satisfaction (which can contribute to churn)
- The product has inconsistent interaction paradigms, styling, labeling, and messaging, which enhance the _perception_ of poor usability even when things are sufficiently usable

We say we are "shipping to learn" but we are not doing the work needed to _actually_ learn.

## Goals
- Improve the effectiveness of our live software experiments
- Raise the level of quality visible to users
- Manage downward the overall level of technical and interactive debt visible to users
- Improve teamwork in part by firming up our working definitions of important terms such as MVP, alpha, beta, etc.
- Consider not using the term MVP – it has become so distorted in its use that it lacks useful meaning in practice

## Proposed Intervention

Make experiments experiments again by:

- Carefully selecting projects for live experimentation according to
    - Limited scope
    - Clearly-articulated hypothesis
- Pre-determine the success metrics and decision date for any experiment
- Expose a limited set of customers to an experimental release, producing a basis for comparison (limited release customers vs the rest of the population)
- At the appointed time, on the basis of the agreed-upon metrics, decide to do one of
    - Withdraw the experiment
    - Iterate on the experiment
    - Prepare for general availability/transition to regular feature development process

## Cost/Benefit

**Costs**

- Slight additional effort to plan experiments and evaluate the results
- Additional cost to instrument MVPs so they can be evaluated
- Cost in technically and interactively hardening experiments that succeed (should happen, doesn’t always at the moment)
- Slight additional effort to withdraw experiments that fail
**Benefits**

- Reduced technical and interactive debt due to each experiment having an end date and being either withdrawn or hardened
- Reduced waste releasing fully baked or hardened projects that don't meet customer needs
- Improved interactive quality of items that make it to general availability may lead indirectly to less churn, greater CSAT, improved quality visible to users

## Next Steps
- For new ideas
    - Gain broad agreement on the definition of an experiment
    - Offer guidelines for when to run a software experiment live or to choose other means of experimentation
    - Offer guidelines for running an experiment
    - Pilot by
        - Selecting a hypothesis and means of testing it
        - Setting date and criteria for evaluation
        - Instrumenting, launching experiment, and collecting data
        - Evaluating the results at the appointed time and making the withdraw/iterate/prepare decision, creating a new project if needed
    - Review feedback and results from pilot
    - Share best practices/expectations with department
    - Profit!
- For old ideas (fits with our objective to deprecate crufty and unused things)
    - Offer items to address – what features seem to be experiments that were not evaluated, that are suspect?
    - How do we know if this is doing what it should?
        - We know what result it should produce – measure that
            - It’s doing well – are we happy with the quality?
                - Yes – yahtzee
                - No – remedial “prepare for general availability”
            - It’s doing OK – iterate on the experiment
            - It’s not doing well
                - Is that strategically relevant?
                    - Yes – iterate on the experiment
                    - No – candidate for withdrawal
        - We’re not sure what result it should produce
            - Is it being used?
                - Yes – how and why
                    - …
                - No – candidate for withdrawal

Things we need to teach/encourage/expect/insist on
- Working from hypotheses and measures
- Feed the innovation pipeline with clarity on customer problems we are interested in solving
- Consider examples at various sizes/complexities to break down into experiments
- Need a company-wide framework to help us consider ideas for experimentation, from the customer problem/jtbd/benefit
- Raise the level of direct product use knowledge/experience among engineers and designers – better have operated the thing you are working on
