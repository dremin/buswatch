var express = require('express');
var router = express.Router();

var utils = require('../utils');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Buswatch',
    subtitle: 'Select a CTA bus series to view the latest service information.',
    updateFreq: `Data is updated every ${process.env.INTERVAL_MIN} ${process.env.INTERVAL_MIN !== '0' ? 'minutes' : 'minute'}.`,
    series: utils.series
  });
});

module.exports = router;
