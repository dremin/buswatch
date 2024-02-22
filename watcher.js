const axios = require('axios');
const db = require('./db');
const utils = require('./utils');

let watchInterval;

exports.init = () => {
  watchInterval = setInterval(fetchBusData, process.env.INTERVAL_MIN * 60 * 1000);
  fetchBusData();
}

const fetchBusData = async () => {
  // First, get all routes
  const routes = await getRoutes();
  const vehicles = [];
  const now = db.getDbDateTime();
  
  if (!routes) {
    console.log(`Failed to update bus data at ${new Date()}`);
    return;
  }
  
  // Get each vehicle for each route. A vehicle appears on one route at a time.
  // Chunk up to ten routes per API request.
  for (let i = 0; i < routes.length; i += 10) {
    const routesChunk = routes.slice(i, i + 10);
    const routeVehicles = await getRouteVehicles(routesChunk.join());
    
    for (vehicle in routeVehicles) {
      vehicles.push(routeVehicles[vehicle]);
    }
  }
  
  // Get the current state so that we can compare
  const buses = db.query(`select * from buses order by vid asc`, false);
  
  // Update the database
  for (vehicle in vehicles) {
    const bus = vehicles[vehicle];
    let garage = utils.decodeGarage(bus.tablockid, false);
    
    if (bus.vid < 10) {
      // filter out bogus data
      continue;
    }
    
    const existingBus = buses.find(b => b.vid == bus.vid);
    
    if (existingBus) {
      // check if we should send any change alerts
      if (utils.isOutOfService(now, existingBus.lastSeen, process.env.OUT_OF_SERVICE_ALERT_THRESHOLD_SEC)) {
        await utils.postRevivedBus(bus, existingBus, now);
      }
      // use existing garage if new is missing
      if (!garage) {
        garage = existingBus.garage;
      }
    }
    
    // common case, update existing bus
    const updateResult = db.query('update buses set lastSeen = ?, route = ?, blockid = ?, garage = ?, oosNoted = 0 where vid = ?', true, [ now, bus.rt, bus.tablockid, garage, bus.vid ]);
    
    if (updateResult.changes < 1) {
      // missing row -> new bus!
      db.query('insert into buses (vid, firstSeen, lastSeen, route, blockId, garage, oosNoted) values (?, ?, ?, ?, ?, ?, 0)', true, [ bus.vid, now, now, bus.rt, bus.tablockid, garage ]);
      await utils.postNewBus(bus);
    }
  }
  
  // Detect newly out-of-service buses
  const updatedBuses = db.query(`select * from buses where lastSeen is not null and oosNoted <> 1 order by vid asc`, false);
  for (const bus of updatedBuses) {
    if (utils.isOutOfService(now, bus.lastSeen, process.env.OUT_OF_SERVICE_ALERT_THRESHOLD_SEC)) {
      // Mark as noted in the database so we don't alert again
      const updateResult = db.query('update buses set oosNoted = 1 where vid = ?', true, [ bus.vid ]);
      await utils.postOutOfServiceBus(bus);
    }
  }
  
  console.log(`Updated bus data at ${new Date()}`);
}

const getRoutes = async () => {
  let routes = [];
  const routesResponse = await busTimeRequest('getroutes', {});
  
  routes = routesResponse['bustime-response']?.routes?.map(route => route.rt);
  
  return routes;
}

const getRouteVehicles = async (route) => {
  let vehicles = [];
  const vehiclesResponse = await busTimeRequest('getvehicles', {
    rt: route
  });
  
  vehicles = vehiclesResponse['bustime-response']?.vehicle;
  
  return vehicles;
}

const busTimeRequest = async (endpoint, params) => {
  try {
    const response = await axios.get(`https://ctabustracker.com/bustime/api/v2/${endpoint}`, {
      params: {
        key: process.env.API_KEY,
        format: 'json',
        ...params
      }
    });
    
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
  }
  
  return {};
}