'use strict';

var crypto = require( 'crypto' );

/* middleware module to retrieve and validate github transaction description if any */

function github( req, res, next ) {

  console.log( req.headers['x-hub-signature'] );
  console.log( req.body.toString() );

  /* do we have any github webhooks configured? (properties: webhook.github.x.reponame etc */
  if( req.settings.github ) {

    var description = {};
    try {
      description.method = req.method;
      if( req.bodyJSON ) {
        const payload = req.bodyJSON;
        const unk     = '--unknown--';
        if( payload.commits && req.headers['x-hub-signature'] ) {
          description.origin        = 'github';
          description.signature     = req.headers['x-hub-signature'];
          description.event         = 'Github push';
          description.event_name    = 'push';
          description.repopath      = (  payload.repository && payload.repository.full_name ) || unk;
          description.reponame      = (  payload.repository && payload.repository.name ) || unk;
          description.git_ssh_url   = (  payload.repository && payload.repository.ssh_url ) || '';
          description.git_https_url = (  payload.repository && payload.repository.clone_url ) || '';
          description.ref           = payload.ref || unk;
        }

        var matched = false;
        for( var key in req.settings.github ) {
          if( req.settings.github.hasOwnProperty( key ) ) {
            var item = req.settings.github[key];

            if( item ) {
              if( item.reponame === description.reponame &&
                  item.ref === description.ref ) {

                var valid = validateGithub( item.secret, description.signature, req.body );
                if( valid ) {
                  description.on_webhook = item.on_webhook || 'on-webhook';
                  description.ok         = true;
                  req.description        = description;
                  req.logger.info( 'match', key, description.reponame, description.ref );
                  break;
                }
              }
            }
          }
        }
        if( !matched ) req.logger.warning( 'rejected webhook from github', req.bodyJSON.event_name,
                                           req.bodyJSON.project.path_with_namespace );
        else req.logger.notice( 'webhook from github', req.bodyJSON.event_name,
                                req.bodyJSON.project.path_with_namespace );

      }
    }
    catch( exception ) {
      logger.warning( 'exception processing github signature', exception );
    }
  }
  next();
}
module.exports = github;


