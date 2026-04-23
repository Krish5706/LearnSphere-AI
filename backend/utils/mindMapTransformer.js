const MAX_NODE_COUNT = 15;

const normalizeTree = (tree, maxNodes = MAX_NODE_COUNT) => {
    let count = 0;

    const walk = (node) => {
        if (!node || count >= maxNodes) {
            return null;
        }

        count += 1;
        const normalizedNode = {
            title: String(node.title || 'Untitled Topic').trim() || 'Untitled Topic',
            children: [],
        };

        if (Array.isArray(node.children) && count < maxNodes) {
            for (const child of node.children) {
                if (count >= maxNodes) {
                    break;
                }
                const normalizedChild = walk(child);
                if (normalizedChild) {
                    normalizedNode.children.push(normalizedChild);
                }
            }
        }

        return normalizedNode;
    };

    return walk(tree);
};

const buildLayoutTree = (tree) => {
    let idCounter = 1;

    const createLayoutNode = (node, level = 0) => {
        const layoutNode = {
            id: String(idCounter++),
            title: node.title,
            level,
            children: [],
            x: 0,
            y: 0,
        };

        layoutNode.children = (node.children || []).map((child) =>
            createLayoutNode(child, level + 1)
        );

        return layoutNode;
    };

    return createLayoutNode(tree, 0);
};

const assignTreePositions = (root, horizontalGap = 240, verticalGap = 180) => {
    let leafIndex = 0;

    const dfs = (node) => {
        if (!node.children.length) {
            node.x = leafIndex * horizontalGap;
            node.y = node.level * verticalGap;
            leafIndex += 1;
            return node.x;
        }

        const childXs = node.children.map((child) => dfs(child));
        const minX = Math.min(...childXs);
        const maxX = Math.max(...childXs);
        node.x = (minX + maxX) / 2;
        node.y = node.level * verticalGap;
        return node.x;
    };

    dfs(root);

    const offsetX = 140;
    const offsetY = 80;

    const normalize = (node) => {
        node.x += offsetX;
        node.y += offsetY;
        node.children.forEach(normalize);
    };

    normalize(root);
};

const flattenToReactFlow = (root) => {
    const nodes = [];
    const edges = [];

    const walk = (node, parentId = null) => {
        nodes.push({
            id: node.id,
            data: { label: node.title },
            position: { x: node.x, y: node.y },
        });

        if (parentId) {
            edges.push({
                id: `e-${parentId}-${node.id}`,
                source: parentId,
                target: node.id,
            });
        }

        node.children.forEach((child) => walk(child, node.id));
    };

    walk(root);

    return { nodes, edges };
};

const treeToMindMapGraph = (tree, options = {}) => {
    const maxNodes = options.maxNodes || MAX_NODE_COUNT;
    const normalizedTree = normalizeTree(tree, maxNodes);

    if (!normalizedTree) {
        return { nodes: [], edges: [] };
    }

    const layoutTree = buildLayoutTree(normalizedTree);
    assignTreePositions(
        layoutTree,
        options.horizontalGap || 240,
        options.verticalGap || 180
    );

    return flattenToReactFlow(layoutTree);
};

module.exports = {
    MAX_NODE_COUNT,
    treeToMindMapGraph,
};
