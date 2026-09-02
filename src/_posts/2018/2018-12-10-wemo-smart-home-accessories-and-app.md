---
title: WeMo smart home accessories and app
layout: layouts/portfolio_detail.njk
date: "2018-12-10T12:00:00-08:00"
tags: portfolio
coverImage: 2022/12/wemo-nest-device-list.png
coverPosition: center top
description: "Belkin's home automation line – switches, sensors, and the app that ran them. Setup as the moment of truth, rules people could say out loud, and what it took to be one system among several."
ogImage: /assets/images/og/portfolio.png
---
2013 UX Award Silver, Best Consumer Device. 2015 IDSA IDEA Bronze, Wemo Insight Switch. 2019 CES Innovation Award, Wemo 3-Way Light Switch.

Wemo started as a single idea done well: a plug-in switch and a motion sensor you could see and control from your phone, from anywhere. It grew fast – Insight, a light switch, LED lighting, a heater, humidifier, slow-cooker, a dimmer, and eventually Wemo Mini. Growth came easier than discipline.

![The early WeMo product line](/assets/images/2022/12/devices_withhand-1024x761.png)
*The line as it stood early on. A switch, a motion sensor, and an app.*

## What I did

I was Senior Director of Product Experience Design at Belkin, running a centralized design department across three brands – Belkin, Linksys, and Wemo. On Wemo I made the formative experience sketches for the product line, and they went on to govern how the system worked, for better or worse. I formed the UX team from members of my design staff and moved them into a semi-Agile process so they could keep pace with the software and cloud teams assembling around them.

For most of the period shown here there was no UX manager for Wemo. I managed two to three quite senior designers directly and gave them a lot of room to work. That's the reason I stayed close – running workshops, settling disputes, and weighing in on strategic fit on the occasions that needed a director's weight behind it. Later, as a reorganization approached, one of them stepped into the manager role and I managed her, which freed me to turn my attention to the design and interactive components of the Linksys division.

## We decided how it should feel before we decided how it looked

Six of us – our industrial design director, two UX designers, two product managers, and me – spent a session working out what we wanted running through a person's head at each stage. We wrote the sentences down as if someone were saying them: *I didn't know I can do this with my smartphone. This is gonna be cool. I can do this, it is easier than expected. I feel smart – look at me go. I want to do that again.* Further along, the ones we cared most about: *anticipates my needs, respects me as a person.*

![Whiteboard mapping stages of awareness and setup with quoted user reactions](/assets/images/2018/12/wemo-whiteboard-journey.jpg)
*Stages across the top, the sentence we wanted a person saying underneath. Writing the target as something a person would say keeps a team honest. It's hard to argue that a screen delivers "I feel smart" when it plainly doesn't.*

On the second board we turned those sentences into rules we could check a design against:

> Bite-sized steps. Forward & back. Minimal decision-making. Obvious initial action. Prevent pitfalls (poka-yoke plus). Do as much as we can for the user. Work in context. Fidelity for focus. Smart defaults when they are also useful. I know when I am done.

That last one is the rule people forget. The complaint is almost never that setup took a few minutes; it's that nobody could tell when it was over.

The tone line was "efficiently friendly, but not too terse," and holding onto it turned out to be the hard part.

![Whiteboard of onboarding principles and tone words](/assets/images/2018/12/wemo-whiteboard-tone.jpg)
*The board also names something we returned to constantly – the close relationship between the materials and the setup. Style, continuity, tone, and looks had to carry across both. The app troubleshoots the physical device; the plastics back up what the app says.*

A third board, from the same session, works on the brand rather than the flow. In the middle, boxed in green: *by people, for people. Respects your intelligence. Respectfully irreverent.*

![Whiteboard of brand attributes with "by people, for people" boxed in the centre](/assets/images/2018/12/wemo-whiteboard-brand.jpg)
*Around it, the qualities we were aiming at – emotion, education, intuition, discovery, efficiency, visual up and words down, self-esteem builder. Taped above is the Belkin brand matrix those came from, which lists packaging as a place tone of voice has to show up.*

"Respectfully irreverent" is a license, and licenses get over-drawn. A year or so later we shipped a firmware update screen that read: "Your devices are handling the update on their own, so feel free to close this app and play some Angry Birds now."

{% portraitGrid %}

![Firmware update screen ending with a joke about playing Angry Birds](/assets/images/2018/12/wemo-firmware-angry-birds.png)
*Ten minutes of waiting, and a joke to fill it.*

{% endportraitGrid %}

That came from a product manager who wanted to be funny and had the authority to put it in. It isn't efficiently friendly. It's a wink at a person who is waiting to find out whether their house still works, and it names a competitor's game inside our own product. Writing the tone down didn't settle it. Anyone with enough authority could overrule it in a single sentence.

We got it back, though the fix had nothing to do with copy. We pushed to make firmware updates automatic and quick enough that nobody had to sit in front of a progress screen for ten minutes, and once there was no waiting to fill, the joke had nothing to do and went away with the screen. Removing the reason a bad line exists works better than arguing about the line.

The same license, used well, produced this.

{% portraitGrid %}

![Device list where the motion sensor's status reads "Oooh, I sense motion!"](/assets/images/2018/12/wemo-motion-voice.png)
*The living room motion sensor. "Oooh, I sense motion!" is irreverent, and it still says exactly what the sensor is doing.*

{% endportraitGrid %}

## Setup was the moment of truth

For a connected device, setup is where you win or lose the person. They've spent money, they've opened a box, and they're standing at an outlet with a phone in their hand. No other moment in the product has that much of a person's undivided attention.

To connect a Wemo, you had to leave our app, go into iOS Settings, join a network the device itself was broadcasting, and come back. Four changes of context before anything worked, and each one was a place to lose somebody. iOS and Android have since added ways for a phone to detect an unconfigured device nearby and offer it to you, which takes most of that away. At the time, this was the state of the art, and it was as unpleasant as it sounds.

![Marker sketch of numbered setup panels](/assets/images/2018/12/wemo-qig-sketch.jpg)
*The early sketch. Numbered panels, one instruction each, a hand showing where to press – the whole structure was settled here before any of it was drawn properly.*

So we moved the quick start guide into the app and made it five panels, each holding exactly one thing to do.

{% portraitGrid %}

![Panel one: First, Plug Me In](/assets/images/2018/12/wemo-qig-1.jpg)
*"First, Plug Me In." A note handles the one variant that mattered – for WeMo Motion, check that the sensor is firmly connected to the power unit.*

![Panel two: Open the Settings App](/assets/images/2018/12/wemo-qig-2.jpg)
*"Open the Settings App (after finishing these instructions)." That parenthetical does a lot of work. We were about to send someone out of our app, so we told them to read to the end before they went.*

![Panel three: Tap WiFi](/assets/images/2018/12/wemo-qig-3.jpg)
*"Tap WiFi." One instruction, drawn over the actual screen they'd be looking at.*

![Panel four: Select the WeMo Network](/assets/images/2018/12/wemo-qig-4.jpg)
*"Select the WeMo Network." This is the step that loses people in a printed guide. The network has a name they've never seen, belonging to a device they just unwrapped, sitting in a list of their neighbors' routers.*

![Panel five: Re-open the WeMo app to complete the setup](/assets/images/2018/12/wemo-qig-5.jpg)
*"Re-open the WeMo app to complete the setup," and then permission to leave: "If you're ready, close this app to get started."*

{% endportraitGrid %}

Putting the instructions in software let us direct attention to one place at a time, and to keep it there. Changing where a person is looking is expensive. Each change costs a little confidence, and setup is exactly when a person has the least to spare. Everything in those five panels serves that one idea – one instruction per panel, the illustration drawn over the screen they're actually looking at, and a note before we ask them to leave.

The rule about knowing when you're done applied to the end of setup as much as the middle of it.

{% portraitGrid %}

![Setup Successful screen offering a name and an icon for the new switch](/assets/images/2018/12/wemo-setup-successful.png)
*"WeMo Light Switch (ID: WeMo.Light.044) is now connected." Then, immediately, an invitation to give it a memorable name and an icon. The done state and the naming step are the same screen. Those names went on to carry a lot – every rule, every partner integration, and every voice command resolved through them.*

{% endportraitGrid %}

The same idea applies well before anyone opens a box. So we drew the whole run in sequence and marked, at each step, the one place we wanted a person looking: the app icon on the package, the App Store listing, the icon landing on the springboard, the Belkin pip bloom, the empty state asking to be set up, and a notification arriving days later. The point was to make each of those hand off cleanly to the next instead of each one competing for the same attention.

We had a framework for this by then. EDIT – enticing, delightful, interactive, thoughtful – was something we built to keep ourselves honest about Belkin experiences, and we ran the touchpoints against it stage by stage.

![Sketched sequence of six touchpoints, each with a green circle marking where attention should land](/assets/images/2018/12/wemo-attention-sequence.jpg)
*Left to right: the app icon on the package, the store listing, the icon on the springboard, the pip bloom, the empty state asking to be set up, and a notification arriving later. One green circle per frame, marking the single place we wanted the eye to land.*

Moving the quick start guide into software earned its keep on the hardware side, too. Instructions printed on paper are frozen the day the box is made. Instructions in the app aren't, so one simplified insert could serve devices we hadn't designed yet, and partner devices we didn't build at all. Our costs stayed where they were. What changed was how much the box had to carry, and nobody needed convincing of that – everyone wanted the simpler box. By the end, the lid said hello in two languages and the printed quick start guide lived on the back of that same flap, which was all the instruction the box still had to hold.

The last thing I worked on before leaving Belkin in 2019 put the same problem back onto paper: the physical setup instructions for the Wemo 3-Way Light Switch, which won a CES Innovation Award that year. A three-way switch is the hardest install in the line – two boxes, traveler wires, and a real chance of getting it wrong. Our electrical engineers understood the wiring far too well to explain it simply, and the product managers couldn't follow the explanation they were given. Simplifying it took the same work as the app panels, in a medium that can't be revised after it ships.

## Rules people could say out loud

Automation is the reason to buy any of this, and it's also where a consumer product usually turns into a programming environment by accident. The question turned up in the first sketches I made, in March 2011, more than a year before anything shipped and while the project was still called Conserve Plug-ins. We were working on energy measurement products then, and the kernel of the idea was that helping people save power meant being able to turn things off for them.

{% portraitGrid %}

![Sketch of a flow between plug-ins and rules, with a written question](/assets/images/2018/12/wemo-sketch-2011-flow.jpg)
*"Which best fulfills the core interaction – plug-ins or rules?" Everything in this section is an answer to that question, worked out over the following four years.*

![Sketch of a home screen listing plug-in devices](/assets/images/2018/12/wemo-sketch-2011-devicelist.jpg)
*"Home: Plug-ins." Each item gets a status icon, a name, and a detail button. Touch to toggle a switch; touch to simulate state on a sensor.*

![Sketch of a single device screen with its rules listed as sentences](/assets/images/2018/12/wemo-sketch-2011-device-rules.jpg)
*"A single device." At 3pm turn on. At 6pm turn off. When living room motion senses. The rules live on the device they act on, so they're editable and inspectable from the thing you're thinking about.*

{% endportraitGrid %}

Rules as sentences was the first answer, and it's the one that shipped: a sentence with slots in it.

{% portraitGrid %}

![The Edit Rule screen with What Happens, If, and When](/assets/images/2018/12/wemo-rule-edit.png)
*What happens, if this, when, and a name. Each row is a separate decision, and each one can be left alone.*

![A finished rule shown as a summary](/assets/images/2018/12/wemo-rule-details.png)
*The finished rule read back to you: the tree turns on, stays on for fifteen minutes after the motion stops, triggered by the living room sensor.*

![Choosing a sensor and its sensitivity](/assets/images/2018/12/wemo-rule-sensors.png)
*Picking the sensor, and how twitchy it should be.*

{% endportraitGrid %}

It worked, but it asked people to think the way the rules engine thought. The next version turned that around and started from the outcome instead.

{% portraitGrid %}

![The I Want feature screen](/assets/images/2022/12/ios7_iwant_iphone5-577x1024.png)
*"I want to…" started with the result rather than the mechanism. Underneath it's a structured picker – control a switch by time, sunset, or motion, or get notified on motion or power draw – but the conversational label made four conditional-logic options feel like a sentence you'd say out loud.*

![The I Want feature, expanded](/assets/images/2022/12/ios7_iwant2_iphone5-577x1024.png)
*Expanded, with time and sunrise/sunset settings.*

![Creating a rule for a lamp](/assets/images/2022/12/ios7_lamprule_iphone5-577x1024.png)
*Building a lamp rule. Sunset was the trigger people wanted most, and the reason is maintenance. A clock time is wrong by a little more every week, so a schedule set in November needs editing by January. Sunset stays right on its own. People hated going back to correct rules that used to work.*

{% endportraitGrid %}

The direction after that we explored and never shipped: templates that offered whole outcomes ready-made, so a person picked the result they wanted and assembled nothing at all.

Two more things came out of the rules work: rules that switched nothing at all, and a list that read like a household's day.

{% portraitGrid %}

![A rule that only sends a notification](/assets/images/2018/12/wemo-rule-notify.png)
*This one watches a battery charger's power draw and tells you when the batteries are done. The automation is there to notice something on your behalf while you're in another room.*

![A list of enabled rules](/assets/images/2018/12/wemo-rules-enabled.png)
*Off for bed. Evening front outdoor. Morning living room lights. Nightlight. A fair description of a household, written entirely by the person living in it.*

{% endportraitGrid %}

Controls got the same attention. When dimming arrived we tried several ways to put a brightness control in the device list itself, so people could adjust a lamp without leaving the one screen they already understood.

{% portraitGrid %}

![Four brightness control treatments in a device list](/assets/images/2018/12/wemo-dimmer-a.png)
*Four treatments side by side – a bar under the name, a percentage on the power button, an inline slider, and a knob.*

![Two more brightness treatments](/assets/images/2018/12/wemo-dimmer-b.png)
*Two more, including a slider with a bulb for a thumb. Putting the control in the list keeps the person in one place, which was the same argument as the setup panels.*

{% endportraitGrid %}

## One system among several

We never made a thermostat. What we could do was join the other home automation ecosystems forming around us, most of which were going to end up larger than ours, and let that make a Wemo worth more than it was alone. A Nest thermostat could sit in the Wemo device list among our own products, with real control, in our app.

{% portraitGrid %}

![A Nest thermostat controlled inside the Wemo app](/assets/images/2018/12/wemo-nest-control.png)
*Set temperature, current temperature and humidity, and the mode – heat, cool, off, eco – all inside Wemo, for a device we didn't make and couldn't sell.*

![The Connect To Our Smart Home Partners screen](/assets/images/2018/12/wemo-partners.png)
*Alexa, Google Assistant, Apple Home, Nest, and IFTTT. A house was going to fill up with all of these, and the useful question was how well we behaved among them.*

![The Connect to Apple Home app screen](/assets/images/2018/12/wemo-apple-home-connect.png)
*Joining someone else's ecosystem meant explaining our own topology to a person standing in their living room – which Wemos talk to Apple Home directly, and which ones need a bridge.*

{% endportraitGrid %}

Being one of several systems has a cost, and it shows up in an unglamorous place: names. Every rule, every partner integration, and every voice command resolved through a name a person typed. When the same lamp ended up with two names in two apps, somebody had to say which name they preferred.

{% portraitGrid %}

![A dialog asking which app's device name to use](/assets/images/2018/12/wemo-name-conflict.png)
*We asked. The dialog was defensive – it kept us from silently overwriting someone's work – and it also settled which direction changes would propagate. We had no evidence that either direction was the right default, so we didn't pretend to.*

![A confirmation message reading "We like that one, too!"](/assets/images/2018/12/wemo-name-conflict-toast.png)
*One of my designers wrote this one, and it's pretty good. It confirms the choice, explains that changes made in the other app will be changed back, and manages to be gracious about losing.*

![A banner reading "Updating WeMo Link. Please do not unplug the WeMo Link until the update is complete."](/assets/images/2018/12/wemo-link-updating.png)
*The Link was our bridge to Zigbee and Z-Wave, which is where the light bulbs were. It bought us a much wider catalog and it put a second box in the house, with its own firmware, its own failure modes, and one more way for a device to come up "Not Detected."*

{% endportraitGrid %}

## What we didn't do

What we wanted was setup that found the device, named it, and asked you to confirm. Instead we asked the person to tell us what they had bought.

{% portraitGrid %}

![A setup screen reading "Currently connected to WeMo.Bridge.171, Discovering nearby networks…"](/assets/images/2018/12/wemo-setup-discovering.png)
*Connected to a bridge, scanning for what else was out there.*

![A setup screen asking "What device are you setting up today?"](/assets/images/2018/12/wemo-setup-what-device.png)
*And then the question the person shouldn't have had to answer.*

{% endportraitGrid %}

The pattern did ship, in one place.

{% portraitGrid %}

![A scan screen reporting that the WeMo Link found no devices](/assets/images/2018/12/wemo-link-scan.png)
*Scan, then a checklist, then Add Checked. Behind the Link, where the radio was already in the room, we built exactly the flow the sketches asked for – including the honest empty state, "WeMo Link has found 0 devices."*

{% endportraitGrid %}

The Wemos themselves never got it, and that's the miss I still think about. Doing it properly wasn't a small ask: a Bluetooth radio in every product in the line, which adds unit cost to every one of them, and then the firmware and software work to make use of it. The app didn't get good at finding unconfigured devices until very late in my time there, and by then the operating systems had started solving the same problem themselves. The Link went the same way – once a bridge was in the picture, nobody would think expansively enough about what setup should become. Both misses came from the same reluctance, and both of them hit setup, which is where a person decides what to make of the whole system.

It wasn't for want of design. The idea is in the 2011 notebook, the process is on a whiteboard, and by 2013 the whole flow was drawn, edge cases included.

![Notebook page working through device setup, ending with a line spoken by the device](/assets/images/2018/12/wemo-sketch-2011-setup.jpg)
*The 2011 notebook works through setup: Bonjour discovery, a list of nearby networks to pick from, a password, and a prompt to give the device a name. It ends in the device's own voice – "OK, thanks. Unplug me, put me where you want me."*

![Whiteboard listing five steps for setting up an unconfigured device](/assets/images/2018/12/wemo-sketch-setup-flow-whiteboard.jpg)
*Five steps on a whiteboard, and they apply to any WiFi accessory, not only ours. Plug the thing into power. Get and open the app. The app sees the new product over Bluetooth. The app offers it to you. Transfer the credentials.*

![Sketched flow of an app searching for and offering nearby unconfigured devices](/assets/images/2018/12/wemo-sketch-2013-found-devices.jpg)
*March 2013. Add, then "Looking for new Wemo devices nearby…", then either "We found a new Wemo nearby. Add this to your network?" or a list of several with checkboxes and an Add Selected button. Even the empty state is drawn, and its dismiss button says "Bummer." What stopped this was never the design.*

## Choosing partners

Insight was the switch that measured what it was powering. It won an IDSA IDEA Bronze in 2015. Whether the numbers changed anyone's behavior, I don't know, and the dollar figures on that screen are small enough to be more reassurance than economics. What it proved is that a device which can observe itself has something to say.

![Insight power consumption detail for a battery charger](/assets/images/2018/12/wemo-insight-energy.png)
*Last on for five minutes, standby since 5:52, an average day of two hours and thirty-six minutes, an estimated eight cents a month. The switch measured its own behavior, so it had something to report.*

That turned out to be the test we should have applied to partnerships and didn't.

We partnered with a large housewares company to put Wemo inside four products: a heater, a humidifier, a slow cooker, and a coffee maker. Of the four, only the humidifier really belonged. Nobody should be starting a space heater in an empty house, and the safety rules agree. The rest ran into a quieter problem – switching something on from a distance means very little when the thing can't tell you what happened next.

A pet feeder is the clearest case, and it's worth being precise about why. Feeding a pet on a schedule from your phone is a perfectly good idea. It stops being one when the feeder can't tell you how much food is in the bowl or how much is left in the hopper, because then it can't answer the only question you actually have, which is whether the animal ate. Those sensors were buildable. They cost money on a product with thin margins, and our partner decided that money wasn't worth spending. That was their call to make about their own business.

The misjudgment was ours, for signing the partnership before asking what their products would be able to tell us. I was in the room for that.

The test I'd apply now holds up well beyond home automation. Before you automate someone else's product, ask what it can observe. Automation you can't observe is theater. It performs the action and leaves the person no better informed than before, and a person who can't tell whether the automation worked will go back to doing it by hand. I've [written more about this in the context of AI agents](/2026/04/20/agentic-ai-doesnt-make-human-interfaces-go-away/), where the cost of knowing whether the system did what it promised hasn't fallen at all.

By that measure Alexa, Google, Apple, Nest, and IFTTT were all good partners, because each of them either made our devices easier to reach or added capable, observable products to the ecosystem. The appliance line mostly made the catalog longer.

## Lessons learned

You have to be clear about what the core of your product is, or you'll dilute your own message in your eagerness to expand the line. Some of what we added belonged in the line. Some of it existed because a partner was willing to build it, and willingness is a poor substitute for fit.

A partner's sense of itself has to be compatible with yours, and their products have to be able to report on themselves. Automation built on a device that can't say what it did is a light switch with extra steps. The second half of that is checkable before anyone signs anything, and we didn't check it.

People notice when you don't refresh visually, even while the functionality keeps growing. Wemo went through five distinct looks in seven years, and almost every one of them was set in motion by an iOS release changing what current looked like. Designing on someone else's platform means re-learning your own product's appearance on their schedule, and the work of keeping a system coherent through those resets never appears on any roadmap.

And setup deserves more of your organization's attention than it will ever ask for. It's the one moment where the hardware, the packaging, the firmware, the app, and the person are all in the same room at the same time.

What's at stake there is confidence, and I drew that argument before there was a product to make it about.

![Index card sketch of two satisfaction curves over time](/assets/images/2018/12/wemo-sketch-2011-confidence-curve.jpg)
*March 2011, on an index card. Satisfaction up the side, time across. One path climbs. The other drops into the hatched trough at setup and spends the rest of the relationship crawling back toward neutral, never catching the first line.*

A person who struggles through setup arrives at daily use already suspicious, and every later hiccup gets read as more proof the thing doesn't work. That suspicion is hard to reverse, because the product has to be right many times over to undo being wrong once, at the beginning, when the person had nothing else to go on. A person who finishes setup feeling capable carries that into daily use, and gives the system the benefit of the doubt when something looks off. In a product that acts in your house while you're somewhere else, that benefit of the doubt is worth more than any feature.
