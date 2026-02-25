import React, { useState } from "react";

import DataGrid from "../Components/DataGrid/DataGrid.js";

function Data() {
  const [loading, setLoading] = useState(true);

  const handleSetLoading = (value) => {
    setLoading(value);
  };

  return (
    <>
      <h2 className="w-100">Can Weights</h2>
      <br />

      <DataGrid
        table="canWeights"
        setLoadingState={handleSetLoading}
      ></DataGrid>
      {loading ? <h3>Loading...</h3> : ""}
    </>
  );
}

export default Data;
