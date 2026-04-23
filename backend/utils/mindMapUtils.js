const { v4: uuidv4 } = require('uuid');

const convertToNodesAndEdges = (hierarchicalData) => {
  const nodes = [];
  const edges = [];
  let yOffset = 0;
  const xSpacing = 250;
  const ySpacing = 150;

  function traverse(node, parentId = null, level = 0, siblings = 1, index = 0) {
    if (!node || !node.title) return;

    const nodeId = uuidv4();
    
    // Center children under the parent
    const totalWidth = (siblings - 1) * xSpacing;
    const x = index * xSpacing - totalWidth / 2;

    nodes.push({
      id: nodeId,
      data: { label: node.title },
      position: { x: x, y: yOffset + level * ySpacing },
      type: level === 0 ? 'input' : (node.children && node.children.length > 0 ? 'default' : 'output'),
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        animated: true,
      });
    }

    if (node.children && node.children.length > 0) {
      const numChildren = node.children.length;
      node.children.forEach((child, i) => {
        traverse(child, nodeId, level + 1, numChildren, i);
      });
    }
  }

  traverse(hierarchicalData);
  
  // Simple auto-layouting logic
  const levels = {};
  nodes.forEach(node => {
      const level = edges.filter(e => e.target === node.id).length;
      if (!levels[level]) {
          levels[level] = [];
      }
      levels[level].push(node);
  });

  Object.keys(levels).forEach(level => {
      const levelNodes = levels[level];
      const levelWidth = (levelNodes.length - 1) * xSpacing;
      levelNodes.forEach((node, i) => {
          node.position.x = i * xSpacing - levelWidth / 2;
          node.position.y = parseInt(level) * ySpacing;
      });
  });


  return { nodes, edges };
};

module.exports = { convertToNodesAndEdges };
