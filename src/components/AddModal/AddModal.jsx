import { Modal, Button, Form } from "react-bootstrap";
import { useState, useEffect, useRef, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import styles from "./AddModal.module.css";

function AddModal({
  show,
  onHide,
  onConfirm,
  title,
  confirmText,
  cancelText,
  excludeUids = new Set(),
}) {
  const [input, setInput] = useState("");
  const [role, setRole] = useState("member");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch all users once when the modal opens
  useEffect(() => {
    if (!show) {
      setAllUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      const snap = await getDocs(collection(db, "users"));
      // store uid alongside each user's data
      // pre-lowercase once so the filter doesn't repeat it on every keystroke
      const users = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          nameLower: (data.displayName || "").toLowerCase(),
          emailLower: (data.email || "").toLowerCase(),
        };
      });
      setAllUsers(users);
      setIsLoading(false);
    };

    fetchUsers();
  }, [show]);

  const results = useMemo(() => {
    const term = input.trim().toLowerCase();
    if (!term) return [];
    return allUsers
      .filter((user) => {
        if (excludeUids.has(user.uid)) return false;
        return user.nameLower.startsWith(term) || user.emailLower.startsWith(term);
      })
      .slice(0, 6);
  }, [input, allUsers, excludeUids]);

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
    setSelectedUser(user);
    setInput(user.displayName);
    setDropdownOpen(false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setSelectedUser(null);
    setDropdownOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedUser) {
      return;
    }
    onConfirm({ user: selectedUser, role });
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
    setSelectedUser(null);
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
            <Form.Label>Search by name or email</Form.Label>
            <div className={styles.searchWrapper} ref={dropdownRef}>
              <Form.Control
                type="text"
                placeholder="Start typing..."
                value={input}
                onChange={handleInputChange}
                autoComplete="off"
                // show a subtle loading hint while the initial fetch is in progress
                disabled={isLoading}
              />

              {dropdownOpen && results.length > 0 && (
                <div className={styles.dropdown}>
                  {results.map((user) => (
                    <div
                      key={user.uid}
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
              {dropdownOpen && !isLoading && input.trim() && results.length === 0 && (
                <div className={styles.noResults}>No users found</div>
              )}
            </div>
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
