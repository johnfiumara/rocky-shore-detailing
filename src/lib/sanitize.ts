import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML input by removing all HTML tags and malicious code.
 * Use this for user-generated content that should never contain HTML.
 * @param dirty - The unsanitized input string
 * @returns Sanitized text with all HTML tags removed
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize rich text input while allowing safe HTML tags.
 * Currently allows: b, i, u, p, br, ul, li, ol, strong, em
 * @param dirty - The unsanitized input string
 * @returns Sanitized HTML with only safe tags allowed
 */
export function sanitizeRichText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'p', 'br', 'ul', 'li', 'ol', 'strong', 'em'],
    ALLOWED_ATTR: [],
  });
}
