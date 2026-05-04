/**
 * Utility function to check if a connection will create a cycle in the graph
 * Uses depth-first search algorithm to search for the source node from the target node
 * If reached, then a cycle exists in the graph. Ensures that the graph is a 
 * Directed Acyclic Graph - a requirement for the critical path traversals for Honors Project
 * submission
 * @param {Array} nodes 
 * @param {Array} edges 
 * @param {string} sourceId 
 * @param {string} targetId 
 * @returns {boolean} 
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

/**
 * Helper function to convert a task's complexity into a weight
 * to be used for its edges
 * 
 * @param {string} complexity
 * @returns {number}
 */
export function complexityToWeight(complexity) {
  switch ((complexity || "").toLowerCase()) {
    case "severe":
      return 5;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

/**
 * Takes arrays of tasks and edges and returns a map data structure
 * as an internal representation of the Nexus dependency graph. Returns
 * relevant information about the graph including, a task map, an outgoing 
 * adjacency map, an incoming adjacency map, and the indegree (as prereqs for task)
 * 
 * @param {Array} tasks
 * @param {Array} edges
 * @returns {{
 *  taskMap: Map,
 *  outgoing: Map,
 *  incoming: Map,
 *  indegree: Map
 * }}
 */
export function buildGraph(tasks, edges) {
  const taskMap = new Map();
  const outgoing = new Map();
  const incoming = new Map();
  const indegree = new Map();

  tasks.forEach((task) => {
    taskMap.set(task.id, {
      ...task,
      weight: complexityToWeight(task.complexity),
    }); // same task info plus derived weight
    
    // Empty initialized maps
    outgoing.set(task.id, []);
    incoming.set(task.id, []);
    indegree.set(task.id, 0);
  });

  // Populating the outgoing
  edges.forEach((edge) => {
    const { source, target } = edge;
    if (!taskMap.has(source) || !taskMap.has(target)) return; // fixing bug with invalid edges
    
    outgoing.get(source).push(target);
    incoming.get(target).push(source);
    indegree.set(target, indegree.get(target) + 1);
  });

  return {
    taskMap,
    outgoing,
    incoming,
    indegree,
  };
}