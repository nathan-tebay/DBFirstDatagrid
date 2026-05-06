function Home() {
  return <div class="App-intro"><p>This project began as a prototype inventory tracking system developed during the Autorejection initiative, with the goal of exploring ideas ahead of a potential business spin-off. It represents my first full stack web application using React and Node.js.
  </p>
  <p>
  The core concept is a database first approach to UI generation. Changes to the database schema are reflected automatically in the interface. When new fields are added to a table, they are dynamically incorporated into the grid views. Fields that represent relationships, such as InventoryID, are automatically rendered as dropdowns and populated from the corresponding reference tables.
  </p>
  <p>
  While the system was not developed into a fully functional inventory solution, the underlying framework demonstrates a flexible pattern for rapidly building data driven interfaces. As such, it is best viewed as a proof of concept that showcases dynamic schema driven UI generation rather than a complete product.</p></div>;
}

export default Home;
