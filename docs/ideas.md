# Ideas

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

- [ ] OFTEN: sweep slack for links

- [ ] Socials
  - [ ] Consider: Improve existing Fed account bridging according to https://fed.brid.gy/docs#fediverse-enhanced
  - [ ] Consider: Auto-post links to my BSky and mas.to feeds, perhaps via https://brid.gy
  - [ ] Consider: Auto-post posts to my BSky and mas.to feeds, perhaps via https://brid.gy

- [ ] Reinvestigate color scheme
  - [x] Make color playground page with style switcher
  - [ ] *Consider* addressing accessibility test script deficiencies per /docs/accesssibility-test-limitations.md
  - [ ] *Consider* other color inspiration sources

- [x] Address `test seo-meta` warnings
  - [x] Catalog allowable exceptions and make the test be fine with those

- [x] I make a lot of dumb spelling errors. Implement spell checking somehow

- [x] Watch for ahrefs improvement in image size complaints this weekend (it worked! AHrefs health score now 100 and steady)

- [x] pnpm vs npm

- [x] address Dependabot and `pnpm audit` warnings

## CMS

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
    - `pnpm run test content-structure` (after build)
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

- [x] Handle drafts
  - Use `draft: true` in frontmatter
  - Excluded from production builds via Eleventy preprocessor
  - Visible in dev mode (serve/watch)

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


## Future Consideration

- IndexNow

- handle GitHub Dependabot complaints https://github.com/jplummer/jonplummer-11ty/security/dependabot

- https://bsky.app/profile/did:plc:re3ebnp5v7ffagz6rb6xfei4

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
  - Signal external links (maybe not, the assumptin is that 99% of links are external, and already written about as such)
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
