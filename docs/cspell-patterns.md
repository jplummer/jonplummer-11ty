# cspell.json Regex Patterns Documentation

This document explains what each regex pattern in `cspell.json`'s `ignoreRegExpList` does.

## Patterns

1. **Markdown links**: `/\\[([^\\]]+)\\]\\([^\\)]+\\)/g`
   - Ignores both link text and URL in markdown links: `[text](url)`

2. **HTTP/HTTPS URLs**: `/https?:\\/\\/[^\\s]+/g`
   - Ignores URLs starting with `http://` or `https://`

3. **www URLs**: `/www\\.[^\\s]+/g`
   - Ignores URLs starting with `www.`

4. **Domain names**: `/\\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\\.[a-z]{2,}\\b/gi`
   - Ignores domain names like `example.com`, `subdomain.example.org`, etc.

5. **Hashtags**: `/#\\w+/g`
   - Ignores hashtags like `#hashtag`, `#capabledad`, etc.

6. **Nunjucks shortcodes**: `/{%[^%]+%}/g`
   - Ignores Nunjucks template shortcode syntax: `{% portraitGrid %}`, `{% endportraitGrid %}`, etc.

7. **Nunjucks mustache**: `/{{[^}]+}}/g`
   - Ignores `{{ … }}` template expressions

8. **YAML frontmatter absolute paths**: `/^[a-z]+:\\s*\\/[^\\n]+$/gm`
   - Ignores YAML keys with absolute paths: `key: /path/to/file`

9. **YAML frontmatter relative paths with file extensions**: `/^[a-z]+:\\s*[^\\n]*\\/[^\\n]*\\.(png|jpg|jpeg|gif|svg|webp|pdf|mp4|webm|ogg)$/gmi`
   - Ignores YAML keys with relative paths ending in file extensions: `key: path/to/image.png`

10. **YAML frontmatter slugs**: `/^slug:\\s*[^\\n]+$/gmi`
    - Ignores slug values in YAML frontmatter: `slug: some-slug-value`

11. **YAML double-quoted string values**: `/:\\s*\"[^\"]*\"/g`
    - Ignores double-quoted YAML string values: `key: "value"`

12. **YAML single-quoted string values**: `/:\\s*'(?:[^']|'')*'/g`
    - Ignores single-quoted YAML string values, handling doubled apostrophes: `key: 'it''s value'`

## Overrides (YAML only)

Comment lines are ignored only for `**/*.{yaml,yml}` so markdown ATX headings (`# Title`) stay spellchecked:

- **YAML comment lines**: `/^\\s*#.*$/gm`
