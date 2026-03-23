import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MiniMap,  
  MarkerType,
} from '@xyflow/react';
import { HexColorPicker } from 'react-colorful';
import '@xyflow/react/dist/style.css';
import { useOutletContext, useParams } from "react-router-dom";
import { 
  doc,
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import TaskNode from './components/TaskNode/TaskNode';
import CreateTaskModal from './components/CreateTaskModal/CreateTaskModal';
import styles from './DependencyGraph.module.css';

const nodeTypes = { 
  taskNode: TaskNode,
};

export default function DependencyGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { menuButton } = useOutletContext();
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("#6366F1");

  const [saveStatus, setSaveStatus] = useState("idle");
  const [hasLoadedProject, setHasLoadedProject] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const pickerRef = useRef(null);

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "projects", projectId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        const projectData = {
          id: snapshot.id,
          name: data.name || "Untitled Project",
          description: data.description || "",
          color: data.color || "#6366F1",
        };

        setProject(projectData);
        setProjectName((prev) => (hasLoadedProject ? prev : projectData.name));
        setProjectDescription((prev) => (hasLoadedProject? prev : projectData.description));
        setProjectColor(projectData.color);
        setHasLoadedProject(true);
      }
    });

    return () => unsubscribe();
  }, [projectId, hasLoadedProject]);

  useEffect(() => {
    if (!projectId) return;

    const tasksRef = collection(db, "projects", projectId, "tasks");
    const tasksQuery = query(tasksRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const firestoreNodes = snapshot.docs.map((taskDoc, index) => {
        const data = taskDoc.data();

        return {
          id: taskDoc.id,
          type: "taskNode",
          position: {
            x: data.position?.x ?? 120 + index * 260,
            y: data.position?.y ?? 140,
          },

          data: {
            taskCode: data.taskCode || `TASK-${index + 101}`,
            title: data.title || "Untitled Task",
            description: data.description || "",
            assigneeName: data.assigneeName || "Unassigned",
            assigneeInitials: data.assigneeInitials || "--",
            status: data.status || "To Do",
            complexity: data.complexity || "Low",
            dueDate: data.dueDate || "",
          },
        };
      });

      setNodes(firestoreNodes);
    });

    return () => unsubscribe();
  }, [projectId, setNodes]);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        animated: true,

        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },

        style: {
          stroke: "#6B7280",
          strokeWidth: 2,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  const handleSaveProjectDetails = async () => {
    if (!project) return;

    const trimmedName = projectName.trim() || "Untitled Project";
    const trimmedDescription = projectDescription.trim();

    if (trimmedName === (project.name || "Untitled Project") &&
        trimmedDescription === (project.description || "") &&
        projectColor === (project.color || "#6366F1")) {
          setSaveStatus("saved");
          return;
        }

    try {
      setSaveStatus("saving");
      await updateDoc(doc(db, "projects", projectId), {
        name: trimmedName,
        description: trimmedDescription,
        color: projectColor,
        updatedAt: serverTimestamp(),
      });
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error updating project: ", error);
      setSaveStatus("idle");
    }
  };

  useEffect(() => {
    if (!hasLoadedProject || !project) return;
    setSaveStatus("idle");

    const timeout = setTimeout(() => {
      handleSaveProjectDetails();
    }, 700);

    return () => clearTimeout(timeout);
  }, [projectName, projectDescription, projectColor]);

  const handleOpenCreateTask = () => {
    setShowCreateTaskModal(true);
  };

  const handleCreateTask = async (taskFormData) => {
    if (!projectId) return;

    const taskRef = collection(db, "projects", projectId, "tasks");
    const assigneeName = taskFormData.assignee?.trim() || "Unassigned";

    const assigneeInitials =
      assigneeName !== "Unassigned"
        ? assigneeName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((i) => i[0].toUpperCase())
            .join("")
        : "--";
    
    try {
      await addDoc(taskRef, {
        taskCode: `TASK-${nodes.length + 101}`,
        title: taskFormData.title,
        description: taskFormData.description,
        assigneeName,
        assigneeInitials,
        status: taskFormData.status,
        complexity: taskFormData.complexity,
        dueDate: taskFormData.dueDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        position: {
          x: 120 + nodes.length * 40,
          y: 140 + nodes.length * 20,
        },
      }); 
    } catch (error) {
      console.error("Error creating task: ", error);
    }
  };

  return (
    <div className={styles.blueprintContainer}>
      <div className={styles.blueprintHeader}>
        <div className={styles.desktopHeader}>
          <div className={styles.desktopTextBlock}>
            <div className={styles.desktopBreadcrumbRow}>
              <span className={styles.desktopBreadcrumb}>Projects /</span>

              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={styles.desktopBreadcrumbTitle}
                placeholder="Untitled Project"
              />
            </div>

            <div className={styles.desktopDetailsRow}>
              <div ref={pickerRef} className={styles.colorPickerWrapper}>
                <div
                  className={styles.colorDot}
                  style={{ backgroundColor: projectColor }}
                  onClick={() => setShowColorPicker((prev) => !prev)}
                />

                {showColorPicker && (
                  <div className={styles.colorPickerPopover}>
                    <HexColorPicker
                      color={projectColor}
                      onChange={setProjectColor}
                    />
                  </div>
                )}
              </div>

              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className={styles.projectDescriptionInput}
                placeholder="Add project description"
              />
            </div>

            <div className={styles.saveStatus}>
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
            </div>
          </div>
        </div>
        <div className={styles.mobileHeader}>
          <div className={styles.mobileTopRow}>
            <div className={styles.menuRow}>
              {menuButton}
            </div>

            <div className={styles.mobileTitleRow}>
              <span className={styles.mobileBreadcrumb}>Projects /</span>

              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={styles.mobileProjectNameInput}
                placeholder="Untitled Project"
              />
            </div>
          </div>

          <div className={styles.mobileDescriptionRow}>
              <div ref={pickerRef} className={styles.colorPickerWrapper}>
                <div
                  className={styles.colorDot}
                  style={{ backgroundColor: projectColor }}
                  onClick={() => setShowColorPicker((prev) => !prev)}
                />

                {showColorPicker && (
                  <div className={styles.colorPickerPopover}>
                    <HexColorPicker
                      color={projectColor}
                      onChange={setProjectColor}
                    />
                  </div>
                )}
              </div>

              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className={styles.mobileProjectDescriptionInput}
                placeholder="Add project description"
              />
            </div>

            <div className={styles.mobileSaveStatus}>
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
            </div>
          </div>
      </div>
      <div className={styles.blueprintCanvas}>
        
        <div className={styles.floatingToolbar}>
          <button 
            className="btn btn-primary btn-sm" 
            style={{ backgroundColor: '#6366F1', border: 'none' }}
            onClick={handleOpenCreateTask}
          >
            + Add Task
          </button>
        </div>

        <ReactFlow 
          nodes={nodes} 
          edges={edges}
          nodeTypes={nodeTypes} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          defaultViewport={{x: 0, y: 0, zoom: 0.7}}
        >
          <Background variant="dots" gap={20} size={1} />
          <Controls />
          <MiniMap nodeColor="#6366F1" maskColor="rgba(0, 0, 0, 0.1)" />
        </ReactFlow>

        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onCreateTask={handleCreateTask} />
      </div>
    </div>
  );
}