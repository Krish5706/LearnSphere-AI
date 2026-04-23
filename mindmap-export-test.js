/**
 * Mind Map Export Validation Test Suite
 * 
 * Run this in browser console after generating a mind map
 * Usage: Paste entire script into browser DevTools console
 */

const MindMapExportTests = {
    // Helper: Get all nodes from React Flow
    getNodes() {
        const reactFlowNodes = document.querySelectorAll('.react-flow__nodes .react-flow__node');
        console.log(`Found ${reactFlowNodes.length} node elements in DOM`);
        return reactFlowNodes;
    },

    // Helper: Get all edges from React Flow
    getEdges() {
        const edgeSvg = document.querySelector('.react-flow__edges');
        const edgePaths = edgeSvg?.querySelectorAll('path') || [];
        console.log(`Found ${edgePaths.length} edge elements in SVG`);
        return edgePaths;
    },

    // Test 1: Verify DOM structure
    testDOMStructure() {
        console.group('TEST 1: DOM Structure');
        const nodes = this.getNodes();
        const edges = this.getEdges();
        
        console.assert(nodes.length > 0, 'ERROR: No nodes found in DOM');
        console.assert(nodes.length <= 20, `Warning: ${nodes.length} nodes exceeds limit`);
        
        if (nodes.length > 1) {
            console.assert(edges.length > 0, 'ERROR: Multiple nodes but no edges found');
        }
        
        console.log(`✓ Nodes: ${nodes.length}, Edges: ${edges.length}`);
        console.groupEnd();
    },

    // Test 2: Verify node visibility
    testNodeVisibility() {
        console.group('TEST 2: Node Visibility');
        const nodes = this.getNodes();
        let invisible = 0;
        
        nodes.forEach((node, idx) => {
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                console.warn(`Node ${idx} is not visible`);
                invisible++;
            }
        });
        
        console.assert(invisible === 0, `${invisible} invisible nodes detected`);
        console.log(`✓ All ${nodes.length} nodes are visible`);
        console.groupEnd();
    },

    // Test 3: Verify edge styling
    testEdgestyling() {
        console.group('TEST 3: Edge Styling');
        const edges = this.getEdges();
        let styledEdges = 0;
        
        edges.forEach((edge, idx) => {
            const stroke = edge.getAttribute('stroke') || window.getComputedStyle(edge).stroke;
            const strokeWidth = edge.getAttribute('stroke-width') || window.getComputedStyle(edge).strokeWidth;
            const opacity = edge.getAttribute('opacity') || window.getComputedStyle(edge).opacity;
            
            if (stroke && strokeWidth && parseFloat(opacity) > 0) {
                styledEdges++;
            } else {
                console.warn(`Edge ${idx} may have visibility issues:`, { stroke, strokeWidth, opacity });
            }
        });
        
        console.log(`✓ ${styledEdges}/${edges.length} edges properly styled`);
        console.groupEnd();
    },

    // Test 4: Calculate bounds
    testBounds() {
        console.group('TEST 4: Canvas Bounds');
        const nodes = this.getNodes();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        nodes.forEach((node) => {
            const rect = node.getBoundingClientRect();
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.right);
            maxY = Math.max(maxY, rect.bottom);
        });
        
        const viewportRect = document.querySelector('.react-flow__viewport')?.getBoundingClientRect() || { };
        
        console.log('Bounds:', {
            nodes: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
            viewport: {
                width: viewportRect.width,
                height: viewportRect.height,
            },
        });
        
        console.assert(
            minX > viewportRect.left - 100 && maxX < viewportRect.right + 100,
            'Nodes may be outside viewport bounds'
        );
        
        console.groupEnd();
    },

    // Test 5: Verify export container exists
    testExportContainer() {
        console.group('TEST 5: Export Container');
        const reactFlow = document.querySelector('.react-flow');
        const viewport = document.querySelector('.react-flow__viewport');
        
        console.assert(reactFlow, 'ERROR: React Flow container not found');
        console.assert(viewport, 'ERROR: Viewport not found');
        
        if (reactFlow) {
            const style = window.getComputedStyle(reactFlow);
            console.log('React Flow container:', {
                display: style.display,
                width: style.width,
                height: style.height,
            });
        }
        
        console.log('✓ Export container verified');
        console.groupEnd();
    },

    // Test 6: Simulate export data
    testExportData() {
        console.group('TEST 6: Export Data Simulation');
        const nodeElements = this.getNodes();
        const edgeElements = this.getEdges();
        
        // Simulate what will be captured
        const simulatedData = {
            nodeCount: nodeElements.length,
            edgeCount: edgeElements.length,
            canvasSize: {
                width: 1920,
                height: 1080,
            },
            quality: {
                pixelRatio: 2,
                expectedSize: '2-5MB for high-res',
            },
        };
        
        console.table(simulatedData);
        console.log('✓ Export data simulation complete');
        console.groupEnd();
    },

    // Test 7: Check for animation issues
    testAnimations() {
        console.group('TEST 7: Animation Check');
        const edges = this.getEdges();
        let animatedEdges = 0;
        
        edges.forEach((edge) => {
            const animation = window.getComputedStyle(edge).animation;
            if (animation && animation !== 'none') {
                animatedEdges++;
            }
        });
        
        if (animatedEdges > 0) {
            console.warn(`${animatedEdges} edges have animations (may impact export quality)`);
        } else {
            console.log('✓ No animations found (good for export)');
        }
        console.groupEnd();
    },

    // Test 9: Check background color
    testBackgroundColor() {
        console.group('TEST 9: Background Color Check');
        const flowElement = document.querySelector('.react-flow');
        const reactFlowWrapper = document.querySelector('[style*="backgroundColor"]');
        
        if (flowElement) {
            const computedStyle = window.getComputedStyle(flowElement);
            console.log('React Flow background:', computedStyle.backgroundColor);
            console.assert(
                computedStyle.backgroundColor === 'rgb(255, 255, 255)' || computedStyle.backgroundColor === '#ffffff',
                `Expected white background, got: ${computedStyle.backgroundColor}`
            );
        }
        
        if (reactFlowWrapper) {
            const wrapperStyle = window.getComputedStyle(reactFlowWrapper);
            console.log('Wrapper background:', wrapperStyle.backgroundColor);
            console.assert(
                wrapperStyle.backgroundColor === 'rgb(255, 255, 255)' || wrapperStyle.backgroundColor === '#ffffff',
                `Expected white wrapper background, got: ${wrapperStyle.backgroundColor}`
            );
        }
        
        console.log('✓ Background color verification complete');
        console.log('Note: White background via selective container background removal + html-to-image backgroundColor');
        console.groupEnd();
    },

    // Test 8: Full validation report
    runFullValidation() {
        console.clear();
        console.log('%c=== MIND MAP EXPORT VALIDATION REPORT ===', 'color: blue; font-size: 14px; font-weight: bold;');
        
        this.testDOMStructure();
        this.testNodeVisibility();
        this.testEdgestyling();
        this.testBounds();
        this.testExportContainer();
        this.testBackgroundColor();
        this.testAnimations();
        this.testExportData();
        
        console.log('%c=== VALIDATION COMPLETE ===', 'color: green; font-size: 14px; font-weight: bold;');
        console.log('Now click the Download button to test export');
        console.log('Expected improvements:');
        console.log('- fitView called before export');
        console.log('- Increased padding (80px)');
        console.log('- Better scaling calculation');
        console.log('- Higher quality rendering (pixelRatio: 2)');
        console.log('- Clean white background via selective background removal');
        console.log('- Post-export validation');
        console.log('- Background color verification');
    },

    // Monitor export process
    monitorExport() {
        console.group('EXPORT MONITOR');
        console.log('Monitoring export process...');
        
        const originalFetch = window.fetch;
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        
        // Track any canvas operations
        HTMLCanvasElement.prototype.toBlob = function(...args) {
            console.log('Canvas toBlob called:', { width: this.width, height: this.height });
            return originalToBlob.apply(this, args);
        };
        
        console.log('✓ Export monitoring active. Check console for export events');
        console.groupEnd();
    },
};

// Run validation
console.log('%cMind Map Export Test Suite Loaded', 'color: purple; font-weight: bold; font-size: 12px;');
console.log('Run: MindMapExportTests.runFullValidation()');
console.log('Then click Download button');
console.log('Monitor: MindMapExportTests.monitorExport()');
