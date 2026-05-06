import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

import "./Menu.css";

const logo = `${process.env.PUBLIC_URL}/dbfirstgridlogo.png`;

function Menu() {
  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="float-left">
          <img src={logo} className="logo" alt="logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav float-right">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/customers">
              <h3>Customers</h3>
            </Nav.Link>
            <Nav.Link as={Link} to="/orders">
              <h3>Orders</h3>
            </Nav.Link>
            <Nav.Link as={Link} to="/inventory">
              <h3>Inventory</h3>
            </Nav.Link>
            <Nav.Link as={Link} to="/data">
              <h3>Data</h3>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Menu;
