import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import theme from './theme';
import './index.css';
import { WebSocketProvider } from './contexts/WebSocketContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </ChakraProvider>
  </React.StrictMode>
);
