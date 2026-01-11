const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DBSOURCE = path.join(__dirname, "db.sqlite");

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error("Error abriendo la base de datos:", err.message);
    return;
  }

  console.log("Base de datos conectada.");
  initSchema();
});

function initSchema() {
  db.serialize(() => {
    migrateUsersIfNeeded(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          role TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS dj_accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL UNIQUE,
          stripeAccountId TEXT,
          commissionBps INTEGER NOT NULL DEFAULT 1000,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (userId) REFERENCES users(id)
        )`
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          djUserId INTEGER NOT NULL,
          name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          joinCode TEXT UNIQUE NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          endedAt TEXT,
          FOREIGN KEY (djUserId) REFERENCES users(id)
        )`
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS song_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          eventId INTEGER NOT NULL,
          songTitle TEXT NOT NULL,
          artist TEXT,
          message TEXT,
          nickname TEXT,
          status TEXT NOT NULL DEFAULT 'queued',
          priority INTEGER NOT NULL DEFAULT 0,
          tipAmount INTEGER NOT NULL DEFAULT 0,
          deviceHash TEXT,
          updatedAt INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000),
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (eventId) REFERENCES events(id)
        )`
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          requestId INTEGER NOT NULL UNIQUE,
          amountCents INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'eur',
          paymentIntentId TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'requires_capture',
          applicationFeeCents INTEGER NOT NULL DEFAULT 0,
          djStripeAccountId TEXT,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (requestId) REFERENCES song_requests(id)
        )`
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS devices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          eventId INTEGER NOT NULL,
          deviceHash TEXT NOT NULL,
          lastRequestAt TEXT,
          isBanned INTEGER NOT NULL DEFAULT 0,
          bannedAt INTEGER,
          UNIQUE(eventId, deviceHash),
          FOREIGN KEY (eventId) REFERENCES events(id)
        )`
      );

      db.run(
        `CREATE INDEX IF NOT EXISTS idx_song_requests_event_id
         ON song_requests(eventId)`
      );

      db.run(
        `CREATE INDEX IF NOT EXISTS idx_song_requests_event_device
         ON song_requests(eventId, deviceHash)`
      );

      db.run(
        `CREATE INDEX IF NOT EXISTS idx_song_requests_event_updated
         ON song_requests(eventId, updatedAt)`
      );

      db.run(
        `CREATE INDEX IF NOT EXISTS idx_events_dj_user_id
         ON events(djUserId)`
      );

      db.run(
        `CREATE INDEX IF NOT EXISTS idx_payments_request_id
         ON payments(requestId)`
      );

      ensureSongRequestColumns();
      ensureDeviceColumns();
      ensureDjAccountColumns();
      ensurePaymentColumns();
    });
  });
}

function ensureSongRequestColumns() {
  db.all("PRAGMA table_info(song_requests)", (err, columns) => {
    if (err || !columns || columns.length === 0) return;
    const columnNames = columns.map((col) => col.name);
    if (!columnNames.includes("deviceHash")) {
      db.run(`ALTER TABLE song_requests ADD COLUMN deviceHash TEXT`);
    }
    if (!columnNames.includes("nickname")) {
      db.run(`ALTER TABLE song_requests ADD COLUMN nickname TEXT`);
    }
    if (!columnNames.includes("updatedAt")) {
      db.run(
        `ALTER TABLE song_requests
         ADD COLUMN updatedAt INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)`
      );
      db.run(
        `UPDATE song_requests
         SET updatedAt = CAST(strftime('%s','now') AS INTEGER) * 1000
         WHERE updatedAt IS NULL`
      );
    }
  });
}

function ensureDeviceColumns() {
  db.all("PRAGMA table_info(devices)", (err, columns) => {
    if (err || !columns || columns.length === 0) return;
    const columnNames = columns.map((col) => col.name);
    if (!columnNames.includes("isBanned")) {
      db.run(`ALTER TABLE devices ADD COLUMN isBanned INTEGER NOT NULL DEFAULT 0`);
      db.run(`UPDATE devices SET isBanned = 0 WHERE isBanned IS NULL`);
    }
    if (!columnNames.includes("bannedAt")) {
      db.run(`ALTER TABLE devices ADD COLUMN bannedAt INTEGER`);
    }
  });
}

function ensureDjAccountColumns() {
  db.all("PRAGMA table_info(dj_accounts)", (err, columns) => {
    if (err || !columns || columns.length === 0) return;
    const columnNames = columns.map((col) => col.name);
    if (!columnNames.includes("stripeAccountId")) {
      db.run(`ALTER TABLE dj_accounts ADD COLUMN stripeAccountId TEXT`);
    }
    if (!columnNames.includes("commissionBps")) {
      db.run(
        `ALTER TABLE dj_accounts ADD COLUMN commissionBps INTEGER NOT NULL DEFAULT 1000`
      );
      db.run(`UPDATE dj_accounts SET commissionBps = 1000 WHERE commissionBps IS NULL`);
    }
    if (!columnNames.includes("updatedAt")) {
      db.run(
        `ALTER TABLE dj_accounts ADD COLUMN updatedAt TEXT NOT NULL DEFAULT (datetime('now'))`
      );
    }
  });
}

function ensurePaymentColumns() {
  db.all("PRAGMA table_info(payments)", (err, columns) => {
    if (err || !columns || columns.length === 0) return;
    const columnNames = columns.map((col) => col.name);
    if (!columnNames.includes("applicationFeeCents")) {
      db.run(
        `ALTER TABLE payments ADD COLUMN applicationFeeCents INTEGER NOT NULL DEFAULT 0`
      );
      db.run(`UPDATE payments SET applicationFeeCents = 0 WHERE applicationFeeCents IS NULL`);
    }
    if (!columnNames.includes("djStripeAccountId")) {
      db.run(`ALTER TABLE payments ADD COLUMN djStripeAccountId TEXT`);
    }
    if (!columnNames.includes("updatedAt")) {
      db.run(
        `ALTER TABLE payments ADD COLUMN updatedAt TEXT NOT NULL DEFAULT (datetime('now'))`
      );
    }
  });
}

function migrateUsersIfNeeded(done) {
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error("Error leyendo esquema de usuarios:", err.message);
      done();
      return;
    }

    if (!columns || columns.length === 0) {
      done();
      return;
    }

    const columnNames = columns.map((col) => col.name);
    const hasEmail = columnNames.includes("email");
    const hasPasswordHash = columnNames.includes("passwordHash");
    const hasUsername = columnNames.includes("username");
    const hasPassword = columnNames.includes("password");

    if (hasEmail && hasPasswordHash) {
      done();
      return;
    }

    if (hasUsername && hasPassword) {
      const migration = `
        BEGIN TRANSACTION;
        ALTER TABLE users RENAME TO users_old;
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          role TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO users (id, email, passwordHash, role, createdAt)
          SELECT id, username, password, role, datetime('now')
          FROM users_old;
        DROP TABLE users_old;
        COMMIT;
      `;
      db.exec(migration, (migrationErr) => {
        if (migrationErr) {
          console.error("Error migrando usuarios:", migrationErr.message);
        }
        done();
      });
      return;
    }

    console.warn("Esquema de usuarios desconocido; recreando tabla.");
    const fallback = `
      BEGIN TRANSACTION;
      DROP TABLE IF EXISTS users;
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
      COMMIT;
    `;
    db.exec(fallback, (fallbackErr) => {
      if (fallbackErr) {
        console.error("Error recreando usuarios:", fallbackErr.message);
      }
      done();
    });
  });
}

module.exports = db;
