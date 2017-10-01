'use strict';

const config     = require( 'config' );
const properties = require( 'properties' );

var settings        = config.get( 'webhook' );
global.serverConfig = settings.ServerConfig;

var express      = require( 'express' );
var path         = require( 'path' );
var favicon      = require( 'serve-favicon' );
var logger       = require( './lib/logger.js' )( settings );
global.logger    = logger;
var morgan       = require( 'morgan' );
var cookieParser = require( 'cookie-parser' );
var bodyParser   = require( 'body-parser' );

var index = require( './routes/index' );
var users = require( './routes/users' );

var app = express();

app.disable( 'x-powered-by' );
/* trust a local reverse proxy like nginx, to get originating addresses */
app.set( 'trust proxy', 'loopback' );

// view engine setup
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'pug' );
app.use( favicon( path.join( __dirname, 'public', 'favicon.ico' ) ) );

/* web request logging */
app.use( morgan(
    (config.webLogFormat || 'combined'),
    {
      stream: {
        write: function writeWebLog( str ) {
          logger.log( (config.webLogLevel || 'info'), str.replace( /\s*$/, '' ) );
        }
      }
    } ) );

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( {extended: false} ) );
app.use( cookieParser() );
app.use( express.static( path.join( __dirname, 'public' ) ) );

app.use( '/', index );
app.use( '/users', users );

// catch 404 and forward to error handler
app.use( function( req, res, next ) {
  var err    = new Error( 'Not Found' );
  err.status = 404;
  next( err );
} );

// error handler
app.use( function( err, req, res, next ) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error   = req.app.get( 'env' ) === 'development' ? err : {};

  // render the error page
  res.status( err.status || 500 );
  res.render( 'error' );
} );

module.exports = app;
