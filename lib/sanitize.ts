// This works for both server and client in Next.js
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "b", "i", "u", "strong", "em",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "a", "img", "div", "span",
      "blockquote", "pre", "code", "table", "thead",
      "tbody", "tr", "th", "td"
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "id", "target", "rel"],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });

  return sanitized;
}

export function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  return sanitized.trim();
}

export function isSafeHtml(html: string | null | undefined): boolean {
  if (!html || typeof html !== "string") {
    return true;
  }

  const sanitized = DOMPurify.sanitize(html);
  return sanitized === html;
}