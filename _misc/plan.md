# Migration Plan: WordPress → 11ty

## Phase 1: Set Up 11ty Infrastructure

- [x] **Initialize 11ty Project**
  - [x] Create a new project directory
  - [x] Run `npm init` and install 11ty as a dev dependency

- [x] **Create `package.json` with 11ty dependencies**

- [x] **Set up `.eleventy.js` configuration**
  - [x] Configure input/output directories
  - [x] Set up custom collections if needed
    - [x] tag portfolio pieces
    - [x] tag posts

- [x] **Create directory structure**
  - [x] Templates, content, and data folders

- [x] **Create Template Structure**
  - [x] Base layout template
  - [x] Post template (single post view)
  - [x] RSS feed template
    - [x] XML structure
    - [x] Post metadata
    - [x] Content excerpts (no, do full content. It's polite)
  - [x] get dates and date formatting working in all templates and includes
  - [-] Archive/tag templates (no, go straight to pagination)

- **Configure URL Structure**
  - [x] Set up permalinks to match WordPress: `/YYYY/MM/DD/post-slug/`
  - [x] Configure pagination for archives (/page/2/ etc.)
    - [x] Set up pagination for blog posts with /page/2 URL scheme
    - [x] Add pagination navigation component with page numbers
    - [x] Test pagination URLs and navigation functionality
  - [-] Set up tag/category routing (not needed)
  - [x] Configure pagination for individual posts (prev/next)

## Phase 2: Content Migration

- [x] **Export WordPress Content**
  - [x] Use WordPress export tool (`Tools → Export`)
  - [x] Extract posts, pages, and metadata
  - [x] Parse XML to get clean content
  - [x] re-get all the images somehow

- **Organize Content Files**
  - [x] Create `_posts/` directory with dated subdirectories. Example structure: `_posts/2024/11/02/what-went-right-in-october/index.md`

- **Convert to Markdown/Front Matter**
  - [x] Transform WordPress posts to Markdown with YAML front matter
  - [x] Categorize portfolio posts
  - [x] Preserve/check and repair metadata (dates, tags, categories, author)
  - [x] Clean up HTML artifacts
  - [x] Go through ALL of the images and make sure they work

## Phase 3: Template Development

- **Base Layout (`_includes/base.njk`)**
  - Header, navigation, footer
  - [x] Integrate existing CSS structure
  - [x] Add meta tags and SEO elements
  - [x] skip link behavior
  - [x] page color vs content background color
  - general typographical niceties such as
    - [x] font sizes and header sizes https://ithy.com/article/typography-font-size-spacing-lc0m3kwv
    - pagination styles
    - good rhythm for bullets (audit how bullets are converted from .md to .html)
    - fix margins and page color
    - menu behavior wide
    - menu behavior narrow
    - inline links vs incidental links
    - copyright styling

- **Post Content Template (`_includes/post_content.njk`)**
  - [x] Article structure matching current HTML
  - [x] Date formatting
  - [ ] Tag/category display (don't need it)
  - Main navigation at bottom
    - Implement bodyClass in frontmatter to move the nav up and down

- **Index Template (`index.njk`)**
  - Blog listing with pagination
  - Skip "portfolio" category (use only posts collection)
  - [-] Post excerpts (nay!)
  - Navigation controls
  - Main navigation at top

- **Portfolio Template (`portfolio.njk`)**
  - Grid listing
  - Only "portfolio" category
  - [-] Post excerpts (nay!)
  - Navigation controls
  - Main navigation at top
  - Image size/position/styling

- **Portfolio Post Content Template (`_includes/portfolio_post_content.njk`)**
  - Article structure matching current HTML
  - Date formatting
  - Tag/category display
  - Main navigation at bottom? top?
  - Image size/position/styling

## Phase 4: Advanced Features

- **Search & Filtering**
  - Tag-based filtering (not sure I need this)
  - Date-based archives (not sure I need this)
  - Search functionality (not sure I need this)

- **Performance Optimization** meh
  - [-] CSS/JS minification (not sure I need this)
  - [-] Image optimization (not sure I need this)
  - [-] Caching strategies (not sure I need this)

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

- **Basic polish**
  - [x] quickest possible solid type scheme and stack
  - double-dog check centering, margins, padding, breakpoints
  - vertical rhythm https://edgdesign.co/blog/baseline-grids-in-css
  - highlight the current page in the nav per https://11ty.rocks/tips/essential-navigation-snippet/
  - aria-current page per https://www.11ty.dev/docs/collections/#use-an-aria-current-attribute-on-the-current-page

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

## Phase 6: Truly fancy shit
- CMS https://www.11ty.dev/docs/cms/
- "remaindered links' feature ala Kottke (using 11ty collections?)
- consider SERPs (https://schema.org)
- consider POSSE (more tags for different types of entries?)
- date-based color styles