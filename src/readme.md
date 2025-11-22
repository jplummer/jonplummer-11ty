---
title: "/readme"
description: "This is the source code for my personal website. It is designed to be a long-term home for my writing and work."
date: 2025-01-27
layout: base.njk
tags: page
permalink: "/readme/"
---
{{ "README.md" | readFile | markdown | safe }}
