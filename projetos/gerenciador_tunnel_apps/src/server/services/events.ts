import { Response } from 'express';

export interface SSEEvent {
  type: 'notification' | 'app_status' | 'app_log' | 'tunnel_url';
  data: any;
  timestamp: string;
}

class EventManager {
  private clients: Set<Response> = new Set();

  public addClient(res: Response) {
    this.clients.add(res);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  public emit(type: SSEEvent['type'], data: any) {
    const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

export const events = new EventManager();
