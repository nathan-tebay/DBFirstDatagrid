import "bootstrap/dist/css/bootstrap.css";
import EditModal from "../Components/EditModal/EditModal.js";
import DataGrid from "../Components/DataGrid/DataGrid.js";

import React, { useState } from "react";

function Inventory() {
  const pageName = "Inventory";
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTable, setEditTable] = useState("");

  const hideEditModal = () => {
    setShowEditModal(false);
  };

  const handleSetLoading = (value) => {
    setLoading(value);
  };

  const handleSetFields = (fields) => {
    setFields(fields);
  };

  const handleSetEditTable = (table) => {
    setEditTable(table);
    setShowEditModal(true);
  };

  return (
    <>
      <h2>{pageName}</h2>
      <DataGrid
        table="inventory"
        setFieldsData={handleSetFields}
        setLoadingState={handleSetLoading}
        setEditTable={handleSetEditTable}
        subgrid="inventoryOrders"
      ></DataGrid>

      <EditModal
        fields={fields}
        hideEditModal={hideEditModal}
        showEditModal={showEditModal}
        table={editTable}
      ></EditModal>

      {loading ? <h3>Loading...</h3> : ""}
    </>
  );
}

export default Inventory;
