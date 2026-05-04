/**
 * The canonical proxy script injected into the styled page.
 * Version: 2.0 (Self-contained)
 */
export const PROXY_SCRIPT = `
<script id="ghl-proxy-script">
(function() {
  if (window.__ghlProxyInstalled) return;
  window.__ghlProxyInstalled = true;

  console.log('GHL Proxy Form Script Installed');

  const style = document.createElement('style');
  style.id = 'ghl-proxy-styles';
  style.innerHTML = \`
    .ghl-proxy-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: ghl-spin 1s ease-in-out infinite;
      margin-right: 8px;
      vertical-align: middle;
    }
    @keyframes ghl-spin { to { transform: rotate(360deg); } }
    .ghl-proxy-disabled { opacity: 0.6; cursor: not-allowed !important; pointer-events: none !important; }
  \`;
  document.head.appendChild(style);

  function setNativeValue(el, value) {
    const previousValue = el.value;
    el.value = value;
    const tracker = el._valueTracker;
    if (tracker) {
      tracker.setValue(previousValue);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function findGhlFormFor(styledForm) {
    const selectors = '.form-builder--wrap, #_builder-form, .ghl-form-v2, .ghl-form, [name="builder-form"], .hl_form-builder--main';
    
    // 1. Try common GHL containers in the main document, excluding our styled one
    const ghlContainer = document.querySelector(selectors);
    if (ghlContainer && !ghlContainer.hasAttribute('data-ghl-styled')) {
      const form = ghlContainer.tagName === 'FORM' ? ghlContainer : ghlContainer.querySelector('form');
      return form || ghlContainer; 
    }

    // 2. Try any form or div that looks like a GHL form and isn't ours
    const allForms = document.querySelectorAll('form, div[id*="form"], div[class*="form"]');
    for (let f of allForms) {
      if (!f.hasAttribute('data-ghl-styled') && f !== styledForm && (f.id || f.className)) {
        // If it's a known GHL structure or just the only other thing on the page
        if (f.id === '_builder-form' || f.classList.contains('form-builder--wrap')) return f;
      }
    }

    // 3. Search inside all IFRAMES
    const iframes = document.querySelectorAll('iframe');
    for (let i = 0; i < iframes.length; i++) {
      try {
        const frameDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
        const frameContainer = frameDoc.querySelector(selectors + ', form');
        if (frameContainer) {
          const frameForm = frameContainer.tagName === 'FORM' ? frameContainer : frameContainer.querySelector('form');
          return frameForm || frameContainer;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  }

  function showSpinner(btn) {
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.dataset.originalHtml = btn.innerHTML;
    btn.style.minWidth = rect.width + 'px';
    btn.style.minHeight = rect.height + 'px';
    btn.innerHTML = '<span class="ghl-proxy-spinner"></span> ' + (btn.innerText || 'Submitting...');
    btn.classList.add('ghl-proxy-disabled');
  }

  function hideSpinner(btn) {
    if (!btn || !btn.dataset.originalHtml) return;
    btn.innerHTML = btn.dataset.originalHtml;
    btn.classList.remove('ghl-proxy-disabled');
  }

  async function mirrorAndSubmit(styledForm) {
    const ghlTarget = findGhlFormFor(styledForm);
    if (!ghlTarget) {
      console.error('GHL Proxy: Target GHL form/container not found.');
      alert('Error: Could not locate the target GoHighLevel form on this page.');
      return;
    }

    const styledInputs = styledForm.querySelectorAll('input[name], select[name], textarea[name]');
    let missingFields = [];

    styledInputs.forEach(sInput => {
      const gInput = ghlTarget.querySelector(\`[name="\${sInput.name}"], [data-q="\${sInput.name}"], #\${sInput.name}\`);
      if (gInput) {
        setNativeValue(gInput, sInput.value);
      } else {
        missingFields.push(sInput.name);
      }
    });

    if (missingFields.length > 0) {
      console.warn('GHL Proxy: Some fields were not found in GHL form:', missingFields);
    }

    const submitBtn = ghlTarget.querySelector('button[type="submit"], input[type="submit"], .button-element');
    if (submitBtn) {
      submitBtn.click();
    } else if (ghlTarget.tagName === 'FORM') {
      ghlTarget.submit();
    } else {
      console.error('GHL Proxy: No submit button found in target container.');
    }
  }

  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.closest('.form-builder--wrap') || form.id === '_builder-form') return;
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"], input[type="submit"]');
    showSpinner(btn);
    mirrorAndSubmit(form).catch(err => {
      console.error('GHL Proxy Error:', err);
      hideSpinner(btn);
    });
  }, true);

})();
</script>
`;
