/**
 * Nexus Conversion Algorithm
 * 
 * Converts a visual canvas of shapes and connections into an ordered,
 * prioritized task list using topological sorting and dependency analysis.
 */

import type { NexusShape, NexusConnection, GeneratedTask } from '@/types/nexus';

// ── Graph helpers ──────────────────────────────────────

interface AdjacencyMap {
  [shapeId: string]: string[];  // shapeId -> list of dependent shapeIds
}

function buildAdjacency(shapes: NexusShape[], connections: NexusConnection[]): AdjacencyMap {
  const adj: AdjacencyMap = {};
  const shapeIds = new Set(shapes.map(s => s.id));

  for (const s of shapes) {
    adj[s.id] = [];
  }
  for (const c of connections) {
    if (shapeIds.has(c.fromShapeId) && shapeIds.has(c.toShapeId)) {
      if (!adj[c.fromShapeId]) adj[c.fromShapeId] = [];
      adj[c.fromShapeId].push(c.toShapeId);
    }
  }
  return adj;
}

function computeInDegree(shapes: NexusShape[], adj: AdjacencyMap): Map<string, number> {
  const inDeg = new Map<string, number>();
  for (const s of shapes) inDeg.set(s.id, 0);
  for (const from in adj) {
    for (const to of adj[from]) {
      inDeg.set(to, (inDeg.get(to) || 0) + 1);
    }
  }
  return inDeg;
}

/**
 * Kahn's algorithm for topological sort.
 * Falls back to Y-position ordering for cyclic subgraphs.
 */
function topologicalSort(shapes: NexusShape[], adj: AdjacencyMap): string[] {
  const inDeg = computeInDegree(shapes, adj);
  const queue: string[] = [];
  const result: string[] = [];
  const shapeMap = new Map(shapes.map(s => [s.id, s]));

  // Start with all root nodes (in-degree 0), sorted by Y position (top-first)
  const roots = shapes
    .filter(s => (inDeg.get(s.id) || 0) === 0)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  for (const r of roots) queue.push(r.id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const neighbors = (adj[current] || [])
      .map(id => ({ id, shape: shapeMap.get(id)! }))
      .sort((a, b) => (a.shape?.y || 0) - (b.shape?.y || 0));

    for (const { id } of neighbors) {
      inDeg.set(id, (inDeg.get(id) || 0) - 1);
      if (inDeg.get(id) === 0) {
        queue.push(id);
      }
    }
  }

  // Handle cycles: add remaining shapes sorted by Y position
  if (result.length < shapes.length) {
    const visited = new Set(result);
    const remaining = shapes
      .filter(s => !visited.has(s.id))
      .sort((a, b) => a.y - b.y || a.x - b.x);
    for (const r of remaining) result.push(r.id);
  }

  return result;
}

// ── Priority inference ─────────────────────────────────

function inferPriority(
  shape: NexusShape,
  adj: AdjacencyMap,
  inDeg: Map<string, number>
): 'Low' | 'Medium' | 'High' {
  // Explicit priority on shape takes precedence
  if (shape.priority) return shape.priority;

  const outDeg = (adj[shape.id] || []).length;
  const inDegree = inDeg.get(shape.id) || 0;

  // Root nodes with many dependents are high priority
  if (inDegree === 0 && outDeg >= 2) return 'High';
  // Nodes with many connections are medium priority
  if (outDeg >= 1 || inDegree >= 2) return 'Medium';
  // Leaf nodes or isolated nodes are low priority
  return 'Low';
}

// ── Estimated hours heuristic ──────────────────────────

function estimateHours(
  shape: NexusShape,
  adj: AdjacencyMap
): number {
  const textLength = shape.text.trim().length;
  const outDeg = (adj[shape.id] || []).length;

  // Larger text suggests more complex task
  let base = 1;
  if (textLength > 50) base = 3;
  else if (textLength > 20) base = 2;

  // Nodes that feed many others likely represent larger effort
  if (outDeg >= 3) base += 2;
  else if (outDeg >= 1) base += 1;

  return base;
}

// ── Main conversion function ───────────────────────────

export function convertCanvasToTasks(
  shapes: NexusShape[],
  connections: NexusConnection[]
): GeneratedTask[] {
  if (shapes.length === 0) return [];

  const adj = buildAdjacency(shapes, connections);
  const inDeg = computeInDegree(shapes, adj);
  const sortedIds = topologicalSort(shapes, adj);
  const shapeMap = new Map(shapes.map(s => [s.id, s]));

  // Build reverse adjacency for dependency tracking
  const reverseAdj: AdjacencyMap = {};
  for (const s of shapes) reverseAdj[s.id] = [];
  for (const c of connections) {
    if (shapeMap.has(c.fromShapeId) && shapeMap.has(c.toShapeId)) {
      if (!reverseAdj[c.toShapeId]) reverseAdj[c.toShapeId] = [];
      reverseAdj[c.toShapeId].push(c.fromShapeId);
    }
  }

  const tasks: GeneratedTask[] = sortedIds.map((id, index) => {
    const shape = shapeMap.get(id)!;
    const deps = (reverseAdj[id] || [])
      .map(depId => shapeMap.get(depId)?.text.trim() || '')
      .filter(t => t.length > 0);

    return {
      title: shape.text.trim() || `Task ${index + 1}`,
      description: generateDescription(shape, deps, connections, shapeMap),
      priority: inferPriority(shape, adj, inDeg),
      status: 'Todo' as const,
      order: index + 1,
      dependencies: deps,
      labels: shape.labels || [],
      estimatedHours: estimateHours(shape, adj),
      sourceShapeId: shape.id,
    };
  });

  return tasks;
}

// ── Description generator ──────────────────────────────

function generateDescription(
  shape: NexusShape,
  dependencies: string[],
  connections: NexusConnection[],
  shapeMap: Map<string, NexusShape>
): string {
  const lines: string[] = [];

  if (dependencies.length > 0) {
    lines.push(`**Depends on:** ${dependencies.join(', ')}`);
  }

  // Find outgoing connections with labels
  const outgoing = connections
    .filter(c => c.fromShapeId === shape.id && c.label)
    .map(c => {
      const target = shapeMap.get(c.toShapeId);
      return `→ ${target?.text || 'Unknown'}: ${c.label}`;
    });

  if (outgoing.length > 0) {
    lines.push(`**Leads to:**`);
    lines.push(...outgoing);
  }

  // Shape type context
  const shapeTypeHint: Record<string, string> = {
    diamond: 'This is a decision point — consider branching outcomes.',
    hexagon: 'This represents a process or transformation step.',
    parallelogram: 'This represents an input/output operation.',
    circle: 'This is a milestone or checkpoint.',
    rectangle: '',
  };

  const hint = shapeTypeHint[shape.type];
  if (hint) lines.push(hint);

  return lines.join('\n') || 'Generated from Nexus canvas.';
}

// ── Group detection (for sub-task clustering) ──────────

export function detectGroups(
  shapes: NexusShape[],
  connections: NexusConnection[]
): Map<string, string[]> {
  // Simple connected-component detection using BFS
  const adj: Record<string, Set<string>> = {};
  for (const s of shapes) adj[s.id] = new Set();
  for (const c of connections) {
    adj[c.fromShapeId]?.add(c.toShapeId);
    adj[c.toShapeId]?.add(c.fromShapeId);
  }

  const visited = new Set<string>();
  const groups = new Map<string, string[]>();
  let groupIdx = 0;

  for (const s of shapes) {
    if (visited.has(s.id)) continue;

    const queue = [s.id];
    const group: string[] = [];
    visited.add(s.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);
      for (const neighbor of adj[current] || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    groups.set(`Group ${++groupIdx}`, group);
  }

  return groups;
}
