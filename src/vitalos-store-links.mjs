export const STORE_LINKS = Object.freeze({
  googlePlay: '',
  appStore: '',
});

const stores = [
  {
    key: 'googlePlay',
    href: (value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname === 'play.google.com' &&
          url.pathname === '/store/apps/details' && Boolean(url.searchParams.get('id'))
          ? url.href
          : null;
      } catch { return null; }
    },
  },
  {
    key: 'appStore',
    href: (value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname === 'apps.apple.com' &&
          /\/app\/[^/]+\/id\d+$/.test(url.pathname)
          ? url.href
          : null;
      } catch { return null; }
    },
  },
];

export function renderStoreLinks(links, elements) {
  let visible = 0;
  for (const store of stores) {
    const element = elements[store.key];
    const href = store.href(links[store.key] || '');
    element.hidden = !href;
    if (href) { element.href = href; visible += 1; }
    else element.removeAttribute('href');
  }
  elements.section.hidden = visible === 0;
  return visible;
}
