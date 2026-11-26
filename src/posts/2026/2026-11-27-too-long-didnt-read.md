---
title: tl;dr
layout: layouts/single_post.njk
date: "2026-11-27"
tags: post
description: "What to do when an agent blithely mentions that it read only part of a file."
---
Does this sound familiar?

> I only read the top 60 lines, so I missed that.

## Agents stop at the top

An agent does a partial read of a lengthy file (or really any file) to save context, of course. And sometimes a tool read has an input or output cap. You'd like a long file to be read in chunks, but often you just get one chunk.

Then the agent acts as if what it read is all there was – there's typically nothing telling the agent to go back to a long file to read the rest unless that's part of your prompt or instructions, and probably not even then. What might we do about that?

## Three ideas

### Would a table of contents help?

We might encourage an agent to read further in a file by breaking the document into well-named headings and putting a list of those headings at the top of the document. This would require the document to satisfy a few guidelines:

* Headings are descriptive – "Back-to-school accessories assortment" is descriptive, "Notes" is not.
* Good markdown is used – Headings prefaced with `#` are easy to `grep` – text searches are slower and more fragile.
* The instruction to use the ToC appears just above the ToC and is short – a la "Sections list. Read sections relevant to your task before acting."
* The ToC is kept up-to-date – easy for a human to forget to do, so have a script take care of it.

The idea is that the first thing the agent reads is essentially a map of the entire file, bringing what the sections contain into early context.

I haven't tried this yet.

### Would better instructions help?

We might consider putting one line at the top of our global instructions (a la CLAUDE.md or AGENTS.md), to the effect of "Before reading any markdown file over ~200 lines, run `grep -n '^#' file` and decide which sections to read." This will encourage the agent to at least skim the entire file.

If the agent doesn't know what info is pertinent to your request, this might not help, but if you're adding context to an existing job partway through it seems likely to make information lower down in the file known to the agent.

I've added an instruction like this recently. It's rule one, alongside my rule zero of `When anything fails: STOP. Explain. Wait for confirmation before proceeding.` I don't know yet if it is working.

### Should we send a subagent to do the work?

For a single long document, spinning up a cheaper subagent to read and pick out the most pertinent information is probably not worth the tokens. Starting and managing the subagent costs a bit. There'll be [generation loss](https://en.wikipedia.org/wiki/Generation_loss) in both directions – the interpretation of the subrequest destroys a little information, the summarization the subagent does destroys a little more, and the main agent's interpretation of that result does also. This increases the risk that the main agent won't get what it needs or will draw the wrong conclusions from the summary. Also, the subagent is less likely to understand what is pertinent than the main agent, since it lacks the main agent's context.

On the other hand, if you have several long documents you are tempted to add to context, and the question is narrow and easy to state, almost mechanical ("find every mention of quarterly results, find the interpretive statements for each, and arrange them into categories"), and the main agent is already freighted with context, it might be a smart approach.

I haven't tried this yet.

## In the meantime

The most common advice is to be concise and put the most important information at the top. For single-topic documents, this is sensible and it helps human readers as well – the [inverse-pyramid style of journalistic writing](https://en.wikipedia.org/wiki/Inverted_pyramid_(journalism)) is your pre-AI example here.

I use this in my plan.md documents all the time – current status, followed by open tasks, followed by background, with completed tasks archived to the bottom. This helps me stay oriented and puts the information most likely to affect a decision within the first 50 lines or so. It's a habit I picked up from improving my pre-LLM project and one-on-one notes over time. The narrative is useful, but if I don't spend the time to draw conclusions and put them at the top it becomes a pain to paw through the history to find the most relevant data.

In order of cost:

1) Keep the most pertinent information at the top
2) Add a single instruction to your global instructions to skim for headings before reading
3) Create and maintain (automated) a list of headings at the top of long documents
4) Spin up a subagent to take in and comb through large bodies of text

I already do 1. I just did 2 and will report back. I probably won't try 3, and I'll save 4 for special occasions. Any other ideas?
