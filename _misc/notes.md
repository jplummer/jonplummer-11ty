
# Commands
## Development
* npm run dev                          # Start development server with live reload
* npm run build                        # Build production site
* npm run start                        # Start development server
* npm run clean                        # Clean build directory
## Test generated site
### HTML validation
npm run validate                       # Check HTML validity
npm run validate-comprehensive         # Check HTML validity plus plus
### Link checking
npm run test-internal-links            # Test only internal links (critical)
npm run test-external-links            # Test only external links (informational)
npm run test-links                     # Test all links
npm run test-internal-links -- --full  # Full scan (all files)
npm run test-external-links -- --full  # Full scan (all files)
npm run test-links -- --full           # Full scan (all files)
## Other content checks
npm run test-content                   # Test content structure
npm run test-performance               # Analyze performance
npm run test-seo                       # Test SEO and meta tags
npm run test-accessibility             # Test accessibility
npm run test-rss                       # Test RSS feeds
npm run test-all                       # Run all tests in sequence
## Deploy site to host
npm run test-deployment                # Test deployment (environment, local build check, 
                                       # dependencies, SSH, remote directory, rsync dry-run)
npm run deploy                         # Full deployment from /_site (clobbers all) using rsync
npm run deploy-changes                 # Deploy only new or changed items from /_site using rsync

# Color ideas

https://www.presentandcorrect.com/blogs/blog/rams-palette
Dieter Rams 01          #af2e1b, #cc6324, #3b4b59, #bfa07a, #d9c3b0
Dieter Rams 02          #aab7bf, #736356, #bfb1a8, #ad1d1d, #261201
Dieter Rams 03          #ed8008, #ed3f1c, #bf1b1b, #736b1e, #d9d2c6
Dieter Rams 03 adjusted #ed8008, #ed3f1c, #bf1b1b, #736b1e, #dadccf
Dieter Rams 04          #bf7c2a, #c09c6f, #5f503e, #9c9c9c, #e1e4e1

https://www.color-hex.com/color-palettes/popular.php 

https://mcochris.com

# 📚 Front Matter Variables
* layout: Which template to use
* title: Page title
* date: Publication date
* tags: Array of tags for collections (post, portfolio)
* permalink: Custom URL structure
* draft: Whether to publish or not
* eleventyExcludeFromCollections: Exclude from collections