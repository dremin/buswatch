// example usage: node set-last.js 4399 2022-12-09T13:00:00 146 146 -505
const db = require('../db');
const decodeGarage = (blockId) => {
  const dashIndex = blockId.indexOf('-');
  
  if (dashIndex < 0 || blockId.length < 2) {
    return '';
  }
  
  const encodedGarage = blockId.substring(dashIndex + 1, dashIndex + 2);
  let garage = '';
  
  // use block id to determine garage
  switch (encodedGarage) {
      case '1':
      garage = '3';
      break;
      case '2':
      garage = 'K';
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
      break;
  }
  
  return garage;
}

const vid = process.argv[2];
const lastSeen = Math.round(Date.parse(process.argv[3]) / 1000);
const route = process.argv[4];
let block = process.argv[5];
if (process.argv.length >= 7) {
  block = `${block} ${process.argv[6]}`;
}

db.query(`update buses set lastSeen = ?, route = ?, blockId = ?, garage = ? where vid = ?`, true, [ lastSeen, route, block, decodeGarage(block), vid ]);