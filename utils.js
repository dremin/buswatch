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
    description: '2014-2018 Nova Bus LFS',
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
  let garage = '';
  let expandedGarage = 'Unknown';
  
  if (!blockId) {
    return expand ? expandedGarage : garage;
  }
  
  const dashIndex = blockId.indexOf('-');
  
  if (dashIndex < 0 || blockId.length < 2) {
    return expand ? expandedGarage : garage;
  }
  
  const encodedGarage = blockId.substring(dashIndex + 1, dashIndex + 2);
  
  // use block id to determine garage
  const decoded = exports.garages.find(g => g.encoded == encodedGarage);
  
  if (decoded) {
    garage = decoded.sticker;
    expandedGarage = decoded.name;
  }
  
  return expand ? expandedGarage : garage;
}

const epochToDisplay = (epoch) => {
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

const secondsToStr = (seconds) => {
  if (seconds < 1) {
    return "a long time";
  }
  
  let years = Math.floor(seconds / 31536000);
  let months = Math.floor((seconds % 31536000) / 2628000);
  let days = Math.floor(((seconds % 31536000) % 2628000) / 86400);
  
  let components = [];
  
  if (years > 0) {
    components.push(`${years} year${years === 1 ? '' : 's'}`);
  }
  if (months > 0) {
    components.push(`${months} month${months === 1 ? '' : 's'}`);
  }
  if (days > 0) {
    components.push(`${days} day${days === 1 ? '' : 's'}`);
  }
  
  return components.join(", ");
}

exports.secondsToTitleStr = (seconds, greater) => {
  let years = Math.floor(seconds / 31536000);
  let notYears = seconds % 31536000;
  let months = Math.floor(notYears / 2628000);
  let notMonths = notYears % 2628000;
  let weeks = Math.floor(notMonths / 604800);
  let days = Math.floor((notMonths % 604800) / 86400);
  
  let components = [];
  
  if (years > 0) {
    components.push(`${years}${greater && components.length < 1 ? '+' : ''} year${years === 1 ? '' : 's'}`);
  }
  
  if (months > 0) {
    components.push(`${months}${greater && components.length < 1 ? '+' : ''} month${months === 1 ? '' : 's'}`);
  }
  
  if (weeks > 0) {
    components.push(`${weeks}${greater && components.length < 1 ? '+' : ''} week${weeks === 1 ? '' : 's'}`);
  }
  
  if (days > 0) {
    components.push(`${days}${greater && components.length < 1 ? '+' : ''} day${days === 1 ? '' : 's'}`);
  }
  
  return components.join(", ");
}

const postToWebhook = async (body) => {
  if (!process.env.NEW_BUS_WEBHOOK_URL) {
    return;
  }
  
  const webhookUrls = process.env.NEW_BUS_WEBHOOK_URL.split(';');
  
  for (urlIndex in webhookUrls) {
    try {
      await axios.post(webhookUrls[urlIndex], { embeds: [ body ] });
    } catch (error) {
      console.log('Error posting to webhook', error);
    }
  }
  
  // snooze to prevent rate limiting
  await new Promise(r => setTimeout(r, 2000));
}

exports.postNewBus = async (bus) => {
  await postToWebhook({
    color: 3331915,
    title: `Bus ${bus.vid} has entered service out of ${exports.decodeGarage(bus.tablockid, true)} Garage`,
    fields: [
      {
        name: "Route",
        value: bus.rt,
        inline: true
      },
      {
        name: "Block ID",
        value: bus.tablockid,
        inline: true
      }
    ]
  });
}

exports.postRevivedBus = async (bus, existingBus, now) => {
  const secondsSince = existingBus.lastSeen ? now - existingBus.lastSeen : 0;
  const previousGarage = exports.decodeGarage(existingBus.blockId, true);
  const newGarage = exports.decodeGarage(bus.tablockid, true);
  
  const body = {
    color: 689407,
    title: `Bus ${bus.vid} has returned after being out of service for ${secondsToStr(secondsSince)}`,
    fields: [
      {
        name: "Route",
        value: bus.rt,
        inline: true
      },
      {
        name: "Block ID",
        value: bus.tablockid,
        inline: true
      },
      {
        name: "Garage",
        value: newGarage,
        inline: true
      },
      {
        name: "Last Seen",
        value: epochToDisplay(existingBus.lastSeen),
        inline: true
      }
    ]
  };
  
  if (newGarage !== 'Unknown' && previousGarage !== 'Unknown' && newGarage !== previousGarage) {
    body.title = `${body.title}, moved from ${previousGarage} Garage`;
  }
  
  if (existingBus.note) {
    body.fields.push({
      name: "Notes",
      value: existingBus.note.replaceAll('\\n', ' ')
    });
  }
  
  await postToWebhook(body);
}

exports.postOutOfServiceBus = async (bus) => {
  const body = {
    color: 16729402,
    title: `Bus ${bus.vid} has not been seen in service since ${epochToDisplay(bus.lastSeen)}`,
    fields: [
      {
        name: "Route",
        value: bus.route,
        inline: true
      },
      {
        name: "Block ID",
        value: bus.blockId,
        inline: true
      },
      {
        name: "Garage",
        value: exports.decodeGarage(bus.blockId, true),
        inline: true
      }
    ]
  };
  
  if (bus.note) {
    body.fields.push({
      name: "Notes",
      value: bus.note.replaceAll('\\n', ' ')
    });
  }
  
  await postToWebhook(body);
}

exports.mapBusDisplay = (buses, allowColor, now) => {
  return buses.map(bus => ({
    ...bus,
    firstSeen: epochToDisplay(bus.firstSeen),
    lastSeen: epochToDisplay(bus.lastSeen),
    isInService: allowColor && exports.isInService(now, bus.lastSeen),
    isOutOfService: allowColor && exports.isOutOfService(now, bus.lastSeen),
  }));
}

exports.mapBusSeries = (buses, allowColor, now) => {
  const busSeries = [ ...exports.series ];
  
  for (const s in busSeries) {
    busSeries[s].buses = exports.mapBusDisplay(buses.filter(bus => bus.vid >= busSeries[s].min && bus.vid <= busSeries[s].max), allowColor, now);
    busSeries[s].busCount = busSeries[s].buses.length;
  }
  
  return busSeries;
}