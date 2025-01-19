import axios from 'axios';
import config from '../config';

let refresh = false;

axios.interceptors.response.use(
  (resp) => resp,
  async (error: any) => {
    if (error.response.status === 401 && !refresh) {
      refresh = true;
      console.log(localStorage.getItem('refresh_token'));
      const response = await axios.post(
        `${config.DJANGO_SERVER_URL}/token/refresh/`,
        {
          refresh: localStorage.getItem('refresh_token'),
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        },
      );

      if (response.status === 200) {
        axios.defaults.headers.common.Authorization = `Bearer ${response.data.access}`;
        localStorage.setItem('access_token', response.data.access);
        window.electron.updateLocalStorage('set', 'access_token', response.data.access);

        localStorage.setItem('refresh_token', response.data.refresh);
        window.electron.updateLocalStorage('set', 'refresh_token', response.data.refresh);

        return axios(error.config);
      }
    }
    refresh = false;
    return error;
  },
);
