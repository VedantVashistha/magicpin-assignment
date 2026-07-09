const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const startTime = Date.now();

const contexts = {
    category: {},
    merchant: {},
    customer: {},
    trigger: {}
};

const conversations = {};

// ---------------- HEALTH ----------------

app.get("/v1/healthz", (req, res) => {

    res.json({
        status: "ok",
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
        contexts_loaded: {
            category: Object.keys(contexts.category).length,
            merchant: Object.keys(contexts.merchant).length,
            customer: Object.keys(contexts.customer).length,
            trigger: Object.keys(contexts.trigger).length
        }
    });

});

// ---------------- METADATA ----------------

app.get("/v1/metadata", (req, res) => {

    res.json({
        team_name: "Vedant",
        team_members: ["Vedant Vashistha"],
        model: "Rule Based",
        approach: "Simple rule-based responder using in-memory storage",
        contact_email: "vedant@example.com",
        version: "1.0.0",
        submitted_at: new Date().toISOString()
    });

});

// ---------------- CONTEXT ----------------

app.post("/v1/context", (req, res) => {

    const { scope, context_id, version, payload } = req.body;

    if (!contexts.hasOwnProperty(scope)) {

        return res.status(400).json({
            accepted: false,
            reason: "invalid_scope"
        });

    }

    const current = contexts[scope][context_id];

    if (current && current.version >= version) {

        return res.status(409).json({
            accepted: false,
            reason: "stale_version",
            current_version: current.version
        });

    }

    contexts[scope][context_id] = {
        version,
        payload
    };

    res.json({
        accepted: true,
        ack_id: `ack_${context_id}_v${version}`,
        stored_at: new Date().toISOString()
    });

});

// ---------------- TICK ----------------

app.post("/v1/tick", (req, res) => {

    // Minimal implementation:
    // Never proactively send messages.

    res.json({
        actions: []
    });

});

// ---------------- REPLY ----------------

app.post("/v1/reply", (req, res) => {

    const { conversation_id, message } = req.body;

    conversations[conversation_id] = message;

    const text = (message || "").toLowerCase();

    if (text.includes("no") ||
        text.includes("not interested") ||
        text.includes("stop")) {

        return res.json({
            action: "end",
            rationale: "Merchant is not interested."
        });

    }

    if (text.includes("later")) {

        return res.json({
            action: "wait",
            wait_seconds: 1800,
            rationale: "Merchant requested more time."
        });

    }

    return res.json({
        action: "send",
        body: "Thank you for your response. We appreciate your feedback.",
        cta: "open_ended",
        rationale: "Basic acknowledgement."
    });

});

// ----------------

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});