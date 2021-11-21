import "bootstrap/dist/css/bootstrap.css";
import EditModal from "../Components/EditModal/EditModal.js";
import DataGrid from "../Components/DataGrid/DataGrid.js";

import React, { useState } from "react";

function Inventory() {
  const pageName = "Order";
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTable, setEditTable] = useState("");

  const handleShowEditModal = () => {
    setShowEditModal(true);
  };

  const hideEditModal = () => {
    setShowEditModal(false);
  };

  const handleSetLoading = (value) => {
    setLoading(value);
  };

  const handleSetField = (fields) => {
    setFields(fields);
  };

  const handleSetEditTable = (table) => {
    setEditTable(table);
    setShowEditModal(true);
  };

  return (
    <>
      <h2>{pageName}s</h2>
      <DataGrid
        table="orders"
        setFieldsData={handleSetField}
        setLoadingState={handleSetLoading}
        setEditTable={handleSetEditTable}
        setShowEditModal={handleShowEditModal}
        subgrid="orderItems"
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
