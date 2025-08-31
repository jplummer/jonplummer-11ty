# 🚀 Migration Plan: WordPress → 11ty

## Phase 1: Set Up 11ty Infrastructure

- **Initialize 11ty Project**
  -[x] Create a new project directory
  -[x] Run `npm init` and install 11ty as a dev dependency
-[x] **Create `package.json` with 11ty dependencies**
- **Set up `.eleventy.js` configuration**
  -[x] Configure input/output directories
  -[x] Set up custom collections if needed
    -[x] tag portfolio pieces
    -[x] tag posts
- **Create directory structure**
  -[x] Templates, content, and data folders

- **Create Template Structure**
  -[x] Base layout template
  -[x] Post template (single post view)
  - Archive/tag templates
  - RSS feed template
    - XML structure
    - Post metadata
    - Content excerpts (no, do full content. It's polite)

- **Configure URL Structure**
  -[x] Set up permalinks to match WordPress: `/YYYY/MM/DD/post-slug/`
  - Configure pagination for archives (/page/2/ etc.)
  - Configure pagination for individual posts (prev/next)
  - Set up tag/category routing

---

## Phase 2: Content Migration

-[x] **Export WordPress Content**
  -[x] Use WordPress export tool (`Tools → Export`)
  -[x] Extract posts, pages, and metadata
  -[x] Parse XML to get clean content
  -[x] re-get all the images somehow

- **Organize Content Files**
  -[x] Create `_posts/` directory with dated subdirectories. Example structure: `_posts/2024/11/02/what-went-right-in-october.md`

- **Convert to Markdown/Front Matter**
  -[x] Transform WordPress posts to Markdown with YAML front matter
  - Preserve metadata (dates, tags, categories, author)
  - Clean up HTML artifacts
  -[x] Categorize portfolio posts

---

## Phase 3: Template Development

- **Base Layout (`_includes/base.njk`)**
  - Header, navigation, footer
  - Integrate existing CSS structure
  - Add meta tags and SEO elements

- **Post Template (`_includes/post.njk`)**
  - Article structure matching current HTML
  - Date formatting
  - Tag/category display
  - Main navigation at bottom

- **Index Template (`index.njk`)**
  - Blog listing with pagination
  - Skip "portfolio" category
  - Post excerpts
  - Navigation controls
  - Main navigation at top

- **Portfolio Template (`portfolio.njk`)**
  - Grid listing
  - Only "portfolio" category
  - Post excerpts
  - Navigation controls
  - Main navigation at top

- **Portfolio post Template (`_includes/post.njk`)**
  - Article structure matching current HTML
  - Date formatting
  - Tag/category display
  - Main navigation at bottom

---

## Phase 4: Advanced Features

- **Search & Filtering**
  - Tag-based filtering
  - Date-based archives
  - Search functionality

- **Performance Optimization** meh
  - CSS/JS minification
  - Image optimization
  - Caching strategies

- **SEO & Social**
  - Meta tags
  - Open Graph
  - Twitter Cards (look into bsky and mastodon over Xitter)
  - Sitemap generation (for accessibility and indexing, not footer)
  - add meta description to index
  - add slug to post frontmatter
  - add title to post frontmatter
  - add meta description to post frontmatter
  - add ogImage default
  - add ogImage to frontmatter on posts and pages that need it

---

## Phase 5: Site Generation and Upload Automation

### Build Process Automation
- Set up npm scripts for development and production builds
- Configure environment-specific build settings
- Implement build validation and testing

### Deployment Pipeline
- **GitHub Actions** (recommended):
  - Automatic builds on push to main branch
  - Run 11ty build process
  - Validate generated HTML
  - Upload to hosting provider
  
- **Alternative: Local deployment scripts**:
  - Build and upload via rsync/scp
  - FTP deployment automation
  - Cloud storage sync (AWS S3, Netlify, etc.)

### Continuous Integration
- Automated testing of generated site
- Link validation
- Image optimization checks
- Performance monitoring

### Monitoring & Maintenance
- Set up build notifications
- Monitor deployment success/failure
- Implement rollback procedures
- Regular backup of generated site

### Hosting Considerations
- Choose static hosting provider (Netlify, Vercel, GitHub Pages)
- Configure custom domain and SSL
- Set up CDN for global performance
- Implement caching strategies

## Phase 6: Fancy shit
- CMS https://www.11ty.dev/docs/cms/
- "remaindered links' feature ala Kottke (using 11ty collections?)
- consider SERPs (https://schema.org)
- consider POSSE (more tags for different types of entries?)
