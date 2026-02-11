/**
 * markdown-it plugin: Convert image + italic caption to <figure>/<figcaption>
 *
 * Detects two authoring patterns in markdown:
 *   Pattern 1 (no blank line): ![alt](src)\n*caption*   → single paragraph
 *   Pattern 2 (blank line):    ![alt](src)\n\n*caption*  → two paragraphs
 *
 * Both produce: <figure><img ...><figcaption>caption</figcaption></figure>
 * The Eleventy image optimization plugin later converts <img> to <picture>.
 */

function figurePlugin(md) {
  md.core.ruler.push("figure", function (state) {
    const tokens = state.tokens;

    // Extract plain text from an em_open ... em_close token sequence
    function captionText(emTokens) {
      return emTokens
        .slice(1, -1)
        .filter(function (t) { return t.type === "text"; })
        .map(function (t) { return t.content; })
        .join("")
        .trim();
    }

    // Build the 6-token figure structure
    function makeFigure(imageToken, caption) {
      const open = new state.Token("figure_open", "figure", 1);
      open.block = true;
      const img = new state.Token("inline", "", 0);
      img.children = [imageToken];
      img.content = imageToken.content;
      const fcOpen = new state.Token("figcaption_open", "figcaption", 1);
      fcOpen.block = true;
      const fcInline = new state.Token("inline", "", 0);
      const t = new state.Token("text", "", 0);
      t.content = caption;
      fcInline.children = [t];
      fcInline.content = caption;
      const fcClose = new state.Token("figcaption_close", "figcaption", -1);
      fcClose.block = true;
      const close = new state.Token("figure_close", "figure", -1);
      close.block = true;
      return [open, img, fcOpen, fcInline, fcClose, close];
    }

    // Walk backwards so splicing doesn't shift unprocessed indices
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].type !== "paragraph_open") continue;
      if (!tokens[i + 1] || tokens[i + 1].type !== "inline") continue;
      if (!tokens[i + 2] || tokens[i + 2].type !== "paragraph_close") continue;

      const children = tokens[i + 1].children || [];

      // Pattern 1: image + softbreak + emphasis in one paragraph
      if (children.length >= 4 &&
          children[0].type === "image" &&
          (children[1].type === "softbreak" || children[1].type === "hardbreak") &&
          children[2].type === "em_open" &&
          children[children.length - 1].type === "em_close") {
        const cap = captionText(children.slice(2));
        if (cap) {
          tokens.splice(i, 3, ...makeFigure(children[0], cap));
        }
        continue;
      }

      // Pattern 2: image-only paragraph followed by emphasis-only paragraph
      if (children.length === 1 && children[0].type === "image" &&
          tokens[i + 3] && tokens[i + 3].type === "paragraph_open" &&
          tokens[i + 4] && tokens[i + 4].type === "inline" &&
          tokens[i + 5] && tokens[i + 5].type === "paragraph_close") {
        const em = tokens[i + 4].children || [];
        if (em.length >= 3 &&
            em[0].type === "em_open" &&
            em[em.length - 1].type === "em_close") {
          const cap = captionText(em);
          if (cap) {
            tokens.splice(i, 6, ...makeFigure(children[0], cap));
          }
        }
      }
    }
  });
}

module.exports = figurePlugin;
