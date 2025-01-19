import { createRoot } from 'react-dom/client';
import App from './App';
import './interceptors/axios';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  const authToken = localStorage.getItem('access_token');
  window.electron.updateLocalStorage('set', 'access_token', authToken);
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
