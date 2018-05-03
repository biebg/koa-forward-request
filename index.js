'use strict';

const assert = require('assert');
const fs = require('fs');

const request = require('request');
const merge = require('merge-descriptors');
const isUrl = require('is-url');

module.exports = function forwardRequest(app, defaultOptions) {
  defaultOptions = defaultOptions || {};

  app.context.forward = function (url, options) {
    assert('string' === typeof url, 'first parameter must be a url string.');

    options = options || {};
    options = merge(options, defaultOptions, false);

    if (isUrl(url)) {
      options.url = options.url || url;
    } else {
      options.url = options.url || url;
      options.baseUrl = options.baseUrl || this.protocol + '://' + this.host;
    }
    options.method = options.method || this.method;
    delete this.header.host;
    options.headers = options.headers || this.header;
    options.qs = options.qs || this.query;

    switch (this.is('json', 'multipart/form-data', 'urlencoded')) {
    case 'json':
      delete options.headers['content-length'];
      options.body = options.body || this.request.body;
      options.json = true;
      break;
    case 'multipart/form-data':
      const body = this.request.body;
      const files = body.files || {};
      const fields = body.fields || {};
      if (!options.formData) {
        delete options.headers['content-length'];
        options.formData = {};

        Object.keys(files).forEach(function (filename) {
          let file = files[filename];
          if (Array.isArray(file)) {
            options.formData[filename] = file.map(genFormDataFromFile);
          } else {
            options.formData[filename] = genFormDataFromFile(file);
          }
        });
        Object.keys(fields).forEach(function (item) {
          options.formData[item] = fields[item];
        });
      }
      break;
    case 'urlencoded':
      options.form = options.form || this.request.body;
      break;
    default:
      if (!~['HEAD', 'GET', 'DELETE'].indexOf(options.method)) {
        options.body = options.body || this.request.body;
      }
    }
    const self = this;
    self.respond = false;

    if (options.debug) {
      console.log('forward options -> %j', options);
    }

    request(options)
    .on('error', function (err) {
      if (['ENOTFOUND', 'ECONNREFUSED'].indexOf(err.code) !== -1) {
        self.res.statusCode = 404;
        self.res.end();
      } else {
        console.error(err);
        throw err;
      }
    })
    .pipe(self.res);
  };

  module.exports.all = function all (options) {
    assert(defaultOptions.baseUrl, 'use `all()` must set `baseUrl` in options');

    return async function (ctx, next) {
      await next();

      if (ctx.status === 404) {
        ctx.forward(ctx.originalUrl, options);
      }
    };
  };

  return app;
};

function genFormDataFromFile(file) {
  return {
    value: fs.createReadStream(file.path),
    options: {
      filename: file.name,
      contentType: file.type
    }
  };
}
