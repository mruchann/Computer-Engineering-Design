import { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import FileUpload from './FileUpload';
import SeededFiles from './SeededFiles';
import config from '../config';

const Home = () => {

  useEffect(() => {
    if (localStorage.getItem('access_token') === null) {
      window.location.href = '/login';
    } else {
      window.electron.startWatching();
    }
  }, []);

  const sendRequest = async () => {
    await axios.get(`${config.DJANGO_SERVER_URL}/send-magnet/`);
  };

  return (
    <div className="form-signin mt-5 text-center">
      <Button variant="primary" onClick={sendRequest}>
        Try send magnet
      </Button>
      <FileUpload />
      <SeededFiles />
    </div>
  );
};

export default Home;
