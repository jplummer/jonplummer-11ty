---
title: Datto Secure Edge Network Appliance for WFH
layout: layouts/portfolio_detail.njk
date: "2021-01-01T12:00:00-08:00"
tags: portfolio
draft: true
coverImage: 2022/12/Screenshot2022-11-11at3.30.55PM.png
coverPosition: center 14%
coverZoom: 1.2
description: A work-from-home network gateway with two lights and two audiences – the homeowner who plugged it in, and the IT department actually responsible for it.
---
## The situation

Imagine bringing your work laptop home and connecting to your corporate network and to its VPN, merely by selecting your corporate network from your WiFi menu. That's the idea behind the Datto Secure Edge AP421. It was an especially relevant idea while were were all quarantined during the initial waves of COVID-19.

An MSP, the IT company a business hires to manage its network, sends the device to an employee's home, and from that point on it has to serve two different groups at once: the employee who plugged it in wants an easy, reliable setup and fast access to their work, and the MSP who's actually responsible for it working wants it to work and to be easily able to fix things when it goes wrong.

At Concentric Sky, I led the design of the AP421's setup and authentication flow for Datto: the LED behavioral key, the state diagram that reconciles all four setup modes, the authentication and session logic that ties the device to Datto's network, and a full redline of the printed setup guide. The job was making sure the device's lights, its captive portal, and its companion app all told the same story about the same system.

## A light is a narrow little communication channel

The AP421 has two lights. Off, slow blink, fast blink, solid. That's the entire vocabulary available on the hardware itself, and it has to describe a setup sequence with many steps and failure modes: starting up, no internet, internet established but still checking in with the MSP, no service, showtime.

The obvious mistake is treating all of those failure states the same way. They aren't the same. "No internet" is something the person in the house can fix. A cable's unplugged, a router's off, they chose the wrong WiFi network; they can see the fix and do it themselves. "No service", meaning the device can't check in with the MSP, can't authenticate, can't establish its VPN, is not something the person in the house can do anything about. Only the MSP can fix it.

If we try to cram all of this startup information onto one light, whoever's looking at the unit either can't tell what to do, or gets told to fix something they have no power over. Getting the state diagram right meant keeping user-addressable and MSP-addressable failures visibly distinct, so the four-blink vocabulary could actually be used to determine what went wrong.

Four setups, one vocabulary

The AP421 supports four different setup paths: AP mode, Repeater mode, Mesh mode, and Prioritized Traffic Mode. Each has its own sequence of needed operations, its own ideal walkthrough, its own quirks (mesh mode auto-connects; prioritized traffic mode needs additional wiring and a mode change). Mapping all four side by side, operation by operation, was how we confirmed something that mattered more than any single mode: the device's status vocabulary, the same lights, the same states, had to mean the same thing regardless of which path someone took to get there. A light language only counts as a language if it holds across all four modes.

## Where hardware meets a login screen

The setup and authentication flow is where the physical device and the software experience have to agree with each other. An MSP always pre-assigns the AP421 to a corporate network, and not to a person. That ordering matters: the device has to be associated with a network before any individual's login means anything, so the setup flow runs through two separate checks: device association, then user authentication. The light has to be able to represent both states independently.

From there, the flow branches on what's already true: no internet, internet but no service, or showtime. Each state routes a newly connected client to a captive portal or setup URL, through an org code, then to the organization's own login, often an external SSO redirect Datto doesn't control the design of. A returning client, one the system already trusts, sails through most of that automatically. Session logic sits underneath all of it: a client gets re-challenged for authentication once 90% of session length elapses, or after eight hours, whichever comes first, and a successful reauth resets the clock. None of that is visible to a user in normal use. It has to work correctly anyway, or the visible parts fall apart.

One open tension we flagged rather than resolved outright: whether to broadcast the corporate SSID before or after first authentication. Broadcasting early is more convenient. Waiting is more secure. The eventual answer depended on whether setup happened over wired or wireless connection, since a wired setup on an already-authorized device could sail straight through without exposing anything.

## Mockups are not enough

Coordinated experience doesn't stop at the screen. It has to survive into the printed guide in the box, or the story falls apart at the one point of contact most people actually read. Reviewing Datto's quick setup guide surfaced two kinds of catches.

The first was tone: unnecessary capitalization, an instruction to wait for a light that would turn solid before the user could do anything else useful anyway, so the instruction was better cut than followed. Small things, but they're the difference between a guide that sounds like a person wrote it and one that sounds like it came out of a legal template.

The second was a compliance catch: California law requires consumer networking devices to ship secured, with a unique password, not a shared default. That requirement has to show up in what the setup card actually says the device's credentials are. Missing it doesn't make the copy worse. It makes the product noncompliant in one state.

We also pushed for a short, memorable setup URL with a QR code and search-term fallback ("search for Datto Secure Edge"), so a household member without the printed card in hand still had a way in. Coordinating an experience across hardware, portal, and app is one problem. Making sure all three still agree with each other after they've been printed on paper and can't be quietly patched is a different, harder version of the same problem.

## Lessons learned

A status light signals who's in control of fixing what. Get that signal wrong and you turn one confused person into two: a homeowner calling their IT department about something IT can't touch, and an IT department telling a homeowner to do something they have no way to do. Getting it right means deciding, before you design anything, which failures belong to which person, and building every surface, the LED, the portal, the app, the printed guide, to agree on that division consistently.

This is the same argument I've made about software interfaces, applied to a device that mostly just blinks. Coordinated experience is what happens whenever more than one surface has to tell the truth about the same system at the same time – a screen, a light, or a printed card, it doesn't matter which.
