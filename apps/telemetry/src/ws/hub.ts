import type { WebSocket, WebSocketServer } from "ws";
import type { WsMessage } from "../types.js";

export class WsHub {
  private readonly clients = new Set<WebSocket>();

  constructor(wss: WebSocketServer) {
    wss.on("connection", (socket) => {
      this.clients.add(socket);
      const hello: WsMessage = { kind: "hello", serverTime: new Date().toISOString() };
      socket.send(JSON.stringify(hello));
      socket.on("close", () => this.clients.delete(socket));
      socket.on("error", () => this.clients.delete(socket));
    });
  }

  broadcast(message: WsMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === 1) {
        client.send(data);
      }
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }
}
