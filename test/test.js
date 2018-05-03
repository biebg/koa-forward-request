'use strict';

const koa = require('koa');
const koaBody = require('koa-body');
const request = require('supertest');
const route = require('koa-route');
const forward = require('../');

describe('test localhost', function () {
  it('should return 200', function (done) {
    const app = new koa();
    forward(app);
    app.use(route.get('/', async function (ctx) {
      ctx.forward('/test');
    }));
    app.use(route.get('/test', async function (ctx) {
      ctx.body = 'test';
    }));

    request(app.callback())
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        if (res.text !== 'test') {
          return done('should return `test`!');
        }
        done();
      });
  });

  it('should return body', function (done) {
    const app = new koa();
    forward(app, {
      debug: true
    });
    app.use(koaBody());
    app.use(route.post('/', async function (ctx) {
      ctx.forward('/test');
    }));
    app.use(route.post('/test', async function (ctx) {
      ctx.body = ctx.request.body;
    }));

    request(app.callback())
      .post('/')
      .send({name: 'nswbmw'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        if (!res.body || res.body.name !== 'nswbmw') {
          return done("should return `{name: 'nswbmw'}`!");
        }
        done();
      });
  });

  it('should return 401', function (done) {
    const app = new koa();
    forward(app);
    app.use(route.get('/', async function (ctx) {
      ctx.forward('/auth');
    }));
    app.use(route.get('/auth', async function (ctx) {
      ctx.throw(401, 'need auth');
    }));

    request(app.callback())
      .get('/')
      .expect(401)
      .end(function (err, res) {
        if (err) return done(err);
        if (!res.text || res.text !== 'need auth') {
          return done("should return `need auth`!");
        }
        done();
      });
  });

  it('should return 404', function (done) {
    const app = new koa();
    forward(app);
    app.use(route.get('/', async function (ctx) {
      ctx.forward('/auth');
    }));
    app.use(route.get('/test', async function (ctx) {
      ctx.throw(401, 'test');
    }));

    request(app.callback())
      .get('/')
      .expect(404)
      .end(done);
  });
});

describe('test remote url', function () {
  it('should return image binary', function (done) {
    const app = new koa();
    forward(app);
    app.use(route.get('/', async function (ctx) {
      ctx.forward('http://github.global.ssl.fastly.net/images/icons/emoji/+1.png?v5', {
        headers: {}
      });
    }));

    request(app.callback())
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        if (!Buffer.isBuffer(res.body)) {
          return done('should return image binary!');
        }
        done();
      });
  });

  it('should forward to http://expressjs.com', function (done) {
    const app = new koa();
    forward(app, {
      baseUrl: 'http://expressjs.com',
      headers: {},
      debug: true
    });
    app.use(forward.all());

    request(app.callback())
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        if (!res.text.match(/Fast, unopinionated, minimalist web framework/)) {
          return done('Not match `Fast, unopinionated, minimalist web framework`');
        }
        done();
      });
  });

  it('should forward to http://expressjs.com/en/guide/routing.html', function (done) {
    const app = new koa();
    forward(app, {
      baseUrl: 'http://expressjs.com',
      headers: {},
      debug: true
    });
    app.use(forward.all());

    request(app.callback())
      .get('/en/guide/routing.html')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        if (!res.text.match(/Express routing/)) {
          return done('Not match `Express routing`');
        }
        done();
      });
  });

  it('should no forward and return body', function (done) {
    const app = new koa();
    app.use(koaBody());

    forward(app, {
      baseUrl: 'http://expressjs.com',
      headers: {},
      debug: true
    });
    app.use(forward.all());
    app.use(async function (ctx) {
      ctx.body = ctx.request.body;
    });

    request(app.callback())
      .post('/guide/routing.html')
      .send({name: 'nswbmw'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        if (res.body.name !== 'nswbmw') {
          return done('Not match name');
        }
        done();
      });
  });

  it('should no forward', function (done) {
    const app = new koa();
    app.use(koaBody());

    forward(app, {
      baseUrl: 'http://expressjs.com',
      headers: {},
      debug: true
    });
    app.use(async function (ctx) {
      ctx.body = ctx.request.body;
    });
    app.use(forward.all());

    request(app.callback())
      .post('/guide/routing.html')
      .send({name: 'nswbmw'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        if (res.body.name !== 'nswbmw') {
          return done('Not match name');
        }
        done();
      });
  });

  it('should return 404', function (done) {
    const app = new koa();
    forward(app, {
      baseUrl: 'http://non-existent-url.com'
    });
    app.use(forward.all());

    request(app.callback())
      .get('/')
      .expect(404)
      .end(done);
  });

  it('should upload file success', function (done) {
    const app1 = new koa();
    forward(app1, {
      baseUrl: 'http://localhost:3001',
      debug: true
    });
    app1.use(koaBody({
      multipart: true
    }));
    app1.use(forward.all());

    const app2 = new koa();
    app2.use(koaBody({
      multipart: true
    }));
    app2.use(async function (ctx) {
      const body = ctx.request.body;
      ctx.body = body.fields.name + '/' + body.files.avatar.name;
    });
    app2.listen(3001);

    request(app1.callback())
      .post('/upload')
      .field('name', 'nswbmw')
      .attach('avatar', __dirname + '/avatar.png')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        if (res.text !== 'nswbmw/avatar.png') {
          return done('res.text should be `nswbmw/avatar.png`');
        }
        done();
      });
  });
});