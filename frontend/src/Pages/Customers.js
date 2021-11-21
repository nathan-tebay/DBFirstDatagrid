import "bootstrap/dist/css/bootstrap.css";
import EditModal from "../Components/EditModal/EditModal.js";
import DataGrid from "../Components/DataGrid/DataGrid.js";

import React, { useState } from "react";

function Customers() {
  const pageName = "Customer";
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  return (
    <>
      <h2>{pageName}s</h2>
      <DataGrid
        table="customers"
        setFieldsData={handleSetField}
        setLoadingState={handleSetLoading}
        setShowEditModal={handleShowEditModal}
      ></DataGrid>

      <EditModal
        fields={fields}
        hideEditModal={hideEditModal}
        showEditModal={showEditModal}
        table={"customers"}
      ></EditModal>

      {loading ? <h3>Loading...</h3> : ""}
    </>
  );
}

export default Customers;
