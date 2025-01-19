import axios from 'axios';
import { useState } from 'react';
import config from '../config';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();

    const user = {
      username,
      password,
    };

    const { data } = await axios.post(
      `${config.DJANGO_SERVER_URL}/token/`,
      user,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      },
    );
    console.log(data);

    // Initialize the access & refresh token in localstorage.
    localStorage.clear();
    window.electron.updateLocalStorage('clear', null, null);

    localStorage.setItem('access_token', data.access);
    window.electron.updateLocalStorage('set', 'access_token', data.access);

    localStorage.setItem('refresh_token', data.refresh);
    window.electron.updateLocalStorage('set', 'refresh_token', data.refresh);

    axios.defaults.headers.common.Authorization = `Bearer ${data.access}`;
    window.location.href = '/';
  };

  return (
    <div className="Auth-form-container">
      <form className="Auth-form" onSubmit={submit}>
        <div className="Auth-form-content">
          <h3 className="Auth-form-title">Sign In</h3>
          <div className="form-group mt-3">
            <label>Username</label>
            <input
              className="form-control mt-1"
              placeholder="Enter Username"
              name="username"
              type="text"
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group mt-3">
            <label>Password</label>
            <input
              name="password"
              type="password"
              className="form-control mt-1"
              placeholder="Enter password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="d-grid gap-2 mt-3">
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => window.location.href = '/register'}>
              Register
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
