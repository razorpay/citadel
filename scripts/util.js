module.exports.linkUrl = function (url) {
  // if url is a folder, append '/'
  // folderCheck is based in existance of dot/hash in last component after slash (usually the filename)
  if (url && !/(\.|#)[^\/]*/.test(url)) {
    url += '/';
  }
  if (url[0] !== '/') {
    url = '/' + url;
  }
  return '/docs' + url;
};

// General Method Debounce for search bar
module.exports.debounce = function (func, delay) {
  let debounceTimer;
  return function () {
    const context = this,
      args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      func.apply(context, args);
    }, delay);
  };
};

module.exports.throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
