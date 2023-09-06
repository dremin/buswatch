'use strict';
const sqlite3 = require('better-sqlite3');

const dbFile = process.env.HOME + '/buswatch.db';
var db;

function runQuery(req, isNonQuery, params) {
  if (!db) {
    init();
  }
  
  if (!db) {
    // failed to init db
    return [];
  }
  
  try {
    if (isNonQuery) {
      return db.prepare(req).run(...params);
    } else {
      return db.prepare(req).all();
    }
  } catch (err) {
    console.log("Error performing query", err);
    return [];
  }
}

function createDatabase() {
  try {
    db?.prepare(`
    create table buses (
      vid integer not null,
      firstSeen datetime,
      lastSeen datetime,
      route text,
      blockId text,
      garage text,
      note text,
      primary key(vid)
    );
    `).run();
    console.log('Initialized database successfully.');
  } catch (err) {
    console.log("Error initializing database", err);
  }
}

function init() {
  try {
    db = new sqlite3(dbFile, { fileMustExist: true });
  } catch {
    try {
      db = new sqlite3(dbFile);
      createDatabase();
    } catch (err) {
      console.log("Unable to open database", err);
    }
  }
  
  // set up event handlers to close db on exit
  process.on('exit', () => db?.close());
  process.on('SIGHUP', () => process.exit(128 + 1));
  process.on('SIGINT', () => process.exit(128 + 2));
  process.on('SIGTERM', () => process.exit(128 + 15));
}

exports.query = (req, isNonQuery, params) => {
  return runQuery(req, isNonQuery, params);
};

exports.getDbDateTime = () => {
  // Return time as seconds since epoch
  return Math.round(Date.now() / 1000);
}