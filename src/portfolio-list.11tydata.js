/**
 * Per-list page data for src/portfolio-list.njk. Computed in JS so `noindex`
 * is a real boolean (a Nunjucks string "false" would be truthy).
 * Lists share the /portfolio/ OG card: one card per opportunity would be
 * one more file per application, for pages nobody shares.
 */
module.exports = {
  eleventyComputed: {
    title: (data) => data.list && data.list.title,
    description: (data) => data.list && data.list.description,
    noindex: (data) => !(data.list && data.list.indexed),
    ogImage: () => '/assets/images/og/v2/portfolio.png',
  },
};
