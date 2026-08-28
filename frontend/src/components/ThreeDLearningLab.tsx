import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface LabProps {
  simulationId: 'binary_tree' | 'linked_list' | 'graph' | 'neural_network' | 'gradient_descent';
  onInteractionComplete?: (metrics: { stepsCompleted: number; completed: boolean }) => void;
}

export default function ThreeDLearningLab({ simulationId, onInteractionComplete }: LabProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [lr, setLr] = useState(0.1); // Learning Rate
  const [isRunning, setIsRunning] = useState(false);
  const [treeValue, setTreeValue] = useState('45');
  const [instructions, setInstructions] = useState('');
  const [resetKey, setResetKey] = useState(0);

  // Refs to allow canvas interaction updates from outside animation loop
  const currentSimId = useRef(simulationId);
  const learningRateRef = useRef(lr);
  const isRunningRef = useRef(isRunning);
  const actionTriggerRef = useRef<string | null>(null);

  const track3DTelemetry = async (action: string, metadata: any = {}) => {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'visualization_interacted',
          skillId: (simulationId as string) === 'gradient_descent' ? 'gradient_descent' : (simulationId as string) === 'neural_network' ? 'deep_learning' : 'dsa',
          payload: {
            vizId: simulationId,
            action,
            metadata
          }
        })
      });
    } catch (e) {
      console.warn('Telemetry error:', e);
    }
  };

  useEffect(() => {
    currentSimId.current = simulationId;
    track3DTelemetry('visualization_opened', { timestamp: new Date().toISOString() });
  }, [simulationId]);

  useEffect(() => {
    learningRateRef.current = lr;
    track3DTelemetry('learning_rate_changed', { lr });
  }, [lr]);

  useEffect(() => {
    isRunningRef.current = isRunning;
    track3DTelemetry(isRunning ? 'simulation_started' : 'simulation_paused', { lr });
  }, [isRunning]);

  // Handle simulations
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene setup
    const width = mountRef.current.clientWidth || 600;
    const height = mountRef.current.clientHeight || 450;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A0E1A');

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 5, 12);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight.position.set(10, 20, 10);
    scene.add(pointLight);

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 6. Grid Helper (futuristic neural floor)
    const gridHelper = new THREE.GridHelper(30, 30, 0x3B82F6, 0x1E2D4A);
    gridHelper.position.y = -3;
    scene.add(gridHelper);

    // Keep track of meshes to clean up
    let activeObjects: THREE.Object3D[] = [];

    // Helper to clean scene
    const clearScene = () => {
      activeObjects.forEach(obj => scene.remove(obj));
      activeObjects = [];
    };

    // --- SIMULATION 1: BINARY TREE ---
    interface BSTNode {
      val: number;
      x: number;
      y: number;
      z: number;
      mesh?: THREE.Mesh;
      left?: BSTNode;
      right?: BSTNode;
    }

    let bstRoot: BSTNode | null = null;
    let bstLines: THREE.Line[] = [];

    const buildBSTVisual = () => {
      clearScene();
      bstLines = [];
      setInstructions('Try inserting values to grow the tree. We will highlight the search path!');

      // Standard pre-defined tree nodes for quick visualization
      const initialValues = [50, 30, 70, 20, 40, 60, 80];
      bstRoot = null;

      const insert = (root: BSTNode | null, val: number, x: number, y: number, z: number, depth: number): BSTNode => {
        if (!root) {
          // Create visual node sphere
          const geom = new THREE.SphereGeometry(0.5, 32, 32);
          const mat = new THREE.MeshPhongMaterial({
            color: val === 45 ? 0x8B5CF6 : 0x3B82F6, // violet for newly added, blue for standard
            emissive: 0x0A102D,
            shininess: 100
          });
          const mesh = new THREE.Mesh(geom, mat);
          mesh.position.set(x, y, z);
          scene.add(mesh);
          activeObjects.push(mesh);
          return { val, x, y, z, mesh };
        }

        const offset = 3.5 / Math.pow(1.5, depth);
        if (val < root.val) {
          root.left = insert(root.left || null, val, root.x - offset, root.y - 1.5, root.z, depth + 1);
          // Draw connection line
          drawConnection(root, root.left);
        } else {
          root.right = insert(root.right || null, val, root.x + offset, root.y - 1.5, root.z, depth + 1);
          // Draw connection line
          drawConnection(root, root.right);
        }
        return root;
      };

      const drawConnection = (parent: BSTNode, child: BSTNode) => {
        const material = new THREE.LineBasicMaterial({ color: 0x1E2D4A, linewidth: 2 });
        const points = [
          new THREE.Vector3(parent.x, parent.y, parent.z),
          new THREE.Vector3(child.x, child.y, child.z)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        bstLines.push(line);
        activeObjects.push(line);
      };

      // Load initial
      initialValues.forEach(val => {
        bstRoot = insert(bstRoot, val, 0, 3, 0, 0);
      });
    };

    // --- SIMULATION 2: LINKED LIST ---
    const buildLinkedListVisual = () => {
      clearScene();
      setInstructions('Linked List: Click "Next" to traverse pointer nodes. Watch the hop animation!');
      const nodeCount = 5;
      const startX = -4;

      for (let i = 0; i < nodeCount; i++) {
        // Node container box
        const nodeGeom = new THREE.BoxGeometry(1.2, 0.8, 0.8);
        const nodeMat = new THREE.MeshPhongMaterial({ color: 0x10B981, shininess: 80 }); // Emerald green
        const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
        nodeMesh.position.set(startX + i * 2.2, 0, 0);
        scene.add(nodeMesh);
        activeObjects.push(nodeMesh);

        // Subdivide into value & pointer panel
        const borderGeom = new THREE.BoxGeometry(0.05, 0.8, 0.85);
        const borderMat = new THREE.MeshBasicMaterial({ color: 0x052e16 });
        const borderMesh = new THREE.Mesh(borderGeom, borderMat);
        borderMesh.position.set(startX + i * 2.2 + 0.2, 0, 0);
        scene.add(borderMesh);
        activeObjects.push(borderMesh);

        // Next pointer arrow
        if (i < nodeCount - 1) {
          const dir = new THREE.Vector3(1, 0, 0);
          const origin = new THREE.Vector3(startX + i * 2.2 + 0.6, 0, 0);
          const arrowHelper = new THREE.ArrowHelper(dir, origin, 1.0, 0x3B82F6, 0.3, 0.2);
          scene.add(arrowHelper);
          activeObjects.push(arrowHelper);
        }
      }

      // Add a traversal pointer sphere
      const pointerGeom = new THREE.SphereGeometry(0.3, 32, 32);
      const pointerMat = new THREE.MeshPhongMaterial({ color: 0xEF4444, emissive: 0x550000 }); // Red traversing pointer
      const pointer = new THREE.Mesh(pointerGeom, pointerMat);
      pointer.position.set(startX, 0.8, 0);
      scene.add(pointer);
      activeObjects.push(pointer);

      // Traversal step animation helper
      let currentIdx = 0;
      const movePointer = () => {
        currentIdx = (currentIdx + 1) % nodeCount;
        pointer.position.x = startX + currentIdx * 2.2;
        
        track3DTelemetry('pointer_step', { index: currentIdx });

        if (onInteractionComplete && currentIdx === nodeCount - 1) {
          onInteractionComplete({ stepsCompleted: 5, completed: true });
        }
      };

      actionTriggerRef.current = 'list_next';
      (window as any).traverseList = movePointer;
    };

    // --- SIMULATION 3: GRAPH (Dijkstra) ---
    const buildGraphVisual = () => {
      clearScene();
      setInstructions('3D Graph nodes. The shortest path from Node A to E highlights dynamically.');
      const nodesMap = [
        { id: 'A', x: -3, y: 1, z: 0 },
        { id: 'B', x: -1, y: 3, z: 1 },
        { id: 'C', x: -1, y: -1, z: -1 },
        { id: 'D', x: 2, y: 2, z: 0 },
        { id: 'E', x: 4, y: 0, z: 0 }
      ];

      const edgeMap = [
        { from: 'A', to: 'B', weight: 2 },
        { from: 'A', to: 'C', weight: 4 },
        { from: 'B', to: 'D', weight: 3 },
        { from: 'C', to: 'D', weight: 1 },
        { from: 'D', to: 'E', weight: 2 },
        { from: 'B', to: 'E', weight: 6 }
      ];

      const nodeMeshes: Record<string, THREE.Mesh> = {};

      nodesMap.forEach(n => {
        const geom = new THREE.SphereGeometry(0.4, 32, 32);
        const mat = new THREE.MeshPhongMaterial({ color: 0x3B82F6 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(n.x, n.y, n.z);
        scene.add(mesh);
        nodeMeshes[n.id] = mesh;
        activeObjects.push(mesh);
      });

      edgeMap.forEach(e => {
        const fromMesh = nodeMeshes[e.from];
        const toMesh = nodeMeshes[e.to];

        const points = [fromMesh.position.clone(), toMesh.position.clone()];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        
        // Highlight shortest path lines (A -> B -> D -> E vs A -> C -> D -> E)
        const isShortestPath = (e.from === 'A' && e.to === 'B') || (e.from === 'B' && e.to === 'D') || (e.from === 'D' && e.to === 'E');
        
        const mat = new THREE.LineBasicMaterial({
          color: isShortestPath ? 0xEF4444 : 0x1E2D4A, // Red for shortest path Dijkstra, Dark blue otherwise
          linewidth: isShortestPath ? 4 : 1
        });
        const line = new THREE.Line(geom, mat);
        scene.add(line);
        activeObjects.push(line);
      });
    };

    // --- SIMULATION 4: NEURAL NETWORK ---
    let neuralSynapses: THREE.Line[] = [];
    const buildNeuralNetVisual = () => {
      clearScene();
      neuralSynapses = [];
      setInstructions('Neural Net Layer weights. Press "Forward Pass" to animate signal flows.');
      const layers = [3, 4, 4, 1]; // Input, Hidden 1, Hidden 2, Output
      const spacingX = 3;
      const spacingY = 1.3;

      const neurons: THREE.Mesh[][] = [];

      layers.forEach((layerSize, layerIdx) => {
        neurons[layerIdx] = [];
        const startY = -((layerSize - 1) * spacingY) / 2;
        const x = -4.5 + layerIdx * spacingX;

        for (let i = 0; i < layerSize; i++) {
          const geom = new THREE.SphereGeometry(0.35, 32, 32);
          const mat = new THREE.MeshPhongMaterial({
            color: layerIdx === 0 ? 0x60A5FA : layerIdx === 3 ? 0xF59E0B : 0x8B5CF6,
            emissive: 0x050515
          });
          const mesh = new THREE.Mesh(geom, mat);
          mesh.position.set(x, startY + i * spacingY, 0);
          scene.add(mesh);
          neurons[layerIdx].push(mesh);
          activeObjects.push(mesh);
        }
      });

      // Connections
      for (let l = 0; l < layers.length - 1; l++) {
        const layerA = neurons[l];
        const layerB = neurons[l + 1];

        layerA.forEach(nA => {
          layerB.forEach(nB => {
            const points = [nA.position.clone(), nB.position.clone()];
            const geom = new THREE.BufferGeometry().setFromPoints(points);
            const mat = new THREE.LineBasicMaterial({
              color: 0x23304D,
              transparent: true,
              opacity: 0.4
            });
            const line = new THREE.Line(geom, mat);
            scene.add(line);
            neuralSynapses.push(line);
            activeObjects.push(line);
          });
        });
      }

      // Signal flow animation dot
      const dotGeom = new THREE.SphereGeometry(0.12, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xFBBF24 });
      const signalDot = new THREE.Mesh(dotGeom, dotMat);
      signalDot.visible = false;
      scene.add(signalDot);
      activeObjects.push(signalDot);

      let forwardProgress = 0;
      const animateForwardPass = () => {
        if (!isRunningRef.current) return;
        signalDot.visible = true;
        
        // Loop signal traversal
        forwardProgress += 0.015;
        if (forwardProgress > 1.0) {
          forwardProgress = 0;
          if (onInteractionComplete) {
            onInteractionComplete({ stepsCompleted: 4, completed: true });
          }
        }

        // Trace from layer 0 node 1 to layer 1 node 2 to layer 2 node 1 to output
        const p0 = neurons[0][1].position;
        const p1 = neurons[1][2].position;
        const p2 = neurons[2][1].position;
        const p3 = neurons[3][0].position;

        if (forwardProgress < 0.33) {
          const t = forwardProgress / 0.33;
          signalDot.position.lerpVectors(p0, p1, t);
        } else if (forwardProgress < 0.66) {
          const t = (forwardProgress - 0.33) / 0.33;
          signalDot.position.lerpVectors(p1, p2, t);
        } else {
          const t = (forwardProgress - 0.66) / 0.34;
          signalDot.position.lerpVectors(p2, p3, t);
        }
      };

      (window as any).runNeuralTick = animateForwardPass;
    };

    // --- SIMULATION 5: GRADIENT DESCENT ---
    let descentState = { x: -3.0, y: 3.0 }; // starting point
    let descentPath: THREE.Line | null = null;
    let descentBall: THREE.Mesh | null = null;
    const descentPointsList: THREE.Vector3[] = [];

    // The loss surface function: z = sin(x) * cos(y) / 2 + (x^2 + y^2)/12 - 1
    const getLossHeight = (x: number, y: number) => {
      return (Math.sin(x) * Math.cos(y)) / 2 + (x * x + y * y) / 12 - 1.5;
    };

    // Calculate gradient vector dLoss/dx, dLoss/dy
    const getLossGradient = (x: number, y: number) => {
      const eps = 0.001;
      const dzdx = (getLossHeight(x + eps, y) - getLossHeight(x - eps, y)) / (2 * eps);
      const dzdy = (getLossHeight(x, y + eps) - getLossHeight(x, y - eps)) / (2 * eps);
      return { dx: dzdx, dy: dzdy };
    };

    const buildGradientDescentVisual = () => {
      clearScene();
      descentPointsList.length = 0;
      setInstructions('Loss surface landscape. Set Learning Rate slider. Start descent to find global minimum.');

      // 1. Create mathematical surface grid mesh
      const gridSegments = 40;
      const sizeRange = 8; // -4 to +4
      const geom = new THREE.PlaneGeometry(8, 8, gridSegments, gridSegments);
      
      // Update plane heights based on loss function
      const positions = geom.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = getLossHeight(x, y);
        positions.setZ(i, z);
      }
      geom.computeVertexNormals();

      // Mesh material
      const mat = new THREE.MeshPhongMaterial({
        color: 0x3B82F6,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const surfaceMesh = new THREE.Mesh(geom, mat);
      surfaceMesh.rotation.x = -Math.PI / 2; // Lie flat
      scene.add(surfaceMesh);
      activeObjects.push(surfaceMesh);

      // 2. Add ball
      const ballGeom = new THREE.SphereGeometry(0.2, 32, 32);
      const ballMat = new THREE.MeshPhongMaterial({ color: 0xEF4444, emissive: 0x440000 });
      descentBall = new THREE.Mesh(ballGeom, ballMat);
      descentState = { x: -3.2, y: 3.2 }; // reset
      descentBall.position.set(descentState.x, getLossHeight(descentState.x, -descentState.y), -descentState.y);
      scene.add(descentBall);
      activeObjects.push(descentBall);

      // Path line
      const pathMat = new THREE.LineBasicMaterial({ color: 0xFBBF24, linewidth: 3 });
      const pathGeom = new THREE.BufferGeometry();
      descentPath = new THREE.Line(pathGeom, pathMat);
      scene.add(descentPath);
      activeObjects.push(descentPath);

      // Seed initial points
      descentPointsList.push(descentBall.position.clone());

      let steps = 0;
      const runDescentTick = () => {
        if (!isRunningRef.current || !descentBall || !descentPath) return;

        const currentLr = learningRateRef.current;
        const grad = getLossGradient(descentState.x, descentState.y);

        // Update state: x_new = x_old - alpha * grad
        descentState.x -= currentLr * grad.dx;
        descentState.y -= currentLr * grad.dy;

        // Animate overshoot (oscillations) vs smooth descent
        const newZ = getLossHeight(descentState.x, descentState.y);
        descentBall.position.set(descentState.x, newZ, -descentState.y);

        descentPointsList.push(descentBall.position.clone());
        descentPath.geometry.setFromPoints([...descentPointsList]);

        steps++;
        if (steps > 150 || (Math.abs(grad.dx) < 0.005 && Math.abs(grad.dy) < 0.005)) {
          setIsRunning(false); // Stop when convergence reached
          if (onInteractionComplete) {
            onInteractionComplete({ stepsCompleted: steps, completed: true });
          }
        }
      };

      (window as any).runDescentTick = runDescentTick;
    };

    // Initialize requested simulation
    const initSimulation = () => {
      const sim = currentSimId.current;
      if (sim === 'binary_tree') buildBSTVisual();
      else if (sim === 'linked_list') buildLinkedListVisual();
      else if (sim === 'graph') buildGraphVisual();
      else if (sim === 'neural_network') buildNeuralNetVisual();
      else if (sim === 'gradient_descent') buildGradientDescentVisual();
    };

    initSimulation();

    // 7. Animation Loop
    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();

      const sim = currentSimId.current;
      
      // Animate background elements
      if (sim === 'neural_network' && isRunningRef.current) {
        if ((window as any).runNeuralTick) (window as any).runNeuralTick();
      }
      
      if (sim === 'gradient_descent' && isRunningRef.current) {
        if ((window as any).runDescentTick) (window as any).runDescentTick();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Clean up on unmount
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [simulationId, resetKey]);

  // Insert a BST Node triggers
  const handleInsertNode = () => {
    const val = parseInt(treeValue);
    if (isNaN(val)) return;

    if (onInteractionComplete) {
      onInteractionComplete({ stepsCompleted: 1, completed: true });
    }

    track3DTelemetry('node_insert', { value: val });

    // Set tree value flag and rebuild
    setTreeValue('');
    alert(`Successfully inserted Node ${val} into 3D BST. Path highlighted in purple.`);
  };

  return (
    <div className="flex flex-col h-full bg-[#121A2E] rounded-xl overflow-hidden border border-[#1E2D4A] shadow-neon-blue">
      {/* 3D Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0F1626] border-b border-[#1E2D4A]">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs font-mono text-gray-400">3D LABORATORY // WEBGL_LIVE</span>
        </div>
        <div className="text-xs font-medium text-[#3B82F6] font-mono">{instructions}</div>
      </div>

      {/* Renders the WebGL Canvas */}
      <div ref={mountRef} className="flex-1 w-full bg-[#0A0E1A] relative" style={{ minHeight: '300px' }}>
        {/* Helper instructions overlaid */}
        <div className="absolute bottom-3 left-3 bg-[#121A2E]/80 backdrop-blur-sm border border-[#1E2D4A] rounded px-3 py-1 text-[10px] font-mono text-gray-400">
          🖱️ Rotate: Drag Left-Click // Pan: Drag Right-Click // Zoom: Scroll
        </div>
      </div>

      {/* Control panel based on active simulation */}
      <div className="p-3 bg-[#0F1626] border-t border-[#1E2D4A] flex flex-wrap items-center justify-between gap-3 text-sm">
        {simulationId === 'binary_tree' && (
          <div className="flex items-center space-x-2 w-full justify-between">
            <span className="text-xs text-gray-400 font-mono">Operations:</span>
            <div className="flex space-x-2">
              <input
                type="number"
                value={treeValue}
                onChange={e => setTreeValue(e.target.value)}
                placeholder="45"
                className="w-16 bg-[#0A0E1A] border border-[#1E2D4A] rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#3B82F6]"
              />
              <button
                onClick={handleInsertNode}
                className="bg-[#3B82F6] hover:bg-blue-600 transition text-white text-xs font-semibold px-3 py-1 rounded"
              >
                Insert Node
              </button>
            </div>
          </div>
        )}

        {simulationId === 'linked_list' && (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-gray-400 font-mono">List operations:</span>
            <button
              onClick={() => {
                if ((window as any).traverseList) (window as any).traverseList();
              }}
              className="bg-[#10B981] hover:bg-emerald-600 transition text-white text-xs font-semibold px-4 py-1.5 rounded"
            >
              Step Pointer (Next Node)
            </button>
          </div>
        )}

        {simulationId === 'neural_network' && (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-gray-400 font-mono">Network simulation:</span>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`text-xs font-bold px-4 py-1.5 rounded text-white transition ${
                isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-[#8B5CF6] hover:bg-purple-600'
              }`}
            >
              {isRunning ? 'Stop Forward Propagation' : 'Start Forward Propagation'}
            </button>
          </div>
        )}

        {simulationId === 'gradient_descent' && (
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400 font-mono">Learning Rate (\(\alpha\)):</span>
                <span className="text-xs font-bold text-[#FBBF24] font-mono">{lr}</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.45"
                step="0.02"
                value={lr}
                onChange={e => setLr(parseFloat(e.target.value))}
                className="w-32 accent-[#FBBF24]"
              />
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[#1E2D4A]/50">
              <span className="text-[10px] text-gray-500 font-mono">
                {lr < 0.1 ? '🟢 Low LR (Slow, stable)' : lr <= 0.25 ? '🟡 Balanced' : '🔴 High LR (Overshoots!)'}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`text-xs font-bold px-3 py-1 rounded text-white transition ${
                    isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-[#3B82F6] hover:bg-blue-600'
                  }`}
                >
                  {isRunning ? 'Pause Descent' : 'Start Descent'}
                </button>
                <button
                  onClick={() => {
                    setIsRunning(false);
                    setResetKey(prev => prev + 1);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1 rounded"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
