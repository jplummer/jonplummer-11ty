/**
 * markdown-it plugin: Convert image/video + italic caption to <figure>/<figcaption>
 *
 * Detects two authoring patterns in markdown:
 *   Pattern 1 (no blank line): ![alt](src)\n*caption*   → single paragraph
 *   Pattern 2 (blank line):    ![alt](src)\n\n*caption*  → two paragraphs
 *
 * Both produce: <figure><img ...><figcaption>caption</figcaption></figure>
 * The Eleventy image optimization plugin later converts <img> to <picture>.
 *
 * The same patterns work for <video> elements. markdown-it tokenizes
 * <video ...></video> as two consecutive html_inline tokens (open + close),
 * so both are collected and placed inside the figure's inline wrapper.
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

    // Returns { tokens: [...], count: N } for the media element at children[0],
    // or null if the children don't start with a recognised media element.
    // Image: single `image` token.
    // Video: two consecutive html_inline tokens (<video …> + </video>).
    function findMedia(children) {
      if (!children.length) return null;
      if (children[0].type === "image") {
        return { tokens: [children[0]], count: 1 };
      }
      if (children.length >= 2 &&
          children[0].type === "html_inline" && /^<video[\s>]/i.test(children[0].content) &&
          children[1].type === "html_inline" && /^<\/video>/i.test(children[1].content)) {
        return { tokens: [children[0], children[1]], count: 2 };
      }
      return null;
    }

    // Build the figure token structure around an array of media tokens
    function makeFigure(mediaTokens, caption) {
      const open = new state.Token("figure_open", "figure", 1);
      open.block = true;
      const img = new state.Token("inline", "", 0);
      img.children = mediaTokens;
      img.content = mediaTokens.map(function (t) { return t.content; }).join("");
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
      const media = findMedia(children);
      if (!media) continue;

      const afterMedia = media.count;

      // Pattern 1: media + softbreak + emphasis in one paragraph
      if (children.length >= afterMedia + 3 &&
          (children[afterMedia].type === "softbreak" || children[afterMedia].type === "hardbreak") &&
          children[afterMedia + 1].type === "em_open" &&
          children[children.length - 1].type === "em_close") {
        const cap = captionText(children.slice(afterMedia + 1));
        if (cap) {
          tokens.splice(i, 3, ...makeFigure(media.tokens, cap));
        }
        continue;
      }

      // Pattern 2: media-only paragraph followed by emphasis-only paragraph
      if (children.length === afterMedia &&
          tokens[i + 3] && tokens[i + 3].type === "paragraph_open" &&
          tokens[i + 4] && tokens[i + 4].type === "inline" &&
          tokens[i + 5] && tokens[i + 5].type === "paragraph_close") {
        const em = tokens[i + 4].children || [];
        if (em.length >= 3 &&
            em[0].type === "em_open" &&
            em[em.length - 1].type === "em_close") {
          const cap = captionText(em);
          if (cap) {
            tokens.splice(i, 6, ...makeFigure(media.tokens, cap));
          }
        }
      }
    }
  });
}

module.exports = figurePlugin;
