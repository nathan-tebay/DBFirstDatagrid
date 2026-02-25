import React, { useRef } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import EditForm from "../EditorForm/EditorForm";
import { camelCaseToLabel } from "../../shared";

function EditModal({ hideEditModal, fields, showEditModal, table, onSaved }) {
  const formRef = useRef(null);

  const handleSaveComplete = () => {
    if (onSaved) onSaved();
    if (hideEditModal) hideEditModal();
  };

  const handleEditModalSave = () => {
    if (formRef.current && typeof formRef.current.submit === "function") {
      formRef.current.submit();
    }
  };

  return (
    <Modal show={showEditModal} onHide={hideEditModal}>
      <Modal.Header>
        <Modal.Title id="addEditTitle">Add/Edit {camelCaseToLabel(table)}</Modal.Title>
      </Modal.Header>
      <Modal.Body id="modalBody">
        {fields ? (
          <EditForm ref={formRef} fields={fields} saveComplete={handleSaveComplete} table={table} />
        ) : (
          ""
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={hideEditModal}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleEditModalSave}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default EditModal;
