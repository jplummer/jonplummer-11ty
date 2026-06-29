---
title: The agent will not ask
layout: layouts/single_post.njk
date: "2026-06-29T12:00:00-07:00"
tags: post
description: When a developer doesn't know which button variant to use for a destructive action, they can ask. An agent won't.
ogImage: /assets/images/og/2026-06-29-the-agent-will-not-ask.png
---
When a developer doesn't know which button variant to use for a destructive action, they can ask. They can search Slack, check Storybook, peek into the codebase, or ask someone nearby.

An agent composing UI on the fly isn't going to ask. It works from what you give it – component names, tokens, usage rules – and produces something. If your design system is thin or doesn't match the code, it produces something that might work, but looks and feels like it came from a different product.

The usual case for a design system – consistency, faster development, better handoffs – is strong. But agent-composed UI adds new pressure: the agent has to infer what a designer would decide and a developer would implement. Which component for which context. What token to use to signal danger. The gap a designer or developer bridges with judgment, an agent bridges with documentation – or doesn't bridge at all.

Design systems built for human teams often have gaps. Naming that made sense to whoever set it up. Usage guidance that lives in one person's head or feels like common sense. Tokens named by value – color-red-50 – when an agent needs a name that tells it the role: color-action-destructive.

Humans are good at inferring intent; agents take you literally.

What agents need is exactly what developers have always needed: components with clear, semantic names; tokens named for their role; usage guidelines that match the code; usability and accessibility baked into components and patterns.

If your design system is a Figma file and tribal knowledge, an agent will show you why that's not enough. If it's well-documented and semantically named, an agent can compose something that feels like part of your product.

Nothing about this is new work. You just have a new user for your design system, and it's not going to work around the gaps the way a person would.
