import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import React, { useEffect, useState } from "react";
import { PlusCircle, DashCircle, PencilSquare, Trash } from "react-bootstrap-icons";
import apiClient from "../../apiClient";
import { camelCaseToLabel } from "../../shared";
import Paginator from "../Paginator/Paginator.js";

function DataGrid({
  table,
  setFieldsData,
  setLoadingState,
  setEditTable,
  setShowEditModal,
  subgrid,
  parentKey,
  parentId,
  refreshKey = 0,
}) {
  const [gridLoading, setGridLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [fields, setFields] = useState([]);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [openSubgrids, setOpenSubgrids] = useState({});
  const [error, setError] = useState(null);
  const [deleteKey, setDeleteKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setGridLoading(true);
    setError(null);
    const where = parentKey && parentId ? `${parentKey}=${parentId}` : null;
    Promise.all([
      apiClient.get("fetchFields", { table }),
      apiClient.get("fetch", { table, where, page: pageNumber }),
    ])
      .then(([f, d]) => {
        if (!mounted) return;
        setFields(f || []);
        setData(d || []);
        setTotalCount(d?.[0]?.count || 0);
        if (setLoadingState) setLoadingState(false);
        if (setFieldsData) setFieldsData(f || []);
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Failed to load data.");
        console.error(err);
      })
      .finally(() => {
        if (mounted) setGridLoading(false);
      });
    return () => (mounted = false);
  }, [table, parentKey, parentId, pageNumber, refreshKey, deleteKey]);

  const handleSetPageNumber = (page) => setPageNumber(page);

  const handleAdd = () => {
    if (setEditTable) setEditTable(table);
    if (setFieldsData) setFieldsData(fields);
    if (setShowEditModal) setShowEditModal(true);
  };

  const handleEdit = (row) => {
    const enrichedFields = fields.map((f) => ({ ...f, value: row[f.name] }));
    if (setEditTable) setEditTable(table);
    if (setFieldsData) setFieldsData(enrichedFields);
    if (setShowEditModal) setShowEditModal(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    apiClient.del("delete", { table, id })
      .then(() => setDeleteKey((k) => k + 1))
      .catch((err) => setError(err.message || "Delete failed."));
  };

  const toggleSubgrid = (id) => {
    setOpenSubgrids((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubgridAll = () => {
    const anyClosed = Object.keys(openSubgrids).some((k) => !openSubgrids[k]);
    const newState = {};
    data.forEach((row) => {
      const id = row[fields[0]?.name];
      newState[id] = anyClosed;
    });
    setOpenSubgrids(newState);
  };

  return (
    <>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {gridLoading ? (
        <h3>Loading...</h3>
      ) : (
        <div className="tableFixHead">
          <Table
            striped
            bordered
            hover
            variant="dark"
            className="mb-0"
            id={
              parentKey
                ? `subgrid${parentKey.replace("Id", "")}_${parentId}`
                : `datagrid_${table}`
            }
          >
            <thead>
              <tr>
                {fields.map((f, idx) => {
                  if (f.name === "id") {
                    return (
                      <th key={`th-${idx}`} id={subgrid ? "subgridToggleAll" : undefined}>
                        {subgrid ? (
                          <span onClick={toggleSubgridAll} style={{ cursor: "pointer" }}>
                            {Object.keys(openSubgrids).length > 0 && Object.values(openSubgrids).every(Boolean) ? (
                              <DashCircle />
                            ) : (
                              <PlusCircle />
                            )}
                          </span>
                        ) : (
                          <span className="hidden" />
                        )}
                      </th>
                    );
                  }
                  return <th key={`th-${idx}`}>{f.displayText}</th>;
                })}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1} style={{ textAlign: "center" }}>
                    <h2>No records found.</h2>
                  </td>
                </tr>
              ) : (
                data.map((row, rIdx) => {
                  const idValue = row[fields[0]?.name];
                  return (
                    <React.Fragment key={`row-${rIdx}-${idValue}`}>
                      <tr>
                        {fields.map((f, cIdx) => {
                          const cellKey = `${rIdx}-${cIdx}`;
                          if (f.name === "id") {
                            return (
                              <td key={cellKey} className={subgrid ? "subgrid-toggle" : "hidden"}>
                                {subgrid ? (
                                  <span onClick={() => toggleSubgrid(idValue)} style={{ cursor: "pointer" }}>
                                    {openSubgrids[idValue] ? <DashCircle /> : <PlusCircle />}
                                  </span>
                                ) : null}
                              </td>
                            );
                          }

                          let display = "";
                          if (f.type === "dropdown") {
                            const items = f.items || [];
                            const found = items.find((it) => String(it.value) === String(row[f.name]));
                            display = found ? found.text || Object.values(found)[1] : "";
                          } else if (f.type === "date") {
                            display = row[f.name]
                              ? String(row[f.name]).replace(/(\d+)-(\d+)-(\d+).*/, "$2/$3/$1")
                              : "";
                          } else {
                            display = f.name !== "id" ? row[f.name] : "";
                          }

                          return (
                            <td key={cellKey}>
                              {display}
                            </td>
                          );
                        })}
                        <td key={`${rIdx}-actions`}>
                          <Button variant="outline-warning" size="sm" onClick={() => handleEdit(row)} style={{ marginRight: "4px" }}>
                            <PencilSquare />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(idValue)}>
                            <Trash />
                          </Button>
                        </td>
                      </tr>

                      {subgrid && openSubgrids[idValue] ? (
                        <tr>
                          <td colSpan={fields.length + 1} className="subgrid-row">
                            <DataGrid
                              table={subgrid}
                              parentKey={`${table}Id`}
                              parentId={idValue}
                              setLoadingState={setGridLoading}
                              setEditTable={setEditTable}
                              setFieldsData={setFieldsData}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td id={`${parentKey ? `subgrid${parentKey.replace("Id", "")}_${parentId}` : `datagrid_${table}`}_footer`} colSpan={fields.length + 1}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {totalCount > 100 && (
                      <Paginator key={`${table}_paginator`} itemCount={totalCount} page={pageNumber} setPageNumber={handleSetPageNumber} gridName={table} />
                    )}
                    {table !== "canWeights" && (
                      <Button variant="secondary" onClick={handleAdd}>
                        Add {camelCaseToLabel(table)}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            </tfoot>
          </Table>
        </div>
      )}
    </>
  );
}

export default DataGrid;
