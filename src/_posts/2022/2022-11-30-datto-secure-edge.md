---
title: Datto Secure Edge Network Appliance for WFH
layout: layouts/portfolio_detail.njk
date: "2022-11-30T12:00:00-08:00"
tags: portfolio
coverImage: 2022/11/datto-led-behavior.png
coverPosition: center center
coverZoom: 1
description: A work-from-home network gateway with two lights and two audiences – the homeowner who plugged it in and the IT department responsible for keeping it running.
ogImage: /assets/images/og/portfolio.png
---
## The situation

Imagine bringing your work laptop home and connecting to your corporate network via VPN merely by selecting your corporate network name from your WiFi menu. That's the idea behind the Datto Secure Edge AP421. It was an especially relevant idea while we were all quarantined during the initial waves of COVID-19.

An MSP (Managed Services Provider), the IT company a business hires to manage its network, sends the device to an employee's home, and from that point on it has to serve two different groups at once: the employee who plugged it in wants an easy, reliable setup and fast access to their work, and the MSP who's actually responsible for it working wants it to work and to be easily able to fix things when it goes wrong.

At Concentric Sky, I led the improvement of the AP421's setup and authentication flow for Datto: the LED behavioral key, the state diagram that reconciles all four setup modes, the authentication and session logic that ties the device to Datto's network, and a full redline of the printed setup guide. The job was making sure the device's lights, its captive portal, and its companion app all told the same story about the same system.

The project was constrained a bit: Datto was in a hurry, and they were repurposing an existing product, so the board, enclosure, silkscreen, and several functions of the hardware were already locked. This is not ideal, but it is incredibly common when hardware companies are trying to respond to new opportunities quickly. We had to make the setup process and device behavior fit the capabilities and appearance of that existing device, not design something custom for the situation.

## A light is a narrow little communication channel

The AP421 has three green lights and no pulse-width modulation (so no breathing or fading effects, just on and blinking). And one of the lights isn't available to us, reserved for mesh setup. So really, we have two. Off, slow blink, fast blink, and solid is the entire vocabulary available on the hardware itself, and it has to describe a setup sequence with many steps and failure modes: starting up, no internet, internet established but still checking in with the MSP, no connection to the corporate network, showtime.

The obvious mistake would be treating all of those failure states the same way. But "no internet" is something the person in the house can probably fix. A cable's unplugged, a router's off, they chose the wrong WiFi network; they can see the fix and do it themselves. "No service", meaning the device can't check in with the MSP, can't authenticate, or can't establish its VPN, is not something the person in the house can do much about. Only the MSP can fix it.

If we try to cram all of this startup information onto one light, whoever's looking at the unit either can't tell what to do, or gets told to fix something they have no power over. Getting the state diagram right meant keeping user-addressable and MSP-addressable failures visibly distinct, so the four-blink vocabulary could actually be used to determine what went wrong.

![LED behavioral specification](/assets/images/2022/11/datto-setup-state-diagram.png)
*Making LED behavior simple and clear is a challenge with a limited vocabulary. The best LEDs can do for the end-user is to support what they are seeing in other interfaces, and to be clear enough to be described accurately during a support call.*

## Where hardware meets a login screen

The primary challenge is making an intelligible and straightforward setup workflow that people working from home can accomplish. The device's physical behavior, software experience, quick start guide, user knowledge, and MSP pre-work all need to mesh together to. And the physical and software behavior need to support each other to foster user confidence and understanding during the setup process. If they come apart, user confidence will be dashed, and they will never believe in the system.

![Setup and daily-use workflows, combined](/assets/images/2022/11/datto-workflow-intermediate.png)
*Simple is often complicated under the hood. But this is because when we make something simple we are taking workload away from the user and putting it into the product. If done well this also reduces the level of knowledge required by the user and reduces opportunities to make mistakes.*

The setup and authentication flow is where the physical device and the software experience have to agree with each other. An MSP always pre-assigns the AP421 to a corporate network, and not to a person. That ordering matters: the device has to be associated with a network before any individual's login means anything, so the setup flow runs through two separate checks: device association, then user authentication. The lights have to be able to represent both states independently.

From there, the flow branches on what's already true: no internet, internet but no service, or showtime. Each state routes a newly connected client to a captive portal, then to the organization's own login, often an external SSO redirect Datto doesn't control. A returning client, one the system already trusts, sails through most of that automatically. Most of the logic is invisible most of the time.

One open tension we flagged rather than resolved outright: whether to broadcast the corporate SSID before or after first authentication. Broadcasting early is more convenient. Waiting is more secure. The eventual answer depended on whether setup happened over wired or wireless connection, since a wired setup on an already-authorized device could sail straight through without exposing anything.

Later we learned that we couldn't trust the MSP to pre-configure all of the devices, so we had to revise the workflow to allow users given an org code to enter it into the captive portal if need be. This is not ideal, but also incredibly common; as organizations got close to the launch date the pressure to cut corners and ship quickly grows rapidly.

![Setup and daily-use workflows, combined, with late-breaking logic changes](/assets/images/2022/11/datto-workflow-revised.png)
*A strong underlying logic isn't distorted very much by twist and turns late in the project – in this case, not having the org code preconfigured is an easy extension to the user workflow, and additional logic helps a second device respond correctly in the presence of the first.*

## Simple is as simple does

If the workflow takes decisions off of the user's plate, the underlying software experience can appear simple, but there are still plenty of states to define. In networking there are also plenty of wait states to handle. And, critically, the setup experience, ideally done once, needs to hand off smoothly into the day-to-day experience.

![Setup wireframes](/assets/images/2022/11/datto-wires-setup.png)
*There are only a handful of user tasks in setup – if not wired, join a wireless network; authenticate to the corporate network; change to the corporate network and get to work. But each of these has a handful of failure modes. Making the happy path simple and speeds most people through the process. Demonstrating success at the end supports user confidence.*

![Daily use wireframes](/assets/images/2022/11/datto-wires-daily.png)
*Visibly linking the hardware and software together reassures users that the system knows what is going on. Using a captive portal to ask for re-authentication prevents users from having to notice a problem and remember what to do about it.*

## Mockups are not enough

Coordinated experience doesn't stop at the screen. It has to survive into the printed guide in the box, or the story falls apart at the one point of contact most people actually read. Reviewing Datto's quick setup guide surfaced two kinds of catches.

![Quick start guide](/assets/images/2022/11/datto-qsg.png)
*If the device and software take work away from the user, then all the QSG needs to do is help them plug it in and then direct attention to the software experience to complete setup.*

The first was polish: unnecessary capitalization, an instruction to wait for a light that would turn solid before the user could react anyway, so the instruction was better cut than kept. Small things, but they're the difference between a guide that sounds like a person wrote it and one that sounds like it came out of a technical template.

The second was a compliance catch: California law requires consumer networking devices to ship secured, with a unique password, not a shared default. That requirement has to show up in what the setup card actually says the device's credentials are. Missing it doesn't make the copy worse. It makes the product noncompliant in one state.

We also pushed for a short, memorable setup URL, so a household member without the printed card in hand still had a way in. A QR code provided yet another way for people to recognize how to get started. Coordinating an experience across hardware, portal, and app is one problem. Making sure all three still agree with each other after they've been printed on paper and can't be quietly patched is a different, harder version of the same problem.
