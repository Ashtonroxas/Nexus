import React, { useEffect, useState } from "react";
import {
  X,
  ClipboardCheck,
  UserCircle2,
  Calendar,
  Circle,
  Star,
  ChevronDown,
} from "lucide-react";
import styles from "./CreateTaskModal.module.css";

const INITIAL = {
  title: "",
  description: "",
  assignee: "",
  dueDate: "",
  status: "To Do",
  complexity: "Low",
};

function CreateTaskModal({ isOpen, onClose, onCreateTask }) {
  const [form, setForm] = useState(INITIAL);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showComplexityDropdown, setShowComplexityDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL);
      setShowComplexityDropdown(false);
      setShowStatusDropdown(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimTitle = form.title.trim();
    const trimDesc = form.description.trim();
    const trimAssignee = form.assignee.trim();

    if (!trimTitle) return;

    onCreateTask({
      title: trimTitle,
      description: trimDesc,
      assignee: trimAssignee,
      dueDate: form.dueDate,
      status: form.status,
      complexity: form.complexity,
    });
    onClose();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "In Progress":
        return styles.statusInProgress;
      case "Done":
        return styles.statusDone;
      case "To Do":
      default:
        return styles.statusTodo;
    }
  }

  const getComplexityClass = (complexity) => {
    switch (complexity) {
      case "Severe":
        return styles.complexitySevere;
      case "High":
        return styles.complexityHigh;
      case "Medium":
        return styles.complexityMedium;
      case "Low":
      default:
        return styles.complexityLow;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <ClipboardCheck size={18} className={styles.titleIcon} />

            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={styles.titleInput}
              placeholder="Enter task title..."
            />
          </div>

          <X
            size={20}
            color="#6B7280"
            role="button"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={styles.textarea}
              placeholder="Add a short description..."
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldRowLabel}>
              <UserCircle2 size={17} className={styles.rowIconPurple} />
              <span>Assignee</span>
            </div>

            <input
              type="text"
              value={form.assignee}
              onChange={(e) => handleChange("assignee", e.target.value)}
              className={styles.compactInput}
              placeholder="Assign..."
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldRowLabel}>
              <Calendar size={17} className={styles.rowIconGray} />
              <span>Due Date</span>
            </div>

            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className={styles.compactInput}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldRowLabel}>
              <Circle
                size={14}
                className={styles.rowIconGreen}
                fill="currentColor"
              />
              <span>Status</span>
            </div>

            <div className={styles.dropdownContainer}>
              <div
                className={styles.pillField}
                onClick={() => {
                  setShowStatusDropdown((prev) => !prev);
                  setShowComplexityDropdown(false);
                }}
              >
                <div className={styles.pillFieldLeft}>
                  <span
                    className={`${styles.statusDot} ${getStatusClass(form.status)}`}
                  />
                  <span>{form.status}</span>
                </div>

                <ChevronDown size={16} className={styles.selectChevron} />
              </div>

              {showStatusDropdown && (
                <div className={styles.dropdownMenu}>
                  {["To Do", "In Progress", "Done"].map((option) => (
                    <div
                      key={option}
                      className={styles.dropdownItem}
                      onClick={() => {
                        handleChange("status", option);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <span
                        className={`${styles.statusDot} ${getStatusClass(option)}`}
                      />
                      <span>{option}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldRowLabel}>
              <Star size={17} className={styles.rowIconOrange} />
              <span>Complexity</span>
            </div>

            <div className={styles.dropdownContainer}>
              <div
                className={styles.pillField}
                onClick={() => {
                  setShowComplexityDropdown((prev) => !prev);
                  setShowStatusDropdown(false);
                }}
              >
                <div className={styles.pillFieldLeft}>
                  <span
                    className={`${styles.complexityPill} ${getComplexityClass(form.complexity)}`}
                  >
                    {form.complexity}
                  </span>
                </div>

                <ChevronDown size={16} className={styles.selectChevron} />
              </div>

              {showComplexityDropdown && (
                <div className={styles.dropdownMenu}>
                  {["Low", "Medium", "High", "Severe"].map((option) => (
                    <div
                      key={option}
                      className={styles.dropdownItem}
                      onClick={() => {
                        handleChange("complexity", option);
                        setShowComplexityDropdown(false);
                      }}
                    >
                      <span
                        className={`${styles.complexityPill} ${getComplexityClass(option)}`}
                      >
                        {option}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.createButton}
              disabled={!form.title.trim()}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTaskModal;