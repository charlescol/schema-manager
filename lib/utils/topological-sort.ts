/**
 * Performs a topological sort on a directed acyclic graph (DAG) represented by a map of dependencies.
 *
 * This function takes a map where the keys are nodes and the values are arrays of nodes that the key node depends on.
 * It returns an array of nodes in a valid topological order, such that every node appears after all the nodes it depends on.
 *
 * If a cycle is detected in the graph (i.e., if topological sorting is not possible), the function throws an error.
 * This ensures that the input is a valid DAG, as cycles would make a topological sort impossible.
 *
 * **Algorithm Overview**:
 * 1. Initialize in-degrees (number of dependencies) for each node.
 * 2. Build an adjacency list to track which nodes depend on each other.
 * 3. Use a queue to process all nodes with zero in-degrees (no dependencies).
 * 4. For each node processed, reduce the in-degree of its dependent nodes.
 * 5. If any node remains with a non-zero in-degree after processing, a cycle exists.
 *
 * **Example Input:**
 * ```
 * Map {
 *   "A" => ["B", "C"],
 *   "B" => ["D"],
 *   "C" => ["D"],
 *   "D" => []
 * }
 * ```
 *
 * **Example Output:**
 * ```
 * ["D", "B", "C", "A"]
 * ```
 *
 * @param {Map<string, string[]>} dependencies - A map where each key is a node and its value is an array of nodes it depends on.
 * @returns {string[]} - A list of nodes in valid topological order.
 * @throws {Error} - Throws an error if a cycle is detected, indicating that topological sorting is impossible.
 */
export default function topologicalSort(dependencies: Map<string, string[]>): string[] {
  // Initialize in-degrees (how many nodes a node depends on) for each node
  const inDegree: Map<string, number> = new Map();
  const adjList: Map<string, string[]> = new Map();

  // Set up each node with an initial in-degree of 0
  dependencies.forEach((_, node) => {
    inDegree.set(node, 0);
    adjList.set(node, []);
  });

  dependencies.forEach((deps, node) => {
    deps.forEach((dep) => {
      if (dep) {
        adjList.get(dep)!.push(node);
        inDegree.set(node, (inDegree.get(node) || 0) + 1);
      }
    });
  });

  // Queue for nodes with an in-degree of 0 (leaf nodes)
  const queue: string[] = [];
  inDegree.forEach((degree, node) => {
    if (degree === 0) {
      queue.push(node);
    }
  });

  const processingOrder: string[] = [];

  // Process nodes in topological order
  while (queue.length > 0) {
    const node = queue.shift()!;
    processingOrder.push(node);

    adjList.get(node)!.forEach((dependent) => {
      inDegree.set(dependent, inDegree.get(dependent)! - 1);
      if (inDegree.get(dependent) === 0) {
        queue.push(dependent);
      }
    });
  }

  // Check if a cycle exists in the graph
  if (processingOrder.length !== dependencies.size) {
    throw new Error('The graph contains a cycle, topological sorting is impossible.');
  }

  return processingOrder;
}
