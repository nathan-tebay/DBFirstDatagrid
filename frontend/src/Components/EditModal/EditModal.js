import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import EditForm from "../EditorForm/EditorForm";
import { camelCaseToLabel } from "../../shared";

function EditModal({ hideEditModal, fields, showEditModal, table }) {
  const handleEditModalSave = () => {
    document.querySelector("#addEditSubmit").click();
  };

  return (
    <Modal show={showEditModal}>
      <Modal.Header>
        <Modal.Title id="addEditTitle">
          Add/Edit {camelCaseToLabel(table)}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body id="modalBody">
        {fields ? (
          <EditForm
            fields={fields}
            saveComplete={hideEditModal}
            table={table}
          ></EditForm>
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
