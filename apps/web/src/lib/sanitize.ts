/**
 * Sanitizes highlighted HTML from Meilisearch, allowing only <mark> tags.
 * All other HTML tags are stripped to prevent XSS.
 */
export function sanitizeHighlight(html: string | null): string {
  if (!html) return '';
  return html.replace(/<(?!\/?mark\b)[^>]*>/gi, '');
}
