var express = require('express');
var router = express.Router();

var db = require('../db');
var utils = require('../utils');

router.get('/', function(req, res, next) {
  const now = db.getDbDateTime();
  
  let title = 'Garage rosters';
  
  let buses = db.query(`select * from buses where lastSeen >= ${now - process.env.OUT_OF_SERVICE_ROSTER_THRESHOLD_SEC} order by vid asc`, false);
  
  let garages = [];
  
  for (const g of utils.garages) {
    let garage = { ...g };
    garage.busCount = buses.filter(bus => bus.garage == garage.sticker).length;
    garages.push(garage);
  }
  
  res.render('garages', {
    title,
    garages,
    subtitle: `To improve accuracy, only buses in service within the last ${utils.secondsToTitleStr(process.env.OUT_OF_SERVICE_ROSTER_THRESHOLD_SEC, false)} are listed.`,
    backUrl: '/',
  });
});

router.get('/:sticker/:filter?', function(req, res, next) {
  const now = db.getDbDateTime();
  const oosTitle = `${utils.secondsToTitleStr(process.env.OUT_OF_SERVICE_THRESHOLD_SEC, true)} out of service`;
  const staleTitle = `${utils.secondsToTitleStr(process.env.STALE_THRESHOLD_SEC, true)} out of service`;
  
  const garage = { ...utils.garages.find(g => g.sticker == req.params.sticker) };
  
  let allowColor = true;
  let filter = 'all';
  let title = `${garage.name} Garage`;
  let whereClause = `where garage = '${garage.sticker}' and lastSeen >= ${now - process.env.OUT_OF_SERVICE_ROSTER_THRESHOLD_SEC}`;
  
  if (req.params.filter) {
    filter = req.params.filter;
  }
  
  switch (req.params.filter) {
    case 'in-service':
    allowColor = false;
    whereClause = `${whereClause} and ${now} - lastSeen < ${process.env.IN_SERVICE_THRESHOLD_SEC}`;
    title = `${garage.name} buses currently in service`;
    break;
    case 'out-of-service':
    allowColor = false;
    whereClause = `${whereClause} and (${now} - lastSeen > ${process.env.OUT_OF_SERVICE_THRESHOLD_SEC} or lastSeen is null)`;
    title = `${garage.name} buses ${oosTitle}`;
    break;
    case 'stale':
    whereClause = `${whereClause} and (${now} - lastSeen > ${process.env.STALE_THRESHOLD_SEC} or lastSeen is null)`;
    title = `${garage.name} buses ${staleTitle}`;
    break;
    case 'note':
    whereClause = `${whereClause} and note is not null and note != ''`;
    title = `${garage.name} buses with notes`;
    break;
  }
  
  const buses = db.query(`select * from buses ${whereClause} order by vid asc`, false);
  const busSeries = utils.mapBusSeries(buses, allowColor, now);
  
  res.render('buses-split', {
    title,
    oosTitle,
    staleTitle,
    filterTitle: garage.name,
    showFilters: true,
    showRoute: true,
    showGarage: false,
    filter,
    busSeries,
    totalCount: busSeries.reduce((acc, cur) => acc + cur.busCount, 0),
    thisUrl: `/garage/${garage.sticker}`,
    backUrl: filter !== 'all' ? `/garage/${garage.sticker}` : '/garage/',
  });
});

module.exports = router;
