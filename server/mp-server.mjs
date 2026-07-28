#!/usr/bin/env node
/**
 * TerraBlock multiplayer relay server (WebSocket).
 * npm run mp-server
 */
import { WebSocketServer } from "ws";
import { createServer } from "node:http";

const PORT = Number(process.env.MP_PORT || 8787);
const players = new Map();
let nextId = 1;

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("TerraBlock MP relay OK\n");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  const id = nextId++;
  const state = { id, name: `Player${id}`, x: 0, y: 50, z: 0, yaw: 0, hp: 100 };
  players.set(id, { ws, state });
  ws.send(JSON.stringify({ type: "welcome", id }));
  broadcast({ type: "state", players: [...players.values()].map((p) => p.state) }, null);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    const entry = players.get(id);
    if (!entry) return;

    if (msg.type === "hello") {
      entry.state.name = String(msg.name || entry.state.name).slice(0, 24);
    } else if (msg.type === "player") {
      entry.state.x = Number(msg.x) || 0;
      entry.state.y = Number(msg.y) || 0;
      entry.state.z = Number(msg.z) || 0;
      entry.state.yaw = Number(msg.yaw) || 0;
      entry.state.hp = Number(msg.hp) || 0;
      broadcast({ type: "player", ...entry.state }, id);
    } else if (msg.type === "block") {
      broadcast(
        {
          type: "block",
          x: msg.x | 0,
          y: msg.y | 0,
          z: msg.z | 0,
          id: msg.id | 0,
          from: id,
        },
        id
      );
    } else if (msg.type === "chat") {
      broadcast(
        {
          type: "chat",
          name: entry.state.name,
          text: String(msg.text || "").slice(0, 200),
        },
        null
      );
    }
  });

  ws.on("close", () => {
    players.delete(id);
    broadcast({ type: "leave", id }, null);
  });
});

function broadcast(obj, exceptId) {
  const data = JSON.stringify(obj);
  for (const [id, p] of players) {
    if (exceptId != null && id === exceptId) continue;
    if (p.ws.readyState === 1) p.ws.send(data);
  }
}

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[mp-server] listening on ws://127.0.0.1:${PORT}`);
});
