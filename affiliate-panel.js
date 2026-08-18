(() => {
  const showAfter = 560;
  const mobileQuery = window.matchMedia('(max-width: 720px)');
  let panel;
  let launcher;
  let dismissed = false;

  const isMobile = () => mobileQuery.matches;

  const setMobilePanelState = (open) => {
    if (!panel || !isMobile()) return;
    panel.style.display = open ? 'block' : 'none';
    if (launcher) {
      launcher.setAttribute('aria-expanded', String(open));
      launcher.textContent = open ? 'Close useful links' : 'Useful links';
    }
  };

  const updateVisibility = () => {
    if (!panel || dismissed) return;
    if (isMobile()) {
      panel.classList.remove('is-visible');
      panel.style.display = 'none';
      if (launcher) launcher.style.display = 'inline-flex';
      return;
    }
    panel.style.display = '';
    if (launcher) launcher.style.display = 'none';
    panel.classList.toggle('is-visible', window.scrollY > showAfter);
  };

  fetch('/data/commercial-links.json')
    .then((response) => {
      if (!response.ok) throw new Error('Affiliate configuration unavailable');
      return response.json();
    })
    .then((config) => {
      const products = config.products.filter((product) => product.enabled && product.destination);
      if (!products.length) return;

      panel = document.createElement('aside');
      panel.className = 'affiliate-float';
      panel.setAttribute('aria-label', 'Useful solar and EV products');

      const header = document.createElement('div');
      header.className = 'affiliate-float-header';
      const title = document.createElement('h2');
      title.textContent = 'Useful solar & EV products';
      const close = document.createElement('button');
      close.className = 'affiliate-float-close';
      close.type = 'button';
      close.setAttribute('aria-label', 'Close product links');
      close.textContent = '×';
      close.addEventListener('click', () => {
        if (isMobile()) {
          setMobilePanelState(false);
        } else {
          dismissed = true;
          panel.remove();
        }
      });
      header.append(title, close);

      const links = document.createElement('div');
      links.className = 'affiliate-float-links';
      products.forEach((product) => {
        const link = document.createElement('a');
        link.href = product.destination;
        link.target = '_blank';
        link.rel = 'sponsored noopener';
        link.textContent = product.title;
        links.append(link);
      });

      const disclosure = document.createElement('p');
      disclosure.className = 'affiliate-float-disclosure';
      disclosure.textContent = `${config.disclosure} Check compatibility before buying.`;
      panel.append(header, links, disclosure);
      document.body.append(panel);

      launcher = document.createElement('button');
      launcher.type = 'button';
      launcher.className = 'affiliate-mobile-launcher';
      launcher.textContent = 'Useful links';
      launcher.setAttribute('aria-label', 'Open useful solar and EV product links');
      launcher.setAttribute('aria-expanded', 'false');
      launcher.style.cssText = 'display:none;position:fixed;right:12px;top:86px;z-index:1001;align-items:center;justify-content:center;min-height:42px;padding:0 14px;border:1px solid #62ddb7;border-radius:999px;background:#287d69;color:#fff;font:700 14px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 5px 18px #0008;cursor:pointer;';
      launcher.addEventListener('click', () => {
        const open = panel.style.display !== 'block';
        setMobilePanelState(open);
      });
      document.body.append(launcher);

      const applyMobilePanelStyle = () => {
        if (!panel || !isMobile()) return;
        panel.style.cssText += ';position:fixed;left:12px;right:12px;top:138px;bottom:auto;width:auto;max-width:none;max-height:calc(100vh - 154px);overflow:auto;z-index:1000;';
      };

      applyMobilePanelStyle();
      updateVisibility();
      window.addEventListener('scroll', updateVisibility, { passive: true });
      mobileQuery.addEventListener('change', () => {
        dismissed = false;
        if (!isMobile()) panel.removeAttribute('style');
        else applyMobilePanelStyle();
        updateVisibility();
      });
    })
    .catch(() => {});
})();
