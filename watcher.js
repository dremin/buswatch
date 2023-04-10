const axios = require('axios');
const db = require('./db');

let watchInterval;

exports.init = () => {
  watchInterval = setInterval(fetchBusData, process.env.INTERVAL_MIN * 60 * 1000);
  fetchBusData();
}

const decodeGarage = (blockId) => {
  const dashIndex = blockId.indexOf('-');
  
  if (dashIndex < 0 || blockId.length < 2) {
    return 'Unknown';
  }
  
  const encodedGarage = blockId.substring(dashIndex + 1, dashIndex + 2);
  let garage = encodedGarage;
  
  // use block id to determine garage
  switch (encodedGarage) {
      case '1':
      garage = '3';
      break;
      case '2':
      garage = 'K';
      break;
      case '3':
      garage = 'A';
      break;
      case '4':
      garage = 'F';
      break;
      case '5':
      garage = 'P';
      break;
      case '6':
      garage = '6';
      break;
      case '7':
      garage = '7';
      break;
      case '8':
      garage = 'C';
      break;
      default:
      garage = 'Unknown';
      break;
  }
  
  return garage;
}

const fetchBusData = async () => {
  // First, get all routes
  const routes = await getRoutes();
  const vehicles = [];
  
  // Get each vehicle for each route. A vehicle appears on one route at a time.
  // Chunk up to ten routes per API request.
  for (let i = 0; i < routes.length; i += 10) {
    const routesChunk = routes.slice(i, i + 10);
    const routeVehicles = await getRouteVehicles(routesChunk.join());
    
    for (vehicle in routeVehicles) {
      vehicles.push(routeVehicles[vehicle]);
    }
  }
  
  // Update the database
  for (vehicle in vehicles) {
    const bus = vehicles[vehicle];
    const garage = decodeGarage(bus.tablockid);
    
    // vid, firstSeen, lastSeen, route, blockid, garage
    db.query(`insert into buses values (${bus.vid}, '${db.getDbDateTime()}', '${db.getDbDateTime()}', '${bus.rt}', '${bus.tablockid}', '${garage}') on conflict(vid) do update set lastSeen = '${db.getDbDateTime()}', route = '${bus.rt}', blockid = '${bus.tablockid}', garage = '${garage}' where vid = ${bus.vid}`, true);
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