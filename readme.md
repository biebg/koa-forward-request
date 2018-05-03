## koa-forward-request

Forward request for koa, debugging use.
support for koa2

### Install

    npm i koa-forward-request2 --save

### Usage

```
forward(app[, options])
```

### Example
```
'use strict';

var app = new require('koa')();
var route = require('koa-route');
var logger = require('koa-logger');

var forward = require('./');

forward(app, {
  debug: true
});

app.use(logger());

app.use(route.get('/', async function (ctx) {
  ctx.forward('/test');
}));

app.use(route.get('/test', async function (ctx) {
  ctx.body = 'test';
}));

app.listen(3000);
```
or

```
'use strict';

var app = new require('koa')();
var route = require('koa-route');
var koaBody = require('koa-body');
var logger = require('koa-logger');

var forward = require('./');

forward(app, {
  debug: true
});

app.use(logger());
app.use(koaBody());

app.use(route.post('/', async function (ctx) {
  ctx.forward('/test');
}));

app.use(route.post('/test', async function (ctx) {
  ctx.body = 'test';
}));

app.listen(3000);
```

or

```
'use strict';

var app = new require('koa')();
var route = require('koa-route');
var koaBody = require('koa-body');

var forward = require('./');

forward(app, {
  baseUrl: 'http://api.example.com'
});

app.use(koaBody());
app.use(forward.all());// forward all request to 'http://api.example.com'

app.listen(3000);
```

**NB:** If you set content-type to `multipart/form-data` for uploading file, please use `koa-body` and enable `multipart` option.

### Options

see [request](https://github.com/request/request#requestoptions-callback).

### Example

    node --harmony example

### Test

    npm test

### License

MIT