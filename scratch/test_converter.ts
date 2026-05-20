import { convertCanvasToTasks } from '../src/lib/nexus/converter';
import type { NexusShape, NexusConnection } from '../src/types/nexus';

// ── Test Cases ──────────────────────────────────────────

function testFlowchartWithCycle() {
  console.log('🧪 Running Test: Flowchart With Cycle...');
  
  // A -> B -> C -> A
  const shapes: NexusShape[] = [
    {
      id: 'shape-A',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 50,
      text: 'Task A',
      color: '#ffe4e6', // Soft Rose -> Urgent/Critical (red preset)
      borderColor: '#f43f5e',
      textColor: '#881337',
      fontSize: 14,
      zIndex: 1
    },
    {
      id: 'shape-B',
      type: 'rectangle',
      x: 100,
      y: 200,
      width: 100,
      height: 50,
      text: 'Task B',
      color: '#ffffff',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      fontSize: 14,
      zIndex: 2
    },
    {
      id: 'shape-C',
      type: 'rectangle',
      x: 100,
      y: 300,
      width: 100,
      height: 50,
      text: 'Task C',
      color: '#ffffff',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      fontSize: 14,
      zIndex: 3
    }
  ];

  const connections: NexusConnection[] = [
    {
      id: 'conn-1',
      fromShapeId: 'shape-A',
      toShapeId: 'shape-B',
      color: '#3b82f6',
      strokeWidth: 2,
      style: 'solid'
    },
    {
      id: 'conn-2',
      fromShapeId: 'shape-B',
      toShapeId: 'shape-C',
      color: '#3b82f6',
      strokeWidth: 2,
      style: 'solid'
    },
    {
      id: 'conn-3',
      fromShapeId: 'shape-C',
      toShapeId: 'shape-A',
      color: '#3b82f6',
      strokeWidth: 2,
      style: 'solid',
      label: 'Feedback loop'
    }
  ];

  const tasks = convertCanvasToTasks(shapes, connections);
  
  console.log(`Generated ${tasks.length} tasks.`);
  tasks.forEach(t => {
    console.log(`- Title: "${t.title}", Priority: ${t.priority}, Labels: [${t.labels.join(', ')}], Estimated Hours: ${t.estimatedHours}`);
    console.log(`  Description Preview: ${t.description.split('\n')[0]}...`);
    
    // Validate recursive loop warning is present
    if (t.description.includes('Iterative Loop Detected')) {
      console.log('  ✅ Loop warning correctly injected.');
    } else {
      console.error('  ❌ Loop warning missing!');
      process.exit(1);
    }
  });

  // Validate red colorpreset maps to Urgent/Critical label
  const taskA = tasks.find(t => t.title === 'Task A');
  if (taskA && taskA.labels.includes('Urgent/Critical')) {
    console.log('  ✅ Color Preset mapped successfully.');
  } else {
    console.error('  ❌ Color Preset mapping failed!');
    process.exit(1);
  }
}

function testCPMFloatAndPriority() {
  console.log('\n🧪 Running Test: CPM Float and Priority...');

  // Start -> Path 1: Task A (dur=6) -> End
  //       -> Path 2: Task B (dur=2) -> End
  const shapes: NexusShape[] = [
    {
      id: 'shape-start',
      type: 'circle',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      text: 'Start',
      color: '#ffffff',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      fontSize: 14,
      zIndex: 1
    },
    {
      id: 'shape-A',
      type: 'hexagon', // hexagon has dur=6 base
      x: 200,
      y: 50,
      width: 100,
      height: 50,
      text: 'Long Task A',
      color: '#ffffff',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      fontSize: 14,
      zIndex: 2
    },
    {
      id: 'shape-B',
      type: 'diamond', // diamond has dur=2 base
      x: 200,
      y: 150,
      width: 100,
      height: 50,
      text: 'Short Task B',
      color: '#ffffff',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      fontSize: 14,
      zIndex: 3
    },
    {
      id: 'shape-end',
      type: 'circle',
      x: 350,
      y: 100,
      width: 50,
      height: 50,
      text: 'End',
      color: '#ffffff',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      fontSize: 14,
      zIndex: 4
    }
  ];

  const connections: NexusConnection[] = [
    { id: 'c1', fromShapeId: 'shape-start', toShapeId: 'shape-A', color: '#000', strokeWidth: 2, style: 'solid' },
    { id: 'c2', fromShapeId: 'shape-start', toShapeId: 'shape-B', color: '#000', strokeWidth: 2, style: 'solid' },
    { id: 'c3', fromShapeId: 'shape-A', toShapeId: 'shape-end', color: '#000', strokeWidth: 2, style: 'solid' },
    { id: 'c4', fromShapeId: 'shape-B', toShapeId: 'shape-end', color: '#000', strokeWidth: 2, style: 'solid' }
  ];

  const tasks = convertCanvasToTasks(shapes, connections);

  console.log(`Generated ${tasks.length} tasks.`);
  const taskStart = tasks.find(t => t.title === 'Start');
  const taskA = tasks.find(t => t.title === 'Long Task A');
  const taskB = tasks.find(t => t.title === 'Short Task B');
  const taskEnd = tasks.find(t => t.title === 'End');

  // Verify critical path items have High priority (except maybe if overridden)
  // and non-critical items with high slack have Low priority or lower priority.
  // Start, Long Task A, End should be on Critical Path (slack=0)
  // Short Task B has slack (float) = 6 - 2 = 4 hours. So priority should be Medium or Low.
  
  if (taskA && taskA.labels.includes('Critical-Path') && taskA.priority === 'High') {
    console.log('  ✅ Critical Path item Long Task A has High priority.');
  } else {
    console.error('  ❌ Critical Path priority mapping failed for Long Task A!', taskA);
    process.exit(1);
  }

  if (taskB && !taskB.labels.includes('Critical-Path')) {
    console.log('  ✅ Non-critical path item Short Task B correctly identified with slack.');
    console.log(`     Estimated hours: ${taskB.estimatedHours}, Priority: ${taskB.priority}`);
  } else {
    console.error('  ❌ Critical Path identification failed for Short Task B!', taskB);
    process.exit(1);
  }
}

function testMindmapHierarchy() {
  console.log('\n🧪 Running Test: Mindmap Hierarchical Tree Traversal...');

  // Root mindmap-node -> Sub mindmap-node -> Detail mindmap-node
  const shapes: NexusShape[] = [
    {
      id: 'mm-root',
      type: 'mindmap-node',
      x: 100,
      y: 100,
      width: 120,
      height: 50,
      text: 'Company Launch Epic',
      color: '#dbeafe', // Soft Blue -> Core-Engine label
      borderColor: '#3b82f6',
      textColor: '#1e3a8a',
      fontSize: 16,
      zIndex: 1
    },
    {
      id: 'mm-sub1',
      type: 'mindmap-node',
      x: 250,
      y: 50,
      width: 100,
      height: 40,
      text: 'Marketing Prep',
      color: '#ffffff',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      fontSize: 14,
      zIndex: 2
    },
    {
      id: 'mm-leaf1',
      type: 'mindmap-node',
      x: 400,
      y: 20,
      width: 100,
      height: 40,
      text: 'Create landing page',
      color: '#ffffff',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      fontSize: 12,
      zIndex: 3
    },
    {
      id: 'mm-leaf2',
      type: 'mindmap-node',
      x: 400,
      y: 80,
      width: 100,
      height: 40,
      text: 'Set up ad campaigns',
      color: '#ffffff',
      borderColor: '#cbd5e1',
      textColor: '#0f172a',
      fontSize: 12,
      zIndex: 4
    }
  ];

  const connections: NexusConnection[] = [
    { id: 'mc1', fromShapeId: 'mm-root', toShapeId: 'mm-sub1', color: '#000', strokeWidth: 2, style: 'solid' },
    { id: 'mc2', fromShapeId: 'mm-sub1', toShapeId: 'mm-leaf1', color: '#000', strokeWidth: 2, style: 'solid' },
    { id: 'mc3', fromShapeId: 'mm-sub1', toShapeId: 'mm-leaf2', color: '#000', strokeWidth: 2, style: 'solid' }
  ];

  const tasks = convertCanvasToTasks(shapes, connections);

  console.log(`Generated ${tasks.length} tasks.`);
  tasks.forEach(t => {
    console.log(`- Title: "${t.title}"`);
    console.log(`  Priority: ${t.priority}, Estimated: ${t.estimatedHours}h, Labels: [${t.labels.join(', ')}]`);
    console.log(`  Description:\n${t.description.split('\n').map(l => '    ' + l).join('\n')}`);
  });

  const epic = tasks.find(t => t.title === 'Company Launch Epic');
  const sub = tasks.find(t => t.title === 'Marketing Prep');

  if (epic && epic.labels.includes('Mindmap-Root')) {
    console.log('  ✅ Epic correctly recognized as Root.');
  } else {
    console.error('  ❌ Mindmap root detection failed!');
    process.exit(1);
  }

  if (sub && sub.description.includes('- [ ] Create landing page') && sub.description.includes('- [ ] Set up ad campaigns')) {
    console.log('  ✅ Deep nested leaf nodes compiled into branch checklist items successfully!');
  } else {
    console.error('  ❌ Mindmap hierarchical sub-node traversal failed to compile checklist!');
    process.exit(1);
  }
}

// Execute tests
testFlowchartWithCycle();
testCPMFloatAndPriority();
testMindmapHierarchy();

console.log('\n✨ ALL CONVERTER TESTS PASSED SUCCESSFULLY! ✨');
