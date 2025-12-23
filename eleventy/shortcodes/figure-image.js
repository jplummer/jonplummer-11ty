/**
 * Shortcode: Generate optimized figure with picture element
 * 
 * Takes an image source, alt text, and optional caption, and generates
 * a <figure> element containing a <picture> with multiple responsive
 * image sources using @11ty/eleventy-img.
 * 
 * @param {string} src - Image source path (relative to site root or absolute)
 * @param {string} alt - Alt text for the image
 * @param {string} caption - Optional caption text
 * @returns {Promise<string>} HTML string with optimized figure
 */

const Image = require("@11ty/eleventy-img");
const path = require("path");

module.exports = async function figureImage(src, alt, caption = "") {
  // Normalize the image path
  // If it starts with /, it's absolute from site root
  // Otherwise, treat as relative to src/assets/images
  let imagePath = src;
  if (src.startsWith("/assets/images/")) {
    // Convert absolute path to relative path from project root
    imagePath = path.join("src", src);
  } else if (!path.isAbsolute(src)) {
    // Relative path - assume it's from src/assets/images
    imagePath = path.join("src/assets/images", src);
  }

  // Generate optimized images
  const metadata = await Image(imagePath, {
    widths: [400, 800, 1200, 1600, "auto"],
    formats: ["webp", "jpeg"],
    urlPath: "/img/",
    outputDir: "./_site/img/",
    sharpWebpOptions: {
      quality: 80
    },
    sharpJpegOptions: {
      quality: 80
    }
  });

  // Generate picture element HTML
  const pictureHtml = Image.generateHTML(metadata, {
    alt: alt || "",
    loading: "lazy",
    decoding: "async",
    sizes: "100vw"
  });

  // Build figure HTML
  let figureHtml = `<figure>\n  ${pictureHtml.trim().replace(/\n/g, "\n  ")}`;
  
  if (caption) {
    figureHtml += `\n  <figcaption>${caption}</figcaption>`;
  }
  
  figureHtml += `\n</figure>`;

  return figureHtml;
};

