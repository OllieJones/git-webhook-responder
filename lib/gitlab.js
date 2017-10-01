'use strict';

/* middleware module to retrieve and validate gitlab transaction descripton if any */

function gitlab( req, res, next ) {

  /* do we have any gitlab webhooks rigged? (properties: webhook.gitlab.x.reponame etc */
  if( req.settings.gitlab ) {
    var description = {};
    try {
      description.method = req.method;
      if( req.headers['x-gitlab-token'] ) {
        const unk                 = '--unknown--';
        description.origin        = 'gitlab';
        description.signature     = req.headers['x-gitlab-token'];
        description.event         = req.headers['x-gitlab-event'] || unk;
        description.event_name    = req.body.event_name || unk;
        description.reponame      = (  req.body.project && req.body.project.path_with_namespace ) || unk;
        description.git_ssh_url   = (  req.body.project && req.body.project.ssh_url ) || '';
        description.git_https_url = (  req.body.project && req.body.project.http_url ) || '';
        description.ref           = req.body.ref || unk;
        /* todo how does this relate to branch ??*/

        var matched = false;
        for( var key in req.settings.gitlab ) {
          if( req.settings.gitlab.hasOwnProperty( key ) ) {
            var item = req.settings.gitlab[key];

            if( item ) {
              if( item.reponame === description.reponame &&
                  item.secret === description.signature &&
                  item.ref === description.ref ) {
                matched         = true;
                description.ok  = true;
                req.description = description;
                req.logger.info( 'match', key, description.reponame, description.ref );
                break;
              }
            }
          }
        }
        if( !matched ) req.logger.warning( 'rejected webhook from gitlab', req.body.event_name,
                                           req.body.project.path_with_namespace );
        else req.logger.notice( 'webhook from gitlab', req.body.event_name, req.body.project.path_with_namespace );
      }
    }
    catch( exception ) {
      /* empty, intentionally */
    }
  }
  next();
};

module.exports = gitlab;


