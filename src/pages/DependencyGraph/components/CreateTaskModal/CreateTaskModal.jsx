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

function CreateTaskModal({ isOpen, onClose, onCreateTask, teamMembers = [] }) {
  const [form, setForm] = useState(INITIAL);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showComplexityDropdown, setShowComplexityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false); // New state

  // Clears create task modal upon clicking the new button
  // to ensure no leftover information
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL);
      setShowComplexityDropdown(false);
      setShowStatusDropdown(false);
      setShowAssigneeDropdown(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // UI state form settings based on field changes
  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // On submit, sanitize inputs and store information
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

  // Helper to get appropriate styling based on status
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

  // Helper to get appropriate styling based on complexity
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

  // Get today's date in YYYY-MM-DD format to restrict past dates
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.titleRow}>
            {/* Task title and icon row */}
            <ClipboardCheck size={18} className={styles.titleIcon} />
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={styles.titleInput}
              placeholder="Enter task title..."
            />
          </div>
          {/* Cancel functionality (user freedom) */}
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

        {/* Editable Description row */}
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

          {/** Assignee row - USING CUSTOM DROPDOWN UI */}
          <div className={styles.fieldRow}>
            <div className={styles.fieldRowLabel}>
              <UserCircle2 size={17} className={styles.rowIconPurple} />
              <span>Assignee</span>
            </div>

            <div className={styles.dropdownContainer}>
              <div
                className={styles.compactInput}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => {
                  setShowAssigneeDropdown((prev) => !prev);
                  setShowStatusDropdown(false);
                  setShowComplexityDropdown(false);
                }}
              >
                <span style={{ color: form.assignee ? '#111827' : '#9CA3AF' }}>
                  {form.assignee || "Assign..."}
                </span>
                <ChevronDown size={16} className={styles.selectChevron} />
              </div>

              {/* Conditional rendering for assignee dropdown */}
              {showAssigneeDropdown && (
                <div className={styles.dropdownMenu}>
                  <div
                    className={styles.dropdownItem}
                    onClick={() => {
                      handleChange("assignee", "");
                      setShowAssigneeDropdown(false);
                    }}
                  >
                    <span>Unassigned</span>
                  </div>
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className={styles.dropdownItem}
                      onClick={() => {
                        handleChange("assignee", member.name);
                        setShowAssigneeDropdown(false);
                      }}
                    >
                      <span>{member.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deadline row */}
          <div className={styles.fieldRow}>
            <div className={styles.fieldRowLabel}>
              <Calendar size={17} className={styles.rowIconGray} />
              <span>Deadline</span>
            </div>

            <input
              type="date"
              min={today}
              value={form.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className={styles.compactInput}
            />
          </div>

          {/* Status row */}
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
                  setShowAssigneeDropdown(false);
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

              {/* Conditional rednering for status dropdown */}
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

          {/* Complexity row */}
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
                  setShowAssigneeDropdown(false);
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

              {/* Conditional rendering for complexity dropdown */}
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

          {/* Action button row (cancel and submit) */}
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