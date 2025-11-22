---
title: What I learned from my big mistake
layout: single_post.njk
date: "2022-01-31T12:00:00-08:00"
tags: post
description: "On Friday last week I deleted a chunk of the wiki. All of the product management pages, in fact. The work of a team of fifteen, organizing and guiding the work"
---
On Friday last week I deleted a chunk of the wiki. All of the product management pages, in fact. The work of a team of fifteen, organizing and guiding the work of a hundred people, gone. I've managed to avoid being fired, so far. People have been very nice about this, so far. But I don't expect their good will to last: as they trip over the lack of things that were once in place they will learn the painful extent of my big mistake.

There were many failures involved in this big mistake, but the biggest failure belongs to me.

## What happened

The design team, which I lead, had been putting our recent work on the design system, user research, interaction guidelines, etc. in the product management space for quite a while now, but there was a disused old space that contained similar but outdated content, penned by past designers, that cluttered up search results and created confusion among the design and product teams. I was working through the contents of this area, moving some pages to the product management space and marking them as old work, archiving other pages, and deleting "stubs" (pages devoid of content) outright. So I was working in two spaces at once.

At some point the disused old space was effectively empty, so I thought I'd delete it. From the homepage of the disused space I went to space administration, and chose to delete the space. And since I had just done a lot of work there to clear it out, and thought of that work as now safe in the product management space, I didn't pay super-close attention to the confirmation message that warned that the deletion was not reversible. But that confirmation was attempting to warn me that I was deleting the product management space. I blithely confirmed the deletion, then a progress bar appeared, and grew, and was not cancelable.

As the progress bar grew I realized what I had done and panic rose in my chest. I quickly opened a new window and quickly did an export of the product management space, which was in the process of being deleted. I got 22MB of data, so not nothing, but that export is likely partial; I have no idea how large a full export would have been.

Expecting that I had just caused my imminent firing, I immediately Slacked someone in IT for help, my VP of Product to tell her what I had done, and the product team as a whole to apologize and point out that I would do my best to find a solution. As I said, people have been very nice about this, so far. I hope I can act in such a way that preserves at least some of that good will.

I hope they reduce my rights on the system significantly.

## Lessons for me

I was working in two spaces at once, so the likelihood of "pedal error," choosing the wrong action believing it is the right one, was high.

I'll probably never know if it was pedal error or a bug that caused the wrong space to be offered to me for deletion. I believed I had selected the correct space for deletion. But sure of myself in that moment I skimmed over the confirmation step. Others have had this same complaint, if the support site is to be believed, that they selected one space for deletion and were offered a different one. Even so, I should have:

- **Read and heeded confirmation messages**. Failing to do this was the core of my big mistake.
- **Taken a moment before doing anything momentous** or destructive. A bit of time can be room for your brain to catch up to your hands.
- **Taken my own steps to make destructive acts recoverable**. I could have done a full export of both spaces before deleting anything. Had I bothered to actually read the confirmation message I may have thought to do so. Had I paused I may have thought to do so. It would take only a few minutes and be free insurance against catastrophe.
- **Made use of archival or "logical delete" rather than destructive processes**. When available, archiving a page or a space or other record is inherently more recoverable than deleting. It's not clear if this was an option in my case, but it's a good idea. If you find you never visit these archived items, you can choose to delete them later.

I'm happy that I had already learned these lessons:

- **Hang a lantern on your problem**. Had I not started communicating immediately, I'm sure things would be much worse for me. Worse, had I said nothing, I would eventually have been found out and fired not for the mistake but for the cover-up. In my panic it did take a half a beat to recall this lesson.
- **Form a plan with multiple paths to success**. It's not safe to rely on a single path to disaster recovery. How many paths to success can you think of? Can you pursue all of them? How can you maximize your chance of success? If you have just one plan, and it fails, then what?

## Lessons for interfaces and systems

If you would like your system to be kind to me and other normal folks, you'll want to arrange things so mistakes are harder to make, or easier to recover from, or both. There are a lot of things you can do, roughly in order from least to most difficult:

- **Offer recovery preparation activities alongside the destructive action**. It's straightforward to add a reminder to make an export or backup to your confirmation message. Would it have helped me? Who can say.
- **Offer recovery preparation activities alongside the confirmation message**. It's a little less straightforward to offer an export at the point of confirmation. But it's not that hard, and that reminder will catch some folks before they make a mistake.
- **Make confirmation of destructive acts require reading to complete**. You've seen this in Figma and other places, where you are asked to type something to confirm the action. The best of these ask you to think a little bit; "Type the name of the space to confirm that you want to delete it" is better than "type DELETE to confirm that you want to delete this space" as it requires a bit more attention. In this case, a little cognitive load is your friend.
- **Make lengthy or multi-step destructive acts cancelable**. Even if part of the information is saved it is better than watching the system slowly put your mistake into practice with no recourse. In my case, deleting a space involves several transactions – making each page a hidden page, removing the association of the space with its home or overview page, deleting each page, then deleting the now empty space. Stopping at any point in that chain of events would have spared some fraction of the data.
- **Offer archival or logical delete in addition to outright deletion**. Users are more likely to mishandle their data if alternatives to deletion are not available.
- **Offer archival or logical delete _instead of_ outright deletion**. Users can't delete if they can't delete This increases data storage costs, and signs you up to write more interfaces to browse and change the status of archived records, but major mistakes become minor ones.
- **Automatically perform recovery preparation activities**. An automatic export prior to deletion adds time and storage cost to the process, but can save someone's day by giving them the tools needed to undo a mistake.
- **Make destructive acts easily recoverable**. This is the most expensive yet most _polite_ way to handle user data. Let any act be undoable. It's not easy to architect, much less to implement, but the level of comfort it offers to users is extreme. Mistakes in word processors used to be costly and painful, but today they are trivialities. And the effort it takes away from users is likely worth the design and engineering costs.

## Lessons for organizations

A prior IT regime read about the backup practices of our vendor and felt that they were sufficient protection. They read that the vendor makes nightly backups and retains them for thirty days. But there they stopped reading, not noticing that these backups are not offered to clients and are only for vendor-level disaster recovery. So while a backup technically exists, it is no protection from client-caused mishaps. There are several lessons in this one fact:

- **Do not expect your users not to make mistakes**. See "lessons for me" above to learn of typical mistakes.
- **Read the whole contract**.
- **Do not leave backup solely up to your vendor**, even if their backup plan sounds adequate. if you aren't in control of your data, you aren't in control of your data.
- **Do not believe you have a working backup unless you've practiced recovering** via that backup. What does it take to recover from a disaster? How do you know? Are you really ready to accomplish this? One way to find out.
- **Do not believe you have a working backup unless you've verified its contents**. Ah, you have a backup. Your'e covered! Unless…drat, the backup is corrupted, or incomplete, or old because the job has been failing for a while, or a thousand other problems.

There's also the small matter of roles and privileges:

- **The less safe the data is, the fewer people should be allowed to harm it**. No backup? Restrict deletion privileges to relatively inaccessible people, not day-to-day editors. Yes, they'll grumble. But it is for their own good.

## My plan, and what I've done so far

I've got a partial export, a backup locked up at the vendor that I allegedly do not have access to, an unknown level of inconvenience caused to coworkers, and an unknown amount of time and effort between now and whatever level of recovery I am able to effect. Above I mentioned having and putting into practice multiple paths to success. The possible paths to success seem to be

- restoring the export and finding out what is in it, in hopes that it meaningfully reduces the loss
- appealing to the vendor to have access to their backup, which should be complete
- scouring the existing IT infrastructure for any possible existing export or backup we might have

I am pursuing all of these in parallel. In the meantime I have

- communicated this plan with my supervisor, with my employees, and with my peers and others on the product team
- apologized to the design and product teams and individually to select people, especially those who had recently contributed or shared work via the wiki
- shared my plan with the current IT regime so that we can help each other
- opened a temporary space for the teams to use to avoid namespace pollution or any untoward effects of a possible full, partial, or botched restore

I am also communicating the emerging status with team members daily.

I know that with all of this, the likelihood of a full recovery is slim. And I know that at a certain point, some organizations will fire an employee for the effect of their mistakes regardless of the circumstances. If that comes to pass I will understand. But I will pursue multiple paths to success until that happens.

## Update

The product management area of the wiki is back. My export was not usable, but the vendor agreed to help by rolling the wiki back to the moment prior to deletion, allowing us to export the data for the product management space, rolling it forward again, and allowing us to re-import the exported data. Thanks be to the IT person who convinced the vendor to help and who worked on the problem after-hours so that on the morning of day six we had the data back in place.

A side-effect of this is that every inbound link to pages in this area is broken. But so far this seems surmountable. Another side effect is that we now have a backup strategy that we are in charge of, and will not have to appeal to the vendor for further help if additional mistakes are made. I expect a security/privileges audit will come soon.
