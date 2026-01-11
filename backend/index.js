require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./database");

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
const DJ_INVITE_CODE = process.env.DJ_INVITE_CODE || "";
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || "";

const MAX_TITLE_LENGTH = 120;
const MAX_ARTIST_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 200;
const MAX_NICKNAME_LENGTH = 40;
const MAX_TIP_AMOUNT = 20;
const MIN_REQUEST_INTERVAL_MS = 10000;
const MAX_REQUESTS_PER_DEVICE = 5;

if (!JWT_SECRET) {
  console.error("JWT_SECRET no configurado en el entorno.");
  process.exit(1);
}

const allowedOrigins = FRONTEND_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173", "http://127.0.0.1:5173");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origen no permitido por CORS"));
    },
  })
);

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

function sendError(res, status, code, message, retryAfterSeconds) {
  const payload = { error: message, code };
  if (Number.isFinite(retryAfterSeconds)) {
    payload.retryAfterSeconds = retryAfterSeconds;
    if (status === 429) {
      res.set("Retry-After", String(retryAfterSeconds));
    }
  }
  return res.status(status).json(payload);
}

function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return sendError(res, 401, "AUTH_INVALID", "Token no proporcionado");
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const isExpired = err.name === "TokenExpiredError";
      return sendError(
        res,
        401,
        isExpired ? "AUTH_EXPIRED" : "AUTH_INVALID",
        isExpired ? "Sesion caducada" : "Token invalido"
      );
    }
    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return sendError(res, 403, "FORBIDDEN_ROLE", "Sin permisos");
    }
    next();
  };
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function generateJoinCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function createUniqueJoinCode() {
  for (let i = 0; i < 5; i += 1) {
    const joinCode = generateJoinCode();
    const existing = await dbGet(
      "SELECT id FROM events WHERE joinCode = ?",
      [joinCode]
    );
    if (!existing) return joinCode;
  }
  throw new Error("No se pudo generar joinCode");
}

function getDeviceHash(req) {
  const raw =
    req.body?.deviceHash ||
    req.headers["x-device-id"] ||
    `${req.ip}-${req.headers["user-agent"] || "unknown"}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// Registro
app.post("/api/register", async (req, res) => {
  const { email, password, inviteCode } = req.body;
  if (!email || !password) {
    return sendError(res, 400, "VALIDATION_ERROR", "Faltan datos");
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedInviteCode = inviteCode ? inviteCode.trim() : "";
  const role =
    DJ_INVITE_CODE && normalizedInviteCode === DJ_INVITE_CODE
      ? "DJ"
      : "USER";

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await dbRun(
      `INSERT INTO users (email, passwordHash, role) VALUES (?, ?, ?)`,
      [normalizedEmail, hashedPassword, role]
    );
    res.json({ message: "Usuario registrado" });
  } catch (err) {
    return sendError(res, 400, "VALIDATION_ERROR", "Usuario ya existe o error");
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, 400, "VALIDATION_ERROR", "Faltan datos");
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const user = await dbGet(`SELECT * FROM users WHERE email = ?`, [
      normalizedEmail,
    ]);

    if (!user) {
      return sendError(res, 401, "AUTH_INVALID", "Credenciales invalidas");
    }

    const result = await bcrypt.compare(password, user.passwordHash);
    if (!result) {
      return sendError(res, 401, "AUTH_INVALID", "Credenciales invalidas");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Error en BD" });
  }
});

app.get("/api/dj/events", requireAuth, requireRole("DJ"), async (req, res) => {
  try {
    const events = await dbAll(
      `SELECT * FROM events WHERE djUserId = ? ORDER BY createdAt DESC`,
      [req.user.id]
    );
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: "Error cargando eventos" });
  }
});

app.post("/api/dj/events", requireAuth, requireRole("DJ"), async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return sendError(res, 400, "VALIDATION_ERROR", "Nombre requerido");
  }

  try {
    const joinCode = await createUniqueJoinCode();
    const result = await dbRun(
      `INSERT INTO events (djUserId, name, joinCode) VALUES (?, ?, ?)`,
      [req.user.id, name.trim(), joinCode]
    );
    const event = await dbGet(`SELECT * FROM events WHERE id = ?`, [
      result.lastID,
    ]);
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: "Error creando evento" });
  }
});

app.get(
  "/api/dj/events/:id/requests",
  requireAuth,
  requireRole("DJ"),
  async (req, res) => {
    const eventId = Number(req.params.id);
    const since = Number(req.query.since);
    if (!eventId) {
      return sendError(res, 400, "VALIDATION_ERROR", "Evento invalido");
    }

    try {
      const event = await dbGet(
        `SELECT * FROM events WHERE id = ? AND djUserId = ?`,
        [eventId, req.user.id]
      );
      if (!event) {
        return sendError(res, 404, "EVENT_NOT_FOUND", "Evento no encontrado");
      }

      const serverTime = Date.now();
      let requests;
      if (Number.isFinite(since)) {
        requests = await dbAll(
          `SELECT * FROM song_requests
           WHERE eventId = ? AND updatedAt > ?
           ORDER BY updatedAt ASC`,
          [eventId, since]
        );
      } else {
        requests = await dbAll(
          `SELECT * FROM song_requests WHERE eventId = ? ORDER BY createdAt ASC`,
          [eventId]
        );
      }
      res.json({ serverTime, requests });
    } catch (err) {
      res.status(500).json({ error: "Error cargando solicitudes" });
    }
  }
);

app.patch(
  "/api/dj/requests/:id",
  requireAuth,
  requireRole("DJ"),
  async (req, res) => {
    const requestId = Number(req.params.id);
    const { status, priority } = req.body;
    const allowedStatuses = ["queued", "playing", "done"];

    if (!requestId) {
      return sendError(res, 400, "VALIDATION_ERROR", "Solicitud invalida");
    }

    if (status && !allowedStatuses.includes(status)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Estado invalido");
    }

    try {
      const request = await dbGet(
        `SELECT song_requests.*, events.djUserId
         FROM song_requests
         JOIN events ON events.id = song_requests.eventId
         WHERE song_requests.id = ?`,
        [requestId]
      );

      if (!request || request.djUserId !== req.user.id) {
        return sendError(res, 404, "VALIDATION_ERROR", "Solicitud no encontrada");
      }

      const updates = [];
      const params = [];

      if (status) {
        updates.push("status = ?");
        params.push(status);
      }

      const parsedPriority = Number(priority);
      if (Number.isFinite(parsedPriority)) {
        updates.push("priority = ?");
        params.push(Math.floor(parsedPriority));
      }

      if (!updates.length) {
        return sendError(res, 400, "VALIDATION_ERROR", "Sin cambios");
      }

      updates.push("updatedAt = ?");
      params.push(Date.now());

      params.push(requestId);
      await dbRun(
        `UPDATE song_requests SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      const updated = await dbGet(
        `SELECT * FROM song_requests WHERE id = ?`,
        [requestId]
      );
      res.json({ request: updated });
    } catch (err) {
      res.status(500).json({ error: "Error actualizando solicitud" });
    }
  }
);

app.post(
  "/api/dj/events/:id/ban-device",
  requireAuth,
  requireRole("DJ"),
  async (req, res) => {
    const eventId = Number(req.params.id);
    const { deviceHash } = req.body;

    if (!eventId || !deviceHash) {
      return sendError(res, 400, "VALIDATION_ERROR", "Datos invalidos");
    }

    try {
      const event = await dbGet(
        `SELECT * FROM events WHERE id = ? AND djUserId = ?`,
        [eventId, req.user.id]
      );
      if (!event) {
        return sendError(res, 404, "EVENT_NOT_FOUND", "Evento no encontrado");
      }

      const now = Date.now();
      await dbRun(
        `INSERT INTO devices (eventId, deviceHash, isBanned, bannedAt, lastRequestAt)
         VALUES (?, ?, 1, ?, NULL)
         ON CONFLICT(eventId, deviceHash)
         DO UPDATE SET isBanned = 1, bannedAt = excluded.bannedAt`,
        [eventId, deviceHash, now]
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error bloqueando dispositivo" });
    }
  }
);

app.post(
  "/api/dj/events/:id/unban-device",
  requireAuth,
  requireRole("DJ"),
  async (req, res) => {
    const eventId = Number(req.params.id);
    const { deviceHash } = req.body;

    if (!eventId || !deviceHash) {
      return sendError(res, 400, "VALIDATION_ERROR", "Datos invalidos");
    }

    try {
      const event = await dbGet(
        `SELECT * FROM events WHERE id = ? AND djUserId = ?`,
        [eventId, req.user.id]
      );
      if (!event) {
        return sendError(res, 404, "EVENT_NOT_FOUND", "Evento no encontrado");
      }

      await dbRun(
        `UPDATE devices SET isBanned = 0, bannedAt = NULL
         WHERE eventId = ? AND deviceHash = ?`,
        [eventId, deviceHash]
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error desbloqueando dispositivo" });
    }
  }
);

app.post(
  "/api/public/events/:joinCode/requests",
  async (req, res) => {
    const { joinCode } = req.params;
    const { songTitle, artist, message, tipAmount, nickname } = req.body;

    if (!songTitle || !songTitle.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "Cancion requerida");
    }

    try {
      const event = await dbGet(
        `SELECT * FROM events WHERE joinCode = ?`,
        [joinCode.trim().toUpperCase()]
      );

      if (!event) {
        return sendError(res, 404, "EVENT_NOT_FOUND", "Evento no encontrado");
      }
      if (event.status !== "active") {
        return sendError(res, 409, "EVENT_ENDED", "Evento finalizado");
      }

      const deviceHash = getDeviceHash(req);
      const now = new Date();
      const lastRequest = await dbGet(
        `SELECT * FROM devices WHERE eventId = ? AND deviceHash = ?`,
        [event.id, deviceHash]
      );

      if (lastRequest && Number(lastRequest.isBanned) === 1) {
        return sendError(
          res,
          403,
          "DEVICE_BANNED",
          "Tu dispositivo esta bloqueado para este evento"
        );
      }

      if (lastRequest && lastRequest.lastRequestAt) {
        const lastTime = new Date(lastRequest.lastRequestAt).getTime();
        if (now.getTime() - lastTime < MIN_REQUEST_INTERVAL_MS) {
          const retryAfterSeconds = Math.max(
            1,
            Math.ceil(
              (MIN_REQUEST_INTERVAL_MS - (now.getTime() - lastTime)) / 1000
            )
          );
          return sendError(
            res,
            429,
            "COOLDOWN",
            "Espera unos segundos antes de pedir otra",
            retryAfterSeconds
          );
        }
      }

      const requestCount = await dbGet(
        `SELECT COUNT(*) as count FROM song_requests
         WHERE eventId = ? AND deviceHash = ?`,
        [event.id, deviceHash]
      );
      if (requestCount && requestCount.count >= MAX_REQUESTS_PER_DEVICE) {
        return sendError(
          res,
          429,
          "MAX_REQUESTS_PER_DEVICE",
          "Has alcanzado el limite de solicitudes para este evento"
        );
      }

      if (lastRequest) {
        await dbRun(
          `UPDATE devices SET lastRequestAt = ? WHERE id = ?`,
          [now.toISOString(), lastRequest.id]
        );
      } else {
        await dbRun(
          `INSERT INTO devices (eventId, deviceHash, lastRequestAt, isBanned)
           VALUES (?, ?, ?, 0)`,
          [event.id, deviceHash, now.toISOString()]
        );
      }

      const trimmedTitle = songTitle.trim();
      if (trimmedTitle.length > MAX_TITLE_LENGTH) {
        return sendError(res, 400, "VALIDATION_ERROR", "Titulo demasiado largo");
      }
      const trimmedArtist = artist ? artist.trim() : "";
      if (trimmedArtist && trimmedArtist.length > MAX_ARTIST_LENGTH) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Artista demasiado largo"
        );
      }
      const trimmedMessage = message ? message.trim() : "";
      if (trimmedMessage && trimmedMessage.length > MAX_MESSAGE_LENGTH) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Mensaje demasiado largo"
        );
      }
      const trimmedNickname = nickname ? nickname.trim() : "";
      if (trimmedNickname && trimmedNickname.length > MAX_NICKNAME_LENGTH) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Apodo demasiado largo"
        );
      }

      let normalizedTip = 0;
      if (Number.isFinite(Number(tipAmount))) {
        normalizedTip = Math.floor(Number(tipAmount));
        if (normalizedTip < 0 || normalizedTip > MAX_TIP_AMOUNT) {
          return sendError(res, 400, "TIP_OUT_OF_RANGE", "Propina invalida");
        }
      }

      const result = await dbRun(
        `INSERT INTO song_requests
         (eventId, songTitle, artist, message, nickname, status, priority, tipAmount, deviceHash, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?)`,
        [
          event.id,
          trimmedTitle,
          trimmedArtist || null,
          trimmedMessage || null,
          trimmedNickname || null,
          normalizedTip,
          normalizedTip,
          deviceHash,
          Date.now(),
        ]
      );

      const request = await dbGet(
        `SELECT * FROM song_requests WHERE id = ?`,
        [result.lastID]
      );
      res.json({ request });
    } catch (err) {
      res.status(500).json({ error: "Error creando solicitud" });
    }
  }
);

// Ruta protegida de ejemplo
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ message: `Hola ${req.user.email}, estás autenticado` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
