import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Chatbox from "./Chatbox";
import UsageStatistics from "./UsageStatistics";

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <ul style={styles.navList}>
        <li style={styles.navItem}>
          <Link to="/" style={styles.navLink}>Back to Chatbox</Link>
        </li>
      </ul>
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <Main />
    </Router>
  );
};

const Main = () => {
  const location = useLocation();

  return (
    <div>
      {/* Show Navbar only on /usage-statistics */}
      {location.pathname === "/usage-statistics" && <Navbar />}

      {/* Page Content */}
      <Routes>
        <Route path="/" element={<Chatbox />} />
        <Route path="/usage-statistics" element={<UsageStatistics />} />
      </Routes>
    </div>
  );
};

// Inline styles for navbar
const styles = {
  navbar: {
    background: "#333",
    padding: "10px",
    display: "flex",
    justifyContent: "center",
  },
  navList: {
    listStyle: "none",
    display: "flex",
    gap: "20px",
    margin: 0,
    padding: 0,
  },
  navItem: {
    display: "inline",
  },
  navLink: {
    color: "white",
    textDecoration: "none",
    fontSize: "18px",
    padding: "10px",
    borderRadius: "5px",
    transition: "background 0.3s",
  },
};

export default App;
