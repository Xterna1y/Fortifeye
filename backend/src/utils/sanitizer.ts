import DOMPurify from "isomorphic-dompurify";

export function sanitizeHTML(html: string) {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script", "iframe"],
    FORBID_ATTR: ["onerror", "onclick", "onload"]
  });
}