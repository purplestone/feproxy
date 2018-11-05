
const chalk = require('chalk');
const ip = require('ip');
const Koa = require('koa');
const koaWebsocket = require('koa-websocket');
const koaStatic = require('koa-static');

const app = koaWebsocket(new Koa());

app.config = require('./lib/config')();

require('./app/extend/context')(app);

app.inspect = require('./app/inspect')(app);

require('./app/router')(app);

app.use(koaStatic(__dirname + '/public'));

const server = require('./lib/server')(app);

server.listen(app.config.port, () => {
  console.log(chalk.green(`\n👉 Server start on http://${ip.address()}:${app.config.port}`));
  console.log(chalk.green(`🎮 Manange page on http://${ip.address()}:${app.config.port}/admin.html`));
  console.log(chalk.green(`🚀 Inspect page on ${app.config.devtoolsURL}`));
});

app.on('error', (err, ctx) => {
  console.error(ctx.url, err);
});

process.on('uncaughtException', err => {
  console.log('uncaughtException');
  console.error(err);
});
