import { describe, it, expect } from 'vitest';
import { sanitizeHighlight } from '../sanitize';

describe('sanitizeHighlight', () => {
  it('preserves <mark> tags', () => {
    expect(sanitizeHighlight('<mark>торт</mark>')).toBe('<mark>торт</mark>');
  });

  it('preserves multiple <mark> tags', () => {
    expect(sanitizeHighlight('вкусный <mark>шоколадный</mark> <mark>торт</mark>'))
      .toBe('вкусный <mark>шоколадный</mark> <mark>торт</mark>');
  });

  it('strips <script> tags', () => {
    expect(sanitizeHighlight('<script>alert(1)</script>торт')).toBe('alert(1)торт');
  });

  it('strips <img> tags with onerror', () => {
    expect(sanitizeHighlight('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('strips <a> tags', () => {
    expect(sanitizeHighlight('<a href="evil.com">click</a>')).toBe('click');
  });

  it('strips nested dangerous tags inside mark (no added whitespace)', () => {
    // The regex removes tags only — no whitespace is inserted between text nodes.
    expect(sanitizeHighlight('<mark><script>x</script>торт</mark>'))
      .toBe('<mark>xторт</mark>');
  });

  it('returns empty string for null', () => {
    expect(sanitizeHighlight(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(sanitizeHighlight('')).toBe('');
  });

  it('preserves plain text', () => {
    expect(sanitizeHighlight('Обычный текст')).toBe('Обычный текст');
  });

  it('strips <div> tags', () => {
    expect(sanitizeHighlight('<div>content</div>')).toBe('content');
  });

  it('strips <iframe> tags', () => {
    expect(sanitizeHighlight('<iframe src="evil.com"></iframe>')).toBe('');
  });

  it('strips <span> tags but preserves text', () => {
    expect(sanitizeHighlight('<span class="x">text</span>')).toBe('text');
  });

  it('handles <mark> with attributes (preserves the full opening tag)', () => {
    // <mark> with attributes still starts with "mark" so the lookahead keeps it
    expect(sanitizeHighlight('<mark class="hl">торт</mark>')).toBe('<mark class="hl">торт</mark>');
  });
});
