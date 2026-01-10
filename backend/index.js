const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./database");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "TU_SECRETO_SUPERGURO"; // Cambia esto en producción

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// Registro
app.post("/register", (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: "Error en hash" });

    const query = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
    db.run(query, [username, hashedPassword, role], function (err) {
      if (err) {
        return res.status(400).json({ error: "Usuario ya existe o error" });
      }
      res.json({ message: "Usuario registrado" });
    });
  });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], (err, user) => {
    if (err) return res.status(500).json({ error: "Error en BD" });

    // Línea corregida: nada de saltos extraños
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return res.status(500).json({ error: "Error en comparación" });
      if (!result) return res.status(400).json({ error: "Contraseña incorrecta" });

      // Crear token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({ token, username: user.username, role: user.role });
    });
  });
});

// Ruta protegida de ejemplo
app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: `Hola ${req.user.username}, estás autenticado` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
