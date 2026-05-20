/**
 * Nexus Pure Algorithmic Planning Engine
 * 
 * An advanced client-side project scheduling and graph reasoning engine.
 * Integrates:
 * 1. Tarjan's Strongly Connected Components (SCC) for circular loop detection
 * 2. Critical Path Method (CPM) for effort, float (slack) tracking, and priority inference
 * 3. Hierarchical Tree Sorter for Mindmaps (Epic -> Task -> Checklist nesting)
 * 4. Semantic Color/Shape Metadata Heuristics
 */

import type { NexusShape, NexusConnection, GeneratedTask } from '@/types/nexus';

// ── Graph types ───────────────────────────────────────

interface AdjacencyMap {
  [shapeId: string]: string[];  // shapeId -> list of dependent shapeIds
}

// ── Basic Graph Helpers ────────────────────────────────

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

function buildReverseAdjacency(shapes: NexusShape[], connections: NexusConnection[]): AdjacencyMap {
  const rev: AdjacencyMap = {};
  const shapeIds = new Set(shapes.map(s => s.id));

  for (const s of shapes) {
    rev[s.id] = [];
  }
  for (const c of connections) {
    if (shapeIds.has(c.fromShapeId) && shapeIds.has(c.toShapeId)) {
      if (!rev[c.toShapeId]) rev[c.toShapeId] = [];
      rev[c.toShapeId].push(c.fromShapeId);
    }
  }
  return rev;
}

// ── Tarjan's Strongly Connected Components (SCC) ───────
// Detects cycles/loops (e.g. feedback loops) in flowcharts

interface TarjanState {
  index: number;
  indices: Map<string, number>;
  lowlink: Map<string, number>;
  onStack: Set<string>;
  stack: string[];
  sccs: string[][];
}

function tarjanSCC(shapes: NexusShape[], adj: AdjacencyMap): string[][] {
  const state: TarjanState = {
    index: 0,
    indices: new Map(),
    lowlink: new Map(),
    onStack: new Set(),
    stack: [],
    sccs: []
  };

  function strongConnect(u: string) {
    state.indices.set(u, state.index);
    state.lowlink.set(u, state.index);
    state.index++;
    state.stack.push(u);
    state.onStack.add(u);

    const neighbors = adj[u] || [];
    for (const v of neighbors) {
      if (!state.indices.has(v)) {
        strongConnect(v);
        state.lowlink.set(u, Math.min(state.lowlink.get(u)!, state.lowlink.get(v)!));
      } else if (state.onStack.has(v)) {
        state.lowlink.set(u, Math.min(state.lowlink.get(u)!, state.indices.get(v)!));
      }
    }

    if (state.lowlink.get(u) === state.indices.get(u)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = state.stack.pop()!;
        state.onStack.delete(w);
        scc.push(w);
      } while (w !== u);
      state.sccs.push(scc);
    }
  }

  for (const s of shapes) {
    if (!state.indices.has(s.id)) {
      strongConnect(s.id);
    }
  }

  return state.sccs;
}

// ── Safe Topological Sorter (Cycle Resilient) ────────
// Collapses cycle components to run Kahn's algorithm and outputs clean order.

function cycleResilientTopologicalSort(
  shapes: NexusShape[],
  adj: AdjacencyMap,
  sccs: string[][]
): string[] {
  const shapeMap = new Map(shapes.map(s => [s.id, s]));
  const sccIdMap = new Map<string, number>(); // shapeId -> sccIndex
  sccs.forEach((scc, idx) => {
    scc.forEach(nodeId => sccIdMap.set(nodeId, idx));
  });

  // Build collapsed graph (DAG of SCCs)
  const collapsedAdj = new Map<number, Set<number>>();
  const collapsedInDegree = new Map<number, number>();

  for (let i = 0; i < sccs.length; i++) {
    collapsedAdj.set(i, new Set());
    collapsedInDegree.set(i, 0);
  }

  for (const u of shapes.map(s => s.id)) {
    const uScc = sccIdMap.get(u)!;
    for (const v of adj[u] || []) {
      const vScc = sccIdMap.get(v)!;
      if (uScc !== vScc && !collapsedAdj.get(uScc)!.has(vScc)) {
        collapsedAdj.get(uScc)!.add(vScc);
        collapsedInDegree.set(vScc, (collapsedInDegree.get(vScc) || 0) + 1);
      }
    }
  }

  // Kahn's algorithm on SCCs
  const queue: number[] = [];
  collapsedInDegree.forEach((inDeg, sccIdx) => {
    if (inDeg === 0) queue.push(sccIdx);
  });

  // Sort queue by top-most element position (visual coordinate heuristic)
  const getSccMinY = (sccIdx: number) => {
    const nodes = sccs[sccIdx];
    return Math.min(...nodes.map(id => shapeMap.get(id)?.y || 0));
  };

  queue.sort((a, b) => getSccMinY(a) - getSccMinY(b));

  const sortedSccIndices: number[] = [];
  while (queue.length > 0) {
    const uScc = queue.shift()!;
    sortedSccIndices.push(uScc);

    const neighbors = collapsedAdj.get(uScc) || new Set();
    for (const vScc of neighbors) {
      collapsedInDegree.set(vScc, collapsedInDegree.get(vScc)! - 1);
      if (collapsedInDegree.get(vScc) === 0) {
        queue.push(vScc);
      }
    }
  }

  // Fallback for any disconnected SCCs
  if (sortedSccIndices.length < sccs.length) {
    const visited = new Set(sortedSccIndices);
    const remaining = Array.from({ length: sccs.length }, (_, i) => i)
      .filter(i => !visited.has(i))
      .sort((a, b) => getSccMinY(a) - getSccMinY(b));
    sortedSccIndices.push(...remaining);
  }

  // Unroll SCCs to shapes (preserve internal cycle shapes sorted by Y)
  const result: string[] = [];
  for (const sccIdx of sortedSccIndices) {
    const sccNodes = [...sccs[sccIdx]].sort((a, b) => {
      const sa = shapeMap.get(a)!;
      const sb = shapeMap.get(b)!;
      return sa.y - sb.y || sa.x - sb.x;
    });
    result.push(...sccNodes);
  }

  return result;
}

// ── Shape & Color Metadata Heuristics ──────────────────

function estimateBaseHours(shape: NexusShape): number {
  // Shape-to-Effort mapping
  const shapeHours: Record<string, number> = {
    circle: 1,         // Milestone or quick check
    diamond: 2,        // Quality Assurance or review gate
    parallelogram: 3,  // Input/Output operation
    hexagon: 6,        // Process execution or architecture build
    rectangle: 4,      // Standard task block
  };

  let base = shapeHours[shape.type] || 4;

  // Scale based on text description size (longer text implies higher complexity)
  const textLength = shape.text.trim().length;
  if (textLength > 50) base += 3;
  else if (textLength > 20) base += 1.5;

  return base;
}

function parseColorToLabel(fillColor: string): string | null {
  const color = fillColor.toLowerCase();
  // Matching active color presets
  if (color === '#9f1239' || color === '#ffe4e6') return 'Urgent/Critical'; // Rose/Red
  if (color === '#065f46' || color === '#dcfce7') return 'Easy-Win';       // Emerald/Green
  if (color === '#92400e' || color === '#fef3c7') return 'Design-Review';  // Amber/Yellow
  if (color === '#1e3a5f' || color === '#dbeafe') return 'Core-Engine';    // Blue
  if (color === '#5b21b6' || color === '#ede9fe') return 'Refinement';     // Violet/Purple
  if (color === '#0e7490') return 'Integration';
  return null;
}

// ── The Critical Path Method (CPM) ─────────────────────
// Runs scheduling checks to calculate Early/Late bounds and Floats (Slack)

interface CpmNode {
  id: string;
  duration: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  float: number;
  onCriticalPath: boolean;
}

function computeCriticalPath(
  sortedIds: string[],
  adj: AdjacencyMap,
  revAdj: AdjacencyMap,
  shapeMap: Map<string, NexusShape>
): Map<string, CpmNode> {
  const cpmMap = new Map<string, CpmNode>();

  // 1. Initialize Nodes and Durations
  for (const id of sortedIds) {
    const shape = shapeMap.get(id)!;
    cpmMap.set(id, {
      id,
      duration: estimateBaseHours(shape),
      earlyStart: 0,
      earlyFinish: 0,
      lateStart: 0,
      lateFinish: 0,
      float: 0,
      onCriticalPath: false
    });
  }

  // 2. Forward Pass: Calculate Early Start (ES) & Early Finish (EF)
  for (const id of sortedIds) {
    const node = cpmMap.get(id)!;
    const incoming = revAdj[id] || [];
    if (incoming.length === 0) {
      node.earlyStart = 0;
    } else {
      let maxEf = 0;
      for (const pId of incoming) {
        const parent = cpmMap.get(pId);
        if (parent && parent.earlyFinish > maxEf) {
          maxEf = parent.earlyFinish;
        }
      }
      node.earlyStart = maxEf;
    }
    node.earlyFinish = node.earlyStart + node.duration;
  }

  // Find overall project finish time (T_max)
  let projectDuration = 0;
  cpmMap.forEach(n => {
    if (n.earlyFinish > projectDuration) {
      projectDuration = n.earlyFinish;
    }
  });

  // 3. Backward Pass: Calculate Late Finish (LF) & Late Start (LS)
  // Process nodes in reverse topological order
  const reversedIds = [...sortedIds].reverse();
  for (const id of reversedIds) {
    const node = cpmMap.get(id)!;
    const outgoing = adj[id] || [];
    if (outgoing.length === 0) {
      node.lateFinish = projectDuration;
    } else {
      let minLs = Infinity;
      for (const cId of outgoing) {
        const child = cpmMap.get(cId);
        if (child && child.lateStart < minLs) {
          minLs = child.lateStart;
        }
      }
      node.lateFinish = minLs === Infinity ? projectDuration : minLs;
    }
    node.lateStart = node.lateFinish - node.duration;
    
    // Float & Critical Path flags
    node.float = Math.max(0, node.lateFinish - node.earlyFinish);
    node.onCriticalPath = node.float < 0.1; // Float near 0
  }

  return cpmMap;
}

// ── Mindmap Hierarchical Sorter ────────────────────────
// Traverse tree structures to cluster Epic -> Task -> Checklist layout

function parseHierarchicalMindmap(
  shapes: NexusShape[],
  connections: NexusConnection[]
): GeneratedTask[] {
  const shapeMap = new Map(shapes.map(s => [s.id, s]));
  const adj = buildAdjacency(shapes, connections);
  const revAdj = buildReverseAdjacency(shapes, connections);

  // 1. Identify Root Nodes (0 in-degree)
  const roots = shapes.filter(s => (revAdj[s.id] || []).length === 0);
  if (roots.length === 0 && shapes.length > 0) {
    // Fallback: Use the node with the highest out-degree
    const sortedByOut = [...shapes].sort((a, b) => (adj[b.id] || []).length - (adj[a.id] || []).length);
    roots.push(sortedByOut[0]);
  }

  const visited = new Set<string>();
  const tasks: GeneratedTask[] = [];
  let orderIndex = 1;

  function traverseBranch(nodeId: string, currentParentTask: GeneratedTask | null, depth: number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const shape = shapeMap.get(nodeId)!;
    const children = adj[nodeId] || [];

    if (depth === 0) {
      // Root Node -> Epic Milestone
      const epicTask: GeneratedTask = {
        title: shape.text.trim() || 'Central Epic Topic',
        description: `## 👑 Primary Epic Milestone\nCreated from mindmap root. Coordinates all child execution branches.`,
        priority: 'High',
        status: 'Todo',
        order: orderIndex++,
        dependencies: [],
        labels: ['Mindmap-Root'],
        estimatedHours: 4,
        sourceShapeId: shape.id
      };
      
      const customLabel = parseColorToLabel(shape.color);
      if (customLabel) epicTask.labels.push(customLabel);

      tasks.push(epicTask);

      for (const childId of children) {
        traverseBranch(childId, epicTask, depth + 1);
      }
    } else if (depth === 1) {
      // First-level Branch -> Main Task Deliverable
      const subChildren = adj[nodeId] || [];
      const checklistItems: string[] = [];

      // DFS to compile deep nested leaf nodes as standard checklist items
      function gatherLeaves(cId: string) {
        if (visited.has(cId)) return;
        const cShape = shapeMap.get(cId);
        if (cShape) {
          checklistItems.push(cShape.text.trim() || 'Sub-feature block');
          visited.add(cId);
          const grandchildren = adj[cId] || [];
          grandchildren.forEach(gId => gatherLeaves(gId));
        }
      }
      subChildren.forEach(childId => gatherLeaves(childId));

      const descriptionLines = [
        `## 🎯 Main Deliverable`,
        `Direct branch of Epic: **${currentParentTask?.title || 'Main Workspace'}**`,
      ];

      if (checklistItems.length > 0) {
        descriptionLines.push('\n### 📋 Implementation Checklist:');
        checklistItems.forEach(item => descriptionLines.push(`- [ ] ${item}`));
      }

      const task: GeneratedTask = {
        title: shape.text.trim() || 'Mindmap Task',
        description: descriptionLines.join('\n'),
        priority: 'Medium',
        status: 'Todo',
        order: orderIndex++,
        dependencies: currentParentTask ? [currentParentTask.title] : [],
        labels: ['Mindmap-Branch'],
        estimatedHours: 4 + checklistItems.length * 2, // 4 hours base + 2h per checklist child
        sourceShapeId: shape.id
      };

      const customLabel = parseColorToLabel(shape.color);
      if (customLabel) task.labels.push(customLabel);
      if (shape.labels) task.labels.push(...shape.labels);

      tasks.push(task);
    } else {
      // Nested elements are already captured as checklists by depth === 1,
      // but if any loose branches remain we process them.
      const task: GeneratedTask = {
        title: shape.text.trim() || 'Leaf Detail',
        description: `Nested mindmap node. Subtask of Epic.`,
        priority: 'Low',
        status: 'Todo',
        order: orderIndex++,
        dependencies: currentParentTask ? [currentParentTask.title] : [],
        labels: ['Mindmap-Detail'],
        estimatedHours: 2,
        sourceShapeId: shape.id
      };
      tasks.push(task);
    }
  }

  for (const r of roots) {
    traverseBranch(r.id, null, 0);
  }

  // Catch any orphan nodes
  for (const s of shapes) {
    if (!visited.has(s.id)) {
      const task: GeneratedTask = {
        title: s.text.trim() || 'Orphan Node',
        description: 'Isolated mindmap detail.',
        priority: 'Low',
        status: 'Todo',
        order: orderIndex++,
        dependencies: [],
        labels: ['Unlinked'],
        estimatedHours: 2,
        sourceShapeId: s.id
      };
      tasks.push(task);
    }
  }

  return tasks;
}

// ── Description Generator ──────────────────────────────
// Compiles detailed, clean Markdown briefs with dependencies and loops

function generateFlowchartDescription(
  shape: NexusShape,
  dependencies: string[],
  connections: NexusConnection[],
  shapeMap: Map<string, NexusShape>,
  cpmNode: CpmNode | undefined,
  inCycle: boolean,
  cycleNodes: string[]
): string {
  const lines: string[] = [`## 📍 Task Brief`];

  if (dependencies.length > 0) {
    lines.push(`*   **Depends on:** ${dependencies.join(', ')}`);
  }

  // Find outgoing connections with labels
  const outgoing = connections
    .filter(c => c.fromShapeId === shape.id && c.label)
    .map(c => {
      const target = shapeMap.get(c.toShapeId);
      return `→ **${target?.text.trim() || 'Next Step'}**: ${c.label}`;
    });

  if (outgoing.length > 0) {
    lines.push(`*   **Leads to:**`);
    outgoing.forEach(out => lines.push(`    ${out}`));
  }

  // CPM analysis text
  if (cpmNode) {
    lines.push(`\n### ⏱️ Scheduling Metrics`);
    lines.push(`*   **Estimated Duration:** ${cpmNode.duration}h`);
    if (cpmNode.onCriticalPath) {
      lines.push(`*   **Path Priority:** 🔴 **Critical Path Task** (Zero float - cannot be delayed).`);
    } else {
      lines.push(`*   **Float Slack:** 🟢 ${cpmNode.float.toFixed(1)}h slack window available.`);
    }
  }

  // Tarjan cycle/loop warnings
  if (inCycle && cycleNodes.length > 1) {
    const loopSiblings = cycleNodes
      .map(id => shapeMap.get(id)?.text.trim() || '')
      .filter(t => t.length > 0 && t !== shape.text.trim());

    lines.push(`\n> [!NOTE]`);
    lines.push(`> **Iterative Loop Detected:** This task participates in a recurring workflow with: **${loopSiblings.join(', ')}**. Verify iteration boundary parameters and exit safeguards.`);
  }

  // Dynamic advice based on flowchart symbol types
  const shapeHints: Record<string, string> = {
    diamond: '💡 **Quality Assurance Gateway:** Review conditions, tests, and branch exit outcomes.',
    hexagon: '💡 **System/Process Step:** Execute core development, configuration, or processing actions.',
    parallelogram: '💡 **Data IO Operation:** Input required resources or output completed assets.',
    circle: '💡 **Milestone Gateway:** Run validation audits and secure sign-offs.',
    rectangle: '',
  };

  const hint = shapeHints[shape.type];
  if (hint) {
    lines.push(`\n${hint}`);
  }

  return lines.join('\n');
}

// ── Main Conversion Function ───────────────────────────

export function convertCanvasToTasks(
  shapes: NexusShape[],
  connections: NexusConnection[]
): GeneratedTask[] {
  if (shapes.length === 0) return [];

  // Check if diagram is structured as a Mindmap
  const isMindmap = shapes.some(s => s.type === 'mindmap-node');
  if (isMindmap) {
    return parseHierarchicalMindmap(shapes, connections);
  }

  // --- Flowchart Graph Conversion Engine ---
  const adj = buildAdjacency(shapes, connections);
  const revAdj = buildReverseAdjacency(shapes, connections);
  const shapeMap = new Map(shapes.map(s => [s.id, s]));

  // 1. Tarjan Loop Check
  const sccs = tarjanSCC(shapes, adj);
  const cycleMap = new Map<string, string[]>(); // shapeId -> list of siblings in its cycle
  sccs.forEach(scc => {
    if (scc.length > 1) {
      scc.forEach(id => cycleMap.set(id, scc));
    }
  });

  // 2. Run Safe Topological Sorter
  const sortedIds = cycleResilientTopologicalSort(shapes, adj, sccs);

  // 3. Compute Scheduling Metrics via Critical Path Method (CPM)
  const cpmMap = computeCriticalPath(sortedIds, adj, revAdj, shapeMap);

  // 4. Map shapes to generated task structures
  const tasks: GeneratedTask[] = sortedIds.map((id, index) => {
    const shape = shapeMap.get(id)!;
    const cpmNode = cpmMap.get(id);

    // Dependencies inside flowchart
    const deps = (revAdj[id] || [])
      .map(depId => shapeMap.get(depId)?.text.trim() || '')
      .filter(t => t.length > 0);

    // Semantic label mapping
    const labels: string[] = ['Flowchart-Task'];
    const customLabel = parseColorToLabel(shape.color);
    if (customLabel) labels.push(customLabel);
    if (shape.labels) labels.push(...shape.labels);
    if (cpmNode?.onCriticalPath) labels.push('Critical-Path');

    // Priority inference: CPM takes precedence, then fallback
    let priority: 'Low' | 'Medium' | 'High' = 'Medium';
    if (shape.priority) {
      priority = shape.priority;
    } else if (cpmNode) {
      if (cpmNode.onCriticalPath) priority = 'High';
      else if (cpmNode.float >= 6) priority = 'Low';
    }

    const inCycle = cycleMap.has(id);
    const cycleNodes = cycleMap.get(id) || [];

    const description = generateFlowchartDescription(
      shape,
      deps,
      connections,
      shapeMap,
      cpmNode,
      inCycle,
      cycleNodes
    );

    return {
      title: shape.text.trim() || `Task ${index + 1}`,
      description,
      priority,
      status: 'Todo' as const,
      order: index + 1,
      dependencies: deps,
      labels,
      estimatedHours: cpmNode ? Math.round(cpmNode.duration) : 4,
      sourceShapeId: shape.id
    };
  });

  return tasks;
}

// ── Group Detection (Connected Components BFS) ──────────

export function detectGroups(
  shapes: NexusShape[],
  connections: NexusConnection[]
): Map<string, string[]> {
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
