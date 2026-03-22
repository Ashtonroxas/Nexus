import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Calendar } from "lucide-react";
import styles from "./TaskNode.module.css";

function TaskNode({ data, selected }) {
  const {
    taskCode = "TASK-000",
    title = "Untitled Task",
    status = "To Do",
    complexity = "Low",
    dueDate = "N/A",
    assigneeInitials = "N/A",
  } = data || {};

  return (
    <div className={`${styles.taskNode} ${selected ? styles.taskNodeSelected : ""}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />

      <div className={styles.taskCodeRow}>
        <span className={styles.taskCode}>{taskCode}</span>
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
          {dueDate}
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
      return styles.Todo;
  }
}

export default TaskNode;