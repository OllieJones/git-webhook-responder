'use strict';
var express = require( 'express' );
const spawn = require( 'child_process' ).spawn;

var router = express.Router();

/* webhook POST endpoint */
router.post( '/', function( req, res, next ) {

  var status;
  var output;
  if( req.description && req.description.ok ) {
    status = 200;
    if( req.query.describe ) {
      req.description.status  = status;
      req.description.message = 'ok.';
      output                  = JSON.stringify( req.description, null, 2 );
    }
    else output = JSON.stringify( {ok: true, status: 200, message: 'ok.'} );
  }
  else {
    status = 404;
    output = JSON.stringify( {ok: false, status: status, message: 'Not found.'} );
  }

  res.status( status ).send( output );
} );

module.exports = router;
