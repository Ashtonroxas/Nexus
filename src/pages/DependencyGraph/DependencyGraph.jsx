import React, { useCallback } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, addEdge, MiniMap, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NexusLayout from '../../layouts/NexusLayout';
import styles from './DependencyGraph.module.css';

//Starter Nodes on Every New Project, 2 connected Nodes
const initialNodes = [
  { 
    id: '1', 
    position: { x: 100, y: 100 }, 
    data: { label: ' Task 1' },
    sourcePosition: 'right', // outgoing dot to  right side
    targetPosition: 'left'   // incoming dot to  left side
  },
  { 
    id: '2', 
    position: { x: 400, y: 200 }, 
    data: { label: ' Task 2' },
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

  //Drawing new lines
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
    const newNodeId = `Task-${Math.random().toString(36)}`;
    const newNode = {
      id: newNodeId,
      position: { 
        x: Math.random() * 200 + 100, 
        y: Math.random() * 200 + 100 
      }, 
      data: { label: ` Task ${nodes.length + 1}` },
      sourcePosition: 'right', 
      targetPosition: 'left'   
    };
    
    setNodes((nds) => [...nds, newNode]);
  };
    
  return (
    <div className={styles.blueprintContainer}>
      
      <div className={styles.blueprintHeader}>
        <h2 className="m-0 fw-bold">Dependency Graph</h2>
        <p className="text-muted m-0 mt-1">Basic foundation</p>
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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background variant="dots" gap={20} size={1} />
          {/*Controls (zoom/pan) and MiniMap (navigation overview) */}
          <Controls />
          <MiniMap nodeColor="#6366F1" maskColor="rgba(0, 0, 0, 0.1)" /> 
        </ReactFlow>
      </div>

    </div>
  );
}