---
title: /readme
description: This is the source code for my personal website. It is designed to be a long-term home for my writing and work.
date: 2025-01-27T00:00:00.000Z
layout: base.njk
tags: page
permalink: /readme/
ogImage: /assets/images/og/readme.png
---
{{ "README.md" | readFile | markdown | safe }}
