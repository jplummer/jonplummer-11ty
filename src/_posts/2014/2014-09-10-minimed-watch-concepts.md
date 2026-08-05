---
title: "MiniMed watch interface design concepts"
layout: layouts/portfolio_detail.njk
date: "2014-09-10T12:00:00-08:00"
tags: portfolio
coverImage: 2022/12/001.1_idle_-_interrupted_signal.jpg
description: "Skunkworks project exploring a wearable watch remote for insulin pumps and glucose sensors, using limited-segment LCD displays and digital crown controls."
ogImage: /assets/images/og/portfolio.png
---
A skunkworks project to make a wearable remote for an insulin pump and glucose sensor, based on an existing LCD driver with limited segment count, led naturally to wondering: what if it were really a watch, that looked and worked like a watch?

![MiniMed watch concept overview showing watch form factor](/assets/images/2022/12/000.0_overview.jpg)
*Overview of the watch concept, showing how the insulin pump remote could be designed as a functional wristwatch.*

![MiniMed watch concept features and capabilities](/assets/images/2022/12/000.1_features.jpg)
*Key features and capabilities of the watch concept, including glucose monitoring, bolus delivery, and alarm functions.*

![MiniMed watch LCD segment count analysis](/assets/images/2022/12/000.1_segment_counts.jpg)
*Analysis of LCD segment counts showing the constraints and possibilities of the limited-segment display driver.*

![MiniMed watch crown control for accessing settings](/assets/images/2022/12/001.1_idle_-_interrupted_signal.jpg)
*This digital crown concept predates Apple Watch by eight years. The idea didn't come from a smartwatch; it came from asking what the physical vocabulary of an analog watch could do for a segment-limited LCD. Just as pulling the crown puts you in a "set" mode on an analog watch, and pushing it back in "saves" your work, we could enter and exit a "set" mode for a variety of functions with this same gesture.*

![MiniMed watch alarm review screen](/assets/images/2022/12/001.2_alarm_review_-_off.jpg)
*Push the button to find the mode, pull the crown to enter setting mode, rotate to adjust, push to toggle, push back in to save — five steps mapped onto a control people already knew how to use.*

In 2006 this was a fairly radical thought, especially the digital crown and repurposing existing analog watch behaviors for everyday control.

The initial impulse behind this project was to use a controller capable of driving a limited number of segments (I think it was around 170 segments) to make a watch-like object.

![MiniMed watch animation showing all LCD segments illuminated](/assets/images/2022/12/0_all_segments.gif)
*Animation demonstrating all available LCD segments, showing the full range of display capabilities within the segment constraints.*

![MiniMed watch home screen with alarm indicator animated](/assets/images/2022/12/1_home_walarm_on.gif)
*Home screen animation showing the watch face with an active alarm indicator, demonstrating how alerts are communicated visually.*

![MiniMed watch bolus delivery status animation](/assets/images/2022/12/7_2_status_bolus_in_progress.gif)
*Status screen showing a bolus (insulin dose) in progress, with animated progress indicator showing delivery status.*

![MiniMed watch bolus calculator with carbohydrate entry](/assets/images/2022/12/10_0_bolus_carb.gif)
*Bolus calculator screen allowing users to enter carbohydrates for meal-related insulin dosing calculations.*

![MiniMed watch high glucose alarm animation](/assets/images/2022/12/12_alarm_hi.gif)
*High glucose alarm screen alerting the user to elevated blood sugar levels with animated visual indicators.*

![MiniMed watch predicted low glucose alarm animation](/assets/images/2022/12/12_alarm_predict_lo.gif)
*Predicted low glucose alarm using sensor trend data to warn users of impending hypoglycemia before it occurs.*

![MiniMed watch rapid glucose rise alarm animation](/assets/images/2022/12/12_alarm_rise.gif)
*Rapid glucose rise alarm alerting users to fast-increasing blood sugar levels that may require attention.*

![MiniMed watch blood glucose calibration screen](/assets/images/2022/12/13_0_cal_bg.gif)
*Blood glucose calibration screen allowing users to enter fingerstick readings to calibrate the continuous glucose sensor.*

Along the way I experimented with digital watch-style multi-button control methods as well, but since a working prototype was never made the results were never usability-tested. I did make a non-functional physical prototype much in the manner of an old-school piano practice board.

![MiniMed watch interface map showing all screens and navigation paths](/assets/images/2022/12/lcdwatchinterfacemap-1024x791.png)
*Complete interface map showing all watch screens, states, and navigation paths, documenting the full interaction model for the watch concept.*

My role: concepts, interactive specifications, hallway testing with interested employees who were also patients

Lessons learned: there's no substitute for a prototype of any fidelity, and designing for fixed segments is a much different and more limiting beast than pixel-based displays.
