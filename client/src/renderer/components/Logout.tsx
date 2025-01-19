import { useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const Logout = () => {
  useEffect(() => {
    (async () => {
      try {
        await axios.post(`${config.DJANGO_SERVER_URL}/logout/`, {
          refresh_token: localStorage.getItem('refresh_token'),
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });

        localStorage.clear();
        window.electron.updateLocalStorage('clear', null, null);

        axios.defaults.headers.common.Authorization = null;
        window.location.href = '/login';
      } catch (e) {
        console.log('Could not logout:', e);
      }
    })();
  }, []);
  return <div />;
};

export default Logout;
