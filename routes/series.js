var express = require('express');
var router = express.Router();

var db = require('../db');
var utils = require('../utils');

router.get('/:series/:filter?', function(req, res, next) {
  const now = db.getDbDateTime();
  const oosTitle = `${utils.secondsToTitleStr(process.env.OUT_OF_SERVICE_THRESHOLD_SEC, true)} out of service`;
  const staleTitle = `${utils.secondsToTitleStr(process.env.STALE_THRESHOLD_SEC, true)} out of service`;
  
  let allowColor = true;
  let filter = 'all';
  let series;
  let title = 'All buses';
  let whereClause = '';
  
  if (!req.params.series.startsWith('all')) {
    series = utils.series.find(busSeries => busSeries.id === req.params.series);
  }
  
  if (series) {
    whereClause = `where vid >= ${series.min} and vid <= ${series.max}`;
    title = `${series.id}-series buses`;
  } else if (req.params.series !== 'all') {
    title = 'All buses by series';
  }
  
  if (req.params.filter) {
    filter = req.params.filter;
  }
  
  switch (req.params.filter) {
    case 'in-service':
    allowColor = false;
    whereClause = `${whereClause !== '' ? whereClause + ' and' : 'where'} ${now} - lastSeen < ${process.env.IN_SERVICE_THRESHOLD_SEC}`;
    title = `${title} currently in service`;
    break;
    case 'active':
    whereClause = `${whereClause !== '' ? whereClause + ' and' : 'where'} ${now} - lastSeen < ${process.env.STALE_THRESHOLD_SEC}`;
    title = `${title} not out of service`;
    break;
    case 'out-of-service':
    allowColor = false;
    whereClause = `${whereClause !== '' ? whereClause + ' and' : 'where'} (${now} - lastSeen > ${process.env.OUT_OF_SERVICE_THRESHOLD_SEC} or lastSeen is null)`;
    title = `${title} ${oosTitle}`;
    break;
    case 'stale':
    whereClause = `${whereClause !== '' ? whereClause + ' and' : 'where'} (${now} - lastSeen > ${process.env.STALE_THRESHOLD_SEC} or lastSeen is null)`;
    title = `${title} ${staleTitle}`;
    break;
    case 'note':
    whereClause = `${whereClause !== '' ? whereClause + ' and' : 'where'} note is not null and note != ''`;
    title = `${title} with notes`;
    break;
    default:
    if (series) {
      title = `All ${title}`;
    }
    break;
  }
  
  let buses = db.query(`select * from buses ${whereClause} order by vid asc`, false);
  
  const renderOptions = {
    title,
    oosTitle,
    staleTitle,
    showFilters: true,
    filter,
  };
  
  if (series) {
    buses = utils.mapBusDisplay(buses, allowColor, now);
    res.render('buses', {
      ...renderOptions,
      filterTitle: `${series.id}-series`,
      buses,
      totalCount: buses.length,
      thisUrl: `/series/${series.id}`,
      backUrl: filter !== 'all' ? `/series/${series.id}` : '/',
    });
  } else if (req.params.series === 'all') {
    buses = utils.mapBusDisplay(buses, allowColor, now);
    res.render('buses', {
      ...renderOptions,
      filterTitle: `All`,
      buses,
      totalCount: buses.length,
      thisUrl: `/series/all`,
      backUrl: filter !== 'all' ? `/series/all` : '/',
    });
  } else {
    const busSeries = utils.mapBusSeries(buses, allowColor, now);
    res.render('buses-split', {
      ...renderOptions,
      filterTitle: `All`,
      showRoute: true,
      showGarage: true,
      busSeries,
      totalCount: busSeries.reduce((acc, cur) => acc + cur.busCount, 0),
      thisUrl: `/series/all-series`,
      backUrl: filter !== 'all' ? `/series/all-series` : '/',
    });
  }
});

module.exports = router;
