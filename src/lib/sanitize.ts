import sanitizeHtmlLib from "sanitize-html";

const RICH_TEXT_TAGS = ["b", "i", "u", "p", "br", "ul", "li", "ol", "strong", "em"];

const PLAIN_OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  // Preserve HTML entities in text (e.g. &amp;, &copy;) instead of decoding.
  parser: { decodeEntities: false },
};

const RICH_OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: RICH_TEXT_TAGS,
  allowedAttributes: {},
  parser: { decodeEntities: false },
};

/**
 * Strip all HTML tags from user input. Text content is preserved; entities
 * are kept escaped. Use for fields that should never contain markup
 * (names, plain-text quotes, FAQ questions, alt text, etc.).
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  return sanitizeHtmlLib(dirty, PLAIN_OPTIONS);
}

/**
 * Sanitize rich text while allowing a small set of formatting tags
 * (b, i, u, p, br, ul, li, ol, strong, em). All attributes are stripped.
 */
export function sanitizeRichText(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  return sanitizeHtmlLib(dirty, RICH_OPTIONS);
}
