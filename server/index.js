import * as db from "./utils/databaseAPI.js";

import express from "express";

const PORT = process.env.PORT || 3001;
const app = express();

app.get("/fetch*", (req, res) => {
  const query = req.query;
  if (!query.table) {
    res.json({ message: "A table is required in the querystring. " });
    res.status = 400;
  }

  switch (req.path) {
    case "/fetch":
      db.fetchData(
        query.table,
        query.fields?.split(",") || null,
        query.where || null,
        query.page || null
      ).then((data) => {
        res.json(JSON.stringify(data));
      });
      break;
    case "/fetchFields":
      db.fetchFields(query.table, query.fields?.split(",") || null).then(
        (data) => {
          res.json(JSON.stringify(data));
        }
      );
      break;
    case "/fetchDistinct":
      db.fetchDistinct(
        query.table,
        query.fields?.split(",") || null,
        query.where || null
      ).then((data) => {
        res.json(JSON.stringify(data));
      });
      break;
  }
});

app.put("/add", (req, res) => {
  const query = req.query;
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
