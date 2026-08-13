---
title: The agent will not ask
layout: layouts/single_post.njk
date: "2026-06-29T12:00:00-07:00"
tags: post
description: When a developer doesn't know which button variant to use for a destructive action, they can ask. An agent won't.
ogImage: /assets/images/og/2026-06-29-the-agent-will-not-ask.png
---
When a developer isn't sure which button variant to use for a destructive action, they can ask. They can search Slack, check Storybook, peek into the codebase, or ask someone nearby.

An agent composing UI on the fly isn't going to ask. It's going to work from what you give it – component names, tokens, usage rules – and produce something. If your design system is thin or doesn't match the code, it will make something that might work, but will look and feel like it came from a different product.

The usual case for a design system is strong: consistency, faster development, better handoffs. But agent-composed UI means that system needs to be dialed in much better. The agent has to infer what a designer would decide and a developer would ask about. Which component for which context. What token or variant to use to signal danger. The gap a designer or developer bridges with judgment, an agent bridges with the help of documentation or doesn't bridge at all.

Design systems built for human teams often have missing pieces. Inconsistent naming, missing usage guidance, primitive tokens named by appearance (`color-red-50`) when an agent needs a name that tells it the role (`color-action-destructive`), an over-reliance on common sense that the agent doesn't have – any of these can derail the agent's otherwise pretty good work.

Humans are good at reading between the lines; agents take you literally.

What agents need is exactly what developers have always needed: components with clear, semantic names; tokens named for their role; usage guidelines that lead you to choose the right code; usability and accessibility baked into components and patterns.

If your design system is a Figma file and tribal knowledge, an agent will show you why that's not enough. If it's well-documented and semantically named, an agent can compose something that feels like part of your product.

Nothing about this is new work. You just have a new user for your design system, and it's not going to work around the gaps the way a person would.
