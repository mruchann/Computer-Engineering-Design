import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, { useState, useEffect } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function Navigation() {
  const [isAuth, setIsAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = async (event: any) => {
    event.preventDefault();
    console.log('Search query:', searchQuery);

    try {
      const response = await axios.get(`${config.DJANGO_SERVER_URL}/search/`, {
        params: { query: searchQuery },
      });

      navigate('/search-results', { state: { results: response.data } });
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('access_token') !== null) {
      setIsAuth(true);
    }
  }, [isAuth]);

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container fluid>
        <Navbar.Brand href="/">PeerLink</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav
            className="me-auto my-2 my-lg-0"
            style={{ maxHeight: '100px' }}
            navbarScroll
          >
            <Nav.Link href="/">Home</Nav.Link>
            {!isAuth ? (
              <Nav.Link href="/login">Login</Nav.Link>
            ) : (
              <Nav.Link href="/logout">Logout</Nav.Link>
            )}
          </Nav>
          {isAuth ? (
            <Form className="d-flex" onSubmit={handleSearchSubmit}>
              <Form.Control
                type="search"
                placeholder="Search for files..."
                className="me-2"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-success" type="submit">
                Search
              </Button>
            </Form>
          ) : null}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;
