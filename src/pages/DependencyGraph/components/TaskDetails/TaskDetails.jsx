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
  // UI state handlers for task details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [complexity, setComplexity] = useState("Low");
  const [assigneeName, setAssigneeName] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Lifecycle listener for changes in task information to update
  // sidebar/bottom sheet automatically
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

  // Updater
  const saveField = (updates) => {
    onSave?.(task.id, updates);
  };

  // -- Group of helper function to save fields at save events -- //
  
  // Save when user clicks out of title
  const handleTitleBlur = () => {
    saveField({ title });
  };

  // Save when user clicks out of description
  const handleDescriptionBlur = () => {
    saveField({ description });
  };

  // Save when user clicks out of assignee
  const handleAssigneeBlur = () => {
    saveField({ assigneeName });
  };

  // update date
  const handleDateChange = (e) => {
    const value = e.target.value;
    setDueDate(value);
    saveField({ dueDate: value });
  };

  // update status
  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatus(value);
    saveField({ status: value });
  };

  // update complexity
  const handleComplexityChange = (e) => {
    const value = e.target.value;
    setComplexity(value);
    saveField({ complexity: value });
  };

  // update assignee initialis based on name change
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
      {/* If mobile, render bottom sheet styling */}
      {isMobile && <div className={styles.bottomSheetHandle} />}

      <div className={styles.topRow}>
        <div className={styles.taskCode}>{task.taskCode}</div>
        {/* Close taskbar button */}
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

      {/* Editable task title */}
      <input
        className={styles.titleInput}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        placeholder="Untitled Task"
      />

      {/* Editable task description */}
      <textarea
        className={styles.descriptionInput}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder="Add task description"
      />


      <div className={styles.infoGrid}>
        <div className={styles.infoField}>
          {/* Editable status */}
          <div className={styles.infoLabel}>Status</div>

          <div className={styles.selectWrap}>
            {/* Check status and return appropriate styling */}
            <span
              className={`${styles.statusDot} ${
                status === "Done"
                  ? styles.statusDone
                  : status === "In Progress"
                  ? styles.statusInProgress
                  : styles.statusTodo
              }`}
            />
            {/* Dropdown menu for status change */}
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
          {/* Determine complexity and return appropriate styling */}
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
            {/* Dropdown menu for complexity */}
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Severe</option>
          </select>
        </div>

        <div className={styles.infoField}>
          {/* Editable assignee field & initial bubble */}
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
          {/* Selectable date using calendar input */}
          <div className={styles.infoLabel}>Deadline</div>

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

      {/* Render blocking tasks for selected task */}
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

      {/* Render blocked tasks by currently selected task */}
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