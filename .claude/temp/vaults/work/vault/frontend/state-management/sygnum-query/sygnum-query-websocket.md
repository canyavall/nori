# Sygnum Query Websocket

<!--
Migrated from: temp-FE-Mono/technical/sygnum-query/sygnum-query-websocket.md
Migration date: 2025-12-08
Original category: technical/sygnum-query
New category: patterns/sygnum/sygnum-query
Source repo: temp-FE-Mono
-->

# Sygnum Query - WebSocket

WebSocket integration for real-time data.

## Setup

```typescript
import { useSygnumWebsocketData } from '@sygnum/sygnum-query/hooks/useSygnumWebsocketData';

const { data, isConnected, error } = useSygnumWebsocketData({
  url: WS_ENDPOINTS.marketData,
  queryKey: [...queryKey, 'live'],
  enabled: true,
  onMessage: (data) => console.log(data),
});
```

## Cache Integration

```typescript
// Seed cache from WebSocket
useSygnumWebsocketData({
  url: WS_ENDPOINTS.prices,
  queryKey: priceQueryKey,
  onMessage: (data) => {
    queryClient.setQueryData(priceQueryKey, data);
  },
});
```

## Connection Management

```typescript
const { isConnected, reconnect } = useSygnumWebsocketData({
  url: wsUrl,
  queryKey,
  reconnectAttempts: 3,
  reconnectInterval: 1000,
});
```
