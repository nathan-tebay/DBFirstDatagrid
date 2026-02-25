import "./App.css";
import { Routes, Route } from "react-router-dom";
import Customers from "./Pages/Customers.js";
import Orders from "./Pages/Orders.js";
import Inventory from "./Pages/Inventory.js";
import Data from "./Pages/Data.js";
import Home from "./Pages/Home.js";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/customers" element={<Customers />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/data" element={<Data />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
