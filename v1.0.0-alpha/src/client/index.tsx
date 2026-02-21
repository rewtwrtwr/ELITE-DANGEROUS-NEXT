/**
 * Elite Dangerous NEXT Client Entry Point
 */

import { h, render } from 'preact';
import { App } from './App';
import './styles/hud.css';

// Type declaration for window.EDNext
declare global {
  interface Window {
    EDNext?: {
      version: string;
      debug: boolean;
    };
  }
}

// Mount the app to the DOM
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.style.display = 'block';
  render(h(App, null), rootElement);
}

// Export for debugging / Экспорт для отладки
window.EDNext = {
  version: '1.0.0-alpha',
  debug: true,
};
