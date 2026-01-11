This file shows all notable changes, formatted per [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),newest first.

## 2026-01-06

- Remove unused to-ico dependency and reorganize Eleventy docs
- Update pnpm-lock.yaml after removing to-ico
- Update about page with current date and Badgr link

## 2026-01-05

- Migrate from npm to pnpm
- Update configuration files
- Move outdated documentation to archive
- Update documentation
- Improve validation, testing, and security scripts
- Update templates and layouts
- Update content pages
- Update post content and add new post

## 2025-12-24

- Add luxon dependency and update colors documentation
- Add spell checking to test suite
- Update ideas, exclude color-test from deploy, add links

## 2025-12-23

- Improve date/timezone handling with DateTime support
- Reorganize test files into scripts/test/ directory
- Remove unused code and migration scripts
- Miscellaneous updates and improvements
- Add post on agent conversations
- Refactor CSS: consolidate rules and remove duplication

## 2025-12-22

- Add responsive image optimization with figure support
- Remove backup files from migration
- Fix RSS feed formatting and timezone handling

## 2025-12-11

- Add code documentation headers and update tooling
- Implement timezone-aware date handling with PST/PDT default

## 2025-12-10

- Update agent protocol, dev mode passthrough, and add recent links

## 2025-12-09

- Reorganize migration scripts and clean up old files

## 2025-12-08

- Typography improvements: modular scale, baseline grid, and print styles
- Add spinners to deploy script for lengthy operations

## 2025-12-07

- Optimize deploy output and eliminate redundant builds
- Add PDF page-by-page display for portfolio items
- Reduce build verbosity and add animated spinner
- Add portfolio descriptions to index and improve portfolio items
- Convert links-yaml test to unified format and clean up old format code
- Extract spinner frames to shared utility for easier experimentation
- Fix inefficiencies and improve test/deploy output clarity
- Fix HTML validation error in Invoca interview post

## 2025-12-06

- Improve test output formatting and UX
- Fix npm audit vulnerabilities
- Fix duplicate header in individual test output and move test-content-utils
- Improve test output formatting
- Refactor redirects to use data-driven Apache 301 redirects

## 2025-12-05

- Set ogImage to portfolio.png for all portfolio pieces
- Improve test reporting and clarify validation redundancy
- Fix deploy script test type and add dry-run safety check

## 2025-12-04

- Update favicon setup to modern minimal standard
- Refactor includes organization and simplify Open Graph tags
- Refactor HEAD includes to eliminate redundancy and fix index page issues

## 2025-12-03

- Fix horizontal scrollbar on narrow viewports for articles with code blocks
- Switch drafts from folder-based to frontmatter-based
- Modularize .eleventy.js configuration
- Unify exit handling and summary printing across all scripts
- Add date range titles to paginated pages

## 2025-11-30

- Fix sitemap pagination to only include existing pages
- Fix sitemap pagination, improve titles, and fix unescaped quotes
- Upgrade dotenv and fix security audit npm outdated check
- Improve SEO validation for redirect pages and unescaped quotes
- Update redirect template and post content

## 2025-11-26

- Add SITE_DOMAIN environment variable for centralized domain configuration
- Security audit improvements and deployment fixes
- Add security-audit-report.md to .gitignore
- Reduce security audit scope for static site
- Enable smart quotes in markdown and titles
- Refactor test suite and fix nested anchor issue
- Consolidate templates and utilities, fix test issues
- Consolidate documentation and reduce redundancy
- Downgrade dotenv from v17 to v16
- Correct typo in now page

## 2025-11-25

- Security improvements: passwordless SSH, CSP hardening, dependency fixes

## 2025-11-24

- Convert post titles from Title Case to sentence case
- Fix portfolio figure caption styling and update alt texts
- Fix corrupted WeMo figcaption and update portfolio content
- Update now page with corrected dates
- Improve OG image styling and fix color issues

## 2025-11-23

- Update content and fix markdown lint issues
- Implement comprehensive SEO and OG image generation
- Reorganize planning docs into subprojects directory

## 2025-11-22

- Add pre-deploy validation to prevent authoring mistakes
- Move h1 elements from content to template
- Add planning documentation for testing strategy
- Add new links to links feed
- Convert error pages to Markdown and unify link underlining
- Fix meta description validation and add missing descriptions
- Fix markdown lint errors in post files

## 2025-11-20

- Add portrait-grid utility for multi-column image layouts in portfolio details
- Apply portrait-grid to portfolio posts with portrait images

## 2025-11-19

- Refactor project structure and improve documentation
- Move _misc to structured docs/ folder
- Add AI agent instructions to README
- Implement dedicated portfolio detail layout with full-width images and siloed nav
- Refine portfolio layout - text aligns with article column, images full width
- Ensure portfolio detail images span full grid while text stays in column
- Implement image captions for portfolio items
- Update all portfolio items to use portfolio_detail layout
- Wrap all portfolio images in &lt;figure&gt; tags for consistent layout
- Implement responsive portfolio grid layout
- Add blog post about hidden site pages
- General site updates and content cleanup
- Add humans.txt and AI-blocking robots.txt
- Standardize all portfolio images to use HTML &lt;figure&gt; syntax
- Deduplicate .gitignore entries
- Move .htaccess to src/ so it gets copied to build
- Ignore docs/ folder instead of deprecated _misc/
- Add links to technologies in technologies.md

## 2025-11-16

- Add new post about AI-assisted coding and move technologies.md to root

## 2025-11-15

- Add links.yaml validation script and update color scheme to DR10
- Add new post and update content
- Add schema.org structured data for SEO (Person, WebSite, BlogPosting)
- Add SEO meta descriptions to all posts and organize content scripts
- Add post template for new blog posts
- Add documentation maintenance scripts and reorganize project docs
- Update documentation and deployment script

## 2025-11-01

- Update link rendering to show newest links on page 1
- Fix nested paragraphs in link descriptions
- Fix YAML formatting in links.yaml and add YAML validation to tests
- Add _site to .gitignore and remove from git tracking
- Simplify link checking scripts and update notes formatting
- Update data structure and templates
- Update content: blog post and now page
- Update CSS styling
- Update documentation and configuration
- Update package lock and accessibility test script
- Refactor HTML validation and test organization
- Clean up WordPress backup files
- Clean up defunct capabilities and improve naming consistency
- Add security headers to .htaccess
- Add 404 and 500 error pages with permalinks
- Reorganize documentation: move color ideas to notes.md

## 2025-10-08

- New post, cleanup scripts
- Script modularity
- Simpler deployment script
- Update links.json

## 2025-10-06

- Link update

## 2025-10-05

- Removed stupid changedfiles thing
- Implemented remaindered links feature
- Fixed post dates on individual post pages
- Fix feed issues
- Update deploy.js
- More tweaks to deploy scripts
- Vertical rhythm
- Sitemap generation
- Refine test scripts

## 2025-10-04

- Add active page highlighting to navigation
- Touched /now and /about
- Improve typographic hierarchy with letterspacing
- Updated /now and letterspacing

## 2025-09-27

- Meta descriptions and validation
- Added cursor rules file
- Fixed workspace file

## 2025-09-21

- AHrefs issues

## 2025-09-20

- Htaccess
- Redirect /feed/
- Update .gitignore
- Simplify htaccess

## 2025-09-19

- Ignore more .DS_Stroe

## 2025-09-14

- Scripts; validation and deployment
- Tests
- Link checking refinements
- Improved link checking
- SFTP –> rsync
- Documentation cleanup
- Paging fixes
- Cleanup unnecessary files
- Dark mode

## 2025-09-13

- Site nav fixes
- Basic validation issues
- Added arial-label
- Added sitemap

## 2025-09-07

- Pagination and single posts

## 2025-09-06

- Index pagination

## 2025-09-05

- Cleanup

## 2025-09-01

- Fixed some basic rendering issues that had lingered for too long
- Portfolio index loads items now
- Got rid of frontmatter rendering problems for main pages
- Basic typography and spacing for blog posts

## 2025-08-30

- Reworked -Posts structure
- Copied in images from wp.local project
- Building up templates and includes
- Added post and portfolio tags to posts

## 2025-08-27

- Initial commit
- Update .gitignore



Last deployed on 2026-01-07
