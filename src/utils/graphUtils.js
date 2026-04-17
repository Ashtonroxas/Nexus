/**
 * Utility function to check if a connection will create a cycle in the graph
 * Uses depth-first search algorithm to search for the source node from the target node
 * If reached, then a cycle exists in the graph. Ensures that the graph is a 
 * Directed Acyclic Graph - a requirement for the critical path traversals for Honors Project
 * submission
 * @param {*} nodes 
 * @param {*} edges 
 * @param {*} sourceId 
 * @param {*} targetId 
 * @return {boolean} 
 */
export function createsCycle(nodes, edges, sourceId, targetId) {
  if (sourceId === targetId) return true; // self loop check

  const adjacency = new Map();

  // Loading nodes and their edges into adjacency map
  nodes.forEach((node) => {
    adjacency.set(node.id, []);
  });
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source).push(edge.target);
  });

  if (!adjacency.has(sourceId)) adjacency.set(sourceId, []);
  adjacency.get(sourceId).push(targetId); // adding path temporarily to check if it creates a cycle

  // Depth-First Search traversal to see if can get to source from target
  const stack = [targetId];
  const visited = new Set();

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === sourceId) return true;
    if (visited.has(current)) continue;

    visited.add(current);

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return false;
}