require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
const db = require("./database");

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
const DJ_INVITE_CODE = process.env.DJ_INVITE_CODE || "";
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const MAX_TITLE_LENGTH = 120;
const MAX_ARTIST_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 200;
const MAX_NICKNAME_LENGTH = 40;
const MAX_TIP_AMOUNT = 20;
const MIN_REQUEST_INTERVAL_MS = 10000;
const MAX_REQUESTS_PER_DEVICE = 5;
const DEFAULT_CURRENCY = "eur";

if (!JWT_SECRET) {
  console.error("JWT_SECRET no configurado en el entorno.");
  process.exit(1);
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

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

function requireAdmin(req, res, next) {
  if (!ADMIN_EMAIL) {
    return sendError(res, 500, "ADMIN_NOT_CONFIGURED", "Admin no configurado");
  }
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return sendError(res, 403, "FORBIDDEN_ROLE", "Sin permisos");
  }
  next();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function getDjAccount(userId) {
  let account = await dbGet(`SELECT * FROM dj_accounts WHERE userId = ?`, [
    userId,
  ]);
  if (!account) {
    await dbRun(
      `INSERT INTO dj_accounts (userId, commissionBps) VALUES (?, 1000)`,
      [userId]
    );
    account = await dbGet(`SELECT * FROM dj_accounts WHERE userId = ?`, [
      userId,
    ]);
  }
  return account;
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

function formatAmountCentsFromTip(tipAmount) {
  return Math.round(tipAmount * 100);
}

function computeApplicationFee(amountCents, commissionBps) {
  if (!Number.isFinite(amountCents) || !Number.isFinite(commissionBps)) {
    return 0;
  }
  return Math.max(0, Math.round((amountCents * commissionBps) / 10000));
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

    res.json({
      token,
      email: user.email,
      role: user.role,
      isAdmin: ADMIN_EMAIL && user.email === ADMIN_EMAIL,
    });
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

app.post(
  "/api/dj/stripe/connect",
  requireAuth,
  requireRole("DJ"),
  async (req, res) => {
    if (!stripe) {
      return sendError(
        res,
        500,
        "STRIPE_NOT_CONFIGURED",
        "Stripe no configurado"
      );
    }

    try {
      const account = await getDjAccount(req.user.id);
      let stripeAccountId = account.stripeAccountId;

      if (!stripeAccountId) {
        const created = await stripe.accounts.create({
          type: "express",
          country: "ES",
          email: req.user.email,
          capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        });
        stripeAccountId = created.id;
        await dbRun(
          `UPDATE dj_accounts SET stripeAccountId = ?, updatedAt = datetime('now') WHERE userId = ?`,
          [stripeAccountId, req.user.id]
        );
      }

      const refreshUrl = FRONTEND_URL
        ? `${FRONTEND_URL}/dj`
        : "http://localhost:5173/dj";
      const returnUrl = FRONTEND_URL
        ? `${FRONTEND_URL}/dj`
        : "http://localhost:5173/dj";

      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });

      res.json({ url: accountLink.url, stripeAccountId });
    } catch (err) {
      res.status(500).json({ error: "Error conectando Stripe" });
    }
  }
);

app.get(
  "/api/dj/stripe/status",
  requireAuth,
  requireRole("DJ"),
  async (req, res) => {
    try {
      const account = await getDjAccount(req.user.id);
      res.json({
        connected: Boolean(account.stripeAccountId),
        stripeAccountId: account.stripeAccountId || null,
      });
    } catch (err) {
      res.status(500).json({ error: "Error cargando estado de Stripe" });
    }
  }
);

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
          `SELECT song_requests.*,
                  payments.status as paymentStatus,
                  payments.amountCents as paymentAmountCents,
                  payments.currency as paymentCurrency
           FROM song_requests
           LEFT JOIN payments ON payments.requestId = song_requests.id
           WHERE song_requests.eventId = ? AND song_requests.updatedAt > ?
           ORDER BY song_requests.updatedAt ASC`,
          [eventId, since]
        );
      } else {
        requests = await dbAll(
          `SELECT song_requests.*,
                  payments.status as paymentStatus,
                  payments.amountCents as paymentAmountCents,
                  payments.currency as paymentCurrency
           FROM song_requests
           LEFT JOIN payments ON payments.requestId = song_requests.id
           WHERE song_requests.eventId = ?
           ORDER BY song_requests.createdAt ASC`,
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
    const allowedStatuses = ["queued", "playing", "done", "rejected"];

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
  "/api/dj/requests/:id/accept",
  requireAuth,
  requireRole("DJ"),
  async (req, res) => {
    if (!stripe) {
      return sendError(
        res,
        500,
        "STRIPE_NOT_CONFIGURED",
        "Stripe no configurado"
      );
    }

    const requestId = Number(req.params.id);
    if (!requestId) {
      return sendError(res, 400, "VALIDATION_ERROR", "Solicitud invalida");
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

      const payment = await dbGet(
        `SELECT * FROM payments WHERE requestId = ?`,
        [requestId]
      );

      if (!payment) {
        return res.json({ ok: true, message: "Sin pago asociado" });
      }

      if (payment.status === "captured") {
        return res.json({ ok: true, message: "Pago ya capturado" });
      }

      const captured = await stripe.paymentIntents.capture(
        payment.paymentIntentId
      );

      await dbRun(
        `UPDATE payments
         SET status = ?, updatedAt = datetime('now')
         WHERE requestId = ?`,
        [captured.status === "succeeded" ? "captured" : captured.status, requestId]
      );

      await dbRun(
        `UPDATE song_requests SET updatedAt = ? WHERE id = ?`,
        [Date.now(), requestId]
      );

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error aceptando solicitud" });
    }
  }
);

app.post(
  "/api/dj/requests/:id/reject",
  requireAuth,
  requireRole("DJ"),
  async (req, res) => {
    if (!stripe) {
      return sendError(
        res,
        500,
        "STRIPE_NOT_CONFIGURED",
        "Stripe no configurado"
      );
    }

    const requestId = Number(req.params.id);
    if (!requestId) {
      return sendError(res, 400, "VALIDATION_ERROR", "Solicitud invalida");
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

      const payment = await dbGet(
        `SELECT * FROM payments WHERE requestId = ?`,
        [requestId]
      );

      if (payment && payment.status !== "canceled") {
        await stripe.paymentIntents.cancel(payment.paymentIntentId);
        await dbRun(
          `UPDATE payments
           SET status = ?, updatedAt = datetime('now')
           WHERE requestId = ?`,
          ["canceled", requestId]
        );
      }

      await dbRun(
        `UPDATE song_requests SET status = ?, updatedAt = ? WHERE id = ?`,
        ["rejected", Date.now(), requestId]
      );

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error rechazando solicitud" });
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

      let paymentIntent = null;
      let amountCents = 0;
      let applicationFeeCents = 0;
      let djStripeAccountId = null;

      if (normalizedTip > 0) {
        if (!stripe) {
          return sendError(
            res,
            500,
            "STRIPE_NOT_CONFIGURED",
            "Stripe no configurado"
          );
        }

        const djAccount = await getDjAccount(event.djUserId);
        if (!djAccount.stripeAccountId) {
          return sendError(
            res,
            409,
            "DJ_STRIPE_NOT_CONNECTED",
            "El DJ aun no tiene pagos habilitados"
          );
        }

        amountCents = formatAmountCentsFromTip(normalizedTip);
        applicationFeeCents = computeApplicationFee(
          amountCents,
          djAccount.commissionBps
        );
        djStripeAccountId = djAccount.stripeAccountId;

        paymentIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: DEFAULT_CURRENCY,
          capture_method: "manual",
          automatic_payment_methods: { enabled: true },
          application_fee_amount: applicationFeeCents,
          transfer_data: {
            destination: djStripeAccountId,
          },
          metadata: {
            eventId: String(event.id),
            djUserId: String(event.djUserId),
          },
        });
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

      if (paymentIntent) {
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            requestId: String(result.lastID),
          },
        });
        await dbRun(
          `INSERT INTO payments
           (requestId, amountCents, currency, paymentIntentId, status, applicationFeeCents, djStripeAccountId)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            result.lastID,
            amountCents,
            DEFAULT_CURRENCY,
            paymentIntent.id,
            paymentIntent.status,
            applicationFeeCents,
            djStripeAccountId,
          ]
        );
      }

      res.json({
        request,
        clientSecret: paymentIntent ? paymentIntent.client_secret : null,
        amountCents: paymentIntent ? amountCents : null,
      });
    } catch (err) {
      res.status(500).json({ error: "Error creando solicitud" });
    }
  }
);

app.post(
  "/api/public/requests/:id/confirm-payment",
  async (req, res) => {
    if (!stripe) {
      return sendError(
        res,
        500,
        "STRIPE_NOT_CONFIGURED",
        "Stripe no configurado"
      );
    }

    const requestId = Number(req.params.id);
    const { paymentIntentId } = req.body;
    if (!requestId || !paymentIntentId) {
      return sendError(res, 400, "VALIDATION_ERROR", "Datos invalidos");
    }

    try {
      const payment = await dbGet(
        `SELECT * FROM payments WHERE requestId = ?`,
        [requestId]
      );
      if (!payment || payment.paymentIntentId !== paymentIntentId) {
        return sendError(res, 404, "VALIDATION_ERROR", "Pago no encontrado");
      }

      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      await dbRun(
        `UPDATE payments
         SET status = ?, updatedAt = datetime('now')
         WHERE requestId = ?`,
        [intent.status, requestId]
      );
      await dbRun(
        `UPDATE song_requests SET updatedAt = ? WHERE id = ?`,
        [Date.now(), requestId]
      );

      res.json({ ok: true, status: intent.status });
    } catch (err) {
      res.status(500).json({ error: "Error confirmando pago" });
    }
  }
);

// Ruta protegida de ejemplo
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ message: `Hola ${req.user.email}, estás autenticado` });
});

app.get(
  "/api/admin/metrics",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const [
        capturedTotals,
        feeTotals,
        pendingTotals,
        totalDjsRow,
        activeDjsRow,
        totalEventsRow,
        totalRequestsRow,
      ] = await Promise.all([
        dbGet(
          `SELECT COALESCE(SUM(amountCents), 0) as totalCents
           FROM payments
           WHERE status IN ('captured', 'succeeded')`
        ),
        dbGet(
          `SELECT COALESCE(SUM(applicationFeeCents), 0) as feeCents
           FROM payments
           WHERE status IN ('captured', 'succeeded')`
        ),
        dbGet(
          `SELECT COALESCE(SUM(amountCents), 0) as pendingCents
           FROM payments
           WHERE status = 'requires_capture'`
        ),
        dbGet(
          `SELECT COUNT(*) as totalDjs FROM users WHERE role = 'DJ'`
        ),
        dbGet(
          `SELECT COUNT(DISTINCT djUserId) as activeDjs
           FROM events WHERE status = 'active'`
        ),
        dbGet(`SELECT COUNT(*) as totalEvents FROM events`),
        dbGet(`SELECT COUNT(*) as totalRequests FROM song_requests`),
      ]);

      res.json({
        totalCapturedCents: capturedTotals?.totalCents || 0,
        totalFeesCents: feeTotals?.feeCents || 0,
        pendingCents: pendingTotals?.pendingCents || 0,
        totalDjs: totalDjsRow?.totalDjs || 0,
        activeDjs: activeDjsRow?.activeDjs || 0,
        totalEvents: totalEventsRow?.totalEvents || 0,
        totalRequests: totalRequestsRow?.totalRequests || 0,
      });
    } catch (err) {
      res.status(500).json({ error: "Error cargando métricas" });
    }
  }
);

app.get(
  "/api/admin/djs",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const djs = await dbAll(
        `SELECT users.id,
                users.email,
                COALESCE(dj_accounts.commissionBps, 1000) as commissionBps,
                dj_accounts.stripeAccountId,
                COALESCE(SUM(CASE WHEN payments.status IN ('captured','succeeded')
                  THEN payments.amountCents ELSE 0 END), 0) as capturedCents
         FROM users
         LEFT JOIN dj_accounts ON dj_accounts.userId = users.id
         LEFT JOIN events ON events.djUserId = users.id
         LEFT JOIN song_requests ON song_requests.eventId = events.id
         LEFT JOIN payments ON payments.requestId = song_requests.id
         WHERE users.role = 'DJ'
         GROUP BY users.id
         ORDER BY users.email ASC`
      );
      res.json({ djs });
    } catch (err) {
      res.status(500).json({ error: "Error cargando DJs" });
    }
  }
);

app.patch(
  "/api/admin/djs/:id/commission",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const djId = Number(req.params.id);
    const { commissionBps } = req.body;

    if (!djId || !Number.isFinite(Number(commissionBps))) {
      return sendError(res, 400, "VALIDATION_ERROR", "Datos invalidos");
    }

    const normalizedBps = Math.floor(Number(commissionBps));
    if (normalizedBps < 0 || normalizedBps > 3000) {
      return sendError(res, 400, "VALIDATION_ERROR", "Comision invalida");
    }

    try {
      await dbRun(
        `INSERT INTO dj_accounts (userId, commissionBps)
         VALUES (?, ?)
         ON CONFLICT(userId)
         DO UPDATE SET commissionBps = excluded.commissionBps, updatedAt = datetime('now')`,
        [djId, normalizedBps]
      );
      const updated = await dbGet(
        `SELECT userId, commissionBps FROM dj_accounts WHERE userId = ?`,
        [djId]
      );
      res.json({ ok: true, account: updated });
    } catch (err) {
      res.status(500).json({ error: "Error actualizando comisión" });
    }
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
