---
title: Enhanced data dictionary prototype
layout: layouts/portfolio_detail.njk
date: "2026-04-20T12:00:00-08:00"
tags: portfolio
coverImage: 2026/04/dd-list-view.png
description: "A close reading of actual customer configuration data leads to new platform capabilities that are enabled by data we already have, and new patterns useful to customers platform-wide."
ogImage: /assets/images/og/portfolio.png
---
## The situation

Invoca sells conversation intelligence — a platform that tracks phone calls, connects them to marketing campaigns, and fires intent and conversion signals to Google Ads, Salesforce, and forty other systems. Enterprise customers end up with a data model that grows fast: custom fields written by their CRM, built-in fields from Invoca's platform, lookup tables, signals, webhooks, and integrations all layered on top of each other.

For a large enterprise customer I'll call iTelecom, that model had grown to hundreds of fields by the time I started looking at it. The official documentation was a flat list of field names and data types. That's where understanding stopped.

## The problem

The issue wasn't missing documentation. It was the wrong kind.

A flat field list tells you what a field is called. It doesn't tell you when it has data, where that data comes from, who's reading it, what it's called in Salesforce versus in the webhook payload, or whether the field is even active. Several of iTelecom's fields were "entitled but not in use" — they existed because the account was licensed for a capability that was never turned on. They looked identical to live fields, showed up in exports, and had been causing silent errors in attribution reports.

Analysts made decisions based on incomplete mental models. Onboarding a new data person took months of shadowing. When someone left, the knowledge left with them. None of this was visible in any tooling Invoca offered.

In my close reading of a handful of enterprise customer configurations, I found this pattern consistently: the customer champion understood the major workflows, their CSM understood pieces of the technical configuration, but no single person had a complete map, and the platform offered no help building one.

## My response

I treated this as a design problem, not a documentation problem, and built a prototype to make the argument.

The prototype is a data dictionary — but one built around the structure of the system, not a list of its contents. Every field shows its complete provenance: where data comes from (JS tag, Salesforce writeback, platform measurement), where it goes (integrations, webhooks, data deliveries, signals), and what it's called at each end. Clicking any source or consumer opens an inspector with its own detail: fields sent, fields received, external name mappings, status. The whole data ecosystem is traversable from any entry point.

The best part: this could be built in the platform right away using data that already existed there, and building it would introduce patterns the platform sorely needed.

![Data Dictionary list view showing iTelecom fields with filter bar, type badges, source and consumer columns](/assets/images/2026/04/dd-list-view.png)
*The list view covers all 324 fields in iTelecom's configuration — custom, built-in, and hidden. By default, hidden fields aren't shown; "Show hidden" surfaces them alongside live ones. A filter bar slices by field type, tag, source type, and consumer type. Since grouping fields is helpful to understanding what you're measuring, bulk actions allow showing, hiding, and tagging groups of related fields at once.*

## Design considerations

**The data model is the design.** Before writing any UI, I built the field schema to capture everything that matters: source type, consumer type, external field name mappings, visibility status, "entitled but not activated" state, confusion notices for fields with colliding names. Structure first.

**Visibility status is not binary.** Standard tooling shows you "is this field enabled." That's not enough. There's a difference between a field that's off, a field that's hidden from exports, and a field that exists because a paid capability was never activated. iTelecom had all three. Making them distinct — and filterable — changes what analysts can do with the information.

![Data Dictionary filtered to "Not activated" showing fields with orange capability badges](/assets/images/2026/04/dd-not-activated.png)
*Filtering to "not activated" isolates fields that exist in the schema because a paid-for capability was never turned on. These looked identical to live fields in most tooling; they showed up in exports, appeared valid, and cluttered up integration payloads. Making this distinction visible and filterable helps diagnose problems or remind a customer to start making use of a capability they asked for.*

**Traversability over completeness.** A field detail page links to every source and consumer of that field. An inspector lists every field that object receives, with any external name mappings. A signal shows its rule logic and downstream actions. You can start anywhere and follow the chain. No dead ends, no "see the integration docs" footnotes. It was tempting to try to provide a complete data provenance tree, but it got unintelligibly wooly very quickly; a step-wise approach was intelligible to CSMs and customers alike.

![Field detail page for Call Start Time showing metadata strip, editable tags, and source/consumer chips](/assets/images/2026/04/dd-field-detail.png)
*The field detail page shows complete provenance for a single field: where data comes from, where it goes, and status across each connection. System metadata (type, object, custom status) appears alongside editable user metadata (tags). The paused warning on one such consumer is surfaced from the integration config, never before visible at the field level.*

![Inspector panel open for Salesforce (Transaction Events API) showing Fields Sent and Fields Received Writeback sections](/assets/images/2026/04/dd-inspector.png)
*Clicking any source or consumer chip opens an inspector for that object. This one shows the Salesforce integration, and a complete picture of the bidirectional relationship: which fields Invoca sends to Salesforce after each call, and which fields Salesforce writes back via the Transaction Events API. That writeback configuration — disposition, product purchased, order ID — lived in Salesforce and had no visibility in the Invoca platform. Here it's visible at the field level, automatically.*

**System metadata versus user metadata.** Type, object, and built-in/custom status are system-assigned and read-only. Tags belong to the team and are editable in place — individually on the detail view, in bulk from the list. Keeping these conceptually separate turns out to matter a lot once people are actually using the tool.

---

During the process, the coding agent and I built and maintained a handful of documents capturing the data model, how each object is used in the prototype, how the inspector and "used in" patterns work, deferred details, and open decisions. These are Invoca IP so I can't present them here — but the technique is intended to preserve project context, accrue an agent-compatible specification, and make commercialization by engineers with coding agents more straightforward and testable.

You may [play with the prototype](/assets/demos/data-dictionary/data-dictionary.html) pictured above if you like. Note that the sanitized data will have the occasional thing that doesn't quite make sense.
