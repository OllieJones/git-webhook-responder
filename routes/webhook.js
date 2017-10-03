'use strict';
var express = require( 'express' );
const spawn = require( 'child_process' ).spawn;

var router = express.Router();

/* webhook POST endpoint */
router.post( '/', function( req, res, next ) {

  var status;
  var output;
  if( req.description && req.description.ok ) {

    try {
      /* here's where we do something useful */
      var stdout_val = [];
      var stderr_val = [];

      const myShell = spawn( req.description.on_webhook,
                             [req.description.git_ssh_url,
                              req.description.repopath,
                              req.description.reponame,
                              req.description.event_name,
                              req.description.ref] );

      /* send the payload to the spawned shell */
      myShell.stdin.write( JSON.stringify( req.description.payload ) );

      /* gather the results of the spawned shell */
      myShell.stdout.on( 'data', function( data ) {
        stdout_val.push( data.toString( 'utf8' ) );
      } );
      myShell.stderr.on( 'data', function( data ) {
        stderr_val.push( data.toString( 'utf8' ) );
      } );

      /* log the results of the spawned shell */
      myShell.on( 'close', function( code ) {
        var severity = (code === 0) ? 'notice' : 'warning';
        if( code !== 0 ) req.logger.log( severity, req.description.on_webhook + ' exited with ' + code );
        var output = stdout_val.join( '' ).replace( /\s*$/, '' );
        if( output.length >= 0 ) {
          req.logger.log( severity, req.description.on_webhook + ' stdout: ' + output );
        }
        output = stderr_val.join( '' ).replace( /\s*$/, '' );
        if( output.length >= 0 ) {
          req.logger.log( severity, req.description.on_webhook + ' stderr: ' + output );
        }
      } );
    }
    catch( exception ) {
      req.logger.error( 'error trying to spawn command' );
    }

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
