const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const yaml = require("js-yaml");
const pluginRss = require("@11ty/eleventy-plugin-rss");

const fs = require("fs");

module.exports = function (eleventyConfig) {
  // Add readFile filter
  eleventyConfig.addFilter("readFile", (filePath) => {
    return fs.readFileSync(filePath, "utf8");
  });

  // Add YAML data extension support
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));
  eleventyConfig.addDataExtension("yml", (contents) => yaml.load(contents));
  // Initialize markdown-it
  const md = markdownIt({
    html: true, // Allow HTML in markdown
    breaks: true, // Convert line breaks to <br>
    linkify: true // Auto-convert URLs to links
  });
  // Copy static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Copy .htaccess file for security
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });

  // Watch for changes in assets
  eleventyConfig.addWatchTarget("src/assets");

  // RSS plugin
  eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-rss"));

  // Syntax highlighting
  eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-syntaxhighlight"));

  // Date formatting via Luxon
  eleventyConfig.addPlugin(require("eleventy-plugin-date"));

  // Add custom Nunjucks filter: limit
  eleventyConfig.addFilter("limit", function (array, limit) {
    if (!Array.isArray(array)) return array;
    return array.slice(0, limit);
  });

  // add postDate filter
  eleventyConfig.addFilter("postDate", (dateObj) => {
    // Handle both Date objects and date strings
    const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
    return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED);
  });

  // Wrap dateToRfc3339 to handle both Date objects and date strings
  eleventyConfig.addFilter("dateToRfc3339Safe", (dateObj) => {
    const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
    return pluginRss.dateToRfc3339(date);
  });

  // Add markdown filter
  eleventyConfig.addFilter("markdown", function (content) {
    return md.render(content);
  });

  // Add inline markdown filter (no block-level elements like <p>)
  eleventyConfig.addFilter("markdownInline", function (content) {
    return md.renderInline(content);
  });

  // Add JSON filter for escaping strings in JSON-LD
  eleventyConfig.addFilter("json", function (value) {
    return JSON.stringify(value);
  });

  // Add custom Nunjucks shortcode: year
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Add custom filter to merge posts and links chronologically
  eleventyConfig.addFilter("mergePostsAndLinks", function (posts, links, pageNumber, nextPageOldestDate) {
    if (!posts) return [];
    if (!links) {
      return posts.map(post => ({ type: 'post', data: post, date: new Date(post.data.date) }));
    }

    const isPage1 = pageNumber !== undefined && pageNumber === 0;
    const items = [];

    // Sort posts by date (newest first)
    const sortedPosts = [...posts].map(post => ({
      type: 'post',
      data: post,
      date: new Date(post.data.date)
    })).sort((a, b) => b.date - a.date);

    const newestPostDate = sortedPosts[0].date;
    const oldestPostDate = sortedPosts[sortedPosts.length - 1].date;

    // On page 1 only: Add links newer than the newest post first
    if (isPage1) {
      for (const [date, linkList] of Object.entries(links)) {
        const linkDate = new Date(date);
        if (linkDate > newestPostDate) {
          for (let i = 0; i < linkList.length; i++) {
            const link = linkList[i];
            const isLastInGroup = i === linkList.length - 1;
            items.push({
              type: 'link',
              data: { ...link, isLastInGroup },
              date: linkDate
            });
          }
        }
      }
    }

    // For each post, add it and then add links between this post and the next post
    for (let i = 0; i < sortedPosts.length; i++) {
      const post = sortedPosts[i];
      const postDate = post.date;

      // Add the post
      items.push(post);

      // Determine the next post's date
      // If there's another post on this page, use its date
      // If this is the last post on the page, use next page's oldest post date
      // If this is the last post on the last page, include all older links
      let nextPostDate = null;
      if (i < sortedPosts.length - 1) {
        // There's another post on this page
        nextPostDate = sortedPosts[i + 1].date;
      } else if (nextPageOldestDate !== null && nextPageOldestDate !== undefined) {
        // This is the last post on the page, use next page's oldest post date
        nextPostDate = new Date(nextPageOldestDate);
      }
      // If nextPostDate is still null, this is the last post on the last page

      // Add links: linkDate <= postDate && linkDate > nextPostDate
      // If nextPostDate is null (last page), include all links where linkDate <= postDate
      for (const [date, linkList] of Object.entries(links)) {
        const linkDate = new Date(date);
        const isInRange = linkDate <= postDate && (nextPostDate === null || linkDate > nextPostDate);

        if (isInRange) {
          for (let j = 0; j < linkList.length; j++) {
            const link = linkList[j];
            const isLastInGroup = j === linkList.length - 1;
            items.push({
              type: 'link',
              data: { ...link, isLastInGroup },
              date: linkDate
            });
          }
        }
      }
    }

    // Sort chronologically (newest first)
    return items.sort((a, b) => b.date - a.date);
  });


  // Ignore the 'docs' and "_posts/_drafts" folders
  eleventyConfig.ignores.add("docs/");
  eleventyConfig.ignores.add("_posts/_drafts/");

  // Incremental OG image generation on file changes during dev
  eleventyConfig.on("eleventy.beforeWatch", async (changedFiles) => {
    // Only process markdown and njk files that are posts or pages
    const path = require('path');
    const relevantFiles = changedFiles
      .map(file => {
        // Handle both relative and absolute paths
        if (path.isAbsolute(file)) {
          return file;
        }
        return path.join(process.cwd(), file);
      })
      .filter(file => {
        const isPost = file.includes('_posts/') && (file.endsWith('.md') || file.endsWith('.njk'));
        const isPage = file.includes('src/') && !file.includes('_posts/') && !file.includes('_includes/') && !file.includes('_data/') && !file.includes('assets/') && (file.endsWith('.md') || file.endsWith('.njk'));
        const isPortfolioPage = file.endsWith('portfolio.njk') || file.endsWith('portfolio.md');
        return (isPost || isPage || isPortfolioPage);
      })
      .filter(file => {
        // Only process files that actually exist
        const fs = require('fs');
        return fs.existsSync(file);
      });

    if (relevantFiles.length > 0) {
      const { processFile } = require('./scripts/content/generate-og-images.js');
      for (const file of relevantFiles) {
        try {
          await processFile(file);
        } catch (error) {
          // Silently fail during watch - don't break dev server
          console.error(`⚠️  Failed to generate OG image for ${file}: ${error.message}`);
        }
      }
    }
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};