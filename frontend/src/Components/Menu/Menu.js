import logo from "../../Resources/Logo/MAPlogo_BlkWhtStainless_FNL.png";
import { Navbar, Nav, Container } from "react-bootstrap";

import "./Menu.css";

function Menu() {
  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark" sticky="top">
      <Container>
        <Navbar.Brand href="/" className="float-left">
          <img src={logo} className="logo" alt="logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav float-right">
          <Nav className="me-auto">
            <Nav.Link href="/customers">
              <h3>Customers</h3>
            </Nav.Link>
            <Nav.Link href="/orders">
              <h3>Orders</h3>
            </Nav.Link>
            <Nav.Link href="/inventory">
              <h3>Inventory</h3>
            </Nav.Link>
            <Nav.Link href="/data">
              <h3>Data</h3>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Menu;
