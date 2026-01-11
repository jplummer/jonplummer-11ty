# Ideas

## ☑️ Selected

- [ ] **REMINDER (2026-02-11)**: Check if `docs/ELEVENTY-DEBUGGING-WORKFLOW.md` is actually being used by Cursor - search for evidence in chat history and codebase

- [ ] Portfolio 💎 DO SOMETHING EVERY WEEKEND
  - [ ] Explore presentation-to-portfolio item automation, including speaker notes
    - [ ] What does it take to get speaker notes out of a PPT?
    - [ ] What does it take to get speaker notes out of a Google Slides preso?
    - [ ] Can we then import those as captions?
  - [ ] Look through /talks (current and old) for more talks, and evaluate for inclusion
    - [ ] Talks from Belkin
    - [ ] Small artifacts from Belkin
    - [ ] Talks from Invoca
    - [ ] Talks from CSky
    - [ ] Talks from Cayuse

- [ ] OFTEN: sweep Slack for links

- [ ] Socials
  - [ ] *Consider* improving existing Fed account bridging according to https://fed.brid.gy/docs#fediverse-enhanced
  - [ ] *Consider* auto-posting links to my BSky and mas.to feeds, perhaps via https://brid.gy
  - [ ] *Consider* auto-posting posts to my BSky and mas.to feeds, perhaps via https://brid.gy

- [ ] Reinvestigate color scheme
  - [ ] *Consider* addressing accessibility test script deficiencies per /docs/archive/accesssibility-test-limitations.md
  - [ ] *Consider* other color inspiration sources

## 🔮 Future Consideration

### 📓 CMS

**Goals**: Enable authoring from any device via web-based CMS while maintaining local build/deploy capability. Prevent common errors in authoring. Make it relatively quick and easy to capture links and ideas. Make it relatively easy to start posts in one place and finish them someplace else.

**Approach**: Decap CMS (git-based) + GitHub Actions for automated build/deploy on CMS edits.

#### 1. Decap CMS Setup

- [ ] Create `admin/config.yml`
  - Configure GitHub backend (repo, branch)
  - Define collections:
    - `posts` collection matching `src/_posts/YYYY/` structure
    - Fields: title, date, tags (array), description, ogImage, body (markdown)
  - Configure media folder for uploads (if needed)
  - Set up file path pattern: `src/_posts/YYYY/YYYY-MM-DD-slug.md`

- [ ] Create `admin/index.html`
  - Basic HTML page that loads Decap CMS
  - Include Decap CMS script from CDN
  - Initialize CMS with config

- [ ] Configure Eleventy to copy admin folder
  - Add passthrough copy for `admin/` directory
  - Ensure admin page is accessible at `/admin/` on deployed site

#### 2. GitHub Authentication

- [ ] Register GitHub OAuth App
  - Settings → Developer settings → OAuth Apps → New OAuth App
  - Authorization callback URL: `https://jonplummer.com/admin/`
  - Note Client ID and Client Secret

- [ ] Add secrets to GitHub repository
  - `DECAP_CMS_GITHUB_CLIENT_ID` (from OAuth app)
  - `DECAP_CMS_GITHUB_CLIENT_SECRET` (from OAuth app)

- [ ] Update `admin/config.yml` with OAuth settings
  - Add `backend` configuration with GitHub provider
  - Reference environment variables for client ID/secret

#### 3. GitHub Actions Workflow

- [ ] Create `.github/workflows/deploy.yml`
  - Trigger on push to `main` branch
  - Checkout code
  - Setup Node.js (use LTS version matching local)
  - Install dependencies (`pnpm install`)
  - Run pre-deploy validation:
    - `pnpm run test markdown`
    - `pnpm run test frontmatter` (after build)
  - Generate OG images: `pnpm run generate-og-images`
  - Build site: `pnpm run build`
  - Generate changelog: `pnpm run changelog`
  - Rebuild to include changelog
  - Deploy via rsync:
    - Use SSH key from secrets
    - Use deploy credentials from secrets (DEPLOY_HOST, DEPLOY_USERNAME, DEPLOY_REMOTE_PATH)
    - Match rsync flags from current deploy script (`-az --delete --exclude` patterns)

- [ ] Add deployment secrets to GitHub
  - `DEPLOY_SSH_KEY` (private SSH key for server access)
  - `DEPLOY_HOST` (SSH hostname)
  - `DEPLOY_USERNAME` (SSH username)
  - `DEPLOY_REMOTE_PATH` (remote directory path)
  - `SITE_DOMAIN` (for final success message)

- [ ] Configure SSH in workflow
  - Setup SSH key from secret
  - Configure known_hosts for server
  - Test SSH connection before rsync

#### 4. CMS Configuration Details

- [ ] Configure post collection fields:
  - `title` (string, required)
  - `layout` (hidden, default: `single_post.njk`)
  - `date` (datetime, required, format: ISO 8601 with timezone)
  - `tags` (list, required, default includes `post`)
  - `description` (text, optional, max 160 chars)
  - `ogImage` (string, optional, default: `auto`)
  - `body` (markdown, required)

- [ ] Configure file naming
  - Pattern: `YYYY-MM-DD-slug.md`
  - Auto-generate slug from title
  - Ensure files go to correct year directory: `src/_posts/YYYY/`

#### 5. Testing & Validation

- [ ] Test CMS access
  - Access `/admin/` on deployed site
  - Authenticate with GitHub
  - Verify can see existing posts

- [ ] Test post creation via CMS
  - Create new post
  - Verify front matter format matches existing posts
  - Verify file created in correct location
  - Verify commit to git

- [ ] Test automated deployment
  - Edit post via CMS
  - Verify GitHub Actions workflow triggers
  - Verify build completes successfully
  - Verify site updates on jonplummer.com

- [ ] Test local deploy still works
  - Make local change
  - Run `pnpm run deploy`
  - Verify local deploy script still functions

- [ ] Test edge cases
  - Post with special characters in title
  - Post with multiple tags
  - Post without description (should default to title)
  - Post with `ogImage: auto`

#### 6. Documentation Updates

- [ ] Update `docs/authoring.md`
  - Add CMS section explaining web-based editing
  - Document CMS URL and access
  - Note that CMS edits auto-deploy via CI/CD
  - Keep existing markdown editing instructions

- [ ] Update `docs/commands.md`
  - Document dual-deploy workflow (local vs automated)
  - Note when to use local deploy vs CMS
  - Document GitHub Actions workflow

- [ ] Update `README.md`
  - Mention CMS option for authoring
  - Note that local editing still supported

#### 7. Security Considerations

- [ ] Restrict admin page access (optional)
  - Option A: Basic HTTP auth on `/admin/` path
  - Option B: IP whitelist (if static IP available)
  - Option C: Rely on GitHub OAuth only (simpler)

- [ ] Verify secrets are properly secured
  - Ensure `.env` remains gitignored
  - Verify GitHub secrets are not exposed in logs
  - Review GitHub Actions logs for sensitive data

#### 8. Optional Enhancements

- [ ] Add CMS preview functionality
  - Configure preview URLs for posts
  - Allow previewing before publishing

- [ ] Add media management
  - Configure media folder in CMS
  - Set up image upload handling
  - Ensure images go to correct `src/assets/images/` location

**Estimated Complexity**: Medium
**Dependencies**: GitHub Actions, Decap CMS, GitHub OAuth
**Breaking Changes**: None (additive only)

### 🖍 Also…

- handle GitHub Dependabot complaints https://github.com/jplummer/jonplummer-11ty/security/dependabot

- https://bsky.app/profile/did:plc:re3ebnp5v7ffagz6rb6xfei4 ?

- https://kagi.com/search?q=contemporary+blog+styling+2025 ?

- https://llmstxt.org/ ?

- https://github.com/steipete/agent-rules ?

- https://github.com/Invoca/prompt-library ?

- learn about 11ty Debug Mode

- **Alternate color schemes** and how to trigger them
  - According to build/deploy day?
  - Day of view regardless of when built?
  - Random selection from a handful of options, per 24h session?
  - Random selection from a handful of options, cookied, change on reload?
  - Animated color cycle over a long time scale?
  - Animated color cycle triggered by window.blur()?

- **Progressive enhancements**
  - Preview external links
  - ?

- **POSSE** (more tags for different types of entries?)

- **GitHub Actions** (This is not how I'm using GitHub just yet)
  - Automatic builds on push to main branch
  - Run 11ty build process
  - Validate generated HTML (using custom validation scripts)
  - Upload to hosting provider

- **Monitoring & Maintenance**
  - Set up build notifications
  - Monitor deployment success/failure
  - Implement rollback procedures
  - Regular backup of generated site

- **Test suite enhancements**
  - Enhanced progress indicators - Streaming JSON, real-time updates
  - formatTable() - Tabular format (maybe later)
  - formatJson() - Pretty-printed JSON (might be free since tests output JSON, but not needed initially)
  - Additional formats - HTML reports, etc.
  - Filtering and sorting - `--filter`, `--sort` flags
  - CI/CD integration - JUnit XML, GitHub Actions annotations, etc.

---

## MAYBE DON'T

- look into https://github.com/ttscoff/md-fixup ? – not needed, good authoring-oritneted tests shoudl be enough for now
  - Signal external links (maybe not, the assumptin is that 99% of links are external, and already written about as such)

---

## DONE

- [x] Implement IndexNow support (2026-01-11)
- [x] Refactor markdown renderer configuration - replaced HTML blocks with `{% portraitGrid %}` paired shortcode, eliminating need for preprocessor entirely (2026-01-11)
- [x] Fix spellcheck and SEO test filtering - improved `--changed` flag behavior for spell and seo-meta tests (2026-01-11)
- [x] Implement quick authoring-related tests just for new changes (2026-01-10)
- [x] Fix spell checking, since it totally doesn't catch anything (2026-01-10)
- [x] Fix spelling across site (2026-01-10)
- [x] Address Dependabot and `pnpm audit` warnings (2026-01-06)
- [x] Setup SSH access to GitHub from personal laptop (2026-01-06)
- [x] pnpm vs npm (2026-01-05)
- [x] Make color playground page with style switcher (2025-12-24)
- [x] Watch for ahrefs improvement in image size complaints this weekend (it worked! ahrefs health score now 100 and steady) (2025-12-24)
- [x] Address `test seo-meta` warnings (2025-12-24)
  - [x] Catalog allowable exceptions and make the test be fine with those
- [x] I make a lot of dumb spelling errors. Implement spell checking somehow (2025-12-23)
- [x] Typography improvements: modular scale, baseline grid, and print styles (2025-12-08)
- [x] Add spinners to deploy script for lengthy operations (2025-12-08)
- [x] Refactor redirects to use data-driven Apache 301 redirects (2025-12-06)
- [x] Improve test output formatting and UX (2025-12-06)
- [x] Fix npm audit vulnerabilities (2025-12-06)
- [x] Handle drafts (2025-12-22)
- [x] gzip css (2025-12-22)
- [x] handle "image too large" ahrefs feedback (2025-12-22)
  - [x] Automate image optimization (see https://www.aleksandrhovhannisyan.com/blog/eleventy-the-good-the-bad-and-the-possum/#5-it-has-an-excellent-image-plugin and https://bholmes.dev/blog/picture-perfect-image-optimization/ )
- [x] Make portfolio layout not depend on embedded HTML
  - [x] markdown-it-attrs and markdown-it-container?
  - [x] Custom shortcodes
- [x] Portfolio image widths: full, 2/3, 1/3, smaller for mobile images
- [x] Make sure margins etc are good in portfolio items, using blog posts as the example
- [x] Fix timezone issues (going forward reflect real authoring date as I experienced it, but don't break incoming links by changing URLs to existing content) (2025-12-22)
- [x] Watch ahrefs this weekend for "URL changed" errors; site health should be at or near 100 (2025-12-22)
- [x] Optimize deploy output and eliminate redundant builds (2025-12-07)
- [x] Extract spinner frames to shared utility for easier experimentation (2025-12-07)
- [x] Convert links-yaml test to unified format and clean up old format code (2025-12-07)
- [x] Establish method for PDF-based portfolio post offering, to enable… (2025-12-07)
- [x] Expand Cayuse accomplishments portfolio piece
- [x] Expand product trio portfolio piece
- [x] Add Invoca interview presentation as portfolio piece
- [x] Put descriptions on the main portfolio page (from item frontmatter)
- [x] Improve generated ogImage styling (2025-12-07)
- [x] Improve ogImage index.png, which currently has redundant stuff in it (2025-12-07)
- [x] Refactor HEAD includes to eliminate redundancy and fix index page issues (2025-12-04)
- [x] Update favicon setup to modern minimal standard (2025-12-04)
- [x] Curly quotes (2025-12-04)
- [x] Switch drafts from folder-based to frontmatter-based (2025-12-03)
- [x] Modularize .eleventy.js configuration (2025-12-03)
- [x] Add date range titles to paginated pages (2025-12-03)
- [x] Fix horizontal scrollbar on narrow viewports for articles with code blocks (2025-12-03)
- [x] Unify exit handling and summary printing across all scripts (2025-12-03)
- [x] Fix sitemap pagination to only include existing pages (2025-11-30)
- [x] Fix sitemap pagination, improve titles, and fix unescaped quotes (2025-11-30)
- [x] Improve SEO validation for redirect pages and unescaped quotes (2025-11-30)
- [x] Fix timezone issues (relect real authoring date as I experienced it, but don't break incoming links by changing URLs to existing content) (2025-12-11)
- [x] Add SITE_DOMAIN environment variable for centralized domain configuration (2025-11-26)
- [x] Security audit improvements and deployment fixes (2025-11-26)
- [x] Enable smart quotes in markdown and titles (2025-11-26)
- [x] Address `npm test rss-feed` issues (2025-11-26)
- [x] Image optimization (2025-11-26)
- [x] Refactor test suite and fix nested anchor issue (2025-11-26)
- [x] Consolidate templates and utilities, fix test issues (2025-11-26)
- [x] Security improvements: passwordless SSH, CSP hardening, dependency fixes (2025-11-25)
- [x] Improve OG image styling and fix color issues (2025-11-24)
- [x] Fix portfolio figure caption styling and update alt texts (2025-11-24)
- [x] Convert post titles from Title Case to sentence case (2025-11-24)
- [x] Implement comprehensive SEO and OG image generation (2025-11-23)
- [x] Fix meta description validation and add missing descriptions (2025-11-22)
- [x] Move h1 elements from content to template (2025-11-22)
- [x] Convert error pages to Markdown and unify link underlining (2025-11-22)
- [x] Add pre-deploy validation to prevent authoring mistakes (2025-11-22)
- [x] Add portrait-grid utility for multi-column image layouts in portfolio details (2025-11-20)
- [x] Implement dedicated portfolio detail layout with full-width images and siloed nav (2025-11-19)
- [x] Implement image captions for portfolio items (2025-11-19)
- [x] Implement responsive portfolio grid layout (2025-11-19)
- [x] Standardize all portfolio images to use HTML figure syntax (2025-11-19)
- [x] Add humans.txt and AI-blocking robots.txt (2025-11-19)
- [x] Add AI agent instructions to README (2025-11-19)
- [x] Reorganize project structure and improve documentation (2025-11-19)
- [x] Move _misc to structured docs/ folder (2025-11-19)
- [x] Move .htaccess to src/ so it gets copied to build (2025-11-19)
- [x] Add schema.org structured data for SEO (Person, WebSite, BlogPosting) (2025-11-15)
- [x] Add SEO meta descriptions to all posts (2025-11-15)
- [x] Add links.yaml validation script (2025-11-15)
- [x] Add post template for new blog posts (2025-11-15)
- [x] Update color scheme to DR10 (2025-11-15)
- [x] Add documentation maintenance scripts and reorganize project docs (2025-11-15)
- [x] Add security headers to .htaccess (2025-11-01)
- [x] Add 404 and 500 error pages with permalinks (2025-11-01)
- [x] Add YAML validation to tests (2025-11-01)
- [x] Fix YAML formatting in links.yaml (2025-11-01)
- [x] Fix nested paragraphs in link descriptions (2025-11-01)
- [x] Update link rendering to show newest links on page 1 (2025-11-01)
- [x] Refactor HTML validation and test organization (2025-11-01)
- [x] Clean up defunct capabilities and improve naming consistency (2025-11-01)
- [x] Add _site to .gitignore and remove from git tracking (2025-11-01)
- [x] Simplify link checking scripts and update notes formatting (2025-11-01)
- [x] Add sitemap generation (2025-10-05)
- [x] Fix feed issues (2025-10-05)
- [x] Implement remaindered links feature (2025-10-05)
- [x] Fixed post dates on individual post pages (2025-10-05)
- [x] Vertical rhythm (2025-10-05)
- [x] Refine test scripts (2025-10-05)
- [x] Add active page highlighting to navigation (2025-10-04)
- [x] Improve typographic hierarchy with letterspacing (2025-10-04)
- [x] Meta descriptions and validation (2025-09-27)
- [x] Added cursor rules file (2025-09-27)
- [x] Redirect /feed/ (2025-09-20)
- [x] Scripts; validation and deployment (2025-09-14)
- [x] Tests (2025-09-14)
- [x] Improved link checking (2025-09-14)
- [x] SFTP → rsync migration (2025-09-14)
- [x] Documentation cleanup (2025-09-14)
- [x] Paging fixes (2025-09-14)
- [x] Dark mode (2025-09-14)
- [x] Site nav fixes (2025-09-13)
- [x] Added aria-label (2025-09-13)
- [x] Added sitemap (2025-09-13)
- [x] Basic validation issues (2025-09-13)
- [x] Pagination and single posts (2025-09-07)
- [x] Index pagination (2025-09-06)
- [x] Fixed some basic rendering issues that had lingered for too long (2025-09-01)
- [x] Portfolio index loads items now (2025-09-01)
- [x] Got rid of frontmatter rendering problems for main pages (2025-09-01)
- [x] Basic typography and spacing for blog posts (2025-09-01)
- [x] Building up templates and includes (2025-08-30)
- [x] Added post and portfolio tags to posts (2025-08-30)
- [x] Copied in images from wp.local project (2025-08-30)
- [x] Reworked Posts structure (2025-08-30)
