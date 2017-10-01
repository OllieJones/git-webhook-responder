'use strict';

/* middleware module to retrieve and validate gitlab transaction descripton if any */

function gitlab( req, res, next ) {

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

      description.ok = true;
    }
  }
  catch( exception ) { /* empty, intentionally */
  }

  next();
};

module.exports = gitlab;


