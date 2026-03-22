import React from 'react';
import styles from './TaskDetailPanel.module.css';

export default function TaskDetailPanel({ 
  task,          
  isOpen,        // Boolean to slide the drawer in/out
  onClose,       // lose the drawer
  onUpdateTask,  // send data edits back to main graph/Firebase
  nodes = [],    
  edges = [],    
  onAddEdge,     // create a new connection line
  onRemoveEdge   // delete a connection line
}) {
  
  // If no task is clicked and the drawer is closed
  if (!task && !isOpen) return null;

  // Dynamic Styling Logic 

  // Assign exact CSS classes based on the current task's state strings
  let statusBadgeClass = styles.tdStatusTodo;
  if (task?.data?.status === 'Done') statusBadgeClass = styles.tdStatusDone;
  if (task?.data?.status === 'In Progress') statusBadgeClass = styles.tdStatusProgress;

  let complexityBadgeClass = styles.tdBadgeLow;
  if (task?.data?.complexity === 'Medium') complexityBadgeClass = styles.tdBadgeMedium;
  if (task?.data?.complexity === 'High') complexityBadgeClass = styles.tdBadgeHigh;
  if (task?.data?.complexity === 'Severe') complexityBadgeClass = styles.tdBadgeSevere;

  // DEPENDENCY LOGIC

  // Task is "Blocked By" edges that point TO  (target -> task.id)
  const blockedByEdges = edges.filter((e) => e.target === task?.id);
  // Task is "Blocking" edges that originate FROM  (source -> task.id)
  const blockingEdges = edges.filter((e) => e.source === task?.id);

  // Helper functions to look up a task's name/status using its ID
  const getTaskName = (id) => nodes.find((n) => n.id === id)?.data?.label || 'Unknown Task';
  const getTaskStatus = (id) => nodes.find((n) => n.id === id)?.data?.status || 'To Do';

  // Determine which tasks can be added as dependencies. 

  //  filter out the current task itself, tasks its connected to
  const availableToBlockMe = nodes.filter(n => n.id !== task?.id && !blockedByEdges.find(e => e.source === n.id));
  const availableToBlock = nodes.filter(n => n.id !== task?.id && !blockingEdges.find(e => e.target === n.id));

  return (
    <aside className={`${styles.drawerOverlay} ${isOpen ? styles.drawerOpen : ''}`}>
      {task && (
        <div className={styles.tdContent}>
          
          {/* HEADER */}
          <div className={styles.tdHeader}>
            <span className={styles.tdEyebrow}>TASK DETAILS</span>
            <button className={styles.tdCloseBtn} onClick={onClose}>&times;</button>
          </div>

          {/* EDITABLE TITLE INPUT */}
          <input 
            value={task.data.label || ''} 
            onChange={(e) => onUpdateTask(task.id, { label: e.target.value })} 
            className={styles.tdTitleInput} 
            placeholder="Task Name"
          />
          
          {/* EDITABLE STATUS DROPDOWN */}
          <select
            value={task.data.status || 'To Do'}
            onChange={(e) => onUpdateTask(task.id, { status: e.target.value })}
            className={`${styles.tdStatus} ${statusBadgeClass}`}
            style={{ fontFamily: 'inherit' }}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          {/* DESCRIPTION */}
          <div className={styles.tdSection}>
            <h3 className={styles.tdSectionLabel}>DESCRIPTION</h3>
            <p className={styles.tdText}>Detailed information coming soon.</p>
          </div>

          {/* METADATA GRID */}
          <div className={styles.tdGrid}>
            <div>
              <h3 className={styles.tdSectionLabel}>ASSIGNEE</h3>
              <div className={styles.tdUser}>
                <div className={`${styles.tdAvatar} ${styles.tdAvatarPurple}`}>{task.data.assigneeInitials}</div>
                <span>{task.data.assigneeName}</span>
              </div>
            </div>
            
            <div>
              <h3 className={styles.tdSectionLabel}>DUE DATE</h3>
              <div className={styles.tdDate}>
                {/*&#128197; */}
                <input 
                  type="date"
                  value={task.data.date || ''}
                  onChange={(e) => onUpdateTask(task.id, { date: e.target.value })}
                  className={styles.tdDateInput}
                  style={{ marginLeft: '6px' }}
                />
              </div>
            </div>

            <div>
              <h3 className={styles.tdSectionLabel}>COMPLEXITY</h3>
              <select
                value={task.data.complexity || 'Low'}
                onChange={(e) => onUpdateTask(task.id, { complexity: e.target.value })}
                className={`${styles.tdBadge} ${complexityBadgeClass}`}
                style={{ fontFamily: 'inherit' }}
              >
                <option value="Low">LOW</option>
                <option value="Medium">MEDIUM</option>
                <option value="High">HIGH</option>
                <option value="Severe">SEVERE</option>
              </select>
            </div>

            <div>
              <h3 className={styles.tdSectionLabel}>TASK ID</h3>
              <div className={styles.tdText}>{task.id}</div>
            </div>
          </div>

          {/* DEPENDENCY MAP */}
          <div className={`${styles.tdSection} ${styles.tdBorderTop}`}>
            <h3 className={styles.tdSectionLabel}>DEPENDENCY MAP</h3>
            
            {/* BLOCKED BY OTHERS  */}
            <div className={styles.tdDependencyRow}>
              <span className={`${styles.tdText} ${styles.tdTextBold}`}>Blocked By</span>
              <span className={styles.tdCount}>{blockedByEdges.length}</span>
            </div>
            {blockedByEdges.length === 0 ? (
              <p className={`${styles.tdText} ${styles.tdTextMuted} ${styles.tdTextItalic}`}>No blocking dependencies detected</p>
            ) : (
              <ul className={styles.tdDependencyList}>
                {blockedByEdges.map(edge => (
                  <li key={edge.id}>
                    <span className={`${styles.dot} ${styles.dotOrange}`}></span> 
                    {getTaskName(edge.source)} 
                    <span className={styles.tdStatusSmall}>{getTaskStatus(edge.source).toUpperCase()}</span>
                    {/* Delete Line Button */}
                    <button className={styles.removeDepBtn} onClick={() => onRemoveEdge(edge.id)} title="Remove connection">&times;</button>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Add Line Dropdown */}
            <select 
              className={styles.addDepSelect} 
              value="" 
              onChange={(e) => onAddEdge(e.target.value, task.id)}
            >
              <option value="" disabled>+ Add blocking task...</option>
              {availableToBlockMe.map(n => (
                <option key={n.id} value={n.id}>{n.data.label}</option>
              ))}
            </select>

            {/* BLOCKING OTHERS  */}
            <div className={`${styles.tdDependencyRow} ${styles.mt4}`}>
              <span className={`${styles.tdText} ${styles.tdTextBold}`}>Blocking</span>
              <span className={styles.tdCount}>{blockingEdges.length}</span>
            </div>
            {blockingEdges.length === 0 ? (
              <p className={`${styles.tdText} ${styles.tdTextMuted} ${styles.tdTextItalic}`}>Not blocking any tasks</p>
            ) : (
              <ul className={styles.tdDependencyList}>
                {blockingEdges.map(edge => (
                  <li key={edge.id}>
                    <span className={`${styles.dot} ${styles.dotBlue}`}></span> 
                    {getTaskName(edge.target)} 
                    <span className={styles.tdStatusSmall}>{getTaskStatus(edge.target).toUpperCase()}</span>
                    {/* Delete Line Button */}
                    <button className={styles.removeDepBtn} onClick={() => onRemoveEdge(edge.id)} title="Remove connection">&times;</button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Line Dropdown */}
            <select 
              className={styles.addDepSelect} 
              value="" 
              onChange={(e) => onAddEdge(task.id, e.target.value)}
            >
              <option value="" disabled>+ Add task to block...</option>
              {availableToBlock.map(n => (
                <option key={n.id} value={n.id}>{n.data.label}</option>
              ))}
            </select>

          </div>
        </div>
      )}
    </aside>
  );
}