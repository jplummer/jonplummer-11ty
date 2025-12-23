/**
 * Markdown-it plugin: Extended image syntax with captions
 * 
 * Detects markdown image syntax followed by italic text on the next line
 * and converts it to a custom HTML element that will be processed
 * by an Eleventy transform.
 * 
 * Pattern:
 * ![alt text](/path/to/image.png)
 * *Caption text here*
 * 
 * This will be converted to:
 * <figure-image src="/path/to/image.png" alt="alt text" caption="Caption text here"></figure-image>
 */

function figurePlugin(md) {
  // Store the original image renderer
  const defaultImageRender = md.renderer.rules.image || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  // Override image renderer
  md.renderer.rules.image = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const imageHtml = defaultImageRender(tokens, idx, options, env, self);
    
    // Check if next token is a paragraph starting with emphasis (italic)
    const nextToken = tokens[idx + 1];
    
    if (nextToken && nextToken.type === 'paragraph_open') {
      // Look ahead to see if paragraph contains only emphasis
      let lookAhead = idx + 2;
      let foundEmphasis = false;
      let captionText = '';
      
      while (lookAhead < tokens.length) {
        const aheadToken = tokens[lookAhead];
        
        if (aheadToken.type === 'paragraph_close') {
          break;
        }
        
        if (aheadToken.type === 'emphasis_open' && aheadToken.tag === 'em') {
          foundEmphasis = true;
          // Get text from next token
          const textToken = tokens[lookAhead + 1];
          if (textToken && textToken.type === 'inline') {
            // Extract text from inline tokens
            const inlineTokens = textToken.children || [];
            captionText = inlineTokens
              .filter(t => t.type === 'text' || t.type === 'text_special')
              .map(t => t.content)
              .join('');
          }
          // Skip the emphasis_close token
          break;
        }
        
        lookAhead++;
      }
      
      if (foundEmphasis && captionText) {
        // Extract src and alt from image token
        const src = token.attrGet('src') || '';
        const alt = token.content || '';
        
        // Return custom element that will be processed by transform
        return `<figure-image src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(alt)}" caption="${md.utils.escapeHtml(captionText)}"></figure-image>`;
      }
    }
    
    return imageHtml;
  };
}

module.exports = figurePlugin;

