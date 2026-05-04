import { Modal, Button, Form } from "react-bootstrap";
import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./AddModal.module.css";

function AddModal({
  show,
  onHide,
  onConfirm,
  title,
  confirmText,
  cancelText,
  suggestions = [],
}) {
  const [input, setInput] = useState("");
  const [role, setRole] = useState("member");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const results = useMemo(() => {
    const term = input.trim().toLowerCase();
    if (!term) return [];

    return suggestions
      .filter((user) => {
        const nameLower = (user.displayName || "").toLowerCase();
        const emailLower = (user.email || "").toLowerCase();
        return nameLower.startsWith(term) || emailLower.startsWith(term);
      })
      .slice(0, 6);
  }, [input, suggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user) => {
    setInput(user.email || "");
    setDropdownOpen(false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setDropdownOpen(true);
  };

  const handleConfirm = () => {
    const email = input.trim();
    if (!email) {
      return;
    }

    onConfirm({ email, role });
    resetState();
    onHide();
  };

  const handleHide = () => {
    resetState();
    onHide();
  };

  const resetState = () => {
    setInput("");
    setRole("member");
    setDropdownOpen(false);
  };

  return (
    <Modal show={show} onHide={handleHide} centered className={styles.modalRoot}>
      <Modal.Header closeButton>
        <Modal.Title className={styles.modalTitle}>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="addMemberSearch">
            <Form.Label>Search email</Form.Label>
            <div className={styles.searchWrapper} ref={dropdownRef}>
              <Form.Control
                type="text"
                placeholder="Enter email address"
                value={input}
                onChange={handleInputChange}
                autoComplete="off"
              />

              {dropdownOpen && results.length > 0 && (
                <div className={styles.dropdown}>
                  {results.map((user) => (
                    <div
                      key={user.uid || user.email}
                      className={styles.dropdownItem}
                      onMouseDown={() => handleSelect(user)}
                    >
                      <img
                        src={user.imgURL}
                        alt={user.displayName}
                        className={styles.avatar}
                      />
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.displayName}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* no results message only shown after typing with a valid user list */}
              {dropdownOpen && input.trim() && results.length === 0 && input.includes("@") && (
                <div className={styles.noResults}>Press "Send Invite" to invite user</div>
              )}
            </div>
          </Form.Group>

          <div className={styles.roleRow}>
            <span className={styles.modalText}>Role</span>

            <div className={styles.roleButtons}>
              <button
                type="button"
                className={`${styles.roleOption} ${role === "member" ? styles.selected : ""}`}
                onClick={() => setRole("member")}
              >
                Member
              </button>
              <button
                type="button"
                className={`${styles.roleOption} ${role === "admin" ? styles.selected : ""}`}
                onClick={() => setRole("admin")}
              >
                Admin
              </button>
            </div>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button className={styles.cancelButton} onClick={handleHide}>
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
