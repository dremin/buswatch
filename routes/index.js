var express = require('express');
var router = express.Router();

var db = require('../db');
var utils = require('../utils');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Buswatch',
    subtitle: 'Select a bus series to view the latest in-service information.',
    series: utils.series
  });
});


router.get('/buses', function(req, res, next) {
  const now = db.getDbDateTime();
  
  let title = 'All buses';
  let whereClause = '';
  
  if (req.query.series) {
    const series = utils.series.find(busSeries => busSeries.id === req.query.series);
    
    if (series) {
      whereClause = `where vid >= ${series.min} and vid <= ${series.max}`;
      title = `${series.id}-series buses`;
    }
  }
  
  if (req.query.filter) {
    switch (req.query.filter) {
      case 'in-service':
      whereClause = `${whereClause !== '' ? whereClause + ' and' : 'where'} ${now} - lastSeen < ${process.env.IN_SERVICE_THRESHOLD_SEC}`;
      title = `${title} currently in service`;
      break;
    }
  }
  
  let buses = db.query(`select * from buses ${whereClause} order by vid asc`, false);
  
  buses = buses.map(bus => {
    return {
      ...bus,
      firstSeen: utils.epochToDisplay(bus.firstSeen),
      lastSeen: utils.epochToDisplay(bus.lastSeen),
      isInService: utils.isInService(now, bus.lastSeen),
      isOutOfService: utils.isOutOfService(now, bus.lastSeen),
    };
  });
  
  res.render('buses', {
    title,
    buses
  });
});

module.exports = router;
