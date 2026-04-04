import { Modal, Button, Form } from "react-bootstrap";
import { useState } from "react"; 
import styles from "./AddModal.module.css"

function AddModal({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmVariant = "primary",
}) {

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const handleConfirm = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
    alert("Please enter a valid email.");
    return;
  }

    onConfirm({ email, role });
    setEmail("");
    setRole("member");
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered className={styles.modalRoot}>
      <Modal.Header closeButton>
        <Modal.Title className={styles.modalTitle}>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="addMemberEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type = "email"
              placeholder = "Enter email..."
              value = {email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="addMemberRole">
            <Form.Label>Role</Form.Label>
            <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button className={styles.cancelButton} onClick={onHide}>
          {cancelText}
        </Button>
        <Button className={styles.confirmButton} onClick={handleConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddModal;