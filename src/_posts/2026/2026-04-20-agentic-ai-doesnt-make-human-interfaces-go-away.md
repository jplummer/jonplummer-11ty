---
title: Agentic AI doesn't make human interfaces go away
layout: layouts/single_post.njk
date: "2026-04-20"
tags: post
description: "Why agentic systems still need clear human-facing design: responsibility, trust, and usability do not disappear when automation gets smarter."
ogImage: /assets/images/og/2026-04-19-2026-04-20-agentic-ai-doesnt-make-human-interfaces-go-away.png
---
The case for human interfaces becoming obsolete is getting more sophisticated. It used to be "AI will do everything" – easy to dismiss. Now it sounds like [Matt Webb's recent piece on headless architecture](https://interconnected.org/home/2026/04/18/headless): services need to expose their capabilities as CLI tools and APIs for AI agents, making the visual front-end "sacrificial" – encountered once or twice to get the vibe, then handed off to an agent who never needs to see it. That's a more interesting argument.

I think that's only partially right. Headless software is on the way. Agents are genuinely better than GUIs for a lot of repetitive tasks. And Jeff Gothelf [put it well recently](https://jeffgothelf.com/blog/vibe-coding-surfaces-the-questions-product-management-answers-them/); the cost of building has dropped to near zero.

But several other costs didn't change, or didn't change much:

* The cost to support user trust didn't fall.
* The cost of knowing whether the system delivered what it promised didn't get lower.
* The cost of responding to a mistake an agent made on your behalf didn't go away.

When an AI agent does something unexpected – and it will, just as a person does – the user needs to inspect the system's state, understand what happened, decide whether it's right, and tweak it if it's not. That's not a chat conversation; "explain what you did" gets you a plausible summary, not an audit trail. You need an interface that exposes the objects the agent operated on, their current state, and the relationships between them – something a human can look at, poke around in, and believe.

The "just talk to your AI" folks paper over this by assuming users know exactly what they want, can specify it precisely, will recognize an incorrect result when they see one, and will know how to ask for a correction. Every one of those is an interface design problem waiting to happen. Real users often need to be led to value: shown what's possible, guided toward good configurations, helped to see that the system actually did the right thing.

A company serving a market and actually learning about their customers and prospects has accumulated expertise about that domain that no individual customer has, and a well-designed product expresses that expertise in its ability to lead a customer to right action. A personal AI that generates a piece of bespoke software on demand doesn't benefit from that knowledge.

There's an engineering-minded version of this worth acknowledging. APIs are a bit brittle compared to what an agent can do with a well-designed MCP; the agent can reason about tools, compose them, and adapt to partial failures. That flexibility is valuable. But MCP tools still have schemas and the underlying objects still need to be coherently designed. A poorly conceived MCP tool or underlying model is just as brittle, or worse if the agent confidently does the wrong thing instead of throwing a clean error. The technical design work doesn't disappear: it moves upstream to the object model, the capability definitions, the semantic coherence of what you're exposing. That's more foundational design work, not less.

None of this is an argument for forcing users through rigid prescribed workflows. The right response to the agentic era isn't to wall off capabilities or ignore the headless trend. It's to design both surfaces from the same foundation: the human-facing layer for initial trust, inspection, and correction; and the agent-compatible capabilities underneath. Same objects, same data model, two interaction methods. The front-end and the agent tools should be driving the same underlying model. This is, incidentally, what API-first development has been asking us to do for years.

Interfaces are becoming harder to design well, not less necessary. The object model has to be right for both interaction types. The visible informational layer has to foster trust. The inspection and correction paths have to exist. Since users will operate the human interfaces less often, they need to rely less on training and recall, and rely more on recognition. And someone still has to understand the users well enough to know what value looks like and design toward it.

The cost of knowing what to build didn't get smaller. Neither did the cost of helping people trust and use what you built. That's the product management and design work. AI didn't wave it away. It just made it more important to get right.
