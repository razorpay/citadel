module.exports = function customLink(url, config) {
  const isInternalLink = url.startsWith('/docs/');
  if (isInternalLink) {
    return url.replace(/^\/docs\//, config.publicPath);
  }
  return url;
};
