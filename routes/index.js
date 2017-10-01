var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render( 'index', {title: 'Express', method: req.method, cookies: JSON.stringify( req.cookies, null, 2 )} );
});

module.exports = router;
