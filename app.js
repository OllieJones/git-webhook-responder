'use strict';

const config     = require( 'config' );
const properties = require( 'properties' );

var settings        = config.get( 'webhook' );
global.serverConfig = settings.ServerConfig;

var express          = require( 'express' );
var path             = require( 'path' );
var favicon          = require( 'serve-favicon' );
var logger           = require( './lib/logger' )( settings );
global.logger        = logger;
var morgan           = require( 'morgan' );
var cookieParser     = require( 'cookie-parser' );
var bodyParser       = require( 'body-parser' );
const lessMiddleware = require( 'less-middleware' );
var index            = require( './routes/index' );
var webhook          = require( './routes/webhook' );

var app = express();

app.disable( 'x-powered-by' );
/* trust a local reverse proxy like nginx, to get originating addresses */
app.set( 'trust proxy', 'loopback' );

// view engine setup
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'pug' );
app.use( favicon( path.join( __dirname, 'public', 'favicon.ico' ) ) );

/* request adornment */
app.use(
    function( req, res, next ) {
      req.settings = settings;
      req.logger   = logger;
      next();
    }
);

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


app.use( bodyParser.urlencoded( {extended: false} ) );
/* parse to raw and then to JSON so we can do HMAC correctly on github body data */
//app.use( bodyParser.json() );
app.use( bodyParser.raw( {type: '*/*'} ) );
app.use( function( req, res, next ) {
  try {
    req.bodyJSON = JSON.parse( req.body );
  }
  catch( exception ) {
    if( req.bodyJSON ) delete req.bodyJSON;
  }
  next();
} );
app.use( cookieParser() );
app.use( lessMiddleware( path.join( __dirname, 'public' ) ) );
app.use( express.static( path.join( __dirname, 'public' ) ) );

app.use( require( './lib/gitlab' ) );
app.use( require( './lib/github' ) );

app.use( '/', index );
app.use( '/webhook', webhook );

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
