import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Home from './components/Home';
import WatchesCatalog from './components/WatchesCatalog';
import About from './components/About';
import wmLogo from './brandImages/WMlogo2.png';

const App = () => {
  return (
    <Router>
      <div>
        <div className="logo-container">
          <img src={wmLogo} alt="WM Logo" className="wm-logo-above" />
          <Link to="/" className="navbar-text logo-text">Watch Market</Link>
        </div>
        <nav className="navbar navbar-expand-lg navbar-dark bg-brown">
          <div className="container-fluid">
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav mx-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/catalog">Watches Catalog</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about">About</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<WatchesCatalog />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
