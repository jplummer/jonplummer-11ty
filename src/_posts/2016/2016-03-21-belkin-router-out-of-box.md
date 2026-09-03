---
title: "Belkin router out-of-box and setup"
layout: layouts/portfolio_detail.njk
date: "2016-03-21T12:00:00-08:00"
tags: portfolio
coverImage: 2022/12/Screenshot2017-06-0321.17.37.png
description: "At any moment setup ran through three things at once – the box, the printed guide, and whichever software was current. The software kept changing. The other two had to hold."
ogImage: /assets/images/og/portfolio.png
---
An in-home study asking people to replace their existing router with one of three Belkin routers showed us how much work we had to do. People surprised us at every turn – losing the instructions, getting turned around inside them, not knowing which cable was which, plugging things into the wrong places. One nice lady plugged the power supply into the headphone jack on her computer, because it sort of looked like it belonged there and she had missed the step where she was supposed to give the router power.

A person who got the wiring wrong was dead in the water, with no hope of recovery. There's no error message for a cable in the wrong socket, no screen to go back to, and nothing anywhere in the process that could tell them what had happened or how to get out of it. They were simply stuck. And it happened far more often than we had expected going in.

So we took some of that work away from them entirely. Cables already connected, fewer sockets to choose between, and an instruction attached to each part that was still theirs to plug in.

Fixes like that get made in the box, weeks before anything is printed, by people who don't think of themselves as working on setup. That is the other thing the study made plain. Setup never lived in one place. At any given moment it ran through three things at once: the box, the printed quick install guide, and whichever piece of software was current. The software kept changing – a CD at first, then a web interface served by the router itself, later an app – and each of the three was owned by a different group working to a different schedule. A person doesn't experience three channels. They experience one evening that either ends with the internet working or doesn't.

## What I did

This ran the length of my time at Belkin. It began on the G routers and went on through several N series, a power modem, and AC.

I was UX manager when it started, and I did the work: the diagnostic in-home studies, the setup flow drawn across the channels, the usability testing. I also cajoled Customer Care into analyzing and reporting call data in ways that could spur action in Design and Product Management, which took longer than the design work did. As it went on I moved up, and the later stretches of it I was setting direction for rather than drawing.

## The original promise of setup

We started by asking what we had actually promised. Four things, in the shorthand we used at the time.

Fast, with an optional install. The install is the companion software, and optional meant optional: a person who never runs it still gets a working network.

Easy, with help for wiring and help with MAC addresses. Wiring meant showing the person what goes where. MAC addresses meant taking that problem off their plate entirely, because a MAC address is not something anyone should have to know exists.

No information needed from the person unless we have to ask for it.

And works with whatever they have handy. A Mac, a PC, an iPhone, an Android phone, a tablet. We don't get to know which one they'll pick up, so all of them have to work.

![Whiteboard reading "What do we need to do to fulfill the original promise of setup?" with a list of qualities beside sketches of a modem, a laptop, and two houses](/assets/images/2016/03/router-setup-original-promise.jpg)
*March 2011. The question we started from. The sketches on the right are the two house scenarios – where the equipment sits, and what correct router behavior looks like in each.*

Then we listed the situations a person could actually be in, and ranked them.

![Whiteboard listing setup scenarios with priority numbers beside them](/assets/images/2016/03/router-setup-scenarios.jpg)
*Replace an existing router. Add a router to an existing modem-router. Replace an existing modem with a modem-router. Underneath, the things that broke people: the equipment from the ISP isn't recognizable as a modem to the person who owns it, wiring problems we weren't handling at all, and MAC address issues.*

We worked the ones marked 1 first. Those tracked to support calls and returns more strongly than the 2s did.

The one about recognizing the modem caused more trouble than its place on the list suggests. People don't reliably know the difference between a modem, a router, and a gateway, and the industry gives them no help – ISPs use all three words and a few of their own, and plenty of people call the whole arrangement "the WiFi." Any setup process that opens with "connect the cable from your modem" is asking a question a lot of people can't answer. The work went two directions at once: get better at helping someone identify their customer premises equipment, or identify it ourselves and stop asking.

The same session named three more things. Unsupported ISP connection types, an open problem with no good answer yet. Companion software, which had to be truly optional if it shipped at all – the CD-based installs were not, and that is why people hated them. And router monitoring, which had to stay independent of setup, so that declining one still left a person with the other.

This is roughly where we started from.

![Belkin router setup instructions with labels directly on components](/assets/images/2022/12/Screenshot2017-06-0321.17.37-1024x477.png)
*One of the earliest examples of the improved out-of-box experience: a G router, printed instruction with labels on the physical components, and a CD still in the box.*

![Marker sketch of packaging concepts, one labelled "clear sleeve w/ printed insert"](/assets/images/2016/03/router-setup-sleeve-sketch.jpg)
*Packaging concepts from the same period, for getting printed instruction in front of the person before they've unpacked anything.*

## What each channel could actually help with

The following summer we assessed the candidates. Not a delivery plan – an evaluation of which channels could do a good job on which parts of getting online.

![Whiteboard matrix with QIG, Android App, iOS App, CD/Etc, and FW UI down the left and Wiring, Connect to Router, Connect to ISP, Enjoy Wireless across the top](/assets/images/2016/03/router-setup-channel-coverage.jpg)
*August 2011. Five candidate channels down the side, the stages of getting online across the top, and a judgement in each cell about how much help that channel could be at that stage.*

No row is complete, and none of them could have been. The firmware interface has an X at "connect to router" for the obvious reason that you have to reach the router before you can see it. The printed guide is at its strongest on wiring, where a picture of a plug beats anything on a screen. Whatever we shipped was going to be a combination, and the board is how we chose which combination.

In practice it settled into the same three every time. The box and the quick install guide, which were always there, plus one piece of software: the CD at first, then the router's own web interface, then an app. The software channel is the one that kept changing.

## What we required of it

Two boards from April 2011. We used them to set priorities and build a roadmap out of them: red stars marked what we would do first, and the arrows marked experience guidelines that applied to everything.

![Whiteboard listing setup requirements in green marker](/assets/images/2016/03/router-setup-requirements-left.jpg)
*Get the user online. Allow basic customization. Faster router replacement, so a person doesn't have to go around visiting every other device in the house. Handle common installation problems, with corrective action when necessary. Adapt to the level of user knowledge – give novices all the help they need, let experienced people go fast, and be manually overridable. Correct posture depending on what the person needs, router or access point, and work with everything. Don't ask for manual SSID input. Use standard jargon. Install nothing.*

![Second half of the same whiteboard, listing qualities the setup experience had to have](/assets/images/2016/03/router-setup-requirements-right.jpg)
*Guide people to the appropriate setup based on what they already have. Handle MAC address issues gracefully. Then three that aren't about the person at all: guides tech support in helping, guides product management and engineering in improving, and looks coherent with the out-of-box experience and the packaging. Below those, independent of other software, solid and fast, and not dependent on a CD.*

"Use standard jargon" reads like a failure to speak the customer's language. The reason it's there: a person setting up a router could end up on a forum or on the phone with their ISP, and if we've invented friendly words for WAN and DHCP we've made them fluent in a language nobody else speaks. Every word we invent is one more thing they have to translate the moment they go looking for help.

Two of those lines aren't about the customer at all, and they're the ones I'd defend hardest now. A setup experience a customer can't describe to a support rep costs money every day it ships. One that never tells the team where people fall out never improves. Designing for those two audiences alongside the customer is most of what keeps a design intact once an organization gets hold of it.

## The box is where setup starts

Nobody reads a manual, and everybody looks in the box. So we designed the box as the first step rather than as the container the first step arrives in.

Before drawing anything we bought the competition and laid the packouts out side by side, which is a cheap afternoon that settles a lot of opinions.

![Three opened router boxes side by side on a desk, one Netgear and one Belkin](/assets/images/2016/03/router-setup-competitive-packouts.jpg)
*Netgear in the middle, ours on the right. What matters in the comparison is what the person sees first when the lid comes off, and how many decisions they have to make before anything is plugged in.*

![Pencil sketch of a router box with numbered recesses and arrows, annotated "instrument case"](/assets/images/2016/03/router-setup-instrument-case.jpg)
*The idea that organized the rest. An instrument case – every part in its own recess, in the order you need it, with an arrow showing where it goes. The router sits in the middle at position 1. The parts you touch second, third, and fourth run down the left. The flap across the top carries the wiring diagram.*

![Belkin N300 box open on a desk with a "Start here" card showing three numbered steps](/assets/images/2016/03/router-setup-start-here-card.jpg)
*"Start here," three steps, one per panel, each with a picture of the thing you're holding.*

And then the piece I'm still fondest of. The instruction is attached to the part it describes.

![Router box with a card tied to the ethernet cable showing the modem-to-router connection, and a card on the power supply showing a wall outlet](/assets/images/2016/03/router-setup-labels-on-parts.jpg)
*The card on the ethernet cable shows the modem, the router, and a green arrow at the socket it goes into. The card on the power supply shows a wall outlet and a green arrow. Neither one has any words on it, which is also how it shipped in every language at once.*

The guide offered the best sequence rather than enforcing it, and that distinction did more work than it looks like it should. People miss steps. They get called away, they skip the panel that looked like packaging copy, they do the thing they already know how to do first. A process that requires its own order turns every one of those into a dead end. So the guide laid out the best sequence, and everything downstream was built to find out what had actually been done and offer the guidance that closed the gap. Nobody has to start over.

We shipped the router pre-secured, with the network name and password printed on a card, changeable at any time or during setup, with blanks on the back to write down new settings. Later routers had a slot on the foot to keep the card in. That card cut the volume of "what's my network password" calls on its own.

The power modem got the same treatment.

![Whiteboard sketch of the packout showing the router with pre-connected cables, a fold-out guide, and a CD tucked behind](/assets/images/2016/03/router-setup-packout-whiteboard.jpg)
*Working the power modem packout out with industrial design and packaging. Cables pre-connected to the router so there's one fewer connection to get wrong, a tag on the RJ11 cable, the power supply coiled loose, the fold-out guide above, and the CD tucked in behind.*

Across the whole run of it, setup-related support calls fell by roughly 70%, and an entire class of wiring-related calls went nearly to zero. The second one is the measure I trust most, because it's the one the design was aimed at directly.

## Half of setup came from a device that wasn't online yet

The hardest structural problem in this project has nothing to do with copy or layout. A router at the moment of setup is a computer with no internet connection. Anything you want to show a person – help text, a troubleshooting article, a firmware image, a translated string – either already lives on the router or has to come from a server the router can't reach yet.

![Marker sketch of three setup screens with regions outlined in dashed red and a legend reading "from router / from server"](/assets/images/2016/03/router-setup-router-vs-server.jpg)
*February 2012. Solid outlines are served by the router itself. Dashed outlines come from our servers. Drawing the boundary this way makes the failure modes visible: every dashed region needs a version that still works when there's nothing behind it.*

The other half of that problem is that the router has to guess how the person's ISP wants to be talked to, and guessing takes time.

![Large whiteboard decision tree in red and black covering ISP connection types, encapsulation, and detection order](/assets/images/2016/03/router-setup-isp-detection-tree.jpg)
*April 2012. Synchronization, then showtime, then establish the connection, then run through the list of likely configurations for the region. Encapsulation type, static or dynamic IP, PPPoE, PPPoA. The number in red at the top is what this costs in real life: roughly 30 to 90 seconds before we know anything.*

Most of the design effort in setup went into this one step. It used to be a form. It asked people which encapsulation their ISP used, whether their IP address was static or dynamic, whether they were on PPPoE or PPPoA – questions almost nobody is equipped to answer, about a service they never configured. We wanted all of it gone. Don't ask if you don't have to, and when you do have to ask, ask something the person is in a position to answer.

What that buys is silence, and silence has a cost of its own. Even 30 seconds is a long time to wait, and it can run to three times that. The person has done everything they were asked to do. Now they're watching a light and starting to wonder whether they got something wrong, or broke something.

So the note in the corner: no response, ask the user, while detection and repeated reboots carry on in the background. Keep working, keep talking, and don't leave the person in silence waiting for a result you already suspect isn't coming.

The order of the checks isn't universal either. We shipped different firmware for Europe that ran the same list in a different sequence, because what's likely depends on where the router is being installed. Same checks, regional ordering, and a meaningful number of seconds off the wait for most people there.

## Belkin's first responsive router interface

This is the router's own web interface, running in a phone browser. It was the first responsive web UI Belkin shipped, and there is no app involved anywhere in it.

That mattered because of the arithmetic of the third channel. An app means picking platforms, shipping to stores, and hoping the customer owns a phone you built for. A web interface served by the router is available to anything with a browser, which is every device a person could plausibly be holding while they set up a router. Getting there meant one interface that rearranged itself for whatever asked for it, at a point when Ethan Marcotte had named responsive design 18 months earlier.

{% portraitGrid %}

![Setup welcome screen, headed "STEP 1: WELCOME" over "Router setup!"](/assets/images/2016/03/router-setup-welcome.png)
*Numbered step in the chrome, so "am I nearly done" has an answer at every moment. This is the router talking, on a phone, in 2012.*

![Screen offering to reuse the old network name and password so existing devices reconnect](/assets/images/2016/03/router-setup-reuse-old-network.png)
*"If you had an old network, try using the same network name and password so that those devices still connect." This is what the faster-router-replacement requirement looks like once it reaches a screen. Without it, replacing a router means walking around the house re-joining a printer, two laptops, and a game console.*

![Screen reading "We're checking your firmware now"](/assets/images/2016/03/router-setup-firmware-check.png)
*Work happening in the open, with a reason given for it.*

![Screen reading "We noticed you're on an iPhone, here are some features to take advantage of," offering wireless printing](/assets/images/2016/03/router-setup-device-aware.png)
*Advertising capabilities was one of the jobs on the requirements board. Doing it at the end of setup, based on what we can already tell about the device in the person's hand, is the version that isn't an interruption.*

![Registration screen with an explainer headed "How will registration actually benefit you in the future?" and a "Register Later" link](/assets/images/2016/03/router-setup-register-why.png)
*Registration is where a setup flow usually turns into a form for someone else's benefit. So it gets a plain answer to why, and a way past it.*

![Step 3 screen, "Thanks for setting up your router!" followed by "Register your router"](/assets/images/2016/03/router-setup-finished-register.png)
*I know when I am done. Say it before you ask for anything else.*

![Dashboard headed "This is your dashboard" listing Change SSID, IPv6, DLNA, and more](/assets/images/2016/03/router-setup-dashboard.png)
*Setup ends at a place worth coming back to, rather than dumping the person back into the browser.*

{% endportraitGrid %}

## Say what to try next

The interesting screens in any setup are the ones where it didn't work.

{% portraitGrid %}

![Error screen reading "Your router cannot be detected" followed by "Solution 1: Check your connection" and a "Next Tip" link](/assets/images/2016/03/router-setup-not-detected-tips.png)
*One suggestion at a time, numbered, with a way to ask for the next one. A person who is already stuck can act on one instruction. A list of eight makes them close the window.*

![Router dashboard showing network name "Pretty Fly for a Wifi," download and upload speeds, and connected devices](/assets/images/2016/03/router-setup-shipped-dashboard.png)
*The other side of it. Speeds, connected devices, and a re-test button, so the answer to "is it working" is on the screen instead of in a support call.*

{% endportraitGrid %}

## What the light says

The router isn't silent while all this is going on. It has one LED, and that LED is the only channel available when the browser can't load and the app can't find anything.

![Whiteboard matrix of LED states against three product types](/assets/images/2016/03/router-setup-led-state-matrix.jpg)
*Blue, blinking blue, amber, and blinking amber down the side. Router, power modem, and integrated modem-router across the top, so the same color means the same thing whichever one you bought.*

That middle column is worth explaining, because it is a piece of product thinking I still like. An integrated modem-router puts the DSL modem inside the router, which drags the whole product onto the modem's regulatory timeline – the router can only be revised as often as the modem's certification allows. A power modem moves the DSL modem into the power brick instead. One purchase, the same two functions, and two pieces that can be updated on their own schedules.

Holding one LED language across all of it, so that blinking amber meant the same thing whichever generation of the family a person had bought, was its own body of work. Some of it is in the [hardware behavioral specifications](/2015/08/01/belkin-hardware-behavior-samples/) piece.

## What carried forward

The lessons went with me into Velop, the Linksys mesh system, where setup has a harder job to do. There isn't one device to configure. There are several, and they have to be placed around a house.

Velop went app-only, chosen for technical expediency. The app uses Bluetooth to find unconfigured nodes nearby and offer them to you, which takes away the worst step in the older flow, where a person has to leave the app, join a network the device is broadcasting, and come back. It's a trade. The app can do something no browser could, and in exchange setup now requires a phone.

## Lessons learned

There's always room to remove an opportunity for a mistake, and removing one is worth more than explaining it better.

Attention is fragile and singular. It can only be in one place at a time, and you can direct it where you need it, but not many times, so spend those moves carefully.

The emotional part of setup isn't decoration. Done well it makes a person believe the product is working. Done poorly they won't believe it's working even when it is, and they'll call you to say so.

The software channel kept changing and the other two didn't. Whatever is most durable in a setup experience ends up carrying the most weight, and it's usually the part nobody in the building thinks of as design.

None of it was ever "finished" and set aside. The box, the guide, and the software each got better across a decade of products, and most of that improvement came from watching people fail at the previous version. Shipping is where you find that out.
