module.exports = {
  eleventyComputed: {
    // Side projects are named like products ("Parker", "prvt"), which is too
    // bare for a <title> or a shared link. Add context to the head title only;
    // the page's h1 still uses the plain name.
    computedTitle: function(data) {
      // No [].concat() here: Eleventy's dependency pass hands this function a
      // Proxy for arrays, and concat reads a Symbol key the Proxy can't handle.
      const tags = data.tags;
      const isSide = Array.isArray(tags)
        ? tags.includes("sideproject")
        : tags === "sideproject";
      if (!isSide || !data.title) {
        return null;
      }
      return `${data.title} – side project`;
    }
  }
};
