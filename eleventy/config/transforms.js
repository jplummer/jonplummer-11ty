/**
 * Eleventy configuration: Transform registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers all HTML transforms that post-process template output.
 */

const cheerio = require("cheerio");

/**
 * Transform to convert image + italic caption to figure elements.
 * 
 * Processes HTML output to detect images (or picture elements) followed by italic captions
 * and converts them to <figure> elements. This runs AFTER the image optimization transform,
 * so it works with <picture> elements that have already been optimized.
 * 
 * Pattern detected:
 * <picture>...</picture> or <img src="..." alt="...">
 * <p><em>Caption text</em></p>
 * 
 * Converted to:
 * <figure>
 *   <picture>...</picture> or <img src="..." alt="...">
 *   <figcaption>Caption text</figcaption>
 * </figure>
 */
function figureTransform(content, outputPath) {
  // Only process HTML files
  if (!outputPath || !outputPath.endsWith(".html")) {
    return content;
  }

  const $ = cheerio.load(content, {
    decodeEntities: false
  });
  let hasChanges = false;

  // Find all picture elements first (these are created by the image transform plugin)
  $("picture").each(function() {
    const $picture = $(this);
    
    // Check if picture is already in a figure - skip if so
    if ($picture.closest("figure").length > 0) {
      return;
    }
    
    // Get the parent element (might be a paragraph)
    const $parent = $picture.parent();
    
    // Case 1: Caption is in the same paragraph as the picture (separated by <br>)
    // Pattern: <p><picture>...</picture><br><em>caption</em></p>
    if ($parent.is("p")) {
      const $br = $picture.next();
      if ($br.length && $br.is("br")) {
        const $em = $br.next();
        if ($em.length && $em.is("em")) {
          // Check if this is the only content after the picture
          const captionText = $em.text().trim();
          if (captionText.length > 0) {
            // Create figure element
            const $figure = $("<figure>");
            
            // Insert figure before the paragraph
            $parent.before($figure);
            $figure.append($picture);
            
            // Create figcaption
            const $figcaption = $("<figcaption>").text(captionText);
            $figure.append($figcaption);
            
            // Remove the paragraph (which now only contains <br> and <em>)
            $parent.remove();
            
            hasChanges = true;
            return;
          }
        }
      }
    }
    
    // Case 2: Caption is in a separate paragraph
    // Find next sibling element
    let $next = $picture.next();
    if (!$next.length) {
      // If no next sibling, check if parent has next sibling
      $next = $parent.next();
    }
    
    // Check if next element is a paragraph with only emphasis (italic) content
    if ($next.length && $next.is("p")) {
      const $p = $next;
      const children = $p.children();
      
      // Check if paragraph contains only a single <em> element
      if (children.length === 1 && children.is("em")) {
        const captionText = children.text().trim();
        
        if (captionText.length > 0) {
          // Create figure element
          const $figure = $("<figure>");
          
          // If picture is in a paragraph by itself, unwrap it
          if ($parent.is("p") && $parent.children().length === 1 && $parent.children().is("picture")) {
            $picture.unwrap();
          }
          
          // Insert figure before the picture (or its parent)
          $picture.before($figure);
          $figure.append($picture);
          
          // Create figcaption
          const $figcaption = $("<figcaption>").text(captionText);
          $figure.append($figcaption);
          
          // Remove the caption paragraph
          $p.remove();
          
          hasChanges = true;
        }
      }
    }
  });

  // Also handle plain img elements (in case image transform didn't run or wasn't needed)
  $("img").each(function() {
    const $img = $(this);
    
    // Skip if already in a figure or picture
    if ($img.closest("figure").length > 0 || $img.closest("picture").length > 0) {
      return;
    }
    
    // Get the parent element (might be a paragraph)
    const $parent = $img.parent();
    
    // Case 1: Caption is in the same paragraph as the image (separated by <br>)
    // Pattern: <p><img>...</img><br><em>caption</em></p>
    if ($parent.is("p")) {
      const $br = $img.next();
      if ($br.length && $br.is("br")) {
        const $em = $br.next();
        if ($em.length && $em.is("em")) {
          // Check if this is the only content after the image
          const captionText = $em.text().trim();
          if (captionText.length > 0) {
            // Create figure element
            const $figure = $("<figure>");
            
            // Insert figure before the paragraph
            $parent.before($figure);
            $figure.append($img);
            
            // Create figcaption
            const $figcaption = $("<figcaption>").text(captionText);
            $figure.append($figcaption);
            
            // Remove the paragraph (which now only contains <br> and <em>)
            $parent.remove();
            
            hasChanges = true;
            return;
          }
        }
      }
    }
    
    // Case 2: Caption is in a separate paragraph
    // Find next sibling element
    let $next = $img.next();
    if (!$next.length) {
      // If no next sibling, check if parent has next sibling
      $next = $parent.next();
    }
    
    // Check if next element is a paragraph with only emphasis (italic) content
    if ($next.length && $next.is("p")) {
      const $p = $next;
      const children = $p.children();
      
      // Check if paragraph contains only a single <em> element
      if (children.length === 1 && children.is("em")) {
        const captionText = children.text().trim();
        
        if (captionText.length > 0) {
          // Create figure element
          const $figure = $("<figure>");
          
          // If image is in a paragraph by itself, unwrap it
          if ($parent.is("p") && $parent.children().length === 1 && $parent.children().is("img")) {
            $img.unwrap();
          }
          
          // Insert figure before the image (or its parent)
          $img.before($figure);
          $figure.append($img);
          
          // Create figcaption
          const $figcaption = $("<figcaption>").text(captionText);
          $figure.append($figcaption);
          
          // Remove the caption paragraph
          $p.remove();
          
          hasChanges = true;
        }
      }
    }
  });

  // Serialize HTML with proper boolean attribute handling
  // Note: We need to manually format boolean attributes to avoid cheerio adding =""
  if (hasChanges) {
    const html = $.html();
    // Fix boolean attributes that cheerio adds ="" to
    // Common boolean attributes: required, disabled, checked, selected, readonly, multiple, etc.
    return html
      .replace(/\s(required|disabled|checked|selected|readonly|multiple|autofocus|autoplay|controls|loop|muted|default|ismap|novalidate|open|reversed|scoped|seamless|sortable|truespeed|typemustmatch)=""/g, ' $1');
  }
  
  // Even if we didn't make figure changes, fix boolean attributes in the content
  // This handles cases where Nunjucks or other processing adds ="" to boolean attributes
  return content.replace(/\s(required|disabled|checked|selected|readonly|multiple|autofocus|autoplay|controls|loop|muted|default|ismap|novalidate|open|reversed|scoped|seamless|sortable|truespeed|typemustmatch)=""/g, ' $1');
}

/**
 * Registers Eleventy transforms.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureTransforms(eleventyConfig) {
  // Transform to convert image + italic caption to figure elements
  // This runs before the image optimization transform
  eleventyConfig.addTransform("figure-transform", figureTransform);
}

module.exports = configureTransforms;

