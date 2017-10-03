'use strict';
var express = require( 'express' );
const spawn = require( 'child_process' ).spawn;

var router = express.Router();

/* webhook POST endpoint */
router.post( '/', function( req, res, next ) {

  var status;
  var output;
    if( req.description && req.description.ok ) {
	/* here's where we do something useful */

	const myShell = spawn ('on-webhook', [req.description.git_ssh_url,
					      req.description.reponame,
					      req.description.event_name,
					      req.description.ref ]);

	myShell.stdout.on('data', function(data) {
	    console.log ('stdout from shell', data.toString('utf8'));
	});
	myShell.stderr.on('data', function(data) {
	    console.log ('stderr from shell', data.toString('utf8'));
	});
        myShell.on('close', function(code){
             console.log ('shell ended with code', code);
        });
	myShell.stdin.write(JSON.stringify(req.description.payload));

	
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
