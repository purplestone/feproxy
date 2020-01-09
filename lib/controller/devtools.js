
const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');

const chromeDevTools = path.dirname(require.resolve('chrome-devtools-frontend/front_end/inspector.html'));
const localDevTools = path.join(__dirname, '../public/devtools');

// These files cound download from:
// https://chrome-devtools-frontend.appspot.com/serve_file/@${commitHash}/${path}
// Current browser commit hash cound found at:
// chrome://version/
const localFiles = [
  'SupportedCSSProperties.js',
  'InspectorBackendCommands.js',
  'accessibility/ARIAProperties.js',
];

const replaceByLocal = {
  'ui/SplitWidget.js': {
    '// Force layout.': "parent.postMessage(JSON.stringify({event: '_onResizeEnd',data: this._savedSidebarSizeDIP || this._totalSizeCSS }), '*');",
    'this._updateLayout(animate);': "this._updateLayout(animate);parent.postMessage(JSON.stringify({event: '_onResizeEnd',data: this._sidebarSizeDIP}), '*');",
  },
};

exports.static = async ctx => {
  const filename = ctx.params[0];
  const filepath = path.join(localFiles.includes(filename) ? localDevTools : chromeDevTools, filename);
  if (await fs.exists(filepath)) {
    ctx.set('Content-Type', mime.lookup(filepath));
    let filetext = '';
    for (const replaceByLocalPath in replaceByLocal) {
      if (~filepath.indexOf(path.join(replaceByLocalPath))) {
        filetext = filetext || fs.readFileSync(filepath).toString();
        for (const strOld in replaceByLocal[replaceByLocalPath]) {
          filetext = filetext.replace(strOld, replaceByLocal[replaceByLocalPath][strOld]);
        }
      } else {
        filetext = fs.createReadStream(filepath);
      }
    }
    ctx.body = filetext;
  }
};

function extendWebsocket(ws) {
  const originSend = ws.send;
  ws.send = obj => {
    if (typeof obj === 'object') {
      obj = JSON.stringify(obj);
    }
    originSend.call(ws, obj);
  };
}

exports.ws = async ctx => {
  const ws = await ctx.accept();

  extendWebsocket(ws);

  ctx.app.inspector.addClient(ws);
};
