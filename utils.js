const axios = require('axios');

exports.series = [
  {
    id: '600',
    description: '2020-2022 Proterra BE40 & ZX5',
    min: 600,
    max: 699
  },
  {
    id: '700',
    description: '2014 New Flyer XE40',
    min: 700,
    max: 799
  },
  {
    id: '1000',
    description: '2006-2009 New Flyer D40LF',
    min: 1000,
    max: 2029
  },
  {
    id: '4000',
    description: '2008 New Flyer DE60LF',
    min: 4000,
    max: 4207
  },
  {
    id: '4300',
    description: '2012 New Flyer DE60LFR & D60LFR',
    min: 4300,
    max: 4399
  },
  {
    id: '7900',
    description: '2014-2019 Nova Bus LFS',
    min: 7900,
    max: 8349
  },
  {
    id: '8350',
    description: '2022-? Nova Bus LFS',
    min: 8350,
    max: 8949
  },
];

exports.decodeGarage = (blockId, expand) => {
  const dashIndex = blockId.indexOf('-');
  
  if (dashIndex < 0 || blockId.length < 2) {
    return 'Unknown';
  }
  
  const encodedGarage = blockId.substring(dashIndex + 1, dashIndex + 2);
  let garage = '';
  let expandedGarage = '';
  
  // use block id to determine garage
  switch (encodedGarage) {
      case '1':
      garage = '3';
      expandedGarage = '103rd';
      break;
      case '2':
      garage = 'K';
      expandedGarage = 'Kedzie';
      break;
      case '3':
      garage = 'A';
      expandedGarage = 'Archer';
      break;
      case '4':
      garage = 'F';
      expandedGarage = 'Forest Glen';
      break;
      case '5':
      garage = 'P';
      expandedGarage = 'North Park';
      break;
      case '6':
      garage = '6';
      expandedGarage = '74th';
      break;
      case '7':
      garage = '7';
      expandedGarage = '77th';
      break;
      case '8':
      garage = 'C';
      expandedGarage = 'Chicago';
      break;
      default:
      break;
  }
  
  return expand ? expandedGarage : garage;
}

exports.epochToDisplay = (epoch) => {
  const options = {
    timeZone: 'America/Chicago',
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "numeric"
  };
  
  if (!epoch) {
    return '';
  }
  
  const date = new Date(epoch * 1000);
  
  if ((date.getUTCHours() === 5 || date.getUTCHours() === 6) && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
    // Exactly midnight just means incomplete data
    delete options.hour;
    delete options.minute;
  }
  
  return date.toLocaleString('en-US', options);
}

exports.isInService = (now, lastSeen) => {
  if (!lastSeen) {
    return false;
  }
  
  return now - lastSeen < process.env.IN_SERVICE_THRESHOLD_SEC;
}

exports.isOutOfService = (now, lastSeen) => {
  if (!lastSeen) {
    return true;
  }
  
  return now - lastSeen > process.env.OUT_OF_SERVICE_THRESHOLD_SEC;
}

exports.postNewBus = async (bus) => {
  if (!process.env.NEW_BUS_WEBHOOK_URL) {
    return;
  }
  
  const body = {
    content: `**New bus detected!** Bus **${bus.vid}** has entered service on route **${bus.rt}** out of **${exports.decodeGarage(bus.tablockid, true)}** garage (Block ID: ${bus.tablockid})`
  }
  
  const webhookUrls = process.env.NEW_BUS_WEBHOOK_URL.split(';');
  
  for (urlIndex in webhookUrls) {
    try {
      await axios.post(webhookUrls[urlIndex], body);
    } catch (error) {
      console.log('Error posting to webhook', error);
    }
  }
}