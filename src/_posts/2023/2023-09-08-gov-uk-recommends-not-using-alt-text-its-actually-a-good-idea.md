---
title: Why Gov.uk's alt text guidance is actually good advice
layout: layouts/single_post.njk
date: "2023-09-08T12:00:00-08:00"
tags: post
description: "\\[name redacted\\] writes: > UK Gov websites dropping support for alt text fields and giving odd advice about what screen reader users want is making the rounds"
ogImage: /assets/images/og/2023-09-08-gov-uk-recommends-not-using-alt-text-its-actually-a-good-idea.png
---
\[name redacted\] writes:

> UK Gov websites dropping support for alt text fields and giving odd advice about what screen reader users want is making the rounds on Linkedin [https://insidegovuk.blog.gov.uk/2023/08/10/making-it-easier-to-add-images-on-gov-uk/](https://insidegovuk.blog.gov.uk/2023/08/10/making-it-easier-to-add-images-on-gov-uk/)

Naturally this has been met with many hot takes, including

> bizarre, especially given that i have often heard the uk gov is a good example of taking accessibility seriously
>
> \[name redacted 2\]

and

> I wonder if they consulted any screen reader users before they went with this somewhat condescending metaphor: "Another way to make sure you are describing the image properly is to imagine that you're reading out the content of the page on a telephone. When you get to the image, what would you say to help the listener understand the point the page is making?"
>
> \[name redacted 3\]

…as well as complaints that Gov.uk is "canceling the alt tag" and other alarmist conclusions.

Gov.uk's advice is actually pretty good, if a bit high-level.

We _should_ provide alternate content for anything that is not text or cannot be read by a screen reader and that is important to the meaning of the page – for example, if the image were missing or broken the page’s meaning or intelligibility would be diminished – and should _not_ provide alternate content for anything that can be safely left out without diminishing that meaning.

There are a few ways to provide alternate content; the `alt` attribute is one of them. It appears that [gov.uk](http://gov.uk/) is expressing in part that the `alt` attribute is a less accessible way of presenting that alternate content than simply putting that alternate content right into the page, and that’s true: a person who needs the content in the `alt` attribute but doesn't use a screen reader (such as a person using a magnifier) will have to do some extra work to dig that content out of the `alt` attribute that a screen reader user would not need to do. That person would be helped if the alternate content were in the page, and no one else would be inconvenienced by this change.
