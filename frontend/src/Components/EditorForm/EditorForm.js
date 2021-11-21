import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Form, Button, Row, Col } from "react-bootstrap";
import React from "react";

function EditForm({ fields, saveComplete, table }) {
  const [validated, setValidated] = useState(false);

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      if (saveComplete) {
      }
    }
    setValidated(true);
  };

  useEffect(
    () =>
      ReactDOM.render(
        addEditor(fields),
        document.getElementById("addEditForm")
      ),
    [fields, table]
  );
  return (
    <Form
      id="addEditForm"
      noValidate
      validated={validated}
      onSubmit={handleSubmit}
    ></Form>
  );
}

export default EditForm;

const addEditor = (fields, subGrid) => {
  let keys = Object.keys(fields);

  const createInputField = (field, props) => {
    let formInput = [];
    let fieldProps = [];

    if (field.length) fieldProps.maxLength = field.length;
    if (field.decimals === 2) fieldProps.step = ".01";
    if (field.name === "id") fieldProps.style = { display: "none" };
    if (field.required && field.name !== "id") fieldProps.required = "required";

    switch (field.type) {
      case "dropdown":
        let options = [];
        options.push(
          React.createElement(
            "option",
            { key: `option${field.name}default` },
            "Select Item"
          )
        );
        field.items?.forEach((item) => {
          let optionProps = {
            value: item.value,
            key: `option${field.name}${item.value}`,
          };

          for (const attribute of Object.keys(item).filter((key) =>
            key.toString().startsWith("data-")
          )) {
            optionProps[attribute] = item[attribute];
          }

          let option = React.createElement("option", optionProps, item.text);
          options.push(option);
        });
        formInput.push(
          React.createElement(Form.Select, { ...props, ...fieldProps }, options)
        );
        break;
      case "number": {
        formInput.push(
          React.createElement(Form.Control, {
            ...props,
            ...fieldProps,
            type: "number",
          })
        );
        break;
      }
      case "date": {
        formInput.push(
          React.createElement(Form.Control, {
            ...props,
            ...fieldProps,
            type: "date",
          })
        );
        break;
      }
      case "time": {
        formInput.push(
          React.createElement(Form.Control, {
            ...props,
            ...fieldProps,
            type: "time",
          })
        );
        break;
      }
      case "datetime": {
        formInput.push(
          React.createElement(Form.Control, {
            ...props,
            ...fieldProps,
            type: "date",
          })
        );
        break;
      }
      case "text": {
        props.type = "text";
        if (field.name.indexOf("email") !== -1) {
          props.type = "email";
        }
        if (parseInt(field.length) > 255) {
          props.as = "textarea";
          props.type = null;
          props.style = { height: "100px" };
        }

        formInput.push(
          React.createElement(Form.Control, { ...props, ...fieldProps })
        );
        break;
      }
      case "boolean": {
        formInput.push(
          React.createElement(Form.Control, {
            ...props,
            ...fieldProps,
            type: "checkbox",
          })
        );
        break;
      }
      default:
    }
    return formInput;
  };

  let formFields = [];
  keys.forEach((key) => {
    let field = fields[key];

    let props = {
      sm: 8,
      key: field.name,
    };

    let formLabel =
      field.name === "id"
        ? []
        : React.createElement(
            Form.Label,
            {
              ...props,
              column: "column",
              sm: 4,
              key: `label${field.name}`,
              className: "text-right",
            },
            field.displayText
          );

    let formFeedbackInvalid =
      field.name !== "id" && field.required
        ? React.createElement(
            Form.Control.Feedback,
            {
              key: `feedbackInvalid${field.name}`,
              type: "invalid",
            },
            `${field.displayText} is required.`
          )
        : [];

    let fieldColDiv = React.createElement(
      Col,
      {
        sm: 8,
        key: `column${field.name}`,
      },
      createInputField(field, props)
    );

    formFields.push(
      React.createElement(
        Form.Group,
        {
          as: Row,
          key: `formGroup${field.name}`,
          className: "mb-2",
          controlId: `${field.name}`,
        },
        [formLabel, fieldColDiv, formFeedbackInvalid]
      )
    );
  });

  formFields.push(
    React.createElement(
      Button,
      {
        key: "submitButton",
        type: "submit",
        id: "addEditSubmit",
        style: { display: "none" },
      },
      "Submit"
    )
  );

  return formFields;
};
