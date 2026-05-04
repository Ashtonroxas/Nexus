import { useEffect, useState, useRef } from "react";
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
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);

  const statusDropdownRef = useRef(null);
  const complexityDropdownRef = useRef(null);
  const assigneeDropdownRef = useRef(null);

  // Lifecycle listener for changes in task information to update
  // sidebar/bottom sheet automatically
  useEffect(() => {
    if (!task) return;

    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus(task.status || "To Do");
    setComplexity(task.complexity || "Low");
    setAssigneeName(task.assigneeName || "");
    setAssigneeId(task.assigneeId || "");
    setDueDate(task.dueDate || "");
    setOpenDropdown(null);
  }, [task]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedStatus = statusDropdownRef.current && statusDropdownRef.current.contains(e.target);
      const clickedComplexity = complexityDropdownRef.current && complexityDropdownRef.current.contains(e.target);
      const clickedAssignee = assigneeDropdownRef.current && assigneeDropdownRef.current.contains(e.target);

      if (!clickedStatus && !clickedComplexity && !clickedAssignee) {
        setOpenDropdown(null);
      }
    };
    
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdown]);

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

          <div ref={statusDropdownRef} className={styles.dropdownContainer}>
            <div
              className={`${styles.dropdownTrigger} ${
                openDropdown === "status" ? styles.dropdownTriggerOpen : ""
              }`}
              onClick={() =>
                setOpenDropdown((prev) => (prev === "status" ? null : "status"))
              }
            >
              <div className={styles.dropdownValue}>
                <span
                  className={`${styles.statusDot} ${
                    status === "Done"
                      ? styles.statusDone
                      : status === "In Progress"
                      ? styles.statusInProgress
                      : styles.statusTodo
                  }`}
                />
                <span className={styles.dropdownText}>{status}</span>
              </div>
              <ChevronDown size={16} className={styles.chevron} />
            </div>

            {openDropdown === "status" && (
              <div className={styles.dropdownMenu}>
                {["To Do", "In Progress", "Done"].map((option) => (
                  <div
                    key={option}
                    className={styles.dropdownItem}
                    onClick={async () => {
                      setStatus(option);
                      saveField({ status: option });
                      setOpenDropdown(null);

                      if (option === "Done" && task && projectId) {
                        try {
                          await logActivity(projectId, "task_completed", {
                            senderName: currentUser?.displayName || "A team member",
                            projectName: projectName,
                            taskCode: task.taskCode,
                          });
                        } catch (error) {
                          console.error("Error logging task completion activity:", error);
                        }
                      }
                    }}
                  >
                    <span
                      className={`${styles.statusDot} ${
                        option === "Done"
                          ? styles.statusDone
                          : option === "In Progress"
                          ? styles.statusInProgress
                          : styles.statusTodo
                      }`}
                    />
                    <span>{option}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.infoField}>
          <div className={styles.infoLabel}>Complexity</div>
          {/* Determine complexity and return appropriate styling */}
          <div ref={complexityDropdownRef} className={styles.dropdownContainer}>
            <div
              className={`${styles.dropdownTrigger} ${
                openDropdown === "complexity" ? styles.dropdownTriggerOpen : ""
              }`}
              onClick={() =>
                setOpenDropdown((prev) => (prev === "complexity" ? null : "complexity"))
              }
            >
              <div className={styles.dropdownValue}>
                <span
                  className={`${styles.pillTag} ${
                    complexity === "Severe"
                      ? styles.severePill
                      : complexity === "High"
                      ? styles.highPill
                      : complexity === "Medium"
                      ? styles.mediumPill
                      : styles.lowPill
                  }`}
                >
                  {complexity}
                </span>
              </div>
              <ChevronDown size={16} className={styles.chevron} />
            </div>

            {openDropdown === "complexity" && (
              <div className={styles.dropdownMenu}>
                {["Low", "Medium", "High", "Severe"].map((option) => (
                  <div
                    key={option}
                    className={styles.dropdownItem}
                    onClick={() => {
                      setComplexity(option);
                      saveField({ complexity: option });
                      setOpenDropdown(null);
                    }}
                  >
                    <span
                      className={`${styles.pillTag} ${
                        option === "Severe"
                          ? styles.severePill
                          : option === "High"
                          ? styles.highPill
                          : option === "Medium"
                          ? styles.mediumPill
                          : styles.lowPill
                      }`}
                    >
                      {option}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.infoField}>
          <div className={styles.infoLabel}>Assignee</div>

          <div ref={assigneeDropdownRef} className={styles.dropdownContainer}>
            <div
              className={`${styles.dropdownTrigger} ${
                openDropdown === "assignee" ? styles.dropdownTriggerOpen : ""
              }`}
              onClick={() =>
                setOpenDropdown((prev) => (prev === "assignee" ? null : "assignee"))
              }
            >
              <div className={styles.dropdownValue}>
                <div className={styles.assigneeBadge}>
                  {liveAssigneeInitials}
                </div>
                <span className={styles.dropdownText}>
                  {assigneeName || "Unassigned"}
                </span>
              </div>
              <ChevronDown size={16} className={styles.chevron} />
            </div>

            {openDropdown === "assignee" && (
              <div className={styles.dropdownMenu}>
                <div
                  className={styles.dropdownItem}
                  onClick={() => {
                    setAssigneeName("");
                    setAssigneeId("");
                    saveField({ 
                      assigneeName: "",
                      assigneeId: "",
                    });
                    setOpenDropdown(null);
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
                      setAssigneeId(member.id);
                      saveField({ 
                        assigneeName: member.name,
                        assigneeId: member.id,
                      });
                      setOpenDropdown(null);
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