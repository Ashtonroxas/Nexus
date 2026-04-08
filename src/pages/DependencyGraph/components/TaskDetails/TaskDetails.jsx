import { useEffect, useState } from "react";
import { X, Calendar, ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../firebase/AuthContext";
import { logActivity } from "../../../../utils/activityLogger";
import styles from "./TaskDetails.module.css";

function TaskDetails({
  task,
  onClose,
  onSave,
  blockedBy = [],
  blocking = [],
  isMobile = false,
  teamMembers = [],
  projectName = "Project",
}) {
  // Hooks for activity logging
  const { projectId } = useParams();
  const { currentUser } = useAuth();

  // UI state handlers for task details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [complexity, setComplexity] = useState("Low");
  const [assigneeName, setAssigneeName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

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
    setShowAssigneeDropdown(false);
  }, [task]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAssigneeDropdown && !e.target.closest(`.${styles.dropdownContainer}`)) {
        setShowAssigneeDropdown(false);
      }
    };

    if (showAssigneeDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showAssigneeDropdown]);

  if (!task) return null;

  // Updater
  const saveField = (updates) => {
    onSave?.(task.id, updates);
  };

  //helper function to save fields at save events  //
  
  // Save when user clicks out of title
  const handleTitleBlur = () => {
    saveField({ title });
  };

  // Save when user clicks out of description
  const handleDescriptionBlur = () => {
    saveField({ description });
  };

  // update date
  const handleDateChange = (e) => {
    const value = e.target.value;
    setDueDate(value);
    saveField({ dueDate: value });
  };

  // update status
  const handleStatusChange = async (e) => {
    const value = e.target.value;
    setStatus(value);
    saveField({ status: value });

    // Log activity when task is marked as completed
    if (value === "Done" && task && projectId) {
      try {
        await logActivity(projectId, 'task_completed', {
          senderName: currentUser?.displayName || "A team member",
          projectName: projectName,
          taskCode: task.taskCode,
        });
      } catch (error) {
        console.error("Error logging task completion activity:", error);
      }
    }
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

  // Get today's date in YYYY-MM-DD format to restrict past dates
  const today = new Date().toISOString().split('T')[0];

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
          {/* Selectable assignee field with styled dropdown */}
          <div className={styles.infoLabel}>Assignee</div>

          <div className={styles.dropdownContainer}>
            <div
              className={styles.assigneeTrigger}
              onClick={() => setShowAssigneeDropdown((prev) => !prev)}
            >
              <div className={styles.assigneeRow}>
                <div className={styles.assigneeBadge}>
                  {liveAssigneeInitials}
                </div>
                <span className={styles.assigneeText}>
                  {assigneeName || "Unassigned"}
                </span>
              </div>
              <ChevronDown size={16} className={styles.chevron} />
            </div>

            {/* Styled dropdown card */}
            {showAssigneeDropdown && (
              <div className={styles.assigneeDropdown}>
                <div
                  className={styles.dropdownItem}
                  onClick={() => {
                    setAssigneeName("");
                    saveField({ assigneeName: "" });
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
                      setAssigneeName(member.name);
                      saveField({ assigneeName: member.name });
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

        <div className={styles.infoField}>
          {/* Selectable date using calendar input */}
          <div className={styles.infoLabel}>Deadline</div>

          <label className={styles.dateRow}>
            <Calendar size={14} className={styles.dateIcon} />
            <input
              type="date"
              min={today}
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