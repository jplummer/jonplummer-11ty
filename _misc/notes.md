
# 🔨 NPM Commands

## 💻 Development
    * npm run dev                          # Start development server with live reload
    * npm run build                        # Build production site
    * npm run start                        # Start development server
    * npm run clean                        # Clean build directory

## 🔍 Test generated site

### 📋 HTML validation
    * npm run validate                       # Check HTML validity
    * npm run validate-comprehensive         # Check HTML validity plus plus

### 🔗 Link checking
    * npm run test-internal-links            # Test only internal links (critical)
    * npm run test-external-links            # Test only external links (informational)
    * npm run test-links                     # Test all links
    * npm run test-internal-links -- --full  # Full scan (all files)
    * npm run test-external-links -- --full  # Full scan (all files)
    * npm run test-links -- --full           # Full scan (all files)

### 📝 Other content checks
    * npm run test-content                   # Test content structure
    * npm run test-performance               # Analyze performance
    * npm run test-seo                       # Test SEO and meta tags
    * npm run test-accessibility             # Test accessibility
    * npm run test-rss                       # Test RSS feeds
    * npm run test-all                       # Run all tests in sequence

## 🚢 Deploy site to host
    * npm run test-deployment                # Test deployment (environment, local build check,
                                             # dependencies, SSH, remote directory, rsync dry-run)
    * npm run preview-deploy-changes         # See what would be done by deploy-changes
    * npm run deploy-changes                 # Deploy only new/changed items via rsync
    * npm run deploy                         # Full deployment via rsync


# 📚 Front Matter Variables

    * layout: Which template to use
    * title: Page title
    * date: Publication date
    * tags: Array of tags for collections (post, portfolio)
    * permalink: Custom URL structure
    * draft: Whether to publish or not
    * eleventyExcludeFromCollections: Exclude from collections