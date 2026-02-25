import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import React from "react";
import apiClient from "../../apiClient";

const EditForm = forwardRef(function EditForm({ fields, saveComplete, table }, ref) {
  const [validated, setValidated] = useState(false);
  const [values, setValues] = useState({});
  const [saveError, setSaveError] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (!fields) {
      setValues({});
      return;
    }
    const initial = {};
    Object.keys(fields).forEach((k) => {
      const field = fields[k];
      if (field.name === "id") initial[field.name] = field.value || "";
      else if (field.type === "boolean") initial[field.name] = !!field.value;
      else initial[field.name] = field.value ?? "";
    });
    setValues(initial);
    setValidated(false);
    setSaveError(null);
  }, [fields, table]);

  const handleChange = (e, field) => {
    const name = field.name;
    let val;
    if (field.type === "boolean") {
      val = e.target.checked;
    } else {
      val = e.target.value;
    }
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
      setValidated(true);
      return;
    }
    event.preventDefault();
    setValidated(true);
    setSaveError(null);
    try {
      if (values.id) {
        const { id, ...rest } = values;
        await apiClient.patch("update", { table, id, ...rest });
      } else {
        await apiClient.put("add", { table, ...values });
      }
      if (saveComplete) saveComplete();
    } catch (err) {
      setSaveError(err.message || "Save failed. Please try again.");
    }
  };

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (formRef.current) {
        if (typeof formRef.current.requestSubmit === "function") {
          formRef.current.requestSubmit();
        } else {
          const evt = new Event("submit", { bubbles: true, cancelable: true });
          formRef.current.dispatchEvent(evt);
        }
      }
    },
  }));

  if (!fields) return null;

  return (
    <Form ref={formRef} id="addEditForm" noValidate validated={validated} onSubmit={handleSubmit}>
      {saveError && (
        <div className="alert alert-danger" role="alert">
          {saveError}
        </div>
      )}
      {Object.keys(fields).map((k) => {
        const field = fields[k];
        if (field.name === "id") return null;
        const controlId = field.name;
        const required = field.required && field.name !== "id";

        const input = (() => {
          const commonProps = {
            id: controlId,
            value: values[controlId] ?? "",
            onChange: (e) => handleChange(e, field),
            required: required || undefined,
            maxLength: field.length || undefined,
            step: field.decimals === 2 ? ".01" : undefined,
            type: field.type === "number" ? "number" : undefined,
          };

          switch (field.type) {
            case "dropdown":
              return (
                <Form.Select {...commonProps} aria-label={field.displayText}>
                  <option value="">Select Item</option>
                  {field.items?.map((item, idx) => (
                    <option key={`${controlId}-option-${idx}`} value={item.value} {...Object.fromEntries(Object.entries(item).filter(([kk]) => kk.startsWith("data-")))}>
                      {item.text}
                    </option>
                  ))}
                </Form.Select>
              );
            case "date":
              return <Form.Control {...commonProps} type="date" />;
            case "time":
              return <Form.Control {...commonProps} type="time" />;
            case "datetime":
              return <Form.Control {...commonProps} type="datetime-local" />;
            case "number":
              return <Form.Control {...commonProps} type="number" />;
            case "boolean":
              return (
                <Form.Check
                  id={controlId}
                  checked={!!values[controlId]}
                  onChange={(e) => handleChange(e, field)}
                  type="checkbox"
                />
              );
            default:
              if (parseInt(field.length) > 255) {
                return <Form.Control as="textarea" style={{ height: "100px" }} {...commonProps} />;
              }
              return <Form.Control {...commonProps} type={field.name.indexOf("email") !== -1 ? "email" : "text"} />;
          }
        })();

        return (
          <Form.Group as={Row} className="mb-2" controlId={controlId} key={`formGroup-${controlId}`}>
            <Form.Label column sm={4} className="text-right">
              {field.displayText}
            </Form.Label>
            <Col sm={8}>
              {input}
              {required && <Form.Control.Feedback type="invalid">{`${field.displayText} is required.`}</Form.Control.Feedback>}
            </Col>
          </Form.Group>
        );
      })}

      <Button type="submit" style={{ display: "none" }}>Submit</Button>
    </Form>
  );
});

export default EditForm;
