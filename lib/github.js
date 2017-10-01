'use strict';

var crypto = require( 'crypto' );

/* middleware module to retrieve and validate github transaction description if any */

function github( req, res, next ) {

  var description = {};
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

    for( var key in req.settings.github ) {
      if( req.settings.github.hasOwnProperty( key ) ) {
        var item = req.settings.github[key];

        if( item ) {
          if( item.reponame === description.reponame &&
              item.ref === description.ref ) {

            if( false /* TODO validate the signature */ ) {
              description.ok  = true;
              req.description = description;
              req.logger.info( 'match', key, description.reponame, description.ref );
              break;
            }
          }
        }
      }
    }
  }
  catch( exception ) { /* empty, intentionally */
  }

  next();
};

module.exports = github;


