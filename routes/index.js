var express = require('express');
var router = express.Router();

var db = require('../db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Buswatch',
    subtitle: 'Select a bus series to view the latest in-service information.',
    series: [
      {
        id: '600',
        description: '2020-2022 Proterra BE40 & ZX5'
      },
      {
        id: '700',
        description: '2014 New Flyer XE40'
      },
      {
        id: '1000',
        description: '2006-2009 New Flyer D40LF'
      },
      {
        id: '4000',
        description: '2008 New Flyer DE60LF'
      },
      {
        id: '4300',
        description: '2012 New Flyer D60LFR & DE60LFR'
      },
      {
        id: '7900',
        description: '2014-2019 Nova Bus LFS'
      },
      {
        id: '8350',
        description: '2022-? Nova Bus LFS'
      },
    ]
  });
});


router.get('/buses', function(req, res, next) {
  // check for series param; filter query accordingly
  let whereClause = '';
  
  if (req.query.series) {
    switch (req.query.series) {
        case '600':
        whereClause = 'where vid >= 600 and vid < 700';
        break;
        case '700':
        whereClause = 'where vid >= 700 and vid < 800';
        break;
        case '1000':
        whereClause = 'where vid >= 1000 and vid < 2030';
        break;
        case '4000':
        whereClause = 'where vid >= 4000 and vid < 4208';
        break;
        case '4300':
        whereClause = 'where vid >= 4300 and vid < 4400';
        break;
        case '7900':
        whereClause = 'where vid >= 7900 and vid < 8350';
        break;
        case '8350':
        whereClause = 'where vid >= 8350 and vid < 8949';
        break;
        default:
        break;
    }
  }
  
  let buses = db.query(`select * from buses ${whereClause} order by vid asc`, false);
  
  const options = {
    timeZone: 'America/Chicago',
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "numeric"
  };
  
  buses = buses.map(bus => {
    return {
      ...bus,
      firstSeen: bus.firstSeen ? new Date(bus.firstSeen * 1000).toLocaleString('en-US', options) : '',
      lastSeen: bus.lastSeen ? new Date(bus.lastSeen * 1000).toLocaleString('en-US', options) : '',
    };
  });
  
  res.render('buses', {
    title: `${whereClause !== '' ? req.query.series + '-series' : 'All'} buses`,
    buses
  });
});

module.exports = router;
