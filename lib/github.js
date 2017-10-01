'use strict';

var crypto = require( 'crypto' );

/* middleware module to retrieve and validate github transaction description if any */

function github( req, res, next ) {

  var description;
  if( req.description ) {
    description = req.description;
  }
  else {
    var description = {};
    req.description = description;
  }
  try {
    description.method = req.method;
    if( req.body.commits && req.headers['x-hub-signature'] ) {
      const unk                 = '--unknown--';
      description.origin        = 'github';
      description.signature     = req.headers['x-hub-signature'];
      description.event         = 'Github push';
      description.event_name    = 'push';
      description.reponame      = (  req.body.repository && req.body.repository.full_name ) || unk;
      description.git_ssh_url   = (  req.body.repository && req.body.repository.ssh_url ) || '';
      description.git_https_url = (  req.body.repository && req.body.repository.clone_url ) || '';
      description.ref           = req.body.ref || unk;
    }

    if( signature && signature.length > 0 ) {

      //TODO the incoming sig says hash=12345cafe6
      // we should use the hash identified.
      var hmac = crypto.createHmac( 'sha1', 'secret' );
      hmac.update( req.body, 'utf-8' );

      if( hmac == signature ) description.ok = true;
    }
  }
  catch( exception ) { /* empty, intentionally */
  }

  next();
};

module.exports = github;


