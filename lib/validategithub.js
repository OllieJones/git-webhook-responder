'use strict';

const crypto = require( 'crypto' );

function validateGithub( secret, signature, rawBody ) {
  if( (!signature) || signature.length === 0 ) return false;
  if( (!rawBody) || rawBody.length === 0 ) return false;

  try {
    const splits = signature.split( '=' );
    if( splits.length > 1 ) {
      /* signature looks like sha1=12345678cafecafefedcba9876543210 */
      const hash   = splits[0];
      const sig    = splits.slice( 1 ).join( '' );
      const hmac   = crypto.createHmac( hash, secret );
      var computed = new Buffer( hmac.update( rawBody, 'utf8' ).digest( 'hex' ) );
      var header   = new Buffer( sig );
      return crypto.timingSafeEqual( computed, header );
    }
    else {
      return false;
    }
  }
  catch( exception ) {
    return false;
  }
}

module.exports = validateGithub;
