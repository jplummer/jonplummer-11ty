All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to chronological ordering (newest first).

## 2025-12-06

- Improve test output formatting and UX
- Fix npm audit vulnerabilities
- Fix duplicate header in individual test output and move test-content-utils

## 2025-12-05

- Set ogImage to portfolio.png for all portfolio pieces
- Improve test reporting and clarify validation redundancy
- Fix deploy script test type and add dry-run safety check

## 2025-12-04

- Update favicon setup to modern minimal standard
- Refactor includes organization and simplify Open Graph tags
- Refactor HEAD includes to eliminate redundancy and fix index page issues
- Reduce whitespace in HEAD section

## 2025-12-03

- Fix horizontal scrollbar on narrow viewports for articles with code blocks
- Switch drafts from folder-based to frontmatter-based
- refactor: modularize .eleventy.js configuration
- refactor: unify exit handling and summary printing across all scripts
- Add date range titles to paginated pages

## 2025-11-30

- Fix sitemap pagination to only include existing pages
- Fix sitemap pagination, improve titles, and fix unescaped quotes
- fix: upgrade dotenv and fix security audit npm outdated check
- test: improve SEO validation for redirect pages and unescaped quotes
- content: update redirect template and post content
- docs: add periodic maintenance section and update plan

## 2025-11-26

- Add SITE_DOMAIN environment variable for centralized domain configuration
- Security audit improvements and deployment fixes
- Add security-audit-report.md to .gitignore
- Reduce security audit scope for static site
- fix: resolve HTML validation errors in changelog and code blocks
- Enable smart quotes in markdown and titles
- Refactor test suite and fix nested anchor issue
- Refactor: Consolidate templates and utilities, fix test issues
- docs: consolidate documentation and reduce redundancy
- chore: downgrade dotenv from v17 to v16
- fix: correct typo in now page

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
- feat: implement comprehensive SEO and OG image generation
- docs: reorganize planning docs into subprojects directory

## 2025-11-22

- feat: add pre-deploy validation to prevent authoring mistakes
- refactor: move h1 elements from content to template
- feat: add new links to links feed
- Convert error pages to Markdown and unify link underlining
- Fix meta description validation and add missing descriptions
- Documentation updates: 3 commits
- fix: fix markdown lint errors in post files

## 2025-11-20

- feat: add portrait-grid utility for multi-column image layouts in portfolio details
- style: apply portrait-grid to portfolio posts with portrait images
- docs: update plan.md to reflect completed portfolio template work

## 2025-11-19

- Refactor project structure and improve documentation
- refactor: move _misc to structured docs/ folder
- feat: implement dedicated portfolio detail layout with full-width images and siloed nav
- style: refine portfolio layout - text aligns with article column, images full width
- fix: ensure portfolio detail images span full grid while text stays in column
- feat: implement image captions for portfolio items
- refactor: update all portfolio items to use portfolio_detail layout
- style: wrap all portfolio images in &lt;figure&gt; tags for consistent layout
- feat: implement responsive portfolio grid layout
- Add blog post about hidden site pages
- General site updates and content cleanup
- feat: add humans.txt and AI-blocking robots.txt
- refactor: standardize all portfolio images to use HTML &lt;figure&gt; syntax
- chore: deduplicate .gitignore entries
- docs: add AI agent instructions to README
- docs: add links to technologies in technologies.md
- fix: move .htaccess to src/ so it gets copied to build
- fix: ignore docs/ folder instead of deprecated _misc/

## 2025-11-16

- Add new post about AI-assisted coding and move technologies.md to root

## 2025-11-15

- Add links.yaml validation script and update color scheme to DR10
- Add new post and update content
- Add schema.org structured data for SEO (Person, WebSite, BlogPosting)
- Add SEO meta descriptions to all posts and organize content scripts
- Add post template for new blog posts
- Add documentation maintenance scripts and reorganize project docs
- Reorganize plan.md and make CHANGELOG.md a rendered page
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

## 2025-10-19

- Updated plan.md

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
- Trailing whitespace and content
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

- htaccess
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
- SFTP –&gt; rsync
- Documentation cleanup
- Paging fixes
- Cleanup unnecessary files
- Dark mode
- Updated plan
- Updated plan

## 2025-09-13

- Site nav fixes
- Basic validation issues
- Added arial-label
- Added sitemap

## 2025-09-07

- Pagination and single posts
- Reduced whitespace in lists

## 2025-09-06

- index pagination

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
- Migrating tasks to plan.md

## 2025-08-27

- Initial commit
- Update .gitignore
- Update .gitignore

