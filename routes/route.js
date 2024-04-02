var express = require('express');
var router = express.Router();

var db = require('../db');
var utils = require('../utils');

router.get('/', function(req, res, next) {
  const now = db.getDbDateTime();
  
  let title = 'Routes';
  
  let buses = db.query(`select * from buses where lastSeen >= ${now - process.env.IN_SERVICE_THRESHOLD_SEC} order by vid asc`, false);
  let routes = db.query(`select * from routes`, false);
  
  for (const route of routes) {
    route.busCount = buses.filter(bus => bus.route == route.route).length;
  }
  
  routes = routes.filter(route => route.busCount > 0).sort((a, b) => a.route.replace(/\D/g,'') > b.route.replace(/\D/g,''));
  
  res.render('routes', {
    title,
    routes,
    subtitle: `Routes are shown only if there are buses currently in service on that route.`,
    backUrl: '/',
  });
});

router.get('/:route', function(req, res, next) {
  const now = db.getDbDateTime();
  
  let route = db.query(`select * from routes where route = ?`, false, [ req.params.route ]);
  if (route.length > 0) {
    route = route[0];
  } else {
    route = {
      route: 'Unknown',
      name: 'Unknown',
    }
  }
  
  let title = `Route ${route.route}: ${route.name}`;
  
  const buses = db.query(`select * from buses where route = ? and lastSeen >= ? order by vid asc`, false, [ route.route, now - process.env.IN_SERVICE_THRESHOLD_SEC ]);
  const busSeries = utils.mapBusSeries(buses, false, now);
  
  res.render('buses-split', {
    title,
    showFilters: false,
    showRoute: false,
    showGarage: true,
    busSeries,
    totalCount: busSeries.reduce((acc, cur) => acc + cur.busCount, 0),
    thisUrl: `/route/${req.params.route}`,
    backUrl: '/route/',
  });
});

module.exports = router;
