import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { loadAuthTokens } from '../auth/storage.js';
import { ChatRequest, StreamChunk } from './types.js';
import { estimateTokens } from './tokens.js';

/**
 * Create WebSocket server for Claude chat streaming
 */
export function createChatWebSocket(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade requests
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

    if (pathname === '/chat') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('[Claude] WebSocket connection established');

    ws.on('message', async (data: Buffer) => {
      try {
        const request = JSON.parse(data.toString()) as ChatRequest;

        // Get auth token
        const auth = loadAuthTokens();
        if (!auth) {
          sendError(ws, 'Not authenticated. Please login first.');
          return;
        }

        // Stream chat response
        await streamChat(ws, request, auth.access_token);
      } catch (err) {
        console.error('[Claude] WebSocket error:', err);
        sendError(ws, err instanceof Error ? err.message : 'Unknown error');
      }
    });

    ws.on('close', () => {
      console.log('[Claude] WebSocket connection closed');
    });

    ws.on('error', (err) => {
      console.error('[Claude] WebSocket error:', err);
    });
  });

  return wss;
}

/**
 * Stream chat response using Anthropic SDK
 */
async function streamChat(ws: WebSocket, request: ChatRequest, apiKey: string): Promise<void> {
  try {
    const modelName = request.model || 'claude-sonnet-4-20250514';

    // Create Anthropic provider with API key
    const anthropic = createAnthropic({
      apiKey,
    });

    // Stream response
    const result = streamText({
      model: anthropic(modelName),
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Stream chunks to client
    for await (const chunk of result.textStream) {
      if (ws.readyState === WebSocket.OPEN) {
        const streamChunk: StreamChunk = {
          type: 'chunk',
          content: chunk,
        };
        ws.send(JSON.stringify(streamChunk));
      } else {
        break;
      }
    }

    // Send completion message
    if (ws.readyState === WebSocket.OPEN) {
      const fullText = await result.text;
      const tokens = estimateTokens(fullText);

      const doneChunk: StreamChunk = {
        type: 'done',
        content: fullText,
        tokens,
      };
      ws.send(JSON.stringify(doneChunk));
    }
  } catch (err) {
    console.error('[Claude] Streaming error:', err);
    sendError(ws, err instanceof Error ? err.message : 'Streaming failed');
  }
}

/**
 * Send error to WebSocket client
 */
function sendError(ws: WebSocket, error: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    const errorChunk: StreamChunk = {
      type: 'error',
      error,
    };
    ws.send(JSON.stringify(errorChunk));
  }
}

/**
 * Close WebSocket server gracefully
 */
export function closeWebSocketServer(wss: WebSocketServer): Promise<void> {
  return new Promise((resolve) => {
    wss.clients.forEach((client) => {
      client.close();
    });

    wss.close(() => {
      console.log('[Claude] WebSocket server closed');
      resolve();
    });
  });
}
