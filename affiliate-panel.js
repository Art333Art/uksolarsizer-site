(() => {
  const showAfter = 560;
  let panel;
  let dismissed = false;

  const updateVisibility = () => {
    if (panel && !dismissed) panel.classList.toggle('is-visible', window.scrollY > showAfter);
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
        dismissed = true;
        panel.remove();
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
      updateVisibility();
      window.addEventListener('scroll', updateVisibility, { passive: true });
    })
    .catch(() => {});
})();
