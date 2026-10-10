---
title: Arguing with the agent
layout: layouts/single_post.njk
date: "2026-09-30"
tags: post
description: I like arguing with the agent; it reminds me of good things I already think.
ogImage: /assets/images/og/v2/2026-09-30-arguing-with-the-agent.png
---
I like arguing with the agent because it reminds me of good things I already think.

I spent some time last week reworking the setup flow for [Usage-Chan](/sides/usage-chan/), the desk robot that shows me how much of my Claude usage quota is left. In daily use, Usage-Chan is independent; setup is the one time when the device and a phone or computer have to work together especially well. The device opens its own WiFi network, the phone joins it, a page on the phone collects the home WiFi password, the two have to find each other again on the home network, and then the phone has to collect a token and a PIN and send them to the device. This process is a [moment of truth](https://en.wikipedia.org/wiki/Moment_of_truth_(marketing)) for Usage-Chan as a product, so I asked [Claude Code](https://claude.com/product/claude-code) to make a flowchart of my plan (in FigJam, using Figma MCP) before we built any of it. As fast as Claude is at iterating in code, it's quicker and smarter to get the plan right first.

The first thing I typed that week was a list of setup phases and tasks – the building blocks of what I suspected the setup process needed to be – ending in "CRITIQUE MY CHOICES and propose better ones if clear!" Claude did so; it was right about a few things, and I was grateful for the feedback. What surprised me was what happened when I disagreed: Claude would suggest something, I'd say no, and I'd explain, usually expressing a rule I'd been applying for years, sometimes unconsciously.

## Where I said no

The first flowchart put what's shown on-screen on the arrows and not on the boxes – "you plug it in / it draws the boot bar." That bugged me as a fundamental misunderstanding of how flowcharts work, so I complained:

> a box/node is a state, and a state is often (not always) a screen and a settling place – so where the edge says "it shows a QR code" or similar, that belongs on the node, not the edge. But the conclusion the device reaches, or the action the user does, those belong on edges because those bring us to the next node.

(Here I'm using "nodes and edges" graph language; in a flowchart the boxes are nodes and the arrows are edges.)

In response to my complaint, Claude rewrote 32 labels. Several arrows came out empty; each was carrying state or screen contents (node) and not an action (edge), and you need an action (a user choice, a machine conclusion) to bring you to the next node. I turned the question boxes (system logic) into diamonds while I was at it, and explained that I sometimes put system actions on edges as plain text and user actions in `<angle brackets>`, "just to drive the point home that they are different." I told Claude that one day we should talk about my flowcharting guidelines. (This week covered a few of them, and there are plenty more, first learned in college and built up over my career of explaining things to engineers.)

Then I reminded Claude that we weren't working with one set of screens, but two (device and phone) that needed to be kept in coordination with each other. Claude offered some options for how to lay out two screens in one diagram. One had three lanes: the device on one side, the phone on the other, and logic running down the middle between them. That didn't make sense to me at all! Logic doesn't float free of the two devices; each one makes choices based only on "what they have access to at a given moment" and neither can read the user's mind. Only the device knows whether a token is stored, and only the phone knows whether two PIN entries match; there's no third place for the system to evaluate things. So I put the device in the center instead:

> The device is in charge, so the spine is the device experience, and there are natural points where the user's attention gets handed to the phone or back to the device. It's useful to make sure that the screen *not* in the user's attention is showing something sensible at every step, of course, which is why authoring them together is important.

I'd like other designers to think differently about the interfaces (screens, lights and buttons, etc.) that are *alongside* the user's attention. Often people spend their effort on designing the main screens, leaving the quiet screens unconsidered. But you're in danger of damaging user confidence by having part of the system seem to not know what's happening. You can direct user attention from place to place (which you should not do too many times) but that doesn't mean the other screen won't be looked at. They need to be coordinated.

Example: if the phone's page knows the device's new address before the page dies, it can send the user there itself, saving the effort of bringing user attention to the device and then back to the phone in a round trip. As we chewed on these points, four handoffs between screens became two.

Claude had kept the device's QR code on screen after the phone joined so there'd be something to scan if the captive portal page didn't load. Fair enough. But if it *did* load, "you don't need the device to continue to shout at them to join. It'll seem uninformed, dampening confidence." *Did I do it right? Did it work?* We kept the code and changed the words around it.

One of the stickies I put on the flowchart said the device should look for the network and, on success, be happy about it. Claude asked whether that meant setup should get a face before the dashboard did. No: "Just 'cause it's happy doesn't mean it needs a face, per se. This is posture, not necessarily literal." How it looks is a stylistic question for later. The job at that time was making sure the postures and the technology could support each other.

The project already exports the device's typefaces as real font files – an adaptation so we could mock screens accurately in Figma. Claude offered a free win: set the setup pages in the device's own typefaces too. I said no:

> it's probably not great to make the web look like the device, and that would squander us being able to picture the device and its screen as a distinct thing on the web views if necessary. They should share colors and general design language, but it's important to be true to the medium you are working in so you can take advantage of what that medium does well.

Claude had ported from [claude-usage-stick](https://github.com/oauramos/claude-usage-stick) a single settings panel that handled both setup and everyday changes. But setup is an ordered string of tasks, and mistakes there can be hard to recover from. Changing a setting later is smaller and less dire. It makes sense to use purpose-built pages for setup; even though the settings controls will be the same, the layout should be different. "It's less important to reuse interfaces than it is to create a smooth and streamlined experience given the situation the user is in."

Later, Claude worried that the security before entering a Claude API token was lax – it would be entered on a page served by the device over the local WiFi network. Claude proposed two ways to lock it down: a pairing code on the device's screen, or a stored PIN verifier. Both would have worked, but neither was needed. "If we don't have an API token stored yet we don't need a guard. We accept the API token and a PIN at the same time, encrypt them, and send that blob to the device. And thereafter protect the API token with that PIN." Same instinct when Claude flagged that a power cut leaves the device dark until someone types the PIN: "If a human is not there to notice the dark device, nothing is lost. The device exists to display data to a human, and if the human is not there to see it, a little nap is fine."

Claude also caught its own mistakes. I'd insisted we test some unknowns on real hardware before getting deep into setup, and the first serial log I pasted in showed the radio reporting an authentication failure against my WiFi network, though the password was correct, then connecting normally a moment later. Claude caught that one of our parallel agents had coded setup to read exactly that failure as "the password is wrong." Shipped, it would have accused users of mistyping their passwords every time when they had not. A wrong password fails repeatedly, while this one failed once then succeeded.

Between that log and a look at the usage-credit settings on my Claude account, our plan document turned out to be wrong in a few places. I asked that we make these changes right away: "The longer misinformation lingers the more likely we are to wrongly believe it."

## Today I learned

Why did the arguments do so much work? I've [written before](/2026/06/29/the-agent-will-not-ask/) that an agent won't stop and ask when it isn't sure. It proposes instead, and its proposals are plausible and often good. So each objection signals that I know (or think) something the agent doesn't.

Later, I had Claude go back through our conversation and collect these rules. There were 44! Not all of them are gems, but several are worth remembering:

### Flowcharting

- A box is a state, a place; an arrow is how you got there or how you can leave; a diamond is system logic you pass through.
- Distinguish two actors: put a system action or data in plain text, the person's choice in `<angle brackets>`.
- Put the most important path down the middle. That might not be the most common path.
- Thicken the lines that carry attention when we're working on managing attention.

I have a lot more flowchart tips than just these, but the above are the ones I had to explain to the agent this time.

### Two screens at once

- One party in a multi-screen workflow is in charge; the other runs beside it.
- Define both screens at every step; don't forget the one the user is not watching.
- Logic lives wherever the information is.
- Count the attention handoffs, then try to reduce that number to make the process less fragile.
- A screen that repeats an instruction you've already followed looks out of date. All the players should look like they know what's happening.

### What the device says, and when

- Use a scrim (a translucent overlay) to cover the screen only when needed to focus attention on something specific (a mode) or the screen has become untrustworthy due to an error (which is also a mode).
- Words offer interpretation; bars and points show comparison and let the user interpret.
- Touch targets need to be big enough to touch. Not everything is a touch target; other things can be big enough to read.

### Failure

- Try again before you blame the user.
- Be specific about what happened when there's an error, but don't say something happened that didn't. (Don't name an error the system can't tell from another cause.)
- Track the last success apart from the last attempt. If they're merged, a failure can be mistaken for fresh data.
- An error screen should never block the menu that could fix it.
- As you work, keep a list of your stubs; a fake that was forgotten looks like the truth later.

### Security

- Match the security mechanism to what's actually at stake.
- Don't guard what doesn't exist yet.
- A reset has to destroy all of the secrets.

### How the work gets done

- Critique the plan before working the plan.
- Check that your idea is true before making a big claim, and check the thing that would make your claim wrong.
- Keep notes, but remember that a stale note is worse than no note.
- Add notes to your drawing about what the drawing isn't showing.
- Accurately credit what you borrow: "*based* on claude-usage-stick," not "*is* claude-usage-stick," and not nothing.

Next up is building the setup flow that we argued our way into. I'll let you know how it goes.
