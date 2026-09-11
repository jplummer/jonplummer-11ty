---
title: Prototyping in a regulated environment
layout: layouts/single_post.njk
date: "2026-08-27"
tags:
  - post
description: AI can help us prototype quickly and more completely than ever before. And this is helpful in regulated environments where a fully-documented product is essential.
ogImage: /assets/images/og/2026-08-27-prototyping-in-a-regulated-environment.png
---
When people worry about applying AI to regulated product development, they're usually worried about the wrong phase.

The FDA is not watching your exploration. It doesn’t care how many prototypes you made or how fast you made them. It cares about delivery: proof that what you shipped is fit, right, and documented as such. Proof that you made what you said you would, and that it works as you say it does. In a regulated environment that documentation is half of what you're building; without it there's no approval and no product.

That shows you where the constraints are and the opportunities. You can't be agile in delivery, but agility in exploration is fine. And I encourage it.

The old habit was strict waterfall. The FDA said "don't agile," so we didn't. Building was slow, so we specified as much as we could before anything was built. The states, the errors, the exact wording someone reads mid-procedure, all went into the documentation at the beginning, and then we hoped it would survive building and human factors review. Everyone knew this was awkward, but we did it anyway, because the regulations and accepted "design control" process seemed to require it.

## Benefit, concept, detail

I think of product design in [three segments](/2022/10/22/the-bones-of-my-emerging-philosophy-of-ux-research-and-design/): benefit, concept, and detail. Benefit is the happy result of the customer’s problem actually being solved. Concept is the approach your product takes to deliver it – the interaction model, the general architecture of the experience. Detail is the specific implementation: exact flows, affordances, wording, and behavior. There are many possible benefits for any given problem and many possible concepts for any given benefit, and picking well at each step, with the customer’s help, is most of what design and product management should actually be doing.

The regulatory agencies aren't particularly interested in benefit or concept iteration. [They become very interested](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/applying-human-factors-and-usability-engineering-medical-devices) when you nail down the concept and start working on the details.

AI prototyping tools are most useful in the phases that don’t trigger that scrutiny. They make exploration cheap: more variations, more sessions, more edge cases than you could have spent time on before. Every cycle you run through benefit or concept before committing to detail is a better-informed commitment. You arrive at the detail phase with a tested concept and evidence for why you chose it over the alternatives.

Evidence of your design choices matters too: in a regulated environment, design decisions have to be defensible. An AI-accelerated exploration can produce both better designs and their rationale. You can show what you tried, why you landed where you did, and what the evidence was. Your regulatory affairs people will like this.

## Pushing formative and summative closer together

Human factors engineering under [IEC 62366](https://www.iso.org/standard/63179.html) already draws this distinction. Formative studies happen early and inform the design, while summative testing checks that the built object, is actually something users can work with safely.

Formative studies have always existed; the problem was what you could put in front of someone. Formative work done with a prototype that barely functions doesn't get you very far. You run the sessions, you collect your observations, and you often can’t tell whether you learned about the design or about the limitations of the prototype. Ideally you are pretty sure you'll sail through summative because your formative results were strong, but the farther your prototypes are from reality the less similar those results are. A thin prototype gives you thin measurements, and the specification relies on those measurements. Whatever you got wrong stays hidden until summative testing. So summative accidentally becomes the first real test – validation doing the work of learning, at the latest and most expensive moment.

At Medtronic MiniMed I worked on a display we called [Insulin On Board](/2013/12/06/minimed-next-gen-pump-interface/). After a dose of insulin, a patient whose blood sugar remains high wants to know whether it’s safe to take more insulin to correct. The answer depends on how much of the prior dose is still unmetabolized, a math problem nobody should be doing while stressed about their condition. So we supported a number with a shape that visibly depletes as the insulin is consumed. You look at it and you get a feeling for where your blood sugar is headed. We didn't predict your future blood sugar level (FDA no likey), but we didn't just give you a number and hope you'd do the math.

Getting to a concept like that takes trying several things, watching people explain them back to you, war-gaming the scenarios with real customers, and finding out that most of what you tried was wrong. We prototyped; not delivering actual medicine, of course. The prototypes were thin, barely worked, and weren’t convincing. It was hard to know whether we were learning what we hoped to learn.

## But now…

That’s the part that has since changed. A prototype can now be complete enough to be believed, even built on existing production code, with states and errors that behave just the way the product will. You can introduce it into a patient’s or a caregiver’s actual scenario and see how it grabs them. The formative session stops being a test of the prototype and starts being a test of the concept.

This is where someone in quality or regulatory affairs starts to get twitchy; if the thing got built fast, with AI help, who can account for how it behaves? There's no requirement it traces to, no reviewer who signed off on the logic, nobody who documented what it actually does. Design controls exist precisely so that every part of what ships traces back to something a person chose and something a person verified. You can be confident in the rightness of your choices, and you know who to blame when things go wrong.

They're right to be nervous, if AI is making decisions about your product. If AI-generated code ends up without human understanding and verification in the shipped device, you're incurring risk nobody has quantified. AI is not there to take the blame.

But an AI-assisted prototype is not part of the product. Nobody asks for a traceability matrix on a foam model or a paper prototype – those are tools for learning. What you do keep for regulatory purposes is what you tried and what you learned, written down by a person as a design input and reviewed the same way it always was. The specification gets frozen as before, then validated by a summative study that doesn’t care how you got there. What changed is what you’re freezing: something you watched work, rather than something you hoped might work.

I still think the depleting Insulin On Board shape was right, but we didn't have a good way to know that before it went into the specification. We drew it, we argued for it, we wrote it down, and then we waited to find out.
