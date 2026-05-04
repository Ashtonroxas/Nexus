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

/**
 * Function to produce the scheduling data for risk report. Uses the topological
 * sorted data and calculates timing to be used for critical path, slack, and bottleneck.
 * Returns an object containing taskTimes (a map with earliestStart, earliestFinish, 
 * latestStart, latestFinish, and slack), the sorted order, and the duration of project.
 * 
 * @param {Array} tasks
 * @param {Array} edges
 * @returns {{
 *  taskTimes: Map,
 *  topologicalOrder: Array<string>,
 *  projectDuration: number
 * }}
 */
export function computeSchedule(tasks, edges) {
  const { taskMap, outgoing, incoming } = buildGraph(tasks, edges);

  const topologicalOrder = topologicalSort(tasks, edges);
  // initializing the taskTimes map with empty values
  const taskTimes = new Map();
  tasks.forEach((task) => {
    taskTimes.set(task.id, {
      earliestStart: 0,
      earliestFinish: 0,
      latestStart: 0,
      latestFinish: 0,
      slack: 0,
    });
  });

  // First pass going forward to calculate earliest start and finish
  for (const taskId of topologicalOrder) {
    const task = taskMap.get(taskId);
    const prereqs = incoming.get(taskId) || [];

    // Earliest start will be the latest earliestFinish of a task's prereqs
    // (it can only be started when the prereqs are finished)
    let earliestStart = 0;
    for (const prereqId of prereqs) {
      const prereqTimes = taskTimes.get(prereqId);
      earliestStart = Math.max(earliestStart, prereqTimes.earliestFinish);
    }

    // earliest finish will be the earliest start plus the weight representing
    // its duration
    const earliestFinish = earliestStart + task.weight;

    taskTimes.set(taskId, {
      ...taskTimes.get(taskId),
      earliestStart,
      earliestFinish,
    });
  }

  // Project duration will be the largest earliestFinish
  let projectDuration = 0;
  for (const taskId of topologicalOrder) {
    const { earliestFinish } = taskTimes.get(taskId);
    projectDuration = Math.max(projectDuration, earliestFinish);
  }

  // Second pass through reversed list to calculate latest start and finish
  // Latest finish is the is the soonest latest start of all tasks
  // that depeond upon this task's completion. Latest start will be the latest
  // finish minus the weight representing how long this task will take
  const reversedOrder = [...topologicalOrder].reverse();
  for (const taskId of reversedOrder) {
    const task = taskMap.get(taskId);
    const nextTasks = outgoing.get(taskId) || [];

    let latestFinish;

    // Boundary check: If task has no outgoing edges, it is ending
    // - finishes at the project duration
    if (nextTasks.length === 0) {
      latestFinish = projectDuration;
    } else {
      latestFinish = Infinity;
    }

    for (const nextTaskId of nextTasks) {
      const nextTaskTimes = taskTimes.get(nextTaskId);
      latestFinish = Math.min(latestFinish, nextTaskTimes.latestStart);
    }

    const latestStart = latestFinish - task.weight;
    const earliestStart = taskTimes.get(taskId).earliestStart;
    const slack = latestStart - earliestStart;

    taskTimes.set(taskId, {
      ...taskTimes.get(taskId),
      latestStart,
      latestFinish,
      slack,
    });
  }

  return {
    taskTimes,
    topologicalOrder,
    projectDuration,
  };
}

/**
 * Function to interface with the frontend. Designed to return values used in the
 * RiskReport UI: tasks along the critical path, slack task count, zero-slack task count, 
 * primary bottleneck, and project duration
 * 
 * @param {Array} tasks
 * @param {Array} edges
 * @returns {{
 *  criticalPath: Array<tasks>,
 *  slackTasks: number,
 *  zeroSlackTasks: number,
 *  primaryBottleneck: Object,
 *  projectDuration: number
 * }}
 */
export function buildRiskReport(tasks, edges) {
  const { taskMap } = buildGraph(tasks, edges);
  const { taskTimes, topologicalOrder, projectDuration } = computeSchedule(tasks, edges);

  // Synthesized object containing all sorted tasks and all their information
  const analyzedTasks = topologicalOrder.map((taskId) => {
    const task = taskMap.get(taskId);
    const times = taskTimes.get(taskId);

    return {
      ...task,
      ...times,
    };
  });

  const criticalPath = analyzedTasks.filter((task) => task.slack === 0);
  const slackTasks = analyzedTasks.filter((task) => task.slack > 0).length;
  const zeroSlackTasks = criticalPath.length;

  // Primary bottleneck is 0 slack task with highest weight and latest earliestFinish
  let primaryBottleneck = null;
  for (const task of criticalPath) {
    if (!primaryBottleneck) {
      primaryBottleneck = task;
      continue;
    }

    if (task.weight > primaryBottleneck.weight) {
      primaryBottleneck = task;
    } else if (task.weight === primaryBottleneck.weight &&
      task.earliestFinish > primaryBottleneck.earliestFinish) {
        primaryBottleneck = task;
    }
  }

  return {
    criticalPath,
    slackTasks,
    zeroSlackTasks,
    primaryBottleneck,
    projectDuration,
  };
}