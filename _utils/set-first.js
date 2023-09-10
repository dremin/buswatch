const db = require('../db');

const vid = process.argv[2];
const firstSeen = Math.round(Date.parse(process.argv[3]) / 1000);

db.query(`insert into buses (vid, firstSeen) values (?, ?) on conflict(vid) do update set firstSeen = ? where vid = ?`, true, [ vid, firstSeen, firstSeen, vid ]);