# Migration and Development Plan: WordPress → 11ty

## 🎯 Active Work

### Portfolio Templates
- [x] **Portfolio Template (`portfolio.njk` and `_includes/portfolio_list_item.njk`)**
  - [x] Grid listing (3 columns desktop, 2 tablet, 1 mobile)
  - [x] Only "portfolio" category
  - [x] Navigation controls (unhidden in nav)
  - [x] Image size/position/styling

- [ ] **Portfolio Post Content Template (`_includes/portfolio_detail.njk`)**
  - [x] Article structure matching current HTML (implemented basics)
  - [ ] Date formatting
  - [ ] Tag/category display
  - [ ] Main navigation at bottom? top? (currently at bottom)
  - [ ] Image size/position/styling polish

### SEO & Social
- [ ] **SEO & Social**
  - [x] Sitemap generation (for accessibility and indexing, not footer)
  - [x] Open Graph
  - [x] Twitter Cards (removed - using Open Graph for bsky and mastodon)
  - Meta tags
    - [x] add meta description to index
    - [x] add title to post frontmatter
    - [x] add ogImage default
    - [x] add meta description to post frontmatter
    - [ ] add ogImage to frontmatter on posts and pages that need it (generate them?)
  - [ ] ogImage generation per post

### Security & Deployment
- [ ] **Security and scan results mitigation**
  - [ ] passwordless SSH login for deployment: https://help.dreamhost.com/hc/en-us/articles/216499537-How-to-configure-passwordless-login-in-Mac-OS-X-and-Linux
  - [x] Cloudflare Radar "security headers not set" https://radar.cloudflare.com/scan/fd4597b9-3260-499d-9407-9783804293e7/summary https://owasp.org/www-project-secure-headers/index.html#div-bestpractices
  - [x] https://app.ahrefs.com/site-audit/5163664/issues?current=12-10-2025T072858

### Design & Polish
- [ ] vertical rhythm in spacing https://edgdesign.co/blog/baseline-grids-in-css

### Future Enhancements
- [ ] consider POSSE (more tags for different types of entries?)
- [ ] CMS (headless CMS consideration)

### Optional / Future Consideration
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
