import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MiniMap,  
} from '@xyflow/react';
import { HexColorPicker } from 'react-colorful';
import '@xyflow/react/dist/style.css';
import { useOutletContext, useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import TaskNode from './components/TaskNode/TaskNode';
import styles from './DependencyGraph.module.css';

const nodeTypes = { 
  taskNode: TaskNode,
};

const initialNodes = [
  {
    id: "1",
    type: "taskNode",
    position: { x: 100, y: 100 },
    data: {
      taskCode: "TASK-101",
      title: "Generate Design Prototype",
      status: "To Do",
      complexity: "Low",
      dueDate: "Feb 15",
      assigneeInitials: "AB",
    },
  },
  {
    id: "2",
    type: "taskNode",
    position: { x: 420, y: 180 },
    data: {
      taskCode: "TASK-102",
      title: "API Integration Layer",
      status: "In Progress",
      complexity: "High",
      dueDate: "Feb 18",
      assigneeInitials: "AB",
    },
  },
];

const initialEdges = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    animated: true, 
  },
];

export default function DependencyGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        animated: true,
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

  //Function to generate and add a new node
  const handleAddNode = () => {
    const newNodeId = `Task-${Date.now()}`;

    const newNode = {
      id: newNodeId,
      type: 'taskNode', 
      position: { 
        x: Math.random() * 250 + 120, 
        y: Math.random() * 250 + 120 
      }, 
      data: { 
        taskCode: `TASK-${nodes.length + 101}`,
        title: `New Task ${nodes.length + 1}`,
        status: "To Do",
        complexity: "Low",
        dueDate: "N/A",
        assigneeInitials: "N/A", 
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
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
            onClick={handleAddNode}
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
      </div>

    </div>
  );
}