const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DBSOURCE = path.join(__dirname, "db.sqlite");

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error("Error abriendo la base de datos:", err.message);
  } else {
    console.log("Base de datos conectada.");

    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      )`,
      (err) => {
        if (err) {
          console.log("Tabla usuarios ya existe");
        } else {
          console.log("Tabla usuarios creada");
        }
      }
    );
  }
});

module.exports = db;

