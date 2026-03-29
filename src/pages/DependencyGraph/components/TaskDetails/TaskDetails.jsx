import { useEffect, useState } from "react";
import { X, Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./TaskDetails.module.css";

function TaskDetails({
  task,
  onClose,
  onSave,
  blockedBy = [],
  blocking = [],
  isMobile = false,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [complexity, setComplexity] = useState("Low");
  const [assigneeName, setAssigneeName] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!task) return;

    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus(task.status || "To Do");
    setComplexity(task.complexity || "Low");
    setAssigneeName(task.assigneeName || "");
    setDueDate(task.dueDate || "");
  }, [task]);

  if (!task) return null;

  const saveField = (updates) => {
    onSave?.(task.id, updates);
  };

  const handleTitleBlur = () => {
    saveField({ title });
  };

  const handleDescriptionBlur = () => {
    saveField({ description });
  };

  const handleAssigneeBlur = () => {
    saveField({ assigneeName });
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    setDueDate(value);
    saveField({ dueDate: value });
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatus(value);
    saveField({ status: value });
  };

  const handleComplexityChange = (e) => {
    const value = e.target.value;
    setComplexity(value);
    saveField({ complexity: value });
  };

  const liveAssigneeInitials =
    assigneeName.trim() !== ""
      ? assigneeName
          .trim()
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join("")
      : "--";

  return (
    <div className={styles.taskDetailsPanel}>
      {isMobile && <div className={styles.bottomSheetHandle} />}

      <div className={styles.topRow}>
        <div className={styles.taskCode}>{task.taskCode}</div>

        <X
          size={20}
          className={styles.closeIcon}
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
        />
      </div>

      <input
        className={styles.titleInput}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        placeholder="Untitled Task"
      />

      <textarea
        className={styles.descriptionInput}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder="Add task description"
      />

      <div className={styles.infoGrid}>
        <div className={styles.infoField}>
          <div className={styles.infoLabel}>Status</div>

          <div className={styles.selectWrap}>
            <span
              className={`${styles.statusDot} ${
                status === "Done"
                  ? styles.statusDone
                  : status === "In Progress"
                  ? styles.statusInProgress
                  : styles.statusTodo
              }`}
            />
            <select
              className={styles.statusSelect}
              value={status}
              onChange={handleStatusChange}
            >
              <option>To Do</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          </div>
        </div>

        <div className={styles.infoField}>
          <div className={styles.infoLabel}>Complexity</div>

          <select
            className={`${styles.pillSelect} ${
              complexity === "Severe"
                ? styles.severePill
                : complexity === "High"
                ? styles.highPill
                : complexity === "Medium"
                ? styles.mediumPill
                : styles.lowPill
            }`}
            value={complexity}
            onChange={handleComplexityChange}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Severe</option>
          </select>
        </div>

        <div className={styles.infoField}>
          <div className={styles.infoLabel}>Assignee</div>

          <div className={styles.assigneeRow}>
            <div className={styles.assigneeBadge}>
              {liveAssigneeInitials}
            </div>

            <input
              className={styles.inlineInput}
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              onBlur={handleAssigneeBlur}
              placeholder="Unassigned"
            />
          </div>
        </div>

        <div className={styles.infoField}>
          <div className={styles.infoLabel}>Due Date</div>

          <label className={styles.dateRow}>
            <Calendar size={14} className={styles.dateIcon} />
            <input
              type="date"
              className={styles.dateInput}
              value={dueDate}
              onChange={handleDateChange}
            />
          </label>
        </div>
      </div>

      <div className={styles.linkSection}>
        <div className={styles.linkLabel}>Blocked By</div>

        {blockedBy.length === 0 ? (
          <div className={styles.emptyDependency}>Task is not currently blocked</div>
        ) : (
          blockedBy.map((item) => (
            <div key={item.id} className={styles.linkCard}>
              <ArrowLeft size={14} className={styles.blockedByArrow} />
              <span className={styles.linkCode}>{item.taskCode}</span>
              <span className={styles.linkTitle}>{item.title}</span>
            </div>
          ))
        )}
      </div>

      <div className={styles.linkSection}>
        <div className={styles.linkLabel}>Blocking</div>

        {blocking.length === 0 ? (
          <div className={styles.emptyDependency}>Task is not currently blocking</div>
        ) : (
          blocking.map((item) => (
            <div key={item.id} className={styles.linkCard}>
              <ArrowRight size={14} className={styles.blockingArrow} />
              <span className={styles.linkCode}>{item.taskCode}</span>
              <span className={styles.linkTitle}>{item.title}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TaskDetails;