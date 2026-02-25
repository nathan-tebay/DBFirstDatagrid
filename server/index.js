import * as db from "./utils/databaseAPI.js";

import express from "express";

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.json());

app.get("/fetch*", (req, res) => {
  const query = req.query;
  if (!query.table) {
    return res.status(400).json({ message: "A table is required in the querystring." });
  }

  switch (req.path) {
    case "/fetch":
      db.fetchData(
        query.table,
        query.fields?.split(",") || null,
        query.where || null,
        query.page || null
      )
        .then((data) => res.json(data))
        .catch((err) => res.status(500).json({ error: err.message }));
      break;
    case "/fetchFields":
      db.fetchFields(query.table, query.fields?.split(",") || null)
        .then((data) => res.json(data))
        .catch((err) => res.status(500).json({ error: err.message }));
      break;
    case "/fetchDistinct":
      db.fetchDistinct(
        query.table,
        query.fields?.split(",") || null,
        query.where || null
      )
        .then((data) => res.json(data))
        .catch((err) => res.status(500).json({ error: err.message }));
      break;
    default:
      res.status(404).json({ message: "Unknown endpoint." });
  }
});

app.put("/add", (req, res) => {
  const { table, ...data } = req.body || {};
  if (!table) {
    return res.status(400).json({ message: "A table is required in the request body." });
  }
  db.addData(table, data)
    .then((result) => res.json(result))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.patch("/update", (req, res) => {
  const { table, id, ...data } = req.body || {};
  if (!table || !id) {
    return res.status(400).json({ message: "table and id are required in the request body." });
  }
  db.updateData(table, id, data)
    .then((result) => res.json(result))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.delete("/delete", (req, res) => {
  const { table, id } = req.query;
  if (!table || !id) {
    return res.status(400).json({ message: "table and id are required as query parameters." });
  }
  db.deleteData(table, id)
    .then((result) => res.json(result))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app
  .listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  })
  .on("error", function (err) {
    if (err.errno === "EADDRINUSE") {
      console.log("port busy");
    } else {
      console.log(err);
    }
  });
