// Rewrites the static <title>/og:*/twitter:* meta tags of an already-served
// HTML response to reflect one specific item (a work or a signal), so link
// unfurlers (WhatsApp, Facebook, Threads, etc.) — which never run our
// client-side JS — see the real title/image/description instead of the
// generic site-wide fallback baked into the HTML file.

const MAX_DESCRIPTION_LENGTH = 200;

export function truncate(text, max = MAX_DESCRIPTION_LENGTH) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

class TitleRewriter {
  constructor(title) { this.title = title; }
  element(el) { if (this.title) el.setInnerContent(this.title); }
}

class MetaContentRewriter {
  constructor(content) { this.content = content; }
  element(el) { if (this.content) el.setAttribute('content', this.content); }
}

class RemoveElement {
  element(el) { el.remove(); }
}

// meta: { title, description, image, url }. Any field left undefined keeps
// whatever the static HTML already had for that tag.
export function rewriteMeta(response, meta) {
  const rewriter = new HTMLRewriter();

  if (meta.title) {
    rewriter.on('title', new TitleRewriter(meta.title));
    rewriter.on('meta[property="og:title"]', new MetaContentRewriter(meta.title));
    rewriter.on('meta[name="twitter:title"]', new MetaContentRewriter(meta.title));
  }
  if (meta.description) {
    rewriter.on('meta[name="description"]', new MetaContentRewriter(meta.description));
    rewriter.on('meta[property="og:description"]', new MetaContentRewriter(meta.description));
    rewriter.on('meta[name="twitter:description"]', new MetaContentRewriter(meta.description));
  }
  if (meta.image) {
    rewriter.on('meta[property="og:image"]', new MetaContentRewriter(meta.image));
    rewriter.on('meta[name="twitter:image"]', new MetaContentRewriter(meta.image));
    // Width/height hints from the generic OG image no longer apply to an
    // arbitrary per-item image (YouTube thumbnail or an uploaded cover).
    rewriter.on('meta[property="og:image:width"]', new RemoveElement());
    rewriter.on('meta[property="og:image:height"]', new RemoveElement());
  }
  if (meta.url) {
    rewriter.on('meta[property="og:url"]', new MetaContentRewriter(meta.url));
  }

  return rewriter.transform(response);
}
