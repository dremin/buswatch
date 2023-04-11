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
    description: '2012 New Flyer D60LFR & DE60LFR',
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
  
  return new Date(epoch * 1000).toLocaleString('en-US', options);
}

exports.isInService = (now, lastSeen) => {
  if (!lastSeen) {
    return false;
  }
  
  return now - lastSeen < process.env.IN_SERVICE_THRESHOLD_SEC;
}

exports.isOutOfService = (now, lastSeen) => {
  if (!lastSeen) {
    return false;
  }
  
  return now - lastSeen > process.env.OUT_OF_SERVICE_THRESHOLD_SEC;
}