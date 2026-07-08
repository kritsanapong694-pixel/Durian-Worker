import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Track global spreadsheetId to share across different user sessions
  let globalSpreadsheetId: string | null = null;
  const configPath = path.join(process.cwd(), "spreadsheet_config.json");
  try {
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, "utf-8");
      const data = JSON.parse(fileContent);
      globalSpreadsheetId = data.spreadsheetId || null;
      console.log("Loaded global spreadsheet ID from file:", globalSpreadsheetId);
    }
  } catch (e) {
    console.error("Failed to load spreadsheet_config.json:", e);
  }

  // Local storage database for participants
  const participantsPath = path.join(process.cwd(), "participants_db.json");
  let participantsList: any[] = [];
  try {
    if (fs.existsSync(participantsPath)) {
      const fileContent = fs.readFileSync(participantsPath, "utf-8");
      participantsList = JSON.parse(fileContent);
      console.log(`Loaded ${participantsList.length} participants from file-backed storage.`);
    }
  } catch (e) {
    console.error("Failed to load participants_db.json:", e);
  }

  function saveParticipantsList() {
    try {
      fs.writeFileSync(participantsPath, JSON.stringify(participantsList, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write to participants_db.json:", e);
    }
  }

  // Middleware to parse JSON body
  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Participant database endpoints
  app.get("/api/participants", (req, res) => {
    res.json(participantsList);
  });

  app.post("/api/participants", (req, res) => {
    const p = req.body;
    if (!p.participantCode) {
      return res.status(400).json({ error: "Missing participantCode" });
    }

    if (!p.id) {
      p.id = "p_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    }

    // Check if we already have this participant by ID or by (participantCode + docNo)
    const existingIdx = participantsList.findIndex(item => 
      item.id === p.id || 
      (item.participantCode === p.participantCode && item.docNo === p.docNo)
    );

    if (existingIdx !== -1) {
      // Update existing record
      participantsList[existingIdx] = { ...participantsList[existingIdx], ...p };
    } else {
      // Insert new record
      participantsList.push(p);
    }

    saveParticipantsList();
    res.json({ success: true, participant: p });
  });

  app.post("/api/participants/bulk-merge", (req, res) => {
    const incoming = req.body;
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ error: "Request body must be an array of participants" });
    }

    let updatedCount = 0;
    let addedCount = 0;

    for (const p of incoming) {
      if (!p.participantCode) continue;
      
      if (!p.id) {
        p.id = "p_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
      }

      const existingIdx = participantsList.findIndex(item => 
        item.id === p.id || 
        (item.participantCode === p.participantCode && item.docNo === p.docNo)
      );

      if (existingIdx !== -1) {
        participantsList[existingIdx] = { ...participantsList[existingIdx], ...p };
        updatedCount++;
      } else {
        participantsList.push(p);
        addedCount++;
      }
    }

    if (updatedCount > 0 || addedCount > 0) {
      saveParticipantsList();
    }

    res.json({ success: true, updatedCount, addedCount, total: participantsList.length });
  });

  // Global Config sharing endpoints
  app.get("/api/global-config", (req, res) => {
    res.json({ spreadsheetId: globalSpreadsheetId });
  });

  app.post("/api/global-config", (req, res) => {
    const { spreadsheetId } = req.body;
    if (!spreadsheetId) {
      return res.status(400).json({ error: "Missing spreadsheetId" });
    }
    globalSpreadsheetId = spreadsheetId;
    try {
      fs.writeFileSync(configPath, JSON.stringify({ spreadsheetId }), "utf-8");
      console.log("Saved global spreadsheet ID to file:", spreadsheetId);
    } catch (e) {
      console.error("Failed to save spreadsheet_config.json:", e);
    }
    res.json({ success: true, spreadsheetId });
  });

  // Google API Proxy
  app.all("/api/google-proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl || !(targetUrl.startsWith("https://www.googleapis.com/") || targetUrl.startsWith("https://sheets.googleapis.com/"))) {
      return res.status(400).json({ error: "Invalid target URL" });
    }

    const authHeader = req.headers["authorization"];
    const method = req.method;
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"] as string;
    }

    try {
      const fetchOptions: any = {
        method,
        headers,
      };
      if (method !== "GET" && method !== "HEAD") {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);
      const contentType = response.headers.get("content-type") || "";

      res.status(response.status);
      if (contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: error.message || "Internal server error in proxy" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
