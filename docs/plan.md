# Migration and Development Plan: WordPress → 11ty

## 🎯 Active Work

### Portfolio
- [ ] **Additional portfolio content** ⬅
  - [ ] Add Invoca interview presentation as portfolio piece
  - [ ] Expand Cayuse accomplishments portfolio piece
  - [ ] Expand product trio portfolio piece
  - [ ] MAYBE: Put descriptions on the main portfolio page (from item frontmatter)
  - [ ] MAYBE: Add links to key articles on the portfolio page (since it is a leader's portfolio)

### Design & Polish
- [x] improve generated ogImage styling
- [ ] typographical improvements
  - [x] curly quotes
  - [ ] general legibility (leading, size, etc.)
  - [ ] refine type scale https://webtypography.net/3.1.1
  - [ ] vertical rhythm in typographic spacing https://edgdesign.co/blog/baseline-grids-in-css https://webtypography.net/toc#2.2
- [ ] https://www.inkwell.ie/typography/recommendations.html
  - [ ] other items from https://webtypography.net/?
  
## Future Enhancements
- [ ] consider POSSE (more tags for different types of entries?)
- [ ] CMS (woudl a healdess CMS help with authoring, etc.?)
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

