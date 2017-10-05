'use strict';

const crypto = require( 'crypto' );
/* middleware module to retrieve and validate gitlab transaction descripton if any */

function gitlab( req, res, next ) {

  /* do we have any gitlab webhooks configured? (properties: webhook.gitlab.x.reponame etc */
  if( req.settings.gitlab ) {
    var description = {};
    try {
      description.method = req.method;
      if( req.headers['x-gitlab-token'] && req.bodyJSON ) {
        const payload             = req.bodyJSON;
        const unk                 = '--unknown--';
        description.origin        = 'gitlab';
        description.signature     = req.headers['x-gitlab-token'];
        description.event         = req.headers['x-gitlab-event'] || unk;
        description.event_name    = payload.event_name || unk;
        description.reponame      = (  payload.project && payload.project.name ) || unk;
        description.repopath      = (  payload.project && payload.project.path_with_namespace ) || unk;
        description.git_ssh_url   = (  payload.project && payload.project.ssh_url ) || '';
        description.git_https_url = (  payload.project && payload.project.http_url ) || '';
        /* this looks like refs/heads/branch */
        description.ref = payload.ref || unk;

        /* now that we've extracted useful data from the payload, l
         * look for a matching configuration.
         */
        var matched = false;
        for( var key in req.settings.gitlab ) {
          if( req.settings.gitlab.hasOwnProperty( key ) ) {
            var item = req.settings.gitlab[key];

            if( item ) {
              var secretBuff    = new Buffer( item.secret );
              var signatureBuff = new Buffer( description.signature );
              if( item.repopath === description.repopath &&
                  crypto.timingSafeEqual( secretBuff, signatureBuff ) &&
                  item.ref === description.ref ) {
                matched                = true;
                description.ok         = true;
                description.payload    = payload;
                description.on_webhook = item.on_webhook || 'on-webhook';
                req.description        = description;
                break;
              }
            }
          }
        }
        if( !matched ) req.logger.warning( 'rejected webhook from gitlab', req.bodyJSON.event_name,
                                           req.bodyJSON.project.path_with_namespace );
        else req.logger.notice( 'webhook from gitlab', req.bodyJSON.event_name,
                                req.bodyJSON.project.path_with_namespace );
      }
    }
    catch( exception ) {
      logger.warn( 'exception processing gitlab signature', exception );
    }
  }
  next();
};

module.exports = gitlab;


