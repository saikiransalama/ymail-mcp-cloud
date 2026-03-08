import sanitizeHtml from "sanitize-html";

/**
 * Strictly sanitize an HTML email body.
 * Allows a safe subset of formatting tags. Strips all scripts, styles, iframes,
 * and remote images (data URIs and src attributes on img tags are removed).
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "b",
      "i",
      "em",
      "strong",
      "u",
      "s",
      "del",
      "ins",
      "mark",
      "sub",
      "sup",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "a",
      "span",
      "div",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
      "hr",
    ],
    allowedAttributes: {
      a: ["href", "title", "target"],
      td: ["colspan", "rowspan", "style"],
      th: ["colspan", "rowspan", "style"],
      table: ["style"],
      div: ["style"],
      span: ["style"],
      p: ["style"],
    },
    allowedStyles: {
      div: {
        // Allow only safe inline styles; block url() to prevent CSS tracking pixels
        color: [/^#[0-9a-f]{3}([0-9a-f]{3})?$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
        "font-style": [/^italic$/, /^normal$/],
        "text-decoration": [/^underline$/, /^line-through$/, /^none$/],
      },
      span: {
        color: [/^#[0-9a-f]{3}([0-9a-f]{3})?$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
        "font-style": [/^italic$/, /^normal$/],
        "text-decoration": [/^underline$/, /^line-through$/, /^none$/],
      },
      p: {
        color: [/^#[0-9a-f]{3}([0-9a-f]{3})?$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
        "font-style": [/^italic$/, /^normal$/],
        "text-decoration": [/^underline$/, /^line-through$/, /^none$/],
      },
      td: {
        color: [/^#[0-9a-f]{3}([0-9a-f]{3})?$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
        "font-style": [/^italic$/, /^normal$/],
        "text-decoration": [/^underline$/, /^line-through$/, /^none$/],
      },
      th: {
        color: [/^#[0-9a-f]{3}([0-9a-f]{3})?$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
        "font-style": [/^italic$/, /^normal$/],
        "text-decoration": [/^underline$/, /^line-through$/, /^none$/],
      },
      table: {
        color: [/^#[0-9a-f]{3}([0-9a-f]{3})?$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
        "font-style": [/^italic$/, /^normal$/],
        "text-decoration": [/^underline$/, /^line-through$/, /^none$/],
      },
    },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: {
      a: ["https", "mailto"],
    },
    // Disallow data: URIs and javascript: links
    disallowedTagsMode: "discard",
    // Strip comments
    allowedIframeHostnames: [],
  });
}
