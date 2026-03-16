import React, { useCallback } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MiniMap, 
  MarkerType,
  Handle,        
  Position,      
  useReactFlow   
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NexusLayout from '../../layouts/NexusLayout';
import styles from './DependencyGraph.module.css';

// Updated TextUpdaterNode 
export function TextUpdaterNode({ id, data }) {
  const { updateNodeData } = useReactFlow();

  const onChange = useCallback((evt) => {
    updateNodeData(id, { label: evt.target.value });
  }, [id, updateNodeData]);

  return (
    <div 
      className="text-updater-node" 
      style={{ 
        background: '#fff', 
        border: '1px solid #232323',
        borderRadius: '8px', 
        minWidth: '120px',
        padding: '12px 10px', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      <input 
        id={`text-${id}`} 
        name="text" 
        value={data.label} 
        onChange={onChange} 
        className="nodrag" 
        style={{ 
          width: '100%', 
          padding: '0',          // Removed padding so only the text area is the input
          border: 'none',        
          outline: 'none',       
          background: 'transparent',
          textAlign: 'center',
          fontWeight: 'bold',
          color: '#333'
        }}
      />

      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
}

const nodeTypes = { textUpdater: TextUpdaterNode };

const initialNodes = [
  { 
    id: '1', 
    type: 'textUpdater', 
    position: { x: 100, y: 100 }, 
    data: { label: 'Task 1' },
    sourcePosition: 'right', 
    targetPosition: 'left'   
  },
  { 
    id: '2', 
    type: 'textUpdater', 
    position: { x: 400, y: 200 }, 
    data: { label: 'Task 2' },
    sourcePosition: 'right',
    targetPosition: 'left'
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

  //Function to generate and add a new node
  const handleAddNode = () => {
    const newNodeId = `Task-${Math.random().toString(36).substring(7)}`;
    const newNode = {
      id: newNodeId,
      type: 'textUpdater', 
      position: { 
        x: Math.random() * 200 + 100, 
        y: Math.random() * 200 + 100 
      }, 
      data: { label: `Task ${nodes.length + 1}` },
      sourcePosition: 'right', 
      targetPosition: 'left'   
    };
    
    setNodes((nds) => [...nds, newNode]);
  };
    
  return (
    <div className={styles.blueprintContainer}>
      
      <div className={styles.blueprintHeader}>
        <h2 className="m-0 fw-bold">Dependency Graph</h2>
        <p className="text-muted m-0 mt-1">Relational task dependency overview</p>
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
          fitView
        >
          <Background variant="dots" gap={20} size={1} />
          <Controls />
          <MiniMap nodeColor="#6366F1" maskColor="rgba(0, 0, 0, 0.1)" /> 
        </ReactFlow>
      </div>

    </div>
  );
}