import './App.css';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import LoginForm from './components/LoginForm';
import Home from './components/Home';
import Navigation from './components/NavBar';
import Logout from './components/Logout';
import SearchResults from './components/SearchResults';
import RegisterForm from './components/RegisterForm';

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/register" element={<RegisterForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
