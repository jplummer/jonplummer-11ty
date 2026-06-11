---
title: Coordinated experience prototype
layout: layouts/portfolio_detail.njk
date: "2026-03-03T12:00:00-08:00"
tags: portfolio
coverImage: 2026/03/All-Classifiers-with-Draft.png
description: "To make the Invoca classifier selection and report-building experience a coordinated one, new interactive patterns must be introduced."
ogImage: /assets/images/og/portfolio.png
---
To make the Invoca classifier selection and report-building experience a coordinated one, new interactive patterns must be introduced. The demo below presents a common workflow, setting up a report, but enhances that workflow significantly by introducing several needed but missing interactive patterns, including:

* informative placeholder content
* galleries and templates
* copying in
* targeted options
* drafts as privileged, unfinished work
* list, detail, and edit views
* filtered selectors
* linking to more
* "where used"

In the prototype our user starts filling out the Lead Conversion Dashboard report template, notices that they do not have a classifier for the metric they are interested in, visits a gallery of classifiers, copies a gallery item into their workspace and customizes it, then employs it in the finished Lead Conversion Dashboard report.

The needed patterns and interactive details are explained in the captions below each view.

![Lead Conversion Dashboard template, in work](/assets/images/2026/03/Report-Template.png)
*We begin with a report template. This template shows informative placeholder content, giving the user a strong sense of what they will receive at the conclusion of setup. The initial options available have been trimmed to the few absolutely necessary to capture the value the report offers. An enhanced selector offers the user mainly the few classifiers that are relevant to the particular selection being made, but also provides navigation to additional potentially relevant options. A further enhancement might be to populate this report template with real data, pre-selecting likely relevant classifiers and fields from what's available in the user's account, even if that might be wrong, as editing and correcting can be easier than starting with nothing.*

(Not pictured but also benefiting from some of the patterns here: a gallery of report templates and a detail page for an individual template that invites the user to copy that report into their workspace.)

![All classifiers](/assets/images/2026/03/All-Classifiers.png)
*By following the "select from all classifiers" option the user is brought to the All Classifiers page to choose a classifier. Not seeing a classifier that meets their need, they opt to add a new one.*

![All reports, with Draft](/assets/images/2026/03/All-Reports-with-Draft.png)
*Meanwhile, the work the user had begun in reports is saved as a draft. A draft is clearly special, representing unfinished work that needs to be completed to be valuable. A common way of handling versioning and drafts is sorely needed and there are numerous useful examples of doing so in a lightweight way in popular platforms.*

![Gallery of classifiers](/assets/images/2026/03/Classifier-Gallery.png)
*The centerpiece of the new classifier experience is the gallery of classifiers that Invoca (should) provide. A categorized and filterable list of potentially useful objects will help users find what they are looking for, or something to modify to suit their needs, and save the effort of creating objects from scratch for special occasions.*

![Classifier preview](/assets/images/2026/03/Classifier-Preview.png)
*Each canned classifier has a preview where it can be examined in detail. The user is invited to make a copy of the classifier for their own use. The interactive pattern of "copying in" means that Invoca can edit, add, or remove objects in the gallery as needed without harming working customer functionality that might depend on a previous version of a classifier.*

![New classifier detail](/assets/images/2026/03/New-Classifier-Detail.png)
*Copying the canned classifier into their workspace leads us directly to edit mode for customization. Since this is a copy of a gallery item, it is functional immediately – no edits are strictly required, though some are recommended.*

![All classifiers, with draft](/assets/images/2026/03/All-Classifiers-with-Draft.png)
*Meanwhile, this new classifier is also saved as a draft, following the pattern established for reports and other drafts. Interrupted work can be picked up at any time.*

![Classifier detail](/assets/images/2026/03/Classifier-Detail.png)
*The saved classifier, with the user's customizations, is ready for use.*

![Offer to continue interrupted work](/assets/images/2026/03/Return-to-Report-Template.png)
*There are numerous ways we might invite the user to continue their interrupted work on the Lead Conversion Dashboard. In this case we remember that they were choosing a classifier, and now that they have done so we can guess that they are ready to continue the report work. If this sort of interaction bookmarking proves tricky, other ways of inviting the resumption of tasks might include badging nav items that have new drafts, providing a breadcrumb, or stacking views.*

![Lead Conversion Dashboard template, in work 2](/assets/images/2026/03/Report-Template-2.png)
*Now that the user's "comparison shopping" classifier is in place they can complete filling out the Lead Conversion Dashboard setup form…*

![Completed report](/assets/images/2026/03/Report.png)
*…and the report can be read with real data rather than placeholder content.*

![All reports](/assets/images/2026/03/All-Reports.png)
*The All Reports page demonstrates that the report is complete by removing its draft status.*

Not pictured: once the new "comparison shopping" classifier is employed on the Lead Conversion Dashboard report, the classifier's detail view can show that it is in use on the Lead Conversion Dashboard, and link to that report as a convenience. This will help coordinate the experience (cross linking object to the objects they use and are used by) and also provides clues as to how well- or poorly-used an object is within the system. An unused object is likely safe to remove, but Invoca users currently have no way to tell *if* an object is used or *where* that might be.
