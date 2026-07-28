/**
 * Lightweight multiplayer client — WebSocket sync of positions + block edits.
 * Server: npm run mp-server
 * Connect: ?mp=ws://127.0.0.1:8787&playtest=0
 */
import * as THREE from "three";

export class MultiplayerClient {
  /**
   * @param {import('./Game.js').Game} game
   */
  constructor(game) {
    this.game = game;
    this.ws = null;
    this.id = null;
    this.peers = new Map(); // id -> { mesh, pos }
    this._sendT = 0;
    this.connected = false;
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this._geo = new THREE.CapsuleGeometry(0.3, 0.9, 4, 8);
  }

  connect(url) {
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.game.ui.toast("MP connect failed");
      return;
    }
    this.ws.onopen = () => {
      this.connected = true;
      this.game.ui.toast("Multiplayer connected");
      this.ws.send(JSON.stringify({ type: "hello", name: "Player" }));
    };
    this.ws.onclose = () => {
      this.connected = false;
      this.game.ui.toast("Multiplayer disconnected");
    };
    this.ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      this.onMessage(msg);
    };

    this._applyingRemote = false;
    // hook block sets
    const world = this.game.world;
    const orig = world.setBlock.bind(world);
    world.setBlock = (x, y, z, id) => {
      const ok = orig(x, y, z, id);
      if (ok && this.connected && !this._applyingRemote) {
        this.send({ type: "block", x, y, z, id });
      }
      return ok;
    };
  }

  send(obj) {
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(obj));
  }

  onMessage(msg) {
    if (msg.type === "welcome") {
      this.id = msg.id;
    } else if (msg.type === "state") {
      for (const p of msg.players || []) {
        if (p.id === this.id) continue;
        this.upsertPeer(p);
      }
    } else if (msg.type === "player") {
      if (msg.id === this.id) return;
      this.upsertPeer(msg);
    } else if (msg.type === "block") {
      this._applyingRemote = true;
      try {
        this.game.world.setBlock(msg.x, msg.y, msg.z, msg.id);
      } finally {
        this._applyingRemote = false;
      }
    } else if (msg.type === "chat") {
      this.game.ui.toast(`${msg.name}: ${msg.text}`);
    } else if (msg.type === "leave") {
      const peer = this.peers.get(msg.id);
      if (peer) {
        this.group.remove(peer.mesh);
        peer.mesh.geometry.dispose();
        peer.mesh.material.dispose();
        this.peers.delete(msg.id);
      }
    }
  }

  upsertPeer(p) {
    let peer = this.peers.get(p.id);
    if (!peer) {
      const mat = new THREE.MeshLambertMaterial({ color: 0x74b9ff });
      const mesh = new THREE.Mesh(this._geo, mat);
      this.group.add(mesh);
      peer = { mesh, pos: new THREE.Vector3() };
      this.peers.set(p.id, peer);
    }
    peer.pos.set(p.x, p.y, p.z);
    peer.mesh.position.set(p.x, p.y + 0.85, p.z);
    peer.mesh.rotation.y = p.yaw || 0;
  }

  update(dt) {
    if (!this.connected || !this.game.player) return;
    this._sendT += dt;
    if (this._sendT >= 0.05) {
      this._sendT = 0;
      const p = this.game.player;
      this.send({
        type: "player",
        x: p.pos.x,
        y: p.pos.y,
        z: p.pos.z,
        yaw: p.yaw,
        hp: p.hp,
      });
    }
  }

  chat(text) {
    this.send({ type: "chat", text });
  }
}
