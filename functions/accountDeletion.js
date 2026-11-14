// Self-service account deletion (App Store guideline 5.1.1(v)).
//
// One implementation shared by the Cloud Function `api` (functions/index.js)
// and the Express server (server.ts). It has no require() of its own: the host
// injects `getServices` (firebase-admin auth + firestore), so the same file
// bundles safely into the ESM server build and loads in the CommonJS function.
//
// Authorization model: the ONLY uid ever deleted is the one inside a verified
// Firebase ID token. A uid supplied by the caller is never used to pick the
// target; if one is supplied and differs from the token's uid the request is
// refused with 403.

const REAUTH_WINDOW_SECONDS = 5 * 60;

// Deleted: the user's profile (users/{uid}), admin marker (admins/{uid}), the
// ripples they authored (with their likes subcollections) and the like markers
// they left on other ripples. Their reporterUid on ripple_reports is cleared.
// Kept: anonymous logs (search_logs, ai_logs, analytics) and contact_requests /
// answer_reports, none of which are keyed by uid; replies other people wrote
// under the user's ripples belong to those authors.
async function eraseUserData(firestore, uid) {
    const ripples = await firestore.collection("ripples").where("authorId", "==", uid).get();
    for (const doc of ripples.docs) await firestore.recursiveDelete(doc.ref);

    try {
        const likes = await firestore.collectionGroup("likes").where("userId", "==", uid).get();
        for (const doc of likes.docs) await doc.ref.delete();
    } catch (err) {
        // Like markers hold only the opaque uid; a missing collection-group index must not block deletion.
        console.warn("[AccountDeletion] like markers not removed:", err && err.code ? err.code : err);
    }

    // Reports the user filed keep the moderation record but lose the link to the account.
    try {
        const reports = await firestore.collection("ripple_reports").where("reporterUid", "==", uid).get();
        for (const doc of reports.docs) await doc.ref.update({ reporterUid: null });
    } catch (err) {
        console.warn("[AccountDeletion] reporter ids not cleared:", err && err.code ? err.code : err);
    }

    await firestore.collection("users").doc(uid).delete();
    await firestore.collection("admins").doc(uid).delete();
}

function createDeleteAccountHandler({ getServices, now = () => Date.now() }) {
    return async function deleteAccount(req, res) {
        const authz = String(req.header("Authorization") || "");
        const idToken = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
        if (!idToken) {
            return res.status(401).json({ error: "AUTH_REQUIRED" });
        }

        const services = await getServices();
        if (!services) return res.status(503).json({ error: "UNAVAILABLE" });

        let decoded;
        try {
            decoded = await services.auth.verifyIdToken(idToken);
        } catch (err) {
            console.warn("[AccountDeletion] ID token rejected:", err && err.code ? err.code : err);
            return res.status(401).json({ error: "AUTH_REQUIRED" });
        }

        const uid = decoded.uid;
        const claimed = (req.body && req.body.uid) ?? (req.query && req.query.uid);
        if (claimed !== undefined && claimed !== uid) {
            return res.status(403).json({ error: "FORBIDDEN" });
        }

        // Deleting an account is irreversible: require a sign-in from the last few minutes.
        const authTime = Number(decoded.auth_time || 0);
        if (!authTime || authTime * 1000 < now() - REAUTH_WINDOW_SECONDS * 1000) {
            return res.status(401).json({ error: "REAUTH_REQUIRED" });
        }

        try {
            await eraseUserData(services.firestore, uid);
            await services.auth.deleteUser(uid);
        } catch (err) {
            console.error("[AccountDeletion] failed:", err && err.message ? err.message : err);
            return res.status(500).json({ error: "DELETE_FAILED" });
        }
        return res.json({ deleted: true });
    };
}

module.exports = { createDeleteAccountHandler, eraseUserData, REAUTH_WINDOW_SECONDS };
