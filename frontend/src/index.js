import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Menu from "./Components/Menu/Menu";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.render(
  <React.StrictMode>
    <Menu />
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

reportWebVitals();
