# Migration and Development Plan: WordPress to 11ty

## What remains

### Portfolio 💎
- [x] Establish method for PDF-based portfolio post offering, to enable…
- [ ] **Additional portfolio content**
  - [x] Expand Cayuse accomplishments portfolio piece
  - [x] Expand product trio portfolio piece
  - [x] Add Invoca interview presentation as portfolio piece
  - [x] Put descriptions on the main portfolio page (from item frontmatter)
  - [ ] Add/expand/investigate https://jonplummer.com/2022/11/01/conference-talk-ux-philosophy/
  - [ ] look through talks for more talks!

### Design & Polish 
- [x] improve generated ogImage styling
- [x] improve ogImage index.png, which currently has redundant stuff in it
- [ ] have pagination links use the computed titles from the resulting pages as "title" atributes 
- [ ] typographical improvements
  - [x] curly quotes
  - [ ] general legibility (leading, size, etc.)
  - [ ] refine type scale https://webtypography.net/3.1.1
  - [ ] vertical rhythm in typographic spacing https://edgdesign.co/blog/baseline-grids-in-css https://webtypography.net/toc#2.2
- [ ] https://www.inkwell.ie/typography/recommendations.html
  - [ ] other items from https://webtypography.net/?
- [ ] Fool around with terminal spinners a la https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json

### CMS

**Goal**: Enable authoring from any device via web-based CMS while maintaining local build/deploy capability.

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
  - Install dependencies (`npm ci`)
  - Run pre-deploy validation:
    - `npm run test markdown`
    - `npm run test content-structure` (after build)
  - Generate OG images: `npm run generate-og-images`
  - Build site: `npm run build`
  - Generate changelog: `npm run changelog`
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
  - Run `npm run deploy`
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

- **Alternate color schemes** and how to trigger them

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
