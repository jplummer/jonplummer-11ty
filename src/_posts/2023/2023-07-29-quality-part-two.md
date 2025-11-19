---
title: Quality, part two
layout: single_post.njk
date: "2023-07-29T12:00:00-08:00"
tags: post
description: "It seems like we have a pretty good grasp of what quality should be when it comes to infrastructure – what technical soundness is, how much load we should"
---
It seems like we have a pretty good grasp of what quality should be when it comes to infrastructure – what technical soundness is, how much load we should handle, what kind of logging, etc. but we are less mature regarding other dimensions of quality.

An interactive item in general availability, operated by customer users, should
- be valuable to specific users
    - deliver value in results and conveniences
    - minimize toil
    - and this should be verifiable by experiment and by monitoring success metrics/adoption rate/etc.
- be usable by those users
    - intelligible
        - and this should be made more likely via concept testing, and somewhat verifiable by experiment and by monitoring success metrics/adoption rate/etc.
    - obvious in expected actions and right action (design guideline)
    - makes success obvious (design guideline)
    - makes good use of familiar controls and interaction paradigms where possible (design guideline)
    - and this should be made more likely through user testing, and monitorable via success rate/time on task/error rate/etc.
- be complete in its states, messages, and errors (design guideline)
- be instrumented so we can witness users’ successes and difficulties

There’s some disagreement about how important interactive quality might be for infrequently-operated configuration tasks in the platform. The irony is that an infrequently-operated item is not practiced frequently enough by a user to be well-learned, so it must be _more_ obvious in its operation than something they do every day. So to the above there’s pressure to add
- be self-explanatory, relying on recognition rather than training and recall

For products in a growth phase, where catering to new users and bringing them to intermediate proficiency is arguably more important than catering to existing power users, “be self-explanatory, relying on recognition rather than training and recall” is also important for the most critical, central workflows.

Some attention to interactive quality is important even in experiments, since poor interactive quality can confound our measurements. For example,

- If it is not usable we may not learn what we hope to learn from an experiment or a beta – since actual use will be hampered.
- If it is unpleasant to use, its uptake will be blunted unless the value strongly outweighs the problems.
- If it is not visually credible, confidence in its function will be blunted.
- If it contains needless toil it will be unpleasant, time on task will be high, error rate may be high.

Some confounding factors inhere more strongly to “complete” features rather than experiments:

- If it is incomplete in the intended use cases it will seem broken.
- If it is incomplete in its states, messages, and errors for the covered use cases it will seem broken.
- If it is not obvious it is not usable. This is just a facet of usability that we should strive for in every delivery to live users.
- If it is not self-explanatory it has poor usability and increases the cost of training, which is backward from what we plan to do.
- If it is poorly-labeled it is not usable. This is just a facet of usability that we should strive for in every delivery to live users.

The general idea is that scope should scale but quality should not. All of these are achievable in small scopes and if we care about quality are not “extra” costs.
