/**
 * Hello Bar parsing and Sales Page URL building
 */

// Hardcoded constant as requested
export const SALES_PAGE_URL = 'https://bonniefahy.com/twin';

export interface HelloBarData {
  line1: string;
  line2: string;
  pill: string;
  ctaLabel: string;
}

export function parseHelloBar(message: string): HelloBarData {
  const input = message.trim();
  if (!input) throw new Error('Hello bar message is empty');

  const isHtml = input.startsWith('<') || input.includes('class="');

  if (isHtml) {
    const extract = (className: string, tagName: string = 'div|a|span') => {
      const regex = new RegExp(`<(${tagName})[^>]*class=["'](?:[^"']*?\\s+)?${className}(?:\\s+[^"']*?)?["'][^>]*>([\\s\\S]*?)<\\/\\1>`, 'i');
      const match = input.match(regex);
      return match ? match[2].trim() : null;
    };

    let l1 = extract('hello-line1');
    let l2 = extract('hello-line2');
    let p = extract('price-pill', 'span|div|b');
    let c = extract('hello-cta', 'a|div|span');

    const cleanContent = (text: string | null) => {
      if (!text) return null;
      return text.replace(/<!--[\s\S]*?-->/g, "").trim();
    };

    l1 = cleanContent(l1);
    l2 = cleanContent(l2);
    p = cleanContent(p);
    c = cleanContent(c);

    if (l2 && p) {
      const priceRegex = new RegExp(`<[^>]*class=["']price-pill["'][^>]*>[\\s\\S]*?<\\/[^>]*>`, 'gi');
      l2 = l2.replace(priceRegex, "");
      l2 = l2.replace(p, "");
      l2 = l2.trim();
    }

    if (l1 || l2 || p || c) {
      return {
        line1: (l1 || "Special Offer.").replace(/<!--[\s\S]*?-->/g, "").trim(),
        line2: (l2 || "Exclusive access granted.").replace(/<!--[\s\S]*?-->/g, "").trim(),
        pill: (p || "$22").replace(/<!--[\s\S]*?-->/g, "").trim(),
        ctaLabel: (c || "Get Started →").replace(/<!--[\s\S]*?-->/g, "").trim()
      };
    }
  }

  const clean = input.replace(/<!--[\s\S]*?-->/g, "").trim();
  const priceMatch = clean.match(/\$(\d+)/);
  const price = priceMatch ? priceMatch[0] : "$24";
  const ctaMatch = clean.match(/([^.\n]*?[→]|[^.\n<]*?>[^.\n<]*?)$/);
  const cta = ctaMatch ? ctaMatch[0].trim() : "Get Started →";

  let text = clean.replace(cta, "").replace(price, "").trim();
  let parts = text.split(/ — |— | —|—|\. /).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) {
    parts = text.split('.').map(s => s.trim()).filter(Boolean);
  }

  const line1 = parts[0] ? parts[0] + (parts[0].endsWith('.') ? '' : '.') : "Special Offer.";
  const line2 = parts.slice(1).join(". ") ? parts.slice(1).join(". ") + (parts.slice(1).join(". ").endsWith('.') ? '' : '.') : "Exclusive access granted.";

  return { line1, line2, pill: price, ctaLabel: cta };
}

export function buildSalesPageUrl(data: HelloBarData, baseUrl?: string): string {
  const json = JSON.stringify({
    l1: data.line1,
    l2: data.line2,
    p: data.pill,
    c: data.ctaLabel
  });

  const b64 = Buffer.from(json).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const finalBaseUrl = baseUrl || SALES_PAGE_URL;
  const separator = finalBaseUrl.includes('?') ? '&' : '?';
  return `${finalBaseUrl}${separator}hb=${b64}`;
}
