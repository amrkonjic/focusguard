// incijalizacija sqlite baze
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/focusguard.db');
const schemaPath = path.join(__dirname, '../database/schema.sql');

if (!fs.existsSync(schemaPath)) {
  throw new Error(`Schema file not found at: ${schemaPath}`);
}

const db = new Database(dbPath);

// dopusti istovremeno čitanje i pisanje podataka na disku (umjesto standarndog: blokiraj čitanje dok se piše)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');         // osigurati enforce foreign key constraints (sqlite to ne radi po defaultu)

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);            // pokreni cijeli sql file pri svakom pokretanju servera

module.exports = db;