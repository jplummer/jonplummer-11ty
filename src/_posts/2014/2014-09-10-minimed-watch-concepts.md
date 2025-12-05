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

<figure>
  <img src="/assets/images/2022/12/000.0_overview.jpg" alt="MiniMed watch concept overview showing watch form factor">
  <figcaption>Overview of the watch concept, showing how the insulin pump remote could be designed as a functional wristwatch.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/000.1_features.jpg" alt="MiniMed watch concept features and capabilities">
  <figcaption>Key features and capabilities of the watch concept, including glucose monitoring, bolus delivery, and alarm functions.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/000.1_segment_counts.jpg" alt="MiniMed watch LCD segment count analysis">
  <figcaption>Analysis of LCD segment counts showing the constraints and possibilities of the limited-segment display driver.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/001.1_idle_-_interrupted_signal.jpg" alt="MiniMed watch crown control for accessing settings">
  <figcaption>Just as you pull the crown of an analog watch to set the time, we could pull the crown of this hybrid watch to access various settings.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/001.2_alarm_review_-_off.jpg" alt="MiniMed watch alarm review screen">
  <figcaption>Just as you pull the crown of an analog watch to set the time, we could pull the crown of this hybrid watch to access various settings. use the button to find the proper mode, pull the crown to enter the setting mode, rotate the crown to adjust, push the button to toggle, push crown back in to save.</figcaption>
</figure>

In 2006 this was a fairly radical thought, especially the digital crown and repurposing existing analog watch behaviors for everyday control.

The initial impulse behind this project was to use a controller capable of driving a limited number of segments (I think it was around 170 segments) to make a watch-like object.

<figure>
  <img src="/assets/images/2022/12/0_all_segments.gif" alt="MiniMed watch animation showing all LCD segments illuminated">
  <figcaption>Animation demonstrating all available LCD segments, showing the full range of display capabilities within the segment constraints.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/1_home_walarm_on.gif" alt="MiniMed watch home screen with alarm indicator animated">
  <figcaption>Home screen animation showing the watch face with an active alarm indicator, demonstrating how alerts are communicated visually.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/7_2_status_bolus_in_progress.gif" alt="MiniMed watch bolus delivery status animation">
  <figcaption>Status screen showing a bolus (insulin dose) in progress, with animated progress indicator showing delivery status.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/10_0_bolus_carb.gif" alt="MiniMed watch bolus calculator with carbohydrate entry">
  <figcaption>Bolus calculator screen allowing users to enter carbohydrates for meal-related insulin dosing calculations.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/12_alarm_hi.gif" alt="MiniMed watch high glucose alarm animation">
  <figcaption>High glucose alarm screen alerting the user to elevated blood sugar levels with animated visual indicators.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/12_alarm_predict_lo.gif" alt="MiniMed watch predicted low glucose alarm animation">
  <figcaption>Predicted low glucose alarm using sensor trend data to warn users of impending hypoglycemia before it occurs.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/12_alarm_rise.gif" alt="MiniMed watch rapid glucose rise alarm animation">
  <figcaption>Rapid glucose rise alarm alerting users to fast-increasing blood sugar levels that may require attention.</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/13_0_cal_bg.gif" alt="MiniMed watch blood glucose calibration screen">
  <figcaption>Blood glucose calibration screen allowing users to enter fingerstick readings to calibrate the continuous glucose sensor.</figcaption>
</figure>

Along the way I experimented with digital watch-style multi-button control methods as well, but since a working prototype was never made the results were never usability-tested. I did make a non-functional physical prototype much in the manner of an old-school piano practice board.

<figure>
  <img src="/assets/images/2022/12/lcdwatchinterfacemap-1024x791.png" alt="MiniMed watch interface map showing all screens and navigation paths">
  <figcaption>Complete interface map showing all watch screens, states, and navigation paths, documenting the full interaction model for the watch concept.</figcaption>
</figure>

My role: concepts, interactive specifications, hallway testing with interested employees who were also patients

Lessons learned: there's no substitute for a prototype of any fidelity, and designing for fixed segments is a much different and more limiting beast than pixel-based displays.
