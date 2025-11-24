# Migration and Development Plan: WordPress → 11ty

## 🎯 Active Work

### Portfolio Templates
- [x] **Portfolio Template (`portfolio.njk` and `_includes/portfolio_list_item.njk`)**
  - [x] Grid listing (3 columns desktop, 2 tablet, 1 mobile)
  - [x] Only "portfolio" category
  - [x] Navigation controls (unhidden in nav)
  - [x] Image size/position/styling

- [x] **Portfolio Post Content Template (`_includes/portfolio_detail.njk`)**
  - [x] Article structure matching current HTML
  - [x] No date display (intentional design decision)
  - [x] Portfolio-only navigation (previous/next within portfolio collection)
  - [x] Full-width images for landscape orientation
  - [x] Portrait-grid utility for portrait images (3/2/1 columns responsive)
  - [x] Caption styling aligned with text column
  - [x] All images standardized to HTML `<figure>` syntax
  - [ ] Edit captions and alt text for portfolio item images ⬅

- [ ] **QA portfolio layouts**
  - [ ] Test portfolio listing page across devices
  - [ ] Test portfolio detail pages across devices
  - [ ] Verify image display and responsiveness
  - [ ] Check navigation between portfolio items

- [ ] **Additional portfolio content**
  - [ ] Add Invoca interview presentation as portfolio piece
  - [ ] Expand Cayuse accomplishments portfolio piece
  - [ ] MAYBE: Put descriptions on the main portfolio page (from item frontmatter)
  - [ ] MAYBE: Add links to key articles on the portfolio page (since it is a leader's portfolio)

### Security & Deployment
- [ ] **Security and scan results mitigation**
  - [ ] passwordless SSH login for deployment: https://help.dreamhost.com/hc/en-us/articles/216499537-How-to-configure-passwordless-login-in-Mac-OS-X-and-Linux
  - [x] Cloudflare Radar "security headers not set" https://radar.cloudflare.com/scan/fd4597b9-3260-499d-9407-9783804293e7/summary https://owasp.org/www-project-secure-headers/index.html#div-bestpractices
  - [x] https://app.ahrefs.com/site-audit/5163664/issues?current=12-10-2025T072858
- [x] **Pre-deploy validation**
  - [x] Added validation checks to deploy script (markdown, content structure)
  - [x] Prevents authoring mistakes (malformed YAML, markdown syntax errors, hierarchy issues) from going live
  - [x] Supports `--skip-checks` flag for emergencies

### Design & Polish
- [ ] vertical rhythm in typographic spacing https://edgdesign.co/blog/baseline-grids-in-css

## Future Enhancements
- [ ] consider POSSE (more tags for different types of entries?)
- [ ] CMS (headless CMS consideration)
- [ ] alternate color schemes and a way to trigger them

## Optional / Future Consideration
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

- **Incremental Testing for Slow Tests**
  - Implement incremental testing for slow tests (`links`, `accessibility`, `performance`)
  - Only test files that have changed since last test run
  - Track test results/state to determine what needs re-testing
  - Reduce test time for large sites by avoiding full re-scans
  - Consider caching mechanisms for external link checks
  - Browser-based tests (accessibility) could test only changed pages
