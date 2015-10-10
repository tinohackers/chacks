var connect = require('connect');
var serve_static = require('serve-static');
connect().use(serve_static('../')).listen(8080);
