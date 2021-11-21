import mysql from "mysql";
import mysqlutils from "mysql-utilities";
import * as fs from "fs";
import pluralize from "pluralize";

const connectionDetails = {
  host: process.env.DB_ENDPOINT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "mapequipment",
  ssl: {
    ca: fs.readFileSync("certs/us-east-2-bundle.pem"),
  },
};

const connection = mysql.createConnection(connectionDetails);
mysqlutils.upgrade(connection);
mysqlutils.introspection(connection);

/**
 * Get the field details for the entered table.
 * @param  {String} table required
 *    Name of the table to run the query against.
 * @param  {[String]} fields=null
 *    Array of fields to be to returned from database, will be * if null.
 */
export const fetchFields = (table, fields = null) => {
  return new Promise((resolve, reject) => {
    connection.fields(table, (error, fields) => {
      if (error) {
        reject(error);
      }
      if (fields) {
        resolve(formatFields(fields));
      }
    });
  });
};

/**
 * Query the database
 * @param {String} table required
 *    Name of the table to run the query against.
 * @param  {[String]} fields=null
 *    Array of fields to be to returned from database, will be * if null.
 * @param  {String} where=null
 *    Full where clause that will be add to the SQL select if not null.
 */
export const fetchData = (table, fields = null, where = null, page = null) => {
  return new Promise((resolve, reject) => {
    let pageClause = page ? `LIMIT 100 SKIP ${page}` : "LIMIT 100";
    let whereClause = where ? `WHERE ${where}` : "";
    let fieldList = fields ? fields.join(", ") : "*";
    let countSQL = `(SELECT COUNT(id) FROM ${table} ${whereClause}) as count`;

    const sqlStatement = `SELECT ${fieldList}, ${countSQL} FROM ${table} ${whereClause} ${pageClause}`;
    connection.query(sqlStatement, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

/**
 * @param  {String} table required
 *    Name of the table to run the query against.
 * @param  {[String]} fields=null
 *    Array of fields to be to returned from database, will be * if null.
 * @param  {String} where=null
 *    Full where clause that will be add to the SQL select if not null.
 */
export const fetchDistinct = async (table, field, where = null) => {
  const sqlStatement = `SELECT DISTINCT ${field} FROM ${table} ${
    where ? ` WHERE ${where}` : ""
  }`;

  connection.query(sqlStatement, (error, results) => {
    if (error) {
      console.log(error);
    } else {
      return results;
    }
  });
};
/**
 * Formats fields fas returned from the database to be more consumable on the frontend.
 * @param  {Object} fields
 */
const formatFields = async (fields) => {
  // Used to convert database type to DOM types. This is incomplete but covers those used in my database currently.
  const fieldsTypeMap = new Map([
    ["int", "number"],
    ["tinyint", "number"],
    ["float", "number"],
    ["double", "number"],
    ["decimal", "number"],
    ["date", "date"],
    ["time", "time"],
    ["datetime", "datetime"],
    ["varchar", "text"],
    ["bigint", "text"],
    ["bit", "boolean"],
    ["nvarchar", "text"],
  ]);

  let frontendFields = [];

  let pendingPromises = [];

  for (const fieldName in fields) {
    let frontEndField = {};
    const field = fields[fieldName];
    frontEndField.name = field.Field;
    frontEndField.displayText = camelCaseToLabel(frontEndField.name);
    frontEndField.required = field.Null === "NO";

    if (frontEndField.name.endsWith("Id")) {
      frontEndField.type = "dropdown";
      pendingPromises.push(
        getDropdownValues(frontEndField.name).then(
          (results) => (frontEndField.items = results)
        )
      );
      frontEndField.displayText = camelCaseToLabel(
        frontEndField.name.replace("Id", "")
      );
    }

    const type = field.Type;
    if (type.indexOf("(") !== -1) {
      frontEndField.type = fieldsTypeMap.get(
        type.substring(0, type.indexOf("("))
      );

      if (type.startsWith("decimal"))
        [frontEndField.length, frontEndField.decimals] = type
          .replace(/.*\((\d+),(\d+).*/g, "$1,$2")
          .split(",");
      else frontEndField.length = type.replace(/.*\((\d+).*/g, "$1");
    }

    if (type.indexOf(" ") !== -1) {
      frontEndField.type = fieldsTypeMap.get(
        type.substring(0, type.indexOf(" "))
      );
      if (frontEndField.type === "double")
        frontEndField.length = type.split(" ")[1];
    }

    if (!frontEndField.type) {
      frontEndField.type = fieldsTypeMap.get(type);
    }

    frontendFields.push(frontEndField);
  }
  await Promise.all(pendingPromises);
  return frontendFields;
};

/**
 * Retrieves the dropdown properties for the give table name.
 * @param  {String} tableName
 */
const getDropdownValues = async (tableName) => {
  // List of tables that have foreign keys to them in my database as non-plural(tabel)ID and the value and helper field that will be used for dropdowns.
  // value and text are required in each entry.
  const dropdownsMap = new Map([
    [
      "vendor",
      { value: "id", text: "name", "data-description": "description" },
    ],
    ["orderStatus", { value: "id", text: "status" }],
    [
      "customer",
      {
        value: "id",
        text: "name",
        "data-email": "email",
        "data-contact": "contactName",
        "data-phone": "phone",
      },
    ],
    [
      "shippingCarrier",
      { value: "id", text: "name", estimatedCost: "estimatedCost" },
    ],
    [
      "inventory",
      {
        value: "id",
        text: "inventoryNumber",
        "data-quantity": "quantity",
        "data-unitprice": "unitPrice",
      },
    ],
  ]);

  let table = tableName.replace("Id", "");

  let fieldsArray = [];
  let items = dropdownsMap.get(table);
  for (const property in items) {
    fieldsArray.push(`${items[property]} as '${property}'`);
  }

  let pluralizeTable = true;

  if (table === "inventory") pluralizeTable = false;
  if (pluralizeTable === true) {
    table = pluralize.plural(table);
  }
  return fetchData(table, fieldsArray);
};

/**
 * Convert camel case field names into capitalized and spaced labels.
 * @param  {String} string
 */
const camelCaseToLabel = (string) => {
  string = string.replace(/(.*)([A-Z])(.*)/g, "$1 $2$3");
  string = string[0].toUpperCase() + string.slice(1);

  return string;
};
