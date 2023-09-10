const db = require('../db');

const vid = process.argv[2];

db.query(`delete from buses where vid = ?`, true, [ vid ]);