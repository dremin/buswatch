const db = require('../db');

const vids = process.argv[2].split(',');

for (const vid of vids) {
  db.query(`update buses set retired = 1 where vid = ?`, true, [ vid ]);
}