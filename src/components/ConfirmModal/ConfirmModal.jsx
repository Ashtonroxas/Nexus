import { Modal, Button } from "react-bootstrap";
import styles from "./ConfirmModal.module.css"

function ConfirmModal({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  }) {
  return (
    <Modal show={show} onHide={onHide} centered className={styles.modalRoot}>
      {/* Header information */}
      <Modal.Header closeButton>
        <Modal.Title className={styles.modalTitle}>{title}</Modal.Title>
      </Modal.Header>

      {/* Rendering custom prop message */}
      <Modal.Body>{message}</Modal.Body>

      {/* Action button footer sections */}
      <Modal.Footer>
        <Button className={styles.cancelButton} onClick={onHide}>
          {cancelText}
        </Button>
        <Button className={styles.confirmButton} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmModal;