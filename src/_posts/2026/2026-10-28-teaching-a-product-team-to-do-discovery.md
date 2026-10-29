---
title: Teaching a product team to do discovery
layout: layouts/single_post.njk
date: "2026-10-28"
tags: post
description: "At Cayuse I taught a product team to run discovery interviews. Customer contact went up and the roadmap barely moved. Here's what the training covered, and what it couldn't change."
ogImage: /assets/images/og/v2/2026-10-28-teaching-a-product-team-to-do-discovery.png
---
Product teams have plenty of customer data within reach. Support tickets show where people get stuck, usability tests show whether a design works, and sales calls bring back what buyers ask for. Do teams use it well? Not always, and most of it answers questions about features that already exist. Discovery draws on the same inputs, plus interviews and direct observation, and asks what's worth building.

When I taught about discovery at Cayuse, I split customer contact into three horizons:

- Horizon one helps you ship. Is this usable? Did the release fix the problem?
- Horizon two helps you choose among possible solutions. Which of these designs do people prefer, and why?
- Horizon three helps you find opportunities and decide what's worth building. What problems do people have? Which ones are common or painful enough to be worth solving? Is there a benefit we could offer that's exciting to them and worth it to us?

The first two horizons come naturally once there's something to test. Discovery is horizon three, and coming up with the solution is a separate job. The third has to be scheduled on purpose, because there's nothing to show anyone yet.

At Cayuse, horizon three had no slot at all. Leadership told the product team to understand the markets we serve, and to understand why customers do what they do. The process the team actually followed had no step where any of that happened. Product managers were buried in feature commitments, many of them promises sales had already made to customers, so requests came in and features went out. When leadership ran a start/stop/continue exercise, "train on customer interviewing" landed on the start list. The need was obvious.

So I ran a short [training program](/2022/05/13/discovery-interview-training/) for product managers, product owners, tech leads, and designers: three sessions over four weeks, with homework in between. Session one made the case, partly with [NN/g's 2020 survey](https://www.nngroup.com/articles/discoveries-in-industry-revealed/) of 436 UX practitioners. Of those whose last project included discovery, 83% called it a success, against 52% without, and failures dropped from 16% to 4%. It's self-reported and a convenience sample, so I read it the way NN/g does, as a cut in risk more than a promise of success. Then everyone paired up with a buddy, wrote a research question and a topic list, and went and did an interview. I told them at the outset that I'd rather they interview a little badly than not at all.

The first session built up to the research question, because it decides more about how an interview should go than anything else. The questions people are most tempted by are about the product. Which design is best? Is this usable? Will people buy it? An A/B test answers the first and a usability test answers the second. The third asks people to predict their own behavior, which they're bad at. "What do people want?" isn't a good research question either – but it can be once it's about a process: what's good and bad about how they do this today? A business goal can turn into one too. One example came from my Belkin days. "How do we reduce support costs for our WiFi router?" becomes "How do normal folks think about setting up a router, and where does our setup support or clash with their understanding?" (We also turned the method on ourselves, with a question about why the built product looked so different from the design.) The topic list grows out of the research question, and the interview follows the topic list.

The training went over well. Some PMs started interviewing their own customers, and doing it better (the homework had made everyone do at least one). Others brought UX in to help run theirs. Across the team, customer contact and learning went up.

The project mix barely changed. The roadmap was already full of commitments made before any of those interviews happened, many of them with deals signed on the condition that a feature shipped, so what the PMs learned had nowhere to go. That was a leadership problem, and a training for product managers didn't touch it.

If I taught it again, I'd add a session about what happens after the debrief. Teams that start doing discovery often need help using what they learn. Some of that help is skill, and some is structure. Learning needs a point in the process before the roadmap is committed where a finding can move a project up, down, or off the list. Without one, the team finds out what's wrong with the plan while shipping the plan.

Coding agents change horizons one and two a lot. I can build a dozen working variants of an interaction in less time than it takes to plan a meeting about them, then put them in front of customers. ([Here's one](/2026/06/08/quick-prototypes-beat-thinking/).) And UX can fix usability issues as we find them, issue a PR, and let engineering approve it.

Horizon three stays where it was. A working prototype tells you which version of a solution people understand; it can't tell you whether the problem underneath was worth solving, and a fast build makes it easy to skip asking. I wrote about keeping a check on whether an idea is still the right one in [Vision isn't magic](/2026/07/09/vision-is-not-magic/). Discovery is where that check starts.

The two decks from the Cayuse training are posted as a [PDF](/assets/pdfs/2022/05/discovery-interview-training.pdf). If you run something like it, I'd start where we did, with the research question. And before the first session, I'd find out where in your process the findings are supposed to go.
