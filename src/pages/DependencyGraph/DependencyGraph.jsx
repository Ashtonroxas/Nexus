import React, { useCallback, useState, useEffect } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MiniMap, 
  Handle,        
  Position,      
  useReactFlow   
} from '@xyflow/react';
import { Calendar, AlertTriangle } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import styles from './DependencyGraph.module.css';
import TaskDetailPanel from './components/TaskDetailPanel/TaskDetailPanel';

/* CUSTOM NODE COMPONENT (The Task Card)*/
export function TextUpdaterNode({ id, data, selected }) {
  // Hook to update node data internally in React Flow
  const { updateNodeData } = useReactFlow();

  // Updates title as the user types directly on the node
  const handleTitleChange = (evt) => updateNodeData(id, { label: evt.target.value });

  // Cycles through statuses when the dot is clicked directly on the card
  const toggleStatus = () => {
    const nextStatus = data.status === 'To Do' ? 'In Progress' : data.status === 'In Progress' ? 'Done' : 'To Do';
    updateNodeData(id, { status: nextStatus });
  };

  // Assign color classes based on data
  let complexityClass = styles.tagLow;
  if (data.complexity === 'Medium') complexityClass = styles.tagMedium;
  if (data.complexity === 'High') complexityClass = styles.tagHigh;
  if (data.complexity === 'Severe') complexityClass = styles.tagSevere;

  let statusClass = styles.statusTodo;
  if (data.status === 'In Progress') statusClass = styles.statusProgress;
  if (data.status === 'Done') statusClass = styles.statusDone;

  // Dynamic borders (Indigo if selected, Red if it's a severe bottleneck)
  let cardStyle = {};
  if (selected) {
    cardStyle = { border: '2px solid var(--accent-button-bg)' }; 
  } else if (data.complexity === 'Severe') {
    cardStyle = { border: '2px solid var(--red-status-font)' }; 
  }

  return (
    <div className={styles.taskCard} style={cardStyle}>
      <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-button-bg)', border: 'none', width: '8px', height: '8px', left: '-4px' }} />
      
      <div className={styles.cardHeader}>
        <div className={styles.titleRow}>
          {/* nodrag class ensures clicking the text box doesn't drag the node */}
          <input 
            value={data.label} 
            onChange={handleTitleChange} 
            className={`${styles.taskTitleInput} nodrag`} 
            placeholder="Task Name"
          />
          <div 
            className={`${styles.statusDot} ${statusClass}`} 
            onClick={toggleStatus}
            title={`Status: ${data.status}`}
          />
        </div>

        <div className={styles.metaRow}>
          <div className={styles.assigneeBlock}>
            <div className={styles.avatar}>{data.assigneeInitials}</div>
            <span className={styles.assigneeName}>{data.assigneeName}</span>
          </div>
          <div className={styles.dateBlock}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={`${styles.complexityTag} ${complexityClass}`}>
          {data.complexity.toUpperCase()}
        </div>

        {/* Bottleneck Warning that only appears on 'Severe' tasks */}
        {data.complexity === 'Severe' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red-status-font)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            <AlertTriangle className="w-4 h-4" />
            Bottleneck
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-button-bg)', border: 'none', width: '8px', height: '8px', right: '-4px' }} />
    </div>
  );
}

const nodeTypes = { textUpdater: TextUpdaterNode };

/* 2. INITIAL "MOCK" DATA Starts the project off with a single clean task node.*/

const mockNodes = [
  { 
    id: 'task-1', 
    type: 'textUpdater', 
    position: { x: 250, y: 150 }, 
    data: { 
      label: 'Initial Task', 
      assigneeName: 'Unassigned', assigneeInitials: '??',
      status: 'To Do', date: new Date().toISOString().split('T')[0], complexity: 'Low'
    }
  }
];

const mockEdges = []; // No connections exist yet on a new project

/* 3. MAIN ORCHESTRATOR COMPONENT - 
This is where all the state lives and where we define the handlers for creating/updating nodes and edges. 
*/

export default function DependencyGraph() {
  // State controllers
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // UI States
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /*Fetching Data on Load - 
  In a real app, this would pull from Firebase and populate the graph with existing 
  tasks and dependencies for the project. For now, it simulates loading with mock data.*/
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        // TODO: FIREBASE - Replace the timeout with: 
        // const snapshot = await getDocs(collection(db, "projects", projectId, "tasks"));
        setTimeout(() => {
          setNodes(mockNodes);
          setEdges(mockEdges);
          setIsLoading(false);
        }, 500); // Network delay
      } catch (error) {
        console.error("Error fetching graph data:", error);
      }
    };
    fetchGraphData();
  }, [setNodes, setEdges]);

  // Adding a New Task Node
  const handleAddNode = async () => {
    const newTaskData = { 
      label: `New Task`, assigneeName: 'Unassigned', assigneeInitials: '??',
      status: 'To Do', date: new Date().toISOString().split('T')[0], complexity: 'Low'
    };
    
    // TODO: FIREBASE - Add document to database first to get the real ID from Firebase
    const realId = `task-${Math.random().toString(36).substring(7)}`; // Temporary mock ID

    const newNode = {
      id: realId, type: 'textUpdater', 
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 }, 
      data: newTaskData
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // --- UPDATE: Saving changes (Title, Status, Date, Complexity) from the Side Panel ---
  const handleUpdateNodeData = async (nodeId, newData) => {
    // TODO: FIREBASE - updateDoc(doc(db, "tasks", nodeId), newData);
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: { ...node.data, ...newData } };
          // Keep the sidebar instantly synced with the new data
          if (selectedTask?.id === nodeId) {
            setSelectedTask(updatedNode);
          }
          return updatedNode;
        }
        return node;
      })
    );
  };

  // --- UPDATE: Saving a node's physical layout position after dragging ---
  const onNodeDragStop = useCallback(async (event, node) => {
    // TODO: FIREBASE - updateDoc(doc(db, "tasks", node.id), { position: node.position });
  }, []);

  // --- CREATE EDGE: Linking two nodes manually by dragging the handles ---
  const onConnect = useCallback(
    async (params) => {
      // TODO: FIREBASE - Save this dependency connection object in the DB
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges],
  );

  /* EDGE MANAGEMENT HANDLERS (Adding/Removing Dependencies) - 
  These are passed down to the TaskDetailPanel component*/

  // --- CREATE EDGE: Linking two nodes via the dropdown in the sidebar ---
  const handleAddEdgeFromPanel = async (sourceId, targetId) => {
    const newEdge = { id: `e${sourceId}-${targetId}`, source: sourceId, target: targetId, animated: true };
    // TODO: FIREBASE - Save this dependency connection in the DB
    setEdges((eds) => addEdge(newEdge, eds));
  };

  // --- DELETE EDGE: Removing a connection via the 'X' in the sidebar ---
  const handleRemoveEdgeFromPanel = async (edgeId) => {
    // TODO: FIREBASE - Delete this dependency connection from the DB
    setEdges((eds) => eds.filter(e => e.id !== edgeId));
  };

  // Intercept the edges array before render to apply dynamic styling
  const styledEdges = edges.map((edge) => ({
    ...edge,
    style: {
      stroke: edge.selected ? 'var(--accent-button-bg)' : '#9CA3AF', // Turns indigo when clicked by the user
      strokeWidth: edge.selected ? 3 : 1.5,
      ...edge.style, 
    },
    // Creates an invisible for easier clickability
    interactionWidth: 20 
  }));
    
  return (
    <div className={styles.blueprintContainer}>
      
      <div className={styles.blueprintHeader}>
        <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '20px', color: '#111827' }}>Project Dependency Graph</h2>
        <p style={{ margin: 0, marginTop: '4px', fontSize: '14px', color: '#6B7280' }}>Interactive Task Visualization</p>
      </div>

      <div className={styles.blueprintCanvas}>
        {isLoading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, fontWeight: 'bold', color: '#6B7280' }}>
            Loading Project Graph...
          </div>
        )}

        <div className={styles.floatingToolbar}>
          <button 
            style={{ backgroundColor: 'var(--accent-button-bg)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={handleAddNode}
            disabled={isLoading}
          >
            + Add Task
          </button>
        </div>

        {/* Core Interactive Canvas Component */}
        <ReactFlow 
          nodes={nodes} 
          edges={styledEdges} 
          nodeTypes={nodeTypes} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop} 
          onNodeClick={(event, node) => setSelectedTask(node)} // Opens Sidebar
          onPaneClick={() => setSelectedTask(null)}            // Closes Sidebar
          fitView
          defaultEdgeOptions={{ focusable: true }}             // Allows edges to be clicked/selected
        >
          <Controls />
          <MiniMap nodeColor="var(--accent-button-bg)" maskColor="rgba(0, 0, 0, 0.1)" /> 
        </ReactFlow>

        {/* Separated Sidebar Component. Passes it the edge handlers to talk to the graph. */}
        <TaskDetailPanel 
          task={selectedTask} 
          isOpen={!!selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onUpdateTask={handleUpdateNodeData} 
          nodes={nodes}
          edges={edges}
          onAddEdge={handleAddEdgeFromPanel}
          onRemoveEdge={handleRemoveEdgeFromPanel}
        />
      </div>
    </div>
  );
}