---
title: WGA "acceptance criteria for patterns"
layout: layouts/portfolio_detail.njk
date: "2021-06-01T12:00:00-08:00"
tags: portfolio
coverImage: 2022/12/Screenshot2022-11-11at3.30.55PM.png
description: Acceptance criteria document for WGU design system patterns, speeding development and testing by providing clear specifications for developers and QA.
ogImage: /assets/images/og/portfolio.png
---
At Concentric Sky we delivered some form of design system or pattern library to every client depending on their needs and the maturity of the digital property we were working on. For Western Governors University we were working on a new internal tool to manage rich skill descriptors (RSDs), but worked on a complete pattern library up front to speed our own development of the first version of the tool and enable rapid improvements in subsequent projects.

Central to this effort was the [Acceptance Criteria for Patterns](https://misc.jonplummer.com/portfolio/WGU%20acceptance%20criteria%20for%20patterns.pdf) document pictured here. The document included a block diagram of a typical page, followed by descriptions of the form and expected behavior of each pattern, and which smaller patterns each larger pattern incorporates. Each pattern also links the corresponding part of the design system.

<div class="portrait-grid">

![WGU acceptance criteria document showing pattern block diagram](/assets/images/2022/12/Screenshot2022-11-11at3.30.55PM-960x1024.png)
*First page of the Acceptance Criteria for Patterns document showing the block diagram of a typical page layout with labeled pattern areas.*

![WGU acceptance criteria document showing pattern descriptions](/assets/images/2022/12/Screenshot2022-11-11at3.31.41PM-929x1024.png)
*Pattern description page detailing the form, expected behavior, and component relationships for a specific pattern in the design system.*

![WGU acceptance criteria document showing pattern relationships](/assets/images/2022/12/Screenshot2022-11-11at3.31.21PM-1024x1000.png)
*Common controls are a nearly-ubiquitous pattern which can be described once. Be sure to call out the exceptions here and in the specific places where those exceptions apply to implementers don't need to keep the entire document in theri heads.*
</div>

The document serves as a reference to front- and back-end developers and QA, and greatly sped the production of shared code and the subsequent testing of the views and workflows produced. It's estimated that front-end views for the first version of the tool took less than half the time to develop and test one the patterns were in place, and QA commentary was able to focus on larger behavioral questions rather than detailed control behavior and layout.

This document has served as a model for subsequent pattern libraries.
