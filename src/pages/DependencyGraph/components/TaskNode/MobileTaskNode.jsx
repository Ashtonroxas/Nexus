import { Handle, Position } from "@xyflow/react";
import styles from "./MobileTaskNode.module.css";

function MobileTaskNode({ data, selected }) {
  const {
    taskCode = "TASK-000",
    status = "To Do",
    assigneeInitials = "N/A",
  } = data || {};

  return (
    <div className={styles.mobileNodeWrapper}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />

      <div
        className={`${styles.mobileNodeCircle} ${selected ? styles.mobileNodeCircleSelected : ""}`}
      >
        <span className={`${styles.statusDot} ${getStatusClass(status)}`} />
        <div className={styles.taskCodeLabel}>{taskCode}</div>
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