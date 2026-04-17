import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
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
  getDoc
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../firebase/AuthContext";
import TaskNode from './components/TaskNode/TaskNode';
import CustomEdge from './components/CustomEdge/CustomEdge'; 
import CreateTaskModal from './components/CreateTaskModal/CreateTaskModal';
import TaskDetails from './components/TaskDetails/TaskDetails';
import { logActivity } from "../../utils/activityLogger";
import { createsCycle } from '../../utils/graphUtils';
import styles from './DependencyGraph.module.css';

const nodeTypes = { 
  taskNode: TaskNode,
};

export default function DependencyGraph() {
  // React flow node + edge management
  const [nodes, setNodes ] = useNodesState([]);
  const [edges, setEdges ] = useEdgesState([]);

  // Track which edge the mouse is currently hovering over
  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);

  // Register our custom edge type
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  const { menuButton } = useOutletContext(); // from parent layout
  const { projectId } = useParams();
  const { currentUser } = useAuth(); // Current authenticated user

  // State management for temp/permanent project data
  const [project, setProject] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("#6366F1");

  // State management for team members fetched from Firestore
  const [teamMembers, setTeamMembers] = useState([]);

  // System status loading information
  const [saveStatus, setSaveStatus] = useState("idle");
  const [hasLoadedProject, setHasLoadedProject] = useState(false);

  // Project color display
  const [showColorPicker, setShowColorPicker] = useState(false);
  const desktopPickerRef = useRef(null);
  const mobilePickerRef = useRef(null);

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  
  // Handling task selection styling and sidebar status
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // 768 screen limit for screensize differentiation
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const positionField = isMobile ? "positionMobile" : "positionDesktop";

  // Fetch Team Members specifically invited to this project
  useEffect(() => {
    if (!projectId) return;

    const membersRef = collection(db, "projects", projectId, "members");
    const unsubscribe = onSnapshot(membersRef, async (snapshot) => {
      const memberDocs = snapshot.docs.map(doc => doc.id); // Get UIDs

      // Fetch full user details from the 'users' collection
      const memberDetails = await Promise.all(
        memberDocs.map(async (userId) => {
          const userSnap = await getDoc(doc(db, "users", userId));
          const userData = userSnap.exists() ? userSnap.data() : {};
          return {
            id: userId,
            name: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || "Unknown User",
          };
        })
      );

      // Sort alphabetically by name
      memberDetails.sort((a, b) => a.name.localeCompare(b.name));
      setTeamMembers(memberDetails);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Helper function to generate random task code
  // Added checks to ensure repeating bug after deleting nodes was removed
  const generateNextTaskCode = async () => {
    if (!projectId) return "TASK-101";

    try {
      const tasksRef = collection(db, "projects", projectId, "tasks");
      const snapshot = await getDocs(tasksRef);

      let maxNumber = 100; //builds from a base of 100 and counts projects

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

  /*Project and Firestore handlers*/

  // Saves entered project information into firestore - handles exceptions
  // Keeps user informed regarding save status using "saved/saving" label
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

  // -- Task CRUD -- //

  // Create task in firestore and initialize fields with defaults
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

        positionDesktop: {
          x: 120 + nodes.length * 260,
          y: 140 + nodes.length * 120,
        },
        positionMobile: {
          x: 40 + nodes.length * 140,
          y: 100 + nodes.length * 100,
        }
      }); 

      // Log activity for task creation
      await logActivity(projectId, 'task_created', {
        senderName: currentUser?.displayName || "A team member",
        projectName: projectName || "Project",
        taskCode: nextTaskCode,
      });
    } catch (error) {
      console.error("Error creating task: ", error);
    }
  };

  // Updates existing firestore task collection with user edits
  const handleUpdateTask = async (taskId, updates) => {
    if (!projectId || !taskId) return;

    // Create a base object with the timestamp
    const firestoreUpdates = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // ONLY recalculate and overwrite assignee logic if an assignee update was explicitly passed in
    if (updates.assigneeName !== undefined) {
      const assigneeName = updates.assigneeName.trim() || "Unassigned";
      const assigneeInitials = assigneeName !== "Unassigned"
        ? assigneeName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((i) => i[0].toUpperCase())
          .join("")
        : "--";

      firestoreUpdates.assigneeName = assigneeName;
      firestoreUpdates.assigneeInitials = assigneeInitials;
    }

    try {
      await updateDoc(doc(db, "projects", projectId, "tasks", taskId), firestoreUpdates);
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  // Deletes task collections and any relevant dependency arrows originating or ending at deleted task
  const handleDeleteTask = useCallback(
    async (taskId) => {
      if (!projectId || !taskId) return;

      try {
        // Fetch task data before deleting to get task code for activity logging
        const taskDoc = await getDoc(doc(db, "projects", projectId, "tasks", taskId));
        const taskData = taskDoc.data();
        const taskCode = taskData?.taskCode || 'Unknown Task';

        const edgesRef = collection(db, "projects", projectId, "edges");
        const edgeSnapshot = await getDocs(edgesRef);

        const connectedEdges = edgeSnapshot.docs.filter((edgeDoc) => {
          const data = edgeDoc.data();
          return data.source === taskId || data.target === taskId;
        });

        await Promise.all( // delete all associated edges
          connectedEdges.map((edgeDoc) => 
            deleteDoc(doc(db, "projects", projectId, "edges", edgeDoc.id))
        )
      );

      // delete all associated tasks
      await deleteDoc(doc(db, "projects", projectId, "tasks", taskId));

      // Log activity for task deletion
      await logActivity(projectId, 'task_deleted', {
        senderName: currentUser?.displayName || "A team member",
        projectName: projectName || "Project",
        taskCode: taskCode,
      });

      // Update UI status for immediate system status
      setEdges((eds) => 
        eds.filter((edge) => edge.source !== taskId && edge.target !== taskId));
      setNodes((nds) => nds.filter((node) => node.id !== taskId));
      } catch (error) {
        console.error("Error deleting task and edges: ", error);
      }
    }, [projectId, setNodes, setEdges, currentUser, projectName]);

  // Check for approaching deadlines and log activities
  const checkApproachingDeadlines = useCallback(async (taskDocs) => {
    if (!projectId || !projectName) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    for (const taskDoc of taskDocs) {
      const taskData = taskDoc.data();
      
      // Skip if no due date or task is already done
      if (!taskData.dueDate || taskData.status === "Done") continue;

      // Parse the due date
      const dueDate = new Date(taskData.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // Check if deadline is approaching (within 3 days and not in the past)
      if (dueDate >= today && dueDate <= threeDaysFromNow) {
        try {
          // Check if we've already logged a deadline activity for this task
          const activitiesRef = collection(db, "projects", projectId, "activities");
          const existingActivities = await getDocs(activitiesRef);
          
          const alreadyLogged = existingActivities.docs.some(doc => {
            const data = doc.data();
            return data.type === 'deadline' && data.taskCode === taskData.taskCode;
          });

          // Only log if we haven't already logged this deadline
          if (!alreadyLogged) {
            await logActivity(projectId, 'deadline', {
              senderName: "System",
              projectName: projectName,
              taskCode: taskData.taskCode,
            });
          }
        } catch (error) {
          console.error("Error checking deadline:", error);
        }
      }
    }
  }, [projectId, projectName]);

  // Handles association of dependencies and task collections in firestore for use
  // when user connects two nodes on the graph UI
  const onConnect = useCallback(
    async (params) => {
      if (!projectId || !params.source || !params.target) return;

      // Validity checks (edge already exists/cycle paths)
      const edgeExists = edges.some(
        (edge) => edge.source === params.source && edge.target === params.target //check if matching edge already there
      );
      if (edgeExists) return;
      if (createsCycle(nodes, edges, params.source, params.target)) return; // checks for cyclic path

      const edgeId = `edge-${params.source}-${params.target}`;
      const newEdge = {
        id: edgeId,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'custom', // Use custom edge by default
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14, // Made arrow smaller (from 20)
          height: 14, // Made arrow smaller (from 20)
        },
        style: {
          stroke: "#6B7280",
          strokeWidth: 4, 
        },
      };

      setEdges((eds) => addEdge(newEdge, eds)); //udpate UI

      // update firestore
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
    }, [projectId, setEdges, edges, nodes]);

    // Function updates stored node coordinates upon any UI position changes
    // - dragging in this case
  const handleNodesChange = useCallback(
    async (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      const positionChanges = changes.filter(
        (change) => change.type === "position" &&
                    change.position &&
                    change.dragging === false
      ); // obtain all nodes with affected positions

      for (const change of positionChanges) {
        try {
          await updateDoc(doc(db, "projects", projectId, "tasks", change.id), {
            [positionField]: {
              x: change.position.x,
              y: change.position.y,
            },
            updatedAt: serverTimestamp(), //update firestore subcollection
          });
        } catch (error) {
          console.error("Error saving node position: ", error);
        }
      }
    }, [projectId, setNodes, positionField]);

  // handle removing edges between nodes by updating firestore
  const handleEdgesChange = useCallback(
    async (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds)); // UI update

      const removedEdges = changes.filter(
        (change) => change.type === "remove" && change.id
      ); // get all removed edges

      for (const edge of removedEdges) {
        try {
          await deleteDoc(doc(db, "projects", projectId, "edges", edge.id));
        } catch (error) {
          console.error("Error deleting edge: ", error);
        } // delete them in firestore
      }
    }, [projectId, setEdges]);

  // Delete an edge function passed to the custom hover button
  const handleDeleteEdge = useCallback(async (edgeId) => {
    if (!projectId || !edgeId) return;
    try {
      await deleteDoc(doc(db, "projects", projectId, "edges", edgeId));
    } catch (error) {
      console.error("Error deleting edge via hover button: ", error);
    }
  }, [projectId]);

  // Double click deletion (Kept as a convenient fallback)
  const onEdgeDoubleClick = useCallback(async (event, edge) => {
    if (!projectId || !edge.id) return;
    handleDeleteEdge(edge.id);
  }, [projectId, handleDeleteEdge]);

  // apply animations, styling, and custom data properties
  const edgesWithDynamicStyles = useMemo(() => {
    return edges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      
      // check if the source node (where the arrow starts) is severe
      const isSevere = sourceNode?.data?.complexity?.toLowerCase() === "severe";
      const isSourceDone = sourceNode?.data?.status?.toLowerCase() === "done";

      // Determine the color and thickness
      let edgeColor = "#6B7280"; 
      let edgeWidth = 4; 

      if (isSourceDone) {
        edgeColor = "#22C55E"; 
        edgeWidth = 4; 
      } else if (isSevere) {
        edgeColor = "#EF4444"; 
        edgeWidth = 4; // Changed from 2 to 4 so it matches all other arrows
      }

      if (edge.selected) {
        edgeColor = "#6366F1"; 
        edgeWidth = 6;         
      }

      return {
        ...edge,
        type: 'custom', // Bind to our custom edge component
        animated: true, 
        data: {
          ...edge.data,
          onDelete: handleDeleteEdge,
          isHovered: hoveredEdgeId === edge.id,
          isSelected: edge.selected,
          // Methods to trigger hover state from within the HTML button label itself
          onHoverEnter: () => setHoveredEdgeId(edge.id),
          onHoverLeave: () => setHoveredEdgeId(null),
        },
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
  }, [edges, nodes, hoveredEdgeId, handleDeleteEdge]);

  // -- Project Summary Helper Functions -- //

  // Update firestore with tasks marked as done for progress usage
  const updateProjectTaskInfo = useCallback(
    async (taskDocs) => {
      if (!projectId) return;

      const taskCount = taskDocs.length;

      const completedTasks = taskDocs.filter((taskDoc) => {
        const status = taskDoc.data()?.status || "";
        return status.toLowerCase() === "done";
      }).length; // updates when tasks are marked as done

      try {
        await updateDoc(doc(db, "projects", projectId), {
          taskCount,
          completedTaskCount: completedTasks,
          updatedAt: serverTimestamp(),
        }); // record in firestore for project dashboard progress bar display
      } catch (error) {
        console.error("Error updating project task info: ", error);
      }
    }, [projectId]);

  // Set project deadline based on latest task
  const updateProjectDeadline = useCallback(
    async (taskDocs) => {
      if (!projectId) return;

      // Fetch task deadlines and find the latest deadline
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
        }); // Update firestore project doc with derived deadline
      } catch (error) {
        console.error("Error updating project deadline: ", error);
      }
    }, [projectId]);
  
  // -- Task Relationship Helper Functions -- //

  // Find tasks where the edge sources are from non-done tasks
  const blockedByTasks = selectedTask ?
    edges
      .filter((edge) => edge.target === selectedTask.id)
      .map((edge) => nodes.find((node) => node.id === edge.source))
      .filter(Boolean)
      .filter((node) => node.data.status?.toLowerCase() !== "done")
      .map((node) => ({
        id: node.id,
        taskCode: node.data.taskCode,
        title: node.data.title,
      }))
    : [];

  // Find destination nodes from current node if its not done
  const blockingTasks = selectedTask ?
      edges
        .filter((edge) => edge.source === selectedTask.id)
        .map((edge) => nodes.find((node) => node.id === edge.target))
        .filter(Boolean)
        .filter((node) => node.data.status?.toLowerCase() !== "done")
        .map((node) => ({
          id: node.id,
          taskCode: node.data.taskCode,
          title: node.data.title,
        }))
    : [];

  // Task modal toggle
  const handleOpenCreateTask = () => {
    setShowCreateTaskModal(true);
  };

  // -- Life cycle useEffects -- //

  // Allowing user to escape color wheel by clicking anywhere else on the page
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedDesktopPicker = desktopPickerRef.current && desktopPickerRef.current.contains(e.target);
      const clickedMobilePicker = mobilePickerRef.current && mobilePickerRef.current.contains(e.target);

      if (!clickedDesktopPicker && !clickedMobilePicker) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Project information firestore listener
  useEffect(() => {
    if (!projectId) return;

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

        if (!hasLoadedProject) {
          setProjectName((prev) => (hasLoadedProject ? prev : projectData.name));
          setProjectDescription((prev) => (hasLoadedProject? prev : projectData.description));
          setProjectColor(projectData.color);
          setHasLoadedProject(true);
        }
      }
    });

    return () => unsubscribe();
  }, [projectId, hasLoadedProject]);

  // Updating project auto-save status message
  useEffect(() => {
    if (!hasLoadedProject || !project) return;
    setSaveStatus("idle");

    const timeout = setTimeout(() => {
      handleSaveProjectDetails();
    }, 700);

    return () => clearTimeout(timeout);
  }, [projectName, projectDescription, projectColor]);

  // Responsive resizing with a window listener (used for node rendering)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Firestore snapshot listener for tasks subcollection and parse data for UI components
  useEffect(() => {
    if (!projectId) return;

    const tasksRef = collection(db, "projects", projectId, "tasks");
    const tasksQuery = query(tasksRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const firestoreNodes = snapshot.docs.map((taskDoc, index) => {
        const data = taskDoc.data();

        const savedPosition = isMobile
          ? data.positionMobile
          : data.positionDesktop;

        return {
          id: taskDoc.id,
          type: "taskNode",
          selected: taskDoc.id === selectedTaskId,
          position: {
            x: savedPosition?.x ?? (isMobile ? 40 + index * 140 : 120 + index * 260),
            y: savedPosition?.y ?? (isMobile ? 100 + index * 100 : 140 + index * 120),
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
      
      // Check for approaching deadlines
      checkApproachingDeadlines(snapshot.docs);
    });

    return () => unsubscribe();
  }, [projectId, 
      setNodes, 
      handleDeleteTask, 
      updateProjectDeadline, 
      updateProjectTaskInfo,
      selectedTaskId,
      checkApproachingDeadlines,
      isMobile
    ]);
  
  // Syncing selected task for UI state management
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

  // Firestore snapshot edge subcollection listener and parsing for UI components
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
          type: 'custom',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14, // Made arrow smaller
            height: 14, // Made arrow smaller
          },
          style: {
            stroke: "#6B7280",
            strokeWidth: 4, 
          },
        };
      });

      setEdges(firestoreEdges);
    });

    return () => unsubscribe();
  }, [projectId, setEdges]);

  return (
    <div className={styles.blueprintContainer}>
      <div className={styles.blueprintHeader}>
        <div className={styles.desktopHeader}>
          <div className={styles.desktopTextBlock}>
            <div className={styles.desktopBreadcrumbRow}>
              <span className={styles.desktopBreadcrumb}>Projects /</span> {/* Breadcrumb row header */}

              {/* Editable title in breadcrumb row*/}
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={styles.desktopBreadcrumbTitle}
                placeholder="Untitled Project"
              />
            </div>

            {/* Project color settings dot */}
            <div className={styles.desktopDetailsRow}>
              <div ref={desktopPickerRef} className={styles.colorPickerWrapper}>
                <div
                  className={styles.colorDot}
                  style={{ backgroundColor: projectColor }}
                  onClick={() => setShowColorPicker((prev) => !prev)}
                />
                
                {/* Conditionally render hex color picker component if toggled */}
                {showColorPicker && (
                  <div className={styles.colorPickerPopover}>
                    <HexColorPicker
                      color={projectColor}
                      onChange={setProjectColor}
                    />
                  </div>
                )}
              </div>

              {/* Editable project description field text area */}
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className={styles.projectDescriptionInput}
                placeholder="Add project description"
              />
            </div>

            {/* System status save update message */}
            <div className={styles.saveStatus}>
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
            </div>
          </div>
        </div>

        {/* Mobile header modifications for ordering */}
        <div className={styles.mobileHeader}>
          <div className={styles.mobileTopRow}>
            <div className={styles.menuRow}>
              {menuButton}
            </div>

            {/* Editable breadcrumb title */}
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
          
          {/* Description row includes conditional hex color picker rendering and editable desctiption
          field text area */}
          <div className={styles.mobileDescriptionRow}>
              <div ref={mobilePickerRef} className={styles.colorPickerWrapper}>
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

            {/* Stacked system status UI on mobile */}
            <div className={styles.mobileSaveStatus}>
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
            </div>
          </div>
      </div>
      <div className={styles.blueprintCanvas}>
        {/* Add task action button */}
        <div className={styles.floatingToolbar}>
          <button 
            className="btn btn-primary btn-sm" 
            style={{ backgroundColor: '#6366F1', border: 'none' }}
            onClick={handleOpenCreateTask}
          >
            + Add Task
          </button>
        </div>

        {/* Main grid display for background, nodes, and arrows */}
        <ReactFlow 
          nodes={nodes} 
          edges={edgesWithDynamicStyles}
          nodeTypes={nodeTypes} 
          edgeTypes={edgeTypes} /* Registered Custom Edge Types */
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={onEdgeDoubleClick} 
          /* Hover events to track which edge is active */
          onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
          onEdgeMouseLeave={() => setHoveredEdgeId(null)}
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
          {!isMobile && (
            <MiniMap nodeColor="#6366F1" maskColor="rgba(0, 0, 0, 0.3)" />
          )}
        </ReactFlow>
        
        {/* Conditional popover from the bottom task detail component for selecting tasks on mobile */}
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
                teamMembers={teamMembers}
                projectName={projectName}
              />
            </aside>
          </div>
        )}

        {/* Conditional sidebar from side rednering for selecting tasks on desktop */}
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
                teamMembers={teamMembers}
                projectName={projectName}
              />
            </div>
          </div>
        )}

        {/* Conditional task creation modal rendering */}
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onCreateTask={handleCreateTask}
          teamMembers={teamMembers} 
        />
      </div>
    </div>
  );
}