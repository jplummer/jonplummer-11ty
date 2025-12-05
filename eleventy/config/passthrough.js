/**
 * Configures passthrough copy and watch targets.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configurePassthrough(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Copy .htaccess file for security
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });

  // Copy favicon.ico to root (required for legacy browsers and RSS readers)
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });

  // Watch for changes in assets
  eleventyConfig.addWatchTarget("src/assets");
}

module.exports = configurePassthrough;

