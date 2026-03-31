import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MiniMap,  
  MarkerType,
  applyEdgeChanges,
  applyNodeChanges,
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
  deleteDoc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import TaskNode from './components/TaskNode/TaskNode';
import CreateTaskModal from './components/CreateTaskModal/CreateTaskModal';
import TaskDetails from './components/TaskDetails/TaskDetails';
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
  
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const generateNextTaskCode = async () => {
    if (!projectId) return "TASK-101";

    try {
      const tasksRef = collection(db, "projects", projectId, "tasks");
      const snapshot = await getDocs(tasksRef);

      let maxNumber = 100;

      snapshot.docs.forEach((taskDoc) => {
        const taskCode = taskDoc.data()?.taskCode || "";
        const parts = taskCode.split("-");

        if (parts.length !== 2) return;
        if (parts[0] !== "TASK") return;

        const num = Number(parts[1]);
        if (!Number.isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      });

      return `TASK-${maxNumber + 1}`;
    } catch (error) {
      console.error("Error generating task code: ", error);
    }
  };

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

  const handleDeleteTask = useCallback(
    async (taskId) => {
      if (!projectId || !taskId) return;

      try {
        const edgesRef = collection(db, "projects", projectId, "edges");
        const edgeSnapshot = await getDocs(edgesRef);

        const connectedEdges = edgeSnapshot.docs.filter((edgeDoc) => {
          const data = edgeDoc.data();
          return data.source === taskId || data.target === taskId;
        });

        await Promise.all(
          connectedEdges.map((edgeDoc) => 
            deleteDoc(doc(db, "projects", projectId, "edges", edgeDoc.id))
        )
      );

      await deleteDoc(doc(db, "projects", projectId, "tasks", taskId));

      setEdges((eds) => 
        eds.filter((edge) => edge.source !== taskId && edge.target !== taskId));
      setNodes((nds) => nds.filter((node) => node.id !== taskId));
      } catch (error) {
        console.error("Error deleting task and edges: ", error);
      }
    }, [projectId, setNodes, setEdges]);

  const updateProjectTaskInfo = useCallback(
    async (taskDocs) => {
      if (!projectId) return;

      const taskCount = taskDocs.length;

      const completedTasks = taskDocs.filter((taskDoc) => {
        const status = taskDoc.data()?.status || "";
        return status.toLowerCase() === "done";
      }).length;

      try {
        await updateDoc(doc(db, "projects", projectId), {
          taskCount,
          completedTaskCount: completedTasks,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error updating project task info: ", error);
      }
    }, [projectId]);

  const updateProjectDeadline = useCallback(
    async (taskDocs) => {
      if (!projectId) return;

      const deadlines = taskDocs
        .map((taskDoc) => taskDoc.data()?.dueDate)
        .filter(Boolean)
        .map((dueDate) => new Date(dueDate))
        .filter((date) => !isNaN(date.getTime()));
      
      const latestDeadline = deadlines.length > 0 
          ? new Date(Math.max(...deadlines.map((date) => date.getTime())))
          : null;
      
      try {
        await updateDoc(doc(db, "projects", projectId), {
          dueDate: latestDeadline,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error updating project deadline: ", error);
      }
    }, [projectId]);

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
          selected: taskDoc.id === selectedTaskId,
          position: {
            x: data.position?.x ?? 120 + index * 260,
            y: data.position?.y ?? 140,
          },

          data: {
            taskCode: data.taskCode || `No Code`,
            title: data.title || "Untitled Task",
            description: data.description || "",
            assigneeName: data.assigneeName || "Unassigned",
            assigneeInitials: data.assigneeInitials || "--",
            status: data.status || "To Do",
            complexity: data.complexity || "Low",
            dueDate: data.dueDate || "",
            onDelete: handleDeleteTask,
            onSelect: () => setSelectedTaskId(taskDoc.id),
          },
        };
      });

      setNodes(firestoreNodes);
      updateProjectTaskInfo(snapshot.docs);
      updateProjectDeadline(snapshot.docs);
    });

    return () => unsubscribe();
  }, [projectId, 
      setNodes, 
      handleDeleteTask, 
      updateProjectDeadline, 
      updateProjectTaskInfo,
      selectedTaskId
    ]);

  useEffect(() => {
    if (!selectedTaskId) {
      setSelectedTask(null);
      return;
    }

    const matchedNode = nodes.find((node) => node.id === selectedTaskId);

    if (!matchedNode) {
      setSelectedTask(null);
      return;
    }

    setSelectedTask({
      id: matchedNode.id,
      ...matchedNode.data,
    });
  }, [selectedTaskId, nodes]);

  const blockedByTasks = selectedTask ?
    edges
      .filter((edge) => edge.target === selectedTask.id)
      .map((edge) => nodes.find((node) => node.id === edge.source))
      .filter(Boolean)
      .map((node) => ({
        id: node.id,
        taskCode: node.data.taskCode,
        title: node.data.title,
      }))
    : [];
  const blockingTasks = selectedTask ?
      edges
        .filter((edge) => edge.source === selectedTask.id)
        .map((edge) => nodes.find((node) => node.id === edge.target))
        .filter(Boolean)
        .map((node) => ({
          id: node.id,
          taskCode: node.data.taskCode,
          title: node.data.title,
        }))
    : [];

  useEffect(() => {
    if (!projectId) return;

    const edgesRef = collection(db, "projects", projectId, "edges");
    const unsubscribe = onSnapshot(edgesRef, (snapshot) => {
      const firestoreEdges = snapshot.docs.map((edgeDoc) => {
        const data = edgeDoc.data();

        return {
          id: edgeDoc.id,
          source: data.source,
          target: data.target,
          sourceHandle: data.sourceHandle || null,
          targetHandle: data.targetHandle || null,
          animated: false,
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
      });

      setEdges(firestoreEdges);
    });

    return () => unsubscribe();
  }, [projectId, setEdges]);

  const onConnect = useCallback(
    async (params) => {
      if (!projectId || !params.source || !params.target) return;

      const edgeId = `edge-${params.source}-${params.target}`;
      const newEdge = {
        id: edgeId,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        animated: false,
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

      try {
        await setDoc(doc(db, "projects", projectId, "edges", edgeId), {
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          animated: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error saving edge: ", error);
      }
    }, [projectId, setEdges]);

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

  const handleNodesChange = useCallback(
    async (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      const positionChanges = changes.filter(
        (change) => change.type === "position" &&
                    change.position &&
                    change.dragging === false
      );

      for (const change of positionChanges) {
        try {
          await updateDoc(doc(db, "projects", projectId, "tasks", change.id), {
            position: {
              x: change.position.x,
              y: change.position.y,
            },
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error saving node position: ", error);
        }
      }
    }, [projectId, setNodes]);

  const handleEdgesChange = useCallback(
    async (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));

      const removedEdges = changes.filter(
        (change) => change.type === "remove" && change.id
      );

      for (const edge of removedEdges) {
        try {
          await deleteDoc(doc(db, "projects", projectId, "edges", edge.id));
        } catch (error) {
          console.error("Error deleting edge: ", error);
        }
      }
    }, [projectId, setEdges]);

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
    
    const nextTaskCode = await generateNextTaskCode();
    try {
      await addDoc(taskRef, {
        taskCode: nextTaskCode,
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

  const handleUpdateTask = async (taskId, updates) => {
    if (!projectId || !taskId) return;

    const assigneeName = (updates.assigneeName ?? "").trim() || "Unassigned";
    const assigneeInitials = assigneeName !== "Unassigned"
      ? assigneeName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((i) => i[0].toUpperCase())
        .join("")
      : "--";

    try {
      await updateDoc(doc(db, "projects", projectId, "tasks", taskId), {
        ...updates,
        assigneeName,
        assigneeInitials,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Determine edge styles based on connected node states
  const edgesWithDynamicStyles = useMemo(() => {
    return edges.map((edge) => {
      // Find nodes connected to this edge
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      // Check the states
      const isSevere =
        sourceNode?.data?.complexity?.toLowerCase() === "severe" ||
        targetNode?.data?.complexity?.toLowerCase() === "severe";
        
      const isSourceDone = sourceNode?.data?.status?.toLowerCase() === "done";

      // Determine color/thickness
      let edgeColor = "#6B7280"; 
      let edgeWidth = 2;

      if (isSevere) {
        edgeColor = "#EF4444"; // Red for severe 
        edgeWidth = 3;
      } else if (isSourceDone) {
        edgeColor = "#22C55E"; // Green for completed  
      }

      return {
        ...edge,
        animated: true, // motion animation on
        style: {
          ...edge.style,
          stroke: edgeColor,
          strokeWidth: edgeWidth,
        },
        markerEnd: {
          ...edge.markerEnd,
          color: edgeColor, 
        },
      };
    });
  }, [edges, nodes]);

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
          edges={edgesWithDynamicStyles}
          nodeTypes={nodeTypes} 
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          defaultViewport={{x: 0, y: 0, zoom: 0.7}}
          onNodeClick={(event, node) => {
            setSelectedTaskId(node.id);
          }}
          onPaneClick={() => {
            setSelectedTaskId(null);
          }}
        >
          <Background variant="dots" gap={20} size={1} />
          <Controls />
          <MiniMap nodeColor="#6366F1" maskColor="rgba(0, 0, 0, 0.1)" />
        </ReactFlow>

        {!isMobile && selectedTask && (
          <div
            className={styles.sidebarOverlay}
            onClick={() => setSelectedTaskId(null)}
          >
            <aside
              className={styles.taskSidebarPanel}
              onClick={(e) => e.stopPropagation()}
            >
              <TaskDetails
                task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
                onSave={handleUpdateTask}
                blockedBy={blockedByTasks}
                blocking={blockingTasks}
              />
            </aside>
          </div>
        )}

        {isMobile && selectedTask && (
          <div
            className={styles.bottomSheetOverlay}
            onClick={() => setSelectedTaskId(null)}
          >
            <div
              className={styles.bottomSheet}
              onClick={(e) => e.stopPropagation()}
            >
              <TaskDetails
                task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
                onSave={handleUpdateTask}
                blockedBy={blockedByTasks}
                blocking={blockingTasks}
                isMobile={true}
              />
            </div>
          </div>
        )}

        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onCreateTask={handleCreateTask} />
      </div>
    </div>
  );
}