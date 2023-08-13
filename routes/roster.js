var express = require('express');
var router = express.Router();

var db = require('../db');
var utils = require('../utils');

router.get('/', function(req, res, next) {
  const now = db.getDbDateTime();
  
  let title = 'Garage rosters';
  
  let buses = db.query(`select * from buses order by vid asc`, false);
  
  let garages = [];
  
  for (const g of utils.garages) {
    let garage = { ...g };
    garage.busCount = buses.filter(bus => bus.garage == garage.sticker).length;
    garages.push(garage);
  }
  
  res.render('roster', {
    title,
    garages,
    backUrl: '/',
  });
});

router.get('/:sticker', function(req, res, next) {
  const now = db.getDbDateTime();
  
  let buses = db.query(`select * from buses order by vid asc`, false);
  
  let garage = { ...utils.garages.find(g => g.sticker == req.params.sticker), series: [ ...utils.series ] };
  
  for (const s in garage.series) {
    garage.series[s].buses = buses.filter(bus => bus.garage == garage.sticker && bus.vid >= garage.series[s].min && bus.vid <= garage.series[s].max).map(bus => {
      return {
        ...bus,
        firstSeen: utils.epochToDisplay(bus.firstSeen),
        lastSeen: utils.epochToDisplay(bus.lastSeen),
        isInService: utils.isInService(now, bus.lastSeen),
        isOutOfService: utils.isOutOfService(now, bus.lastSeen),
      };
    });
    garage.series[s].busCount = garage.series[s].buses.length;
  }
  garage.busCount = garage.series.reduce((acc, cur) => acc + cur.busCount, 0);
  
  res.render('roster-series', {
    title: `${garage.name} garage`,
    garage,
    backUrl: '/roster/',
  });
});

module.exports = router;
