# Migration and Development Plan: WordPress → 11ty

## 🎯 Active Work

### Portfolio
- [ ] **Additional portfolio content** ⬅
  - [ ] Add Invoca interview presentation as portfolio piece
  - [ ] Expand Cayuse accomplishments portfolio piece
  - [ ] Expand product trio portfolio piece
  - [ ] MAYBE: Put descriptions on the main portfolio page (from item frontmatter)
  - [ ] MAYBE: Add links to key articles on the portfolio page (since it is a leader's portfolio)

### Security & Deployment
- [ ] **Periodic security audit**
  - [ ] Run `npm run security-audit` monthly or before major deployments
  - [ ] Review and address automated check results
  - [ ] Complete manual tasks checklist

### Design & Polish
- [x] improve generated ogImage styling
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
