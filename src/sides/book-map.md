---
title: Book Map
description: A map of where reviewed books are set, generated from a plain text file and built so the basemap gets out of the way and the clustering comes forward.
date: 2026-09-10
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/book-map/
status: Ready to deploy
coverImage: 2026/09/book-map.jpg
coverPosition: center 40%
githubUrl: https://github.com/jplummer/erindouglass-bookmap
ogImage: /assets/images/og/sides.png
---
My wife, [Erin Douglass](https://erindouglass.com), reviews books. At some point she started marking where they were set on a world map, for her own curiosity – Antarctica, Réunion Island, a Louisiana bayou, wartime Germany.

The printed world map was already full of information – borders, cities, labels, terrain – all competing with her few dozen stickers, making the signal hard to pick out. Then a second thought: wouldn't it be nice to share this with other folks? And a third: would this be an interesting index, or supplement to an index, of her book review work? So I set out to make a book map.

Start with the user – she's smart but not a developer, so the data needs to be kept in a format she can confidently edit. She has a personal website on Squarespace, so whatever I make needs to drop into that environment with minimal difficulty. And the list is growing every month – we need a way to extend and regenerate the map that's pretty easy to do. Also, I wanted to know what it's like to build on somebody else's mapping service when you're directing an agent through it instead of writing it yourself.

So the data is a YAML file rather than JSON or something more picky. Each book gets a title, an author, an ISBN, a link to Erin's review, and one or more place names. Run the build script and place names are into coordinates, cover art is fetched, overlapping pins are scattered, and one HTML file is produced that she can put on her site. Adding a book is five lines and one command.

From there it's a matter of style, and the styles are offered by Stadia Maps. We're small fry, so the free tier – 200,000 credits a month, non-commercial only – works fine.

## Try it

<p class="post-demo-popout"><a href="/assets/demos/erindouglass-bookmap/index.html" target="_blank" rel="noopener">open the map in a new tab</a></p>

<div class="post-demo-embed">
  <iframe
    class="post-demo-embed-frame"
    src="/assets/demos/erindouglass-bookmap/index.html"
    title="Book Map – 44 reviewed books pinned to where they are set, with a panel for trying map and pin styles"
    loading="lazy"
  ></iframe>
</div>

That's the real thing as of this writing, with 44 books across 56 places. Every pin has an on-click overlay with the book image, title, genre, author, location, and a link to the review. That makes the map an index. Arrows around the edge let you know how many pins are off-screen in that direction.

The panel on the right is how we explore style. Every free tile and pin style redraws the map live. Try a few and watch what happens.

## How it works

`books.yaml` is the whole input. The build script geocodes each place name through [Nominatim](https://nominatim.org/) and caches what comes back, so a second build skips the lookup and the one-request-per-second wait that goes with it. ISBNs pull title, author, year, and genre from the [Google Books API](https://developers.google.com/books); covers come from [Open Library](https://openlibrary.org/dev/docs/api/covers), falling back to Google Books for the roughly one book in five Open Library has no artwork for. The book data ends up baked into the output as JSON, and the map drawing it is [Leaflet](https://leafletjs.com/).

A build writes two files. `index.html` is the clean one for her site. `preview.html` is the one above: the same map plus the style picker. Pick a combination there, write the two names into `books.yaml`, rebuild, and the clean file comes out looking like what you chose.

That panel made the initial demo and picking the "watercolor" style easy. I walked Erin through the styles, saving watercolor for last because I was fairly sure it was the one. (After 26 years of marriage you'd hope I'd guess right.)

Watercolor works in part because it carries no type and no hard borders, so it stays behind the dots and lets the clustering come forward. Alidade and Toner Lite do the same job in colder, more technical colors. Satellite and Nat Geo have the paper map's problem again – both are beautiful, but on both the dots have to fight for your attention.

The map opens by fitting the middle 90% of the pins rather than all of them, because one book set in Antarctica drags the view out to the whole globe. Fitting instead of fixing a zoom is what lets it survive a phone – the same call that frames the books on a laptop frames them on a narrow screen, and the counted arrows account for whatever falls off the edge. There's a floor under it: Leaflet has no tiles above or below the world, so zooming out past the point where the world fills the window leaves grey bands top and bottom, and the map won't go there.

## Map tiles, and what breaks in public

The default style, [Stamen Watercolor](https://stadiamaps.com/stamen/), comes from [Stadia Maps](https://stadiamaps.com/), and Stadia wants to know who's using their service. A request with no key and no referring domain comes back HTTP/401, and the map draws ugly tiles complaining that you're not authorized.

There's no API key anywhere in this project, which took a little arranging. Anything shipped to a public page is readable, so a key in the HTML is a key you've handed out. [Domain authentication](https://docs.stadiamaps.com/authentication/) does the same job without one: register a domain in the Stadia dashboard and browser requests from pages on it are allowed on their own. jonplummer.com is registered, which is why the map above isn't shouting at you. Erin's domain needs the same entry before it draws there. Locally there's nothing to configure – Stadia accepts unauthenticated requests from localhost, so serving the folder is enough to click through every style.

CARTO's Positron and Voyager styles were in that panel until recently. They still answer every tile request with HTTP/200 and a good-looking PNG, but with "API KEY REQUIRED" printed diagonally across it. They're gone now, six styles lighter.

What's left needs an account but not much of one. Stadia's Alidade Smooth is the clean light basemap Positron used to be, and authenticates by domain like the other free styles. Plain [OpenStreetMap](https://www.openstreetmap.org/) tiles need nothing at all beyond correct attribution and modest traffic – their [tile policy](https://operations.osmfoundation.org/policies/tiles/) is clear that a small embedded map is welcome and a bulk download is not. The map prints the right attribution for whichever style is showing, so switching is a one-line change in `books.yaml`.

## Where the covers come from

The covers took four tries. They started as image files in the repo, one per book, which meant a folder to maintain and 44 things to keep in step with the YAML, and more to come. Then Google Books, which has a static link you can build from an ISBN alone: no API call, no key, no files. Then Open Library, on the grounds that its covers came back cleanly from a web server where the Google ones had been fussy. But these services have their own foibles.

Open Library has artwork for 35 of the current 44 books. For the other nine it returns HTTP 200 and a 43-byte transparent GIF, one pixel square. A seeming success that renders as nothing. The popup laid itself out around a cover that wasn't there, but looked like a mistake.

This reminds us that a status code isn't enough to know you're getting what you expect from a service: CARTO hands back a real image with a watermark burned into it; Open Library hands back a real image that's a single transparent pixel, both return HTTP/200.

The obvious check is also wrong. Open Library's covers endpoint takes a `?default=false` parameter meant to 404 when there's no artwork, and it answers 404 for every ISBN, present or absent. The question that works has to be put to their [Books API](https://openlibrary.org/dev/docs/api/books) instead, where a missing cover is an explicit null. So that's what the enrichment script asks now, falling back to the Google Books link for the nine – which has all nine.

Which lands the covers about where they started, minus the local files: two sources, one preferred, checked at the moment a book is added.

None of that survives volume. Both sources are hotlinks, so every visitor's browser fetches 44 images from two companies under no obligation to keep serving them, and neither promises a given ISBN still resolves next year. At 44 books nobody minds. At a few hundred, on a page with real traffic, the polite thing is to fetch each cover once and serve copies from wherever the map lives. That's also where it stops being a technical question: a cached cover is a copy of someone's book jacket sitting on your server, and Open Library and Google Books have different terms about that.

## What I'd change

Two books set in the same city would sit on top of each other by default, so the script pushes duplicates apart by 120 to 280 kilometers in a random direction. That keeps both pins clickable but puts a book set in Paris out near Rouen. Fanning them out by a few pixels at the current zoom would be more expressive of the real location, but this arrangement is fine for now. Leaflet's marker clustering, which collapses pins that share a location into one numbered dot, obscured the richness of the data set – hence the scatter.

The cluster over the plains states isn't a literary trend. Those are books whose entry says only "United States," which geocodes to the middle of the country and then gets jittered as any other cluster does. A more specific place name would fix each one, and the enrichment script can propose them from Wikipedia, but I'll leave that detail to someone else.

The offsets are random and drawn fresh on each load, so pins land in slightly different places every time. This is a little odd once you notice it, but harmless.

This isn't quite plug-and-play yet. Putting the file on Squarespace really is easy, but getting a fresh file still means a terminal, a Python environment, and a command, which is light development effort. So the arrangement we've landed on is that Erin will edit the book list and I will run the build and hand her the result. That's fine between the two of us, and easy enough – a build that ran on a schedule on a server somewhere, or a script she could double-click, would take it out of my hands entirely. Maybe someday.

The output isn't self-contained. Leaflet loads from a CDN, tiles come from Stadia, covers come from Open Library and Google Books – four network dependencies inside one HTML file. Fine for now, but fragile, and untenable with any real traffic.

## Repo content

`books.yaml` – the input file, with the format documented at the top.
`build.py` – geocoding, caching, and the HTML template. Writes both outputs.
`enrich_books.py` – fills in missing metadata from the Google Books API, and can search Wikipedia for a more specific setting when a book only has something like "United States."
`cache/geocoding.json` – coordinates already looked up, so builds stay fast and stay inside Nominatim's rate limit.
`docs/squarespace_guide.md` – the upload-and-embed path, written for Erin rather than for me.

## Getting started

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 build.py
python3 -m http.server 8000 --directory output
```

Then open `http://localhost:8000/preview.html` and pick a look. Serving the folder rather than opening the file straight off disk matters for the referring-domain reason above, and `--directory` keeps you in the project root so the next `python3 build.py` still finds `books.yaml`. Add books to `books.yaml`, rebuild, upload `output/index.html`.

<h2 id="privacy-and-terms">Privacy and terms</h2>

Book Map is a build script and a static map. There's no server, no account, and no analytics of any kind. The generated page loads map tiles from Stadia Maps, book covers from Open Library and Google Books, and the Leaflet library from a CDN, so those services see the ordinary request data any web page's assets would give them. Nothing else is collected. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time. Source is on GitHub under the [PolyForm Noncommercial License 1.0.0](https://github.com/jplummer/erindouglass-bookmap/blob/main/LICENSE).
