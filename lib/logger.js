'use strict';

/* handle logging */
const winston = require( 'winston' );
let syslog;
try {
  syslog = require( 'winston-syslog-posix' );
}
catch (exception) { /* empty, intentionally */ }

const moment = require( 'moment' );

function makeLogger( config ) {
  const level = config.logLevel || 'info';
  const facility = config.logFacility || 'local1';
  const identity = config.logApplicationName || 'VServer';
  const forceConsoleLogger = config.logForceConsole || false;
  let transports = [];
  function formatter (options) {
    // Return string will be passed to logger.
    return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (options.message ?
                                                                            options.message :
                                                                            '') +
        (options.meta && Object.keys( options.meta ).length ?
         '\n\t' + JSON.stringify( options.meta ) : '' );
  }

  if( syslog ) {
    /* we have syslog. use it. */
    const log = new (winston.transports.SyslogPosix)(
        {
          level:     level,
          facility: facility,
          identity: identity,
          timestamp: function() {
            return moment().format();
          },
          formatter: formatter
        } );
    transports.push( log );
  }
  if (transports.length === 0 || forceConsoleLogger ) {
    /* no syslog. use console. */
    const console  = new (winston.transports.Console)(
        {
          level:     level,
          identity: identity,
          timestamp: function() {
            return moment().format();
          },
          formatter: formatter
        } );
    transports.push( console );
  }

  const logger = new (winston.Logger)(
      {
        transports: transports
      } );
  /* use rfc5424 log levels:
   * emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7
   */
  logger.setLevels (winston.config.syslog.levels);
  return logger;
}

module.exports = makeLogger;