// Reporting of public ripples (App Store guideline 1.2, user-generated content).
//
// Shared by the Cloud Function `api` (functions/index.js) and the Express
// server (server.ts); like accountDeletion.js it has no require() of its own:
// the host injects `getServices` (firebase-admin auth + firestore), so the same
// file bundles into the ESM server build and loads in the CommonJS function.
//
// Reports are written ONLY here, with firebase-admin, into `ripple_reports`.
// Firestore rules deny every client read/write of that collection (default
// deny), so nobody can read or forge reports from the browser. Admins read them
// through GET /api/admin/ripple-reports, which verifies the ID token and the
// same admin identities as isAdmin() in firestore.rules.

const REASONS = ["spam", "abuse", "inappropriate", "other"];
const NOTE_MAX = 500;
const EXCERPT_MAX = 300;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

const OWNER_UID = "VfYbpLBoYFQGoVyBVOlMfVCESdm1";
const ADMIN_EMAILS = [
    "alfailakawidrahmad@gmail.com",
    "alfailakawidrahmad@outlook.com",
    "dr.ahmad@gmail.com",
    "dr.ahmad.alfailakawi@gmail.com",
    "ah_f@hotmail.com",
];

function bearerToken(req) {
    const authz = String(req.header("Authorization") || "");
    return authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
}

// Anonymous visitors may report; a presented token must be valid.
function createReportRippleHandler({ getServices, now = () => Date.now() }) {
    return async function reportRipple(req, res) {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const { rippleId, reason, note } = body;
        if (typeof rippleId !== "string" || !ID_PATTERN.test(rippleId)) {
            return res.status(400).json({ error: "INVALID_RIPPLE" });
        }
        if (typeof reason !== "string" || !REASONS.includes(reason)) {
            return res.status(400).json({ error: "INVALID_REASON" });
        }
        if (note !== undefined && note !== null && (typeof note !== "string" || note.length > NOTE_MAX)) {
            return res.status(400).json({ error: "INVALID_NOTE" });
        }

        const services = await getServices();
        if (!services) return res.status(503).json({ error: "UNAVAILABLE" });

        let reporterUid = null;
        const idToken = bearerToken(req);
        if (idToken) {
            try {
                reporterUid = (await services.auth.verifyIdToken(idToken)).uid;
            } catch (err) {
                console.warn("[RippleReport] ID token rejected:", err && err.code ? err.code : err);
                return res.status(401).json({ error: "AUTH_REQUIRED" });
            }
        }

        try {
            const ripple = await services.firestore.collection("ripples").doc(rippleId).get();
            if (!ripple.exists) return res.status(404).json({ error: "NOT_FOUND" });
            const data = ripple.data() || {};
            const report = {
                rippleId,
                reason,
                note: typeof note === "string" ? note.trim() : "",
                reporterUid,
                rippleAuthorId: typeof data.authorId === "string" ? data.authorId : null,
                rippleExcerpt: String(data.text || "").slice(0, EXCERPT_MAX),
                status: "new",
                createdAt: new Date(now()),
            };
            const reports = services.firestore.collection("ripple_reports");
            // A signed-in user's repeat report of the same ripple updates one record.
            if (reporterUid) await reports.doc(`${rippleId}__${reporterUid}`).set(report);
            else await reports.add(report);
        } catch (err) {
            console.error("[RippleReport] failed:", err && err.message ? err.message : err);
            return res.status(500).json({ error: "REPORT_FAILED" });
        }
        return res.json({ reported: true });
    };
}

async function isAdminToken(firestore, decoded) {
    if (decoded.uid === OWNER_UID) return true;
    const email = String(decoded.email || "").toLowerCase();
    const provider = decoded.firebase && decoded.firebase.sign_in_provider;
    if (ADMIN_EMAILS.includes(email) && (provider !== "password" || decoded.email_verified === true)) return true;
    const marker = await firestore.collection("admins").doc(decoded.uid).get();
    return !!marker.exists;
}

// Read-only list for the admin area. Non-admins get 403 and no data.
function createListRippleReportsHandler({ getServices }) {
    return async function listRippleReports(req, res) {
        const idToken = bearerToken(req);
        if (!idToken) return res.status(401).json({ error: "AUTH_REQUIRED" });

        const services = await getServices();
        if (!services) return res.status(503).json({ error: "UNAVAILABLE" });

        let decoded;
        try {
            decoded = await services.auth.verifyIdToken(idToken);
        } catch (err) {
            return res.status(401).json({ error: "AUTH_REQUIRED" });
        }
        try {
            if (!(await isAdminToken(services.firestore, decoded))) {
                return res.status(403).json({ error: "FORBIDDEN" });
            }
            const snap = await services.firestore.collection("ripple_reports").orderBy("createdAt", "desc").limit(100).get();
            const reports = snap.docs.map((d) => {
                const v = d.data() || {};
                const created = v.createdAt && typeof v.createdAt.toDate === "function" ? v.createdAt.toDate() : v.createdAt;
                return { id: d.id, ...v, createdAt: created instanceof Date ? created.toISOString() : created || null };
            });
            return res.json({ reports });
        } catch (err) {
            console.error("[RippleReport] list failed:", err && err.message ? err.message : err);
            return res.status(500).json({ error: "LIST_FAILED" });
        }
    };
}

module.exports = {
    createReportRippleHandler,
    createListRippleReportsHandler,
    REASONS,
    NOTE_MAX,
};
