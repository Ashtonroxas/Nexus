import { Handle, Position } from "@xyflow/react";
import styles from "./MobileTaskNode.module.css";

function MobileTaskNode({ data, selected }) {
  // using only specified abbreviated data from props
  const {
    taskCode = "TASK-000",
    status = "To Do",
    assigneeInitials = "N/A",
  } = data || {};

  return (
    <div className={styles.mobileNodeWrapper}>
      {/* Renders left bubble for arrow attachments for when node is destination */}
      <Handle
        type="target"
        position={Position.Left}
        className={`${styles.handle} ${styles.handleTarget}`}
      /> 

      {/* Node circle shape depicting abbreviated fields - conditional styling if node is selected */}
      <div
        className={`${styles.mobileNodeCircle} ${selected ? styles.mobileNodeCircleSelected : ""}`}
      >
        <span className={`${styles.statusDot} ${getStatusClass(status)}`} />
        <div className={styles.taskCodeLabel}>{taskCode}</div>
        <div className={styles.assignee}>
          {assigneeInitials}
        </div>
      </div>

      {/* Redners right bubble for arrow attachments when node is source */}
      <Handle
        type="source"
        position={Position.Right}
        className={`${styles.handle} ${styles.handleSource}`}
      />
    </div>
  );
}

/**
 * Helper function to parse node status and return the classNamee
 * @param {string} status 
 * @returns string classname
 */
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

export default MobileTaskNode;