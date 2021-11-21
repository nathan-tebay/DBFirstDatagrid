import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import React, { useEffect, useState } from "react";
import { PlusCircle, DashCircle } from "react-bootstrap-icons";
import ReactDOM from "react-dom";
import { camelCaseToLabel } from "../../shared";
import Paginator from "../Paginator/Paginator.js";

function DataGrid({
  table,
  setFieldsData,
  setLoadingState,
  setEditTable,
  subgrid,
  parentKey,
  parentId,
}) {
  const [gridLoading, setGridLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);

  const handleSetPageNumber = (page) => {
    setPageNumber(page);
  };

  const handleSetGridLoading = (loading) => {
    setGridLoading(loading);
  };

  useEffect(() => {
    let gridName = parentKey
      ? `subgrid${parentKey.replace("Id", "")}_${parentId}`
      : `datagrid_${table}`;
    buildGrid(
      table,
      gridName,
      subgrid,
      parentKey && parentId ? `${parentKey}=${parentId}` : null
    )
      .then((results) => {
        let fields = JSON.parse(results[0]);
        let count = JSON.parse(results[1]);
        if (setLoadingState) setLoadingState(false);
        if (setFieldsData) setFieldsData(fields);
        if (subgrid) {
          let subgridToggles =
            document.getElementsByClassName("subgrid-toggle");
          for (const toggle of subgridToggles) {
            let parentId = toggle.id.split("_")[1];
            toggle.classList.add("closed");
            ReactDOM.render(
              <PlusCircle
                onClick={() => toggleSubgrid(subgrid, table, parentId)}
              />,
              document.getElementById(toggle.id)
            );
          }

          let toggleAll = document.getElementById("subgridToggleAll");
          toggleAll.classList.add("closed");
          ReactDOM.render(
            <PlusCircle onClick={() => toggleSubgridAll()} />,
            document.getElementById(toggleAll.id)
          );
        }

        let footerComponents = [];

        if (count > 100) {
          footerComponents.push(
            <Paginator
              key={`${gridName}_paginator`}
              itemCount={count}
              page={pageNumber}
              setPageNumber={handleSetPageNumber}
              gridName={gridName}
            />
          );
        }

        if (table !== "canWeights") {
          footerComponents.push(
            <Button
              key={`${gridName}_addButton`}
              variant="secondary"
              onClick={() => {
                setEditTable(table);
                if (setFieldsData) setFieldsData(fields);
              }}
            >
              Add {camelCaseToLabel(table)}
            </Button>
          );
        }
        if (footerComponents.length > 0) {
          ReactDOM.render(
            footerComponents,
            document.getElementById(`${gridName}_footer`)
          );
        }
      })
      .catch((error) => console.log(error));
  }, [pageNumber]);

  //used to replace click event since React does not honor them.
  const mouseClickEvents = ["mousedown", "click", "mouseup"];
  function simulateMouseClick(element) {
    mouseClickEvents.forEach((mouseEventType) =>
      element.dispatchEvent(
        new MouseEvent(mouseEventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1,
        })
      )
    );
  }

  function toggleSubgridAll() {
    let toggleAll = document.getElementById("subgridToggleAll");
    let subgridToggles = document.getElementsByClassName("subgrid-toggle");
    for (const toggle of subgridToggles) {
      if (toggleAll.classList.contains("closed")) {
        toggleAll.classList.remove("closed");
        toggleAll.classList.add("open");
        ReactDOM.render(
          <DashCircle onClick={() => toggleSubgridAll()} />,
          toggleAll
        );
        if (toggle.classList.contains("closed")) {
          simulateMouseClick(document.getElementById(toggle.id).firstChild);
        }
      } else {
        toggleAll.classList.add("closed");
        toggleAll.classList.remove("open");
        ReactDOM.render(
          <PlusCircle onClick={() => toggleSubgridAll()} />,
          toggleAll
        );
        if (toggle.classList.contains("open")) {
          simulateMouseClick(document.getElementById(toggle.id).firstChild);
        }
      }
    }
  }

  function toggleSubgrid(table, parentTable, parentId) {
    let toggle = document.getElementById(`subgridToggle_${parentId}`);
    let subgridRow = document.getElementById(`subgridRow_${parentId}`);

    if (toggle.classList.contains("closed")) {
      ReactDOM.render(
        <DataGrid
          table={table}
          parentKey={parentTable + "Id"}
          parentId={parentId}
          setLoadingState={handleSetGridLoading}
          setEditTable={setEditTable}
          setFieldsData={setFieldsData}
        />,
        subgridRow,
        () => {
          subgridRow.parentElement.classList.remove("hidden");
          let toggle = document.getElementById(`subgridToggle_${parentId}`);
          toggle.classList.remove("closed");
          toggle.classList.add("open");
          ReactDOM.render(
            <DashCircle
              onClick={() => toggleSubgrid(subgrid, parentTable, parentId)}
            />,
            toggle
          );
        }
      );
    } else {
      subgridRow.parentElement.classList.add("hidden");
      toggle.classList.add("closed");
      toggle.classList.remove("open");
      ReactDOM.render(
        <PlusCircle
          onClick={() => toggleSubgrid(subgrid, parentTable, parentId)}
        />,
        toggle
      );
    }
  }

  return (
    <>
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
          ></Table>
        </div>
      )}
    </>
  );
}

export default DataGrid;

const buildGrid = (table, gridName, subgrid, where) => {
  return new Promise((resolve, reject) => {
    fetch("fetchFields?" + encodeURI(`table=${table}`))
      .then((res) => res.json())
      .then((fields) => {
        let fieldsObject = JSON.parse(fields);
        let domTable = document.querySelector(`#${gridName}`);
        domTable.innerText = "";
        domTable.append(addTableHeader(fieldsObject, subgrid));
        fetch(
          "fetch?" +
            encodeURI(`table=${table}${where ? `&where=${where}` : ""}`)
        )
          .then((res) => res.json())
          .then((data) => {
            let dataObject = JSON.parse(data);
            domTable.append(addTableBody(dataObject, fieldsObject, subgrid));
            domTable.append(addTableFooter(fields, gridName));

            resolve([fields, dataObject[0]?.count || 0]);
          })
          .catch((error) => reject(error));
      })
      .catch((error) => reject(error));
  });
};

const addTableFooter = (fields, gridName) => {
  let footer = document.createElement("tfoot");
  let tr = document.createElement("tr");
  let colspan = JSON.parse(fields).length;
  let td = document.createElement("td");
  td.setAttribute("id", `${gridName}_footer`);
  td.setAttribute("colspan", colspan);
  tr.append(td);
  footer.append(tr);
  return footer;
};

const addTableHeader = (fields, subgrid) => {
  let head = document.createElement("thead");
  let tr = document.createElement("tr");
  let keys = Object.keys(fields);
  keys.forEach((key) => {
    let th = document.createElement("th");
    if (fields[key].name === "id") {
      if (subgrid) {
        th.setAttribute("id", "subgridToggleAll");
      } else {
        th.classList.add("hidden");
      }
    } else {
      th.innerText = fields[key].displayText;
    }
    tr.append(th);
  });
  head.append(tr);
  return head;
};

const addTableBody = (data, fields, subgrid) => {
  let body = document.createElement("tbody");

  let keys = Object.keys(fields);

  if (data.length === 0) {
    let tr = document.createElement("tr");
    let td = document.createElement("td");
    td.setAttribute("colspan", keys.length);
    td.style.textAlign = "center";
    td.innerHTML = "<h2>No records found.</h2>";
    tr.append(td);
    body.append(tr);
  }

  data.forEach((element) => {
    let tr = document.createElement("tr");
    keys.forEach((key) => {
      let td = document.createElement("td");

      if (fields[key].name === "id") {
        if (subgrid) {
          td.classList.add("subgrid-toggle");
          td.setAttribute("id", `subgridToggle_${element[fields[0].name]}`);
        } else {
          td.classList.add("hidden");
        }
      }

      if (fields[key].type === "dropdown") {
        td.innerText = fields[key].items[element[fields[key].name]];
      } else if (fields[key].type === "date") {
        td.innerText = element[fields[key].name].replace(
          /(\d+)-(\d+)-(\d+).*/,
          "$2/$3/$1"
        );
      } else {
        if (fields[key].name !== "id") td.innerText = element[fields[key].name];
      }
      tr.append(td);
    });
    body.append(tr);

    if (subgrid) {
      let tr = document.createElement("tr");
      tr.classList.add("hidden");
      let td = document.createElement("td");
      td.setAttribute("colspan", keys.length);
      td.classList.add("subgrid-row");
      td.setAttribute("id", `subgridRow_${element[fields[0].name]}`);
      tr.append(td);
      body.append(tr);
    }
  });
  return body;
};
