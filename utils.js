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
    description: '2005-2008 New Flyer D40LF',
    min: 1000,
    max: 2029
  },
  {
    id: '4000',
    description: '2008-2009 New Flyer DE60LF',
    min: 4000,
    max: 4207
  },
  {
    id: '4300',
    description: '2012-2013 New Flyer DE60LFR & D60LFR',
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
    description: '2022-2025 Nova Bus LFS',
    min: 8350,
    max: 8949
  },
];

exports.garages = [
  {
    encoded: '1',
    sticker: '3',
    name: '103rd',
  },
  {
    encoded: '2',
    sticker: 'K',
    name: 'Kedzie',
  },
  {
    encoded: '4',
    sticker: 'F',
    name: 'Forest Glen',
  },
  {
    encoded: '5',
    sticker: 'P',
    name: 'North Park',
  },
  {
    encoded: '6',
    sticker: '6',
    name: '74th',
  },
  {
    encoded: '7',
    sticker: '7',
    name: '77th',
  },
  {
    encoded: '8',
    sticker: 'C',
    name: 'Chicago',
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
  const decoded = exports.garages.find(g => g.encoded == encodedGarage);
  
  if (decoded) {
    garage = decoded.sticker;
    expandedGarage = decoded.name;
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

exports.isOutOfService = (now, lastSeen, override) => {
  if (!lastSeen) {
    return true;
  }
  
  if (override) {
    return now - lastSeen > override;
  }
  
  return now - lastSeen > process.env.OUT_OF_SERVICE_THRESHOLD_SEC;
}

exports.postNewBus = async (bus) => {
  if (!process.env.NEW_BUS_WEBHOOK_URL) {
    return;
  }
  
  const body = {
    content: `Bus **${bus.vid}** has entered service on route **${bus.rt}** out of **${exports.decodeGarage(bus.tablockid, true)}** garage (Block ID: ${bus.tablockid})`
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

const secondsToStr = (seconds) => {
  if (seconds < 1) {
    return "a long time";
  }
  
  let y = Math.floor(seconds / 31536000);
  let mo = Math.floor((seconds % 31536000) / 2628000);
  let d = Math.floor(((seconds % 31536000) % 2628000) / 86400);
  let h = Math.floor((seconds % (3600 * 24)) / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = Math.floor(seconds % 60);
  
  let components = [];
  
  if (y > 0) {
    components.push(y + (y === 1 ? " year" : " years"));
  }
  if (mo > 0) {
    components.push(mo + (mo === 1 ? " month" : " months"));
  }
  if (d > 0) {
    components.push(d + (d === 1 ? " day" : " days"));
  }
  
  return components.join(", ");
}

exports.postRevivedBus = async (bus, secondsSince) => {
  if (!process.env.NEW_BUS_WEBHOOK_URL) {
    return;
  }
  
  const body = {
    content: `Bus **${bus.vid}** has returned to service on route **${bus.rt}** after being out of service for **${secondsToStr(secondsSince)}**`
  }
  
  const webhookUrls = process.env.NEW_BUS_WEBHOOK_URL.split(';');
  
  for (urlIndex in webhookUrls) {
    try {
      await axios.post(webhookUrls[urlIndex], body);
    } catch (error) {
      console.log('Error posting to webhook', error);
    }
  }
  
  // snooze to prevent rate limiting
  await new Promise(r => setTimeout(r, 2000));
}