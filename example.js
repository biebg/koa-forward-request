'use strict';

const Koa = require('koa');
const route = require('koa-route');
const koaBody = require('koa-body');
const logger = require('koa-logger');

const forward = require('./');

const app = new Koa();
forward(app, {
  debug: true
});

app.use(logger());
app.use(koaBody({
  multipart: true
}));

app.use(route.post('/', async function (ctx) {
  console.log(ctx.method);
  console.log(ctx.request.header);
  console.log(ctx.request.body);

  ctx.forward('/test');
}));

app.use(route.post('/test', async function (ctx) {
  console.log(ctx.method);
  console.log(ctx.request.header);
  console.log(ctx.request.body);

  ctx.status = 200;
  ctx.body = ctx.request.body;
}));

app.listen(3000);