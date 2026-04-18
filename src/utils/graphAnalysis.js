import { buildGraph } from "./graphUtils";

/**
 * https://www.geeksforgeeks.org/dsa/topological-sorting/
 * https://www.geeksforgeeks.org/dsa/topological-sorting-indegree-based-solution/
 * 
 * Using Kahn's algorithm described in the above sources, performs a topological
 * sort so that the tasks are ordered with prerequisites before their subsequent 
 * following tasks. Returns an ordered task id list
 * 
 * @param {Array} tasks
 * @param {Array} edges
 * @returns {Array<string>}
 */
export function topologicalSort(tasks, edges) {
    const { outgoing, indegree } = buildGraph(tasks, edges);

    // BFS tracking queue implementing Kahn's
    const queue = [];

    // 1. Add all non-dependent tasks into queue
    indegree.forEach((degree, taskId) => {
        if (degree === 0) queue.push(taskId);
    });

    const order = [];
    while (queue.length > 0) {
        // 2. pop from queue into ordered array
        const curr = queue.shift();
        order.push(curr);

        // 3. Reduce all its dependent tasks' indegrees by 1 to exclude it
        const neighbors = outgoing.get(curr) || [];
        for (const neighbor of neighbors) {
            indegree.set(neighbor, indegree.get(neighbor) - 1);
            // 4. Add the new tasks with indegree 0's into queue to be processed
            if (indegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        }
    }

    if (order.length !== tasks.length) {
        throw new Error("Sort failed, graph contains cycle");
    }

    return order;
}