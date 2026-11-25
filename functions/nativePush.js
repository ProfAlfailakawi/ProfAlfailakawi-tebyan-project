// Native iOS push (APNs) for the Tebyan app (com.dralfailakawi.tebyan.ios).
//
// Shared by the Cloud Function `api` (functions/index.js, production) and the
// Express server (server.ts, dev/backup). Like accountDeletion.js it has no
// require() of its own: the host injects node:http2 / node:crypto and the
// firebase-admin services, so the same file loads in the CommonJS function and
// bundles into the ESM server build.
//
// Configuration comes ONLY from the environment (Secret Manager in production):
//   APNS_KEY_P8   contents of the .p8 key (literal "\n" accepted for newlines)
//   APNS_KEY_ID   key id
//   APNS_TEAM_ID  Apple team id
//   APNS_TOPIC    bundle id (com.dralfailakawi.tebyan.ios)
//   APNS_ENV      optional: "sandbox" for Xcode debug builds; anything else = production
// If any of the four is missing, sending is a silent no-op.
//
// Device tokens live in Firestore `push_tokens/{sha256(token)}` = { uid, token,
// platform, createdAt, updatedAt }, written only here with firebase-admin
// (firestore.rules default-deny covers the collection). A token Apple rejects
// with 410 / BadDeviceToken / Unregistered / DeviceTokenNotForTopic is deleted.
// Secrets and full tokens are never logged.

const APNS_PRODUCTION_ORIGIN = "https://api.push.apple.com";
const APNS_SANDBOX_ORIGIN = "https://api.sandbox.push.apple.com";
const APNS_TTL_SECONDS = 24 * 60 * 60;
const APNS_JWT_REFRESH_SECONDS = 40 * 60;
const APNS_TIMEOUT_MS = 10000;
const APNS_TOKEN_PATTERN = /^[0-9a-fA-F]{64,200}$/;
const DEAD_REASONS = /BadDeviceToken|Unregistered|DeviceTokenNotForTopic/i;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const TOKENS = "push_tokens";
const MAX_TOKENS_PER_USER = 10;

function apnsConfigFromEnv(env) {
    const e = env || {};
    const key = String(e.APNS_KEY_P8 || "").replace(/\\n/g, "\n").trim();
    const keyId = String(e.APNS_KEY_ID || "").trim();
    const teamId = String(e.APNS_TEAM_ID || "").trim();
    const topic = String(e.APNS_TOPIC || "").trim();
    if (!key || !keyId || !teamId || !topic) return null;
    const origin = String(e.APNS_ENV || "").trim().toLowerCase() === "sandbox" ? APNS_SANDBOX_ORIGIN : APNS_PRODUCTION_ORIGIN;
    return { key, keyId, teamId, topic, origin };
}

const b64url = (data) => Buffer.from(data).toString("base64url");

/** Provider token (ES256 JWT) as required by Apple. */
function apnsProviderToken(crypto, config, nowSeconds) {
    const head = `${b64url(JSON.stringify({ alg: "ES256", kid: config.keyId }))}.${b64url(JSON.stringify({ iss: config.teamId, iat: nowSeconds }))}`;
    const signature = crypto.sign("sha256", Buffer.from(head), { key: config.key, dsaEncoding: "ieee-p1363" });
    return `${head}.${b64url(signature)}`;
}

/** Only same-site paths are allowed as the tap target. */
function safeUrl(url) {
    const value = String(url || "").trim();
    return /^\/(?!\/)[^\s]{0,300}$/.test(value) ? value : "/";
}

function apnsPayload(message) {
    const title = String(message.title || "").slice(0, 120);
    const body = String(message.body || "").slice(0, 400);
    return JSON.stringify({
        aps: {
            alert: { title, ...(body ? { body } : {}) },
            sound: "default",
            ...(message.tag ? { "thread-id": String(message.tag).slice(0, 64) } : {}),
        },
        url: safeUrl(message.url),
    });
}

const shortToken = (token) => `${String(token).slice(0, 6)}…`;

/**
 * @param {{ http2?: any, crypto: any, env?: () => Record<string, string | undefined>, now?: () => number, timeoutMs?: number, connect?: (origin: string) => any }} options
 */
function createApnsSender({ http2, crypto, env = () => process.env, now = Date.now, timeoutMs = APNS_TIMEOUT_MS, connect } = {}) {
    const doConnect = connect || ((origin) => http2.connect(origin));
    let cached = null;

    const providerToken = (config) => {
        const nowSeconds = Math.floor(now() / 1000);
        const seed = `${config.keyId}|${config.teamId}|${crypto.createHash("sha256").update(config.key).digest("hex")}`;
        if (cached && cached.seed === seed && nowSeconds - cached.issuedAt < APNS_JWT_REFRESH_SECONDS) return cached.jwt;
        const jwt = apnsProviderToken(crypto, config, nowSeconds);
        cached = { jwt, issuedAt: nowSeconds, seed };
        return jwt;
    };

    return {
        configured: () => apnsConfigFromEnv(env()) !== null,
        send(token, message) {
            const config = apnsConfigFromEnv(env());
            if (!config) return Promise.resolve({ ok: false, gone: false, status: 0, skipped: true });
            if (!APNS_TOKEN_PATTERN.test(String(token || ""))) return Promise.resolve({ ok: false, gone: true, status: 0, error: "bad token" });
            let jwt;
            try { jwt = providerToken(config); } catch (err) {
                return Promise.resolve({ ok: false, gone: false, status: 0, error: "key" });
            }
            const nowSeconds = Math.floor(now() / 1000);
            return new Promise((resolve) => {
                let settled = false;
                let client = null;
                let timer;
                const finish = (result) => {
                    if (settled) return;
                    settled = true;
                    if (timer) clearTimeout(timer);
                    try { if (client) client.close(); } catch (_) { /* already closed */ }
                    resolve(result);
                };
                try {
                    client = doConnect(config.origin);
                    client.on("error", (err) => finish({ ok: false, gone: false, status: 0, error: `conn: ${String((err && err.code) || "error")}` }));
                    timer = setTimeout(() => finish({ ok: false, gone: false, status: 0, error: "timeout" }), timeoutMs);
                    const request = client.request({
                        ":method": "POST",
                        ":path": `/3/device/${String(token).toLowerCase()}`,
                        authorization: `bearer ${jwt}`,
                        "apns-topic": config.topic,
                        "apns-push-type": "alert",
                        "apns-priority": "10",
                        "apns-expiration": String(nowSeconds + APNS_TTL_SECONDS),
                        "content-type": "application/json",
                    });
                    let status = 0;
                    let text = "";
                    request.on("response", (headers) => { status = Number((headers && headers[":status"]) || 0); });
                    if (request.setEncoding) request.setEncoding("utf8");
                    request.on("data", (chunk) => { text += chunk; });
                    request.on("end", () => {
                        if (status === 200) return finish({ ok: true, gone: false, status });
                        let reason = "";
                        try { reason = String(JSON.parse(text).reason || ""); } catch (_) { reason = ""; }
                        finish({ ok: false, gone: status === 410 || DEAD_REASONS.test(reason), status, error: reason || undefined });
                    });
                    request.on("error", () => finish({ ok: false, gone: false, status: 0, error: "req" }));
                    request.end(apnsPayload(message));
                } catch (_) {
                    finish({ ok: false, gone: false, status: 0, error: "connect" });
                }
            });
        },
    };
}

// ---------------------------------------------------------------------------
// Token store + delivery
// ---------------------------------------------------------------------------
function createPushService({ sender, getServices, crypto, now = Date.now, log = console }) {
    const tokenId = (token) => crypto.createHash("sha256").update(`apns:${String(token).toLowerCase()}`).digest("hex");

    async function saveToken(firestore, uid, token) {
        const id = tokenId(token);
        const ref = firestore.collection(TOKENS).doc(id);
        const at = new Date(now());
        await ref.set({ uid, token: String(token).toLowerCase(), platform: "ios", createdAt: at, updatedAt: at });
        return id;
    }

    /** Sends to every token of the given users; drops dead tokens. Never throws. */
    async function sendToUsers(uids, message) {
        const list = Array.from(new Set((uids || []).filter((u) => typeof u === "string" && ID_PATTERN.test(u))));
        const summary = { sent: 0, dropped: 0, skipped: false };
        if (!list.length) return summary;
        if (!sender.configured()) { summary.skipped = true; return summary; }
        let services;
        try { services = await getServices(); } catch (_) { services = null; }
        if (!services) return summary;
        for (const uid of list) {
            let docs = [];
            try {
                const snap = await services.firestore.collection(TOKENS).where("uid", "==", uid).limit(MAX_TOKENS_PER_USER).get();
                docs = snap.docs || [];
            } catch (err) {
                log.warn("[Push] token lookup failed:", err && err.code ? err.code : "error");
                continue;
            }
            for (const d of docs) {
                const data = d.data() || {};
                const result = await sender.send(String(data.token || ""), message);
                if (result.ok) summary.sent += 1;
                else if (result.gone) {
                    summary.dropped += 1;
                    try { await d.ref.delete(); } catch (_) { /* best effort */ }
                    log.warn("[Push] dropped token %s (%s)", shortToken(data.token), result.error || result.status);
                } else if (!result.skipped) {
                    log.warn("[Push] send failed for %s: %s", shortToken(data.token), result.error || result.status);
                }
            }
        }
        return summary;
    }

    async function adminUids(firestore, ownerUid) {
        const uids = new Set([ownerUid]);
        try {
            const snap = await firestore.collection("admins").limit(50).get();
            for (const d of snap.docs || []) uids.add(d.id);
        } catch (_) { /* owner only */ }
        return Array.from(uids);
    }

    return { tokenId, saveToken, sendToUsers, adminUids };
}

function bearerToken(req) {
    const authz = String(req.header("Authorization") || "");
    return authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
}

async function verifiedUser(req, services) {
    const idToken = bearerToken(req);
    if (!idToken) return null;
    try { return await services.auth.verifyIdToken(idToken); } catch (_) { return null; }
}

/** POST /api/push/subscribe-native { token } — signed-in users only. */
function createSubscribeNativeHandler({ push, getServices }) {
    return async function subscribeNative(req, res) {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const token = String(body.token || "");
        if (!APNS_TOKEN_PATTERN.test(token)) return res.status(400).json({ error: "INVALID_TOKEN" });
        const services = await getServices();
        if (!services) return res.status(503).json({ error: "UNAVAILABLE" });
        const user = await verifiedUser(req, services);
        if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });
        try {
            const id = await push.saveToken(services.firestore, user.uid, token);
            return res.json({ subscribed: true, id });
        } catch (err) {
            console.error("[Push] subscribe failed:", err && err.code ? err.code : "error");
            return res.status(500).json({ error: "SUBSCRIBE_FAILED" });
        }
    };
}

/** POST /api/push/unsubscribe-native { token } — removes the caller's own token. */
function createUnsubscribeNativeHandler({ push, getServices }) {
    return async function unsubscribeNative(req, res) {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const token = String(body.token || "");
        if (!APNS_TOKEN_PATTERN.test(token)) return res.status(400).json({ error: "INVALID_TOKEN" });
        const services = await getServices();
        if (!services) return res.status(503).json({ error: "UNAVAILABLE" });
        const user = await verifiedUser(req, services);
        if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });
        try {
            const ref = services.firestore.collection(TOKENS).doc(push.tokenId(token));
            const snap = await ref.get();
            if (snap.exists && (snap.data() || {}).uid === user.uid) await ref.delete();
            return res.json({ unsubscribed: true });
        } catch (_) {
            return res.status(500).json({ error: "UNSUBSCRIBE_FAILED" });
        }
    };
}

/**
 * POST /api/push/ripple-reply { replyId } — called by the replier right after
 * writing a reply. The server re-reads the reply and its parent, so a caller can
 * only trigger a push for a reply they really wrote, and only to the parent's author.
 */
function createRippleReplyPushHandler({ push, getServices }) {
    return async function rippleReplyPush(req, res) {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const replyId = body.replyId;
        if (typeof replyId !== "string" || !ID_PATTERN.test(replyId)) return res.status(400).json({ error: "INVALID_REPLY" });
        const services = await getServices();
        if (!services) return res.status(503).json({ error: "UNAVAILABLE" });
        const user = await verifiedUser(req, services);
        if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });
        try {
            const reply = await services.firestore.collection("ripples").doc(replyId).get();
            if (!reply.exists) return res.status(404).json({ error: "NOT_FOUND" });
            const r = reply.data() || {};
            if (r.authorId !== user.uid || typeof r.parentId !== "string" || !ID_PATTERN.test(r.parentId)) {
                return res.status(403).json({ error: "FORBIDDEN" });
            }
            const parent = await services.firestore.collection("ripples").doc(r.parentId).get();
            const p = parent.exists ? parent.data() || {} : {};
            const target = typeof p.authorId === "string" ? p.authorId : "";
            if (!target || target === user.uid || target === "anon") return res.json({ notified: false });
            const summary = await push.sendToUsers([target], {
                title: "تفاعلٌ جديد مع فكرتك",
                body: String(r.text || "أضاف أحدهم تطويرًا على فكرتك في تبيان.").slice(0, 140),
                url: "/?tab=ripple",
                tag: `ripple-${String(r.rootId || r.parentId)}`,
            });
            return res.json({ notified: summary.sent > 0 });
        } catch (err) {
            console.error("[Push] ripple reply failed:", err && err.code ? err.code : "error");
            return res.status(500).json({ error: "PUSH_FAILED" });
        }
    };
}

/** POST /api/admin/push { uid, title, body, url } — admins only (admin message / reminder to one user). */
function createAdminPushHandler({ push, getServices, isAdminToken }) {
    return async function adminPush(req, res) {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const { uid, title } = body;
        if (typeof uid !== "string" || !ID_PATTERN.test(uid)) return res.status(400).json({ error: "INVALID_UID" });
        if (typeof title !== "string" || !title.trim() || title.length > 120) return res.status(400).json({ error: "INVALID_TITLE" });
        if (body.body !== undefined && (typeof body.body !== "string" || body.body.length > 400)) return res.status(400).json({ error: "INVALID_BODY" });
        const services = await getServices();
        if (!services) return res.status(503).json({ error: "UNAVAILABLE" });
        const user = await verifiedUser(req, services);
        if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });
        try {
            if (!(await isAdminToken(services.firestore, user))) return res.status(403).json({ error: "FORBIDDEN" });
            const summary = await push.sendToUsers([uid], { title: title.trim(), body: body.body || "", url: safeUrl(body.url), tag: "admin" });
            return res.json(summary);
        } catch (_) {
            return res.status(500).json({ error: "PUSH_FAILED" });
        }
    };
}

module.exports = {
    APNS_PRODUCTION_ORIGIN,
    APNS_SANDBOX_ORIGIN,
    APNS_TOKEN_PATTERN,
    apnsConfigFromEnv,
    apnsProviderToken,
    apnsPayload,
    safeUrl,
    createApnsSender,
    createPushService,
    createSubscribeNativeHandler,
    createUnsubscribeNativeHandler,
    createRippleReplyPushHandler,
    createAdminPushHandler,
};
