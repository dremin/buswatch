const db = require('../db');

const vids = process.argv[2].split(',');
const note = process.argv[3];

for (const vid of vids) {
  db.query(`update buses set note = ? where vid = ?`, true, [ note, vid ]);
}