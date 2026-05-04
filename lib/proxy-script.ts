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
    const ghlContainer = document.querySelector('.form-builder--wrap, #_builder-form');
    if (ghlContainer) return ghlContainer.querySelector('form');
    return document.querySelector('form:not([data-ghl-styled])');
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
    const ghlForm = findGhlFormFor(styledForm);
    if (!ghlForm) {
      console.error('GHL Proxy: Target GHL form not found.');
      alert('Error: Could not locate the target GoHighLevel form on this page.');
      return;
    }

    const styledInputs = styledForm.querySelectorAll('input[name], select[name], textarea[name]');
    let missingFields = [];

    styledInputs.forEach(sInput => {
      const gInput = ghlForm.querySelector(\`[name="\${sInput.name}"], [data-q="\${sInput.name}"]\`);
      if (gInput) {
        setNativeValue(gInput, sInput.value);
      } else {
        missingFields.push(sInput.name);
      }
    });

    if (missingFields.length > 0) {
      console.warn('GHL Proxy: Some fields were not found in GHL form:', missingFields);
    }

    const requiredGhl = ghlForm.querySelectorAll('[data-required="true"] input, [data-required="true"] select');
    requiredGhl.forEach(rg => {
      if (!rg.value) console.warn('GHL Proxy: Required GHL field is empty:', rg.name || rg.placeholder);
    });

    const submitBtn = ghlForm.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      submitBtn.click();
    } else {
      ghlForm.submit();
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
