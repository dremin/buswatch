var express = require('express');
var router = express.Router();

var db = require('../db');
var utils = require('../utils');

router.get('/:series/:filter', function(req, res, next) {
  const now = db.getDbDateTime();
  
  let allowColor = false;
  let filter;
  let series;
  let title = 'All buses';
  let whereClause = '';
  
  if (req.params.series !== 'all') {
    series = utils.series.find(busSeries => busSeries.id === req.params.series);
  }
  
  if (series) {
    whereClause = `where vid >= ${series.min} and vid <= ${series.max}`;
    title = `${series.id}-series buses`;
  }
  
  if (req.params.filter) {
    filter = req.params.filter;
  }
  
  switch (req.params.filter) {
    case 'in-service':
    whereClause = `${whereClause !== '' ? whereClause + ' and' : 'where'} ${now} - lastSeen < ${process.env.IN_SERVICE_THRESHOLD_SEC}`;
    title = `${title} currently in service`;
    break;
    case 'out-of-service':
    whereClause = `${whereClause !== '' ? whereClause + ' and' : 'where'} (${now} - lastSeen > ${process.env.OUT_OF_SERVICE_THRESHOLD_SEC} or lastSeen is null)`;
    title = `${title} 1+ month out of service`;
    break;
    default:
    allowColor = true;
    filter = 'all';
    if (series) {
      title = `All ${title}`;
    }
    break;
  }
  
  let buses = db.query(`select * from buses ${whereClause} order by vid asc`, false);
  
  buses = buses.map(bus => {
    return {
      ...bus,
      firstSeen: utils.epochToDisplay(bus.firstSeen),
      lastSeen: utils.epochToDisplay(bus.lastSeen),
      isInService: allowColor && utils.isInService(now, bus.lastSeen),
      isOutOfService: allowColor && utils.isOutOfService(now, bus.lastSeen),
    };
  });
  
  res.render('buses', {
    title,
    buses,
    backUrl: series ? filter !== 'all' ? `/series/${series.id}/all` : '/' : '/',
    filter,
    series
  });
});

module.exports = router;
