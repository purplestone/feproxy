
const url = require('url');

function matchTo(str, match, to) {
  if (typeof match === 'string') {
    if (str === match) {
      return to;
    }
  } else {
    const m = str.match(match);
    if (m) {
      return to.replace(/\$(\d+)/g, (str, index) => m[index]);
    }
  }
  return '';
}

module.exports = async (ctx, next) => {
  const { url: rawURL } = ctx;
  const setting = {
    rule: [],
    host: [],
    ...ctx.app.forwarding,
  };
  const forwarding = {};

  setting.rule.some(item => {
    const to = matchTo(rawURL, item.match, item.to);
    if (to) {
      forwarding.url = to;
      return true;
    }
    return false;
  });

  const hostname = url.parse(forwarding.url || rawURL).hostname;

  setting.host.some(item => {
    const to = matchTo(hostname, item.match, item.to);
    if (to) {
      forwarding.hostname = to;
      return true;
    }
    return false;
  });

  ctx.forwarding = forwarding;

  await next();
};
