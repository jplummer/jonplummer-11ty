---
title: "Belkin hardware behavioral specifications samples"
layout: layouts/portfolio_detail.njk
date: "2015-08-01T12:00:00-08:00"
tags: portfolio
coverImage: 2015/08/belkin-wps-states.png
description: "A few ways we evaluated and specified hardware behavior at Belkin. None of these were in practice before I arrived."
ogImage: /assets/images/og/portfolio.png
---
At Belkin it was critically important to evaluate and specify hardware behavior clearly so that product management, UX, industrial design, electrical engineering, firmware, and original device manufacturers could agree on and faithfully reproduce the intended behavior. Over the years I introduced practices standard elsewhere and developed new ways of expressing these behaviors for different audiences. Below are a handful of samples from different projects.

![WPS state diagram](/assets/images/2015/08/belkin-wps-states.png)
*There was a published IEEE standard for WiFi Protected Setup button and LED behavior but a close reading found it sloppy; it gave a lot of room for interpretation that could lead to poor communication with the user. Establishing the "Belkin way" of meeting the standard gave us a common behavior we could apply to routers, range extenders, and wireless clients, provably met the standard, and solidified this behavior for years to come.*

![Router reset behavior](/assets/images/2015/08/belkin-router-led-reset-behavior.png)
*A rare event like using the reset button on a router, especially since it has multiple outcomes hidden behind a single button, requires a carefully-crafted state diagram and not much effort spent establishing new communication modes.*

![Evaluating Netcam LED behavior during setup](/assets/images/2015/08/belkin-netcam-led-eval-setup.png)
*How do you explain to people what it feels like to use a product as it currently stands and how to improve that feeling? With a timeline.*

![Evaluating Netcam LED behavior during setup](/assets/images/2015/08/belkin-netcam-led-eval-normal.png)
*This method also offered opportunities to reduce cost in the product: if we find that part of the product isn't communicating usefully, or isn't helpful to the task at hand, we can save the unit cost.*

![Netcam phases of experience](/assets/images/2015/08/belkin-netcam-phases-of-experience.png)
*Of course, it is hard to evaluate device behavior unless you know what you want. Before I arrived no one had aligned the segments of an experience with the technical and emotional goals of those segments.*

![An alternate way of explaining LED behavior experientially](/assets/images/2015/08/belkin-netcam-led-behavior.png)
*I experimented with alternate ways of expressing device behavior. This method combined a timeline with aspects of a state diagram, dividing the experience into mode-based regions and was especially appreciated by management and QA.*
