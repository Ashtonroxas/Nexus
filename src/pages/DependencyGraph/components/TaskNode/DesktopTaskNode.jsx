import { Handle, Position } from "@xyflow/react";
import { Calendar, X } from "lucide-react";
import { useState } from "react";
import ConfirmModal from "../../../../components/ConfirmModal/ConfirmModal";
import styles from "./DesktopTaskNode.module.css";

function DesktopTaskNode({ id, data, selected }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleShowDeleteModal = () => setShowDeleteModal(true);
  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  const {
    taskCode = "TASK-000",
    title = "Untitled Task",
    status = "To Do",
    complexity = "Low",
    dueDate = "N/A",
    assigneeInitials = "N/A",
    onDelete,
  } = data || {};

  const handleConfirmDelete = async () => {
    await onDelete?.(id);
    handleCloseDeleteModal();
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    const year = String(date.getFullYear()).slice(-2);

    return `${month} ${day}, ${year}`;
  };

  return (
    <>
    <div className={`${styles.taskNode} ${selected ? styles.taskNodeSelected : ""}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />

      <div className={styles.taskCodeRow}>
        <span className={styles.taskCode}>{taskCode}</span>
        
        <X
          size={20}
          color="#6B7280"
          role="button"
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            handleShowDeleteModal();
          }}
        />

      </div>

      <div className={styles.taskTitle}>
        {title}
      </div>

      <div className={styles.infoRow}>
        <span className={`${styles.badge} ${styles[getComplexityClass(complexity)]}`}>
          {complexity}
        </span>

        <span className={styles.dueDate}>
          <Calendar size={16} className="me-1" />
          {formatDate(dueDate)}
        </span>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.statusWrapper}>
          <span className={`${styles.statusDot} ${getStatusClass(status)}`} />
          <span className={styles.statusText}>{status}</span>
        </div>

        <div className={styles.assignee}>
          {assigneeInitials}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={styles.handle}
      />
    </div>

    <ConfirmModal
          show={showDeleteModal}
          onHide={handleCloseDeleteModal} 
          onConfirm={handleConfirmDelete}
          title="Delete task?"
          message={`Are you sure you want to delete "${title}" and all its data?`}
          confirmText="Delete"
          cancelText="Cancel" />

    </>
  );
}

function getComplexityClass(complexity) {
  switch (complexity.toLowerCase()) {
    case "severe":
      return "severeBadge";
    case "high":
      return "highBadge";
    case "medium":
      return "mediumBadge";
    case "low":
    default:
      return "lowBadge";
  }
}

function getStatusClass(status) {
  switch (status.toLowerCase()) {
    case "done":
      return styles.statusDone;
    case "in progress":
      return styles.statusInProgress;
    case "to do":
    default:
      return styles.statusTodo;
  }
}

export default DesktopTaskNode;