/**
 * The canonical proxy script injected into the styled page.
 * Version: 3.1 (Build Fix)
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
    style.textContent = [
      '@keyframes ghl-proxy-spin { to { transform: rotate(360deg); } }',
      '.ghl-proxy-spinner {',
      '  display: inline-block;',
      '  width: 1.2em;',
      '  height: 1.2em;',
      '  border: 2px solid currentColor;',
      '  border-right-color: transparent;',
      '  border-radius: 50%;',
      '  animation: ghl-proxy-spin 0.7s linear infinite;',
      '  vertical-align: middle;',
      '}',
      '.ghl-proxy-disabled { opacity: 0.7; cursor: not-allowed !important; pointer-events: none !important; }'
    ].join('\\n');
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
    var selectors = '.form-builder--wrap, #_builder-form, .ghl-form-v2, .ghl-form, [name="builder-form"], .hl_form-builder--main';
    var target = document.querySelector(selectors);
    if (target) return target;

    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      try {
        var frameDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
        var frameTarget = frameDoc.querySelector(selectors);
        if (frameTarget) return frameTarget;
      } catch (e) { continue; }
    }
    return null;
  }

  function showSpinner(btn) {
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
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
    var target = findGhlTarget();
    if (!target) {
      console.error('[GHL Proxy] Target form not found');
      alert('Error: Could not locate the target GoHighLevel form on this page.');
      return false;
    }

    styledForm.querySelectorAll('[name]').forEach(function(sInput) {
      var name = sInput.getAttribute('name');
      var selector = '[name="' + name + '"], [data-q="' + name + '"], #' + name;
      var gInput = target.querySelector(selector);
      if (gInput) setNativeValue(gInput, sInput.value);
    });

    var ghlBtn = target.querySelector('button[type="submit"], input[type="submit"], .button-element');
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
      var form = e.target;
      if (form.tagName === 'FORM' && !form.closest('.form-builder--wrap')) {
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"], input[type="submit"]');
        showSpinner(btn);
        mirrorAndSubmit(form).then(function(ok) {
          if (!ok) hideSpinner(btn);
        }).catch(function() { hideSpinner(btn); });
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
`;
