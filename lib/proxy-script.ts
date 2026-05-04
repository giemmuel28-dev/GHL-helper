/**
 * The canonical proxy script injected into the styled page.
 * Version: 3.0 (Merged with User Improvements)
 */
export const PROXY_SCRIPT = `
<script id="ghl-proxy-script">
(function() {
  if (window.__ghlProxyInstalled) return;
  window.__ghlProxyInstalled = true;

  function ensureStyles() {
    if (document.getElementById('ghl-proxy-styles')) return;
    const style = document.createElement('style');
    style.id = 'ghl-proxy-styles';
    style.textContent = \`
      @keyframes ghl-proxy-spin { to { transform: rotate(360deg); } }
      .ghl-proxy-spinner {
        display: inline-block;
        width: 1.2em;
        height: 1.2em;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: ghl-proxy-spin 0.7s linear infinite;
        vertical-align: middle;
      }
      .ghl-proxy-disabled { opacity: 0.7; cursor: not-allowed !important; pointer-events: none !important; }
    \`;
    document.head.appendChild(style);
  }

  function setNativeValue(el, value) {
    const prev = el.value;
    el.value = value;
    if (el._valueTracker) el._valueTracker.setValue(prev);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function findGhlTarget() {
    const selectors = '.form-builder--wrap, #_builder-form, .ghl-form-v2, .ghl-form, [name="builder-form"], .hl_form-builder--main';
    let target = document.querySelector(selectors);
    if (target) return target;

    const iframes = document.querySelectorAll('iframe');
    for (let i = 0; i < iframes.length; i++) {
      try {
        const frameDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
        const frameTarget = frameDoc.querySelector(selectors);
        if (frameTarget) return frameTarget;
      } catch (e) { continue; }
    }
    return null;
  }

  function showSpinner(btn) {
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.dataset.originalHtml = btn.innerHTML;
    btn.style.minWidth = rect.width + 'px';
    btn.style.minHeight = rect.height + 'px';
    btn.innerHTML = '<span class="ghl-proxy-spinner"></span>';
    btn.classList.add('ghl-proxy-disabled');
    btn.disabled = true;
  }

  function hideSpinner(btn) {
    if (!btn || !btn.dataset.originalHtml) return;
    btn.innerHTML = btn.dataset.originalHtml;
    btn.classList.remove('ghl-proxy-disabled');
    btn.disabled = false;
  }

  async function mirrorAndSubmit(styledForm) {
    const target = findGhlTarget();
    if (!target) {
      console.error('[GHL Proxy] Target form not found');
      alert('Error: Could not locate the target GoHighLevel form on this page.');
      return false;
    }

    styledForm.querySelectorAll('[name]').forEach(sInput => {
      const name = sInput.getAttribute('name');
      const gInput = target.querySelector('[name="' + name + '"], [data-q="' + name + '"], #' + name);
      if (gInput) setNativeValue(gInput, sInput.value);
    });

    const ghlBtn = target.querySelector('button[type="submit"], input[type="submit"], .button-element');
    if (ghlBtn) {
      ghlBtn.click();
      return true;
    } else if (target.tagName === 'FORM') {
      target.submit();
      return true;
    }
    return false;
  }

  function init() {
    ensureStyles();
    document.addEventListener('submit', function(e) {
      const form = e.target;
      // If it's a real <form> tag, it's our styled UI (since GHL uses <div>)
      if (form.tagName === 'FORM' && !form.closest('.form-builder--wrap')) {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"], input[type="submit"]');
        showSpinner(btn);
        mirrorAndSubmit(form).then(ok => {
          if (!ok) hideSpinner(btn);
        }).catch(() => hideSpinner(btn));
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
\`;
