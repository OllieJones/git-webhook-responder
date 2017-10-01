'use strict';
var express = require( 'express' );
const spawn = require( 'child_process' ).spawn;

var router = express.Router();

/* webhook POST endpoint */
router.post( '/', function( req, res, next ) {

  if( req.description && req.description.ok ) {
    /* do something useful */
  }

  res.send( JSON.stringify( req.description, null, 2 ) );
} );

module.exports = router;
