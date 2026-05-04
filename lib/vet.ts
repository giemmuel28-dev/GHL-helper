import { PROXY_SCRIPT } from './proxy-script';
import { parseHelloBar, buildSalesPageUrl, SALES_PAGE_URL } from './hello-bar';

export interface VetResult {
  fixedHtml: string;
  issues: { code: string; severity: 'auto-fixed' | 'needs-review'; message: string }[];
  ghlFields: string[];
  styledFields: string[];
  salesPageUrl?: string;
}

const GHL_STANDARD_FIELDS: Record<string, string[]> = {
  first_name: ['firstname', 'fname', 'first'],
  last_name: ['lastname', 'lname', 'last'],
  full_name: ['fullname', 'name'],
  email: ['email', 'emailaddress'],
  phone: ['phone', 'phonenumber', 'mobile', 'cell', 'tel'],
  company_name: ['company', 'business'],
  website: ['site', 'url', 'web'],
  address1: ['address', 'street'],
  address2: ['apt', 'suite'],
  city: ['city'],
  state: ['state', 'province'],
  postal_code: ['zip', 'zipcode', 'postcode'],
  country: ['country'],
  date_of_birth: ['dob', 'birthday'],
  source: ['source']
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[_\-\s]/g, '');
}

export async function vet(params: {
  html: string;
  ghlFields?: string | string[];
  helloBarMessage?: string;
  customSalesPageUrl?: string;
}): Promise<VetResult> {
  let { html, ghlFields, helloBarMessage, customSalesPageUrl } = params;
  const issues: VetResult['issues'] = [];
  const ghlFieldList: string[] = [];
  const requiredGhlFields: string[] = [];

  if (ghlFields) {
    const raw = Array.isArray(ghlFields) ? ghlFields : ghlFields.split(/[,\n]/);
    raw.forEach(f => {
      const trimmed = f.trim();
      if (!trimmed) return;
      const isRequired = trimmed.endsWith('*');
      const name = isRequired ? trimmed.slice(0, -1) : trimmed;
      ghlFieldList.push(name);
      if (isRequired) requiredGhlFields.push(name);
    });
  } else {
    ghlFieldList.push('first_name', 'email', 'phone');
    requiredGhlFields.push('email');
  }

  let fixedHtml = html;

  // 1. Hello-bar processing
  let salesPageUrlResult = '';
  if (helloBarMessage) {
    try {
      const hbData = parseHelloBar(helloBarMessage);
      salesPageUrlResult = buildSalesPageUrl(hbData, customSalesPageUrl);
      issues.push({ code: 'hello-bar-encoded', severity: 'auto-fixed', message: 'Hello bar message encoded into sales page URL.' });

      const baseToMatch = customSalesPageUrl || SALES_PAGE_URL;
      const salesPageRegex = new RegExp(baseToMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

      if (fixedHtml.match(salesPageRegex)) {
        fixedHtml = fixedHtml.replace(salesPageRegex, (_) => salesPageUrlResult);
        issues.push({ code: 'hello-bar-links-rewritten', severity: 'auto-fixed', message: 'Rewrote existing links to include hello-bar payload.' });
      }
    } catch (e: unknown) {
      issues.push({ code: 'hello-bar-parse-failed', severity: 'needs-review', message: `Hello bar parsing failed: ${(e as Error).message}` });
    }
  }

  // 2. Field name inference + reconciliation
  const tagRegex = /<(input|select|textarea)([^>]+)>/gi;
  fixedHtml = fixedHtml.replace(tagRegex, (fullTag, tagName, attrs) => {
    if (attrs.match(/type=["']?(submit|button|reset)["']?/i)) return fullTag;

    const nameMatch = attrs.match(/name=["']?([^"'\s>]+)["']?/i);
    const idMatch = attrs.match(/id=["']?([^"'\s>]+)["']?/i);
    const placeholderMatch = attrs.match(/placeholder=["']?([^"'\s>]+)["']?/i);
    const ariaMatch = attrs.match(/aria-label=["']?([^"'\s>]+)["']?/i);
    const typeMatch = attrs.match(/type=["']?([^"'\s>]+)["']?/i);

    let name = nameMatch ? nameMatch[1] : '';
    const context = (idMatch ? idMatch[1] : '') + ' ' + (placeholderMatch ? placeholderMatch[1] : '') + ' ' + (ariaMatch ? ariaMatch[1] : '') + ' ' + (typeMatch ? typeMatch[1] : '');

    if (!name) {
      if (context.match(/email/i)) name = 'email';
      else if (context.match(/phone|tel|mobile/i)) name = 'phone';
      else if (context.match(/first\s*name|fname/i)) name = 'first_name';
      else if (context.match(/last\s*name|lname/i)) name = 'last_name';
      else if (context.match(/address/i)) name = 'address1';
      else if (context.match(/city/i)) name = 'city';
      else if (context.match(/zip|postal/i)) name = 'postal_code';
      else if (context.match(/state/i)) name = 'state';

      if (name) {
        issues.push({ code: 'field-name-inferred', severity: 'auto-fixed', message: `Inferred name="${name}" for ${tagName} field.` });
        return fullTag.replace(new RegExp(`<${tagName}`, 'i'), `<${tagName} name="${name}"`);
      } else {
        issues.push({ code: 'field-name-missing', severity: 'needs-review', message: `Field type/placeholder "${context.trim()}" lacks a name attribute and couldn't be inferred.` });
        return fullTag;
      }
    }

    const normName = normalize(name);
    let matchedGhl = '';
    for (const [ghl, aliases] of Object.entries(GHL_STANDARD_FIELDS)) {
      if (normName === normalize(ghl) || aliases.some(a => normalize(a) === normName)) {
        matchedGhl = ghl;
        break;
      }
    }

    if (matchedGhl && matchedGhl !== name) {
      issues.push({ code: 'field-name-mismatch', severity: 'auto-fixed', message: `Corrected name="${name}" to "${matchedGhl}" to match GHL standard.` });
      return fullTag.replace(/name=["']?[^"'\s>]+["']?/i, `name="${matchedGhl}"`);
    }

    if (!ghlFieldList.some(f => normalize(f) === normName) && !matchedGhl) {
      issues.push({ code: 'orphan-styled-field', severity: 'needs-review', message: `Field name="${name}" is not in the provided GHL fields list.` });
    }

    return fullTag;
  });

  // 3. Check required GHL fields
  const styledFieldNames = Array.from(fixedHtml.matchAll(/name=["']?([^"'\s>]+)["']?/gi)).map(m => m[1]);
  requiredGhlFields.forEach(rf => {
    if (!styledFieldNames.some(sf => normalize(sf) === normalize(rf))) {
      issues.push({ code: 'ghl-required-not-collected', severity: 'needs-review', message: `The GHL field "${rf}" is required but no matching styled field exists in the HTML.` });
    }
  });

  // 4. Proxy Script Injection
  const hasNewProxy = fixedHtml.includes('__ghlProxyInstalled') && fixedHtml.includes('findGhlFormFor');
  const hasOldProxy = fixedHtml.includes('mirrorAndSubmit(') && fixedHtml.includes('ghl-proxy-spinner');

  if (hasOldProxy && !hasNewProxy) {
    fixedHtml = fixedHtml.replace(/<script[^>]*>[\s\S]*?(mirrorAndSubmit|ghl-proxy-spinner)[\s\S]*?<\/script>/gi, '');
    issues.push({ code: 'proxy-script-upgraded', severity: 'auto-fixed', message: 'Detected and removed old proxy script; replaced with current version.' });
  }

  if (!hasNewProxy) {
    if (fixedHtml.includes('</body>')) {
      fixedHtml = fixedHtml.replace('</body>', PROXY_SCRIPT + '\n</body>');
    } else {
      fixedHtml += PROXY_SCRIPT;
    }
    issues.push({ code: 'proxy-script-injected', severity: 'auto-fixed', message: 'Injected canonical GHL proxy script.' });
  }

  // 5. Submit button check
  const hasSubmit = /<button[^>]+type=["']?submit["']?|<input[^>]+type=["']?submit["']?/i.test(fixedHtml);
  if (!hasSubmit) {
    issues.push({ code: 'styled-submit-missing', severity: 'needs-review', message: 'No submit button (<button type="submit">) found in the styled HTML.' });
  }

  return {
    fixedHtml,
    issues: issues.sort((a, b) => a.severity.localeCompare(b.severity)),
    ghlFields: ghlFieldList,
    styledFields: styledFieldNames,
    salesPageUrl: salesPageUrlResult || undefined
  };
}
