import "./App.css";
import { Route } from "react-router-dom";
import Customers from "./Pages/Customers.js";
import Orders from "./Pages/Orders.js";
import Inventory from "./Pages/Inventory.js";
import Data from "./Pages/Data.js";
import Home from "./Pages/Home.js";

function App() {
  return (
    <div className="App">
      <Route path="/customers" component={Customers} />
      <Route path="/orders" component={Orders} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/data" component={Data} />
      <Route path="/" exact component={Home} />
    </div>
  );
}

export default App;
