import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import d3Force from 'cytoscape-d3-force';
import cytoscapePopper from 'cytoscape-popper';
import {
  computePosition,
  flip,
  shift,
  limitShift,
} from '@floating-ui/dom';

 
cytoscape.use(cytoscapePopper(popperFactory));
cytoscape.use( edgehandles );
cytoscape.use( d3Force );


function popperFactory(ref, content, opts) {
    const popperOptions = {
        middleware: [
            flip(),
            shift({limiter: limitShift()})
        ],
        ...opts,
    }
 
    function update() {
        computePosition(ref, content, popperOptions).then(({x, y}) => {
            Object.assign(content.style, {
                left: `${x}px`,
                top: `${y}px`,
            });
        });
    }
    update();
    return { update };
 }


function generateJson() {
    const elements = cy.elements().jsons();
    return JSON.stringify(elements, null, 2);
}

async function loadJsonData() {
    try {
        const response = await fetch('data.json');
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error('Error loading JSON data:', error);
        return null;
    }
}


function downloadJson() {
    const json = generateJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-layout.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleFileInput(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const jsonData = JSON.parse(e.target.result);
            updateGraphWithJson(jsonData);
        };
        reader.readAsText(file);
    }
}

function updateGraphWithJson(jsonData) {
    cy.elements().remove(); // Remove existing elements
    cy.add(jsonData); // Add new elements
    cy.layout({
        ...layoutProperties,
    }
    ).run(); // Apply layout
}

// dom connections

let maxDistance = document.getElementById('maxDistanceValue').value;

let maxConnections = document.getElementById('maxConnectionsValue').value;


document.getElementById('download-json').addEventListener('click', downloadJson);

document.getElementById('load-json').addEventListener('click', function() {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', handleFileInput);

document.getElementById('maxDistance').addEventListener('input', function() {
    maxDistance = this.value;
    updateMaxPeople();
    document.getElementById('maxDistanceValue').textContent = this.value;
});

document.getElementById('maxConnections').addEventListener('input', function() {
    maxConnections = this.value;
    updateMaxPeople();
    document.getElementById('maxConnectionsValue').textContent = this.value;
});


document.getElementById('adjust').addEventListener('click', function() {
    adjustWithD3(false);
});

document.getElementById('adjust-and-randomize').addEventListener('click', function() {
    adjustWithD3(true);
});


document.getElementById('saveNodeName').addEventListener('click', saveNodeName);

document.getElementById('nodeNameInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        saveNodeName();
    }
});

function saveNodeName() {
    const popperDiv = document.getElementById('nameInputBox');
    const nodeNameInput = document.getElementById('nodeNameInput');
    const nodeId = popperDiv.dataset.nodeId;
    const node = cy.getElementById(nodeId);
    node.data('name', nodeNameInput.value);
    popperDiv.style.display = 'none';
    lastClickedNode = null;
}

function calculateMaxPeople(maxConnections, maxDistance) {
    // Calculate the total number of nodes in a tree with the given depth and branching factor
    let totalNodes = 0;
    for (let i = 0; i <= maxDistance; i++) {
        totalNodes += Math.pow(maxConnections, i);
    }
    return totalNodes;
}

function updateMaxPeople() {
    const maxDistance = document.getElementById('maxDistance').value;
    const maxConnections = document.getElementById('maxConnections').value;
    const maxPeople = calculateMaxPeople(maxConnections, maxDistance);
    document.getElementById('maxPeople').textContent = maxPeople;
}

function createId(salt, randomLength = 8) {
    return (
      (salt || '') +
      Number(
        Math.random()
          .toString()
          .substring(3, randomLength) + Date.now()
      ).toString(36)
    )
  }

// Function to create nodes and edges from JSON data
async function createGraphFromJson() {
    const jsonData = await loadJsonData();
    if (!jsonData) return;

    const nodes = jsonData.nodes.map(node => ({
        group: 'nodes',
        data: {
            id: node.id,
            position: node.position,
            group: node.group,
            name: node.name
        },
        id: node.id
    }));

    const edges = jsonData.edges.map(edge => ({
        group: 'edges',
        data: {
            source: edge.source,
            target: edge.target
        }
    }));

    // Assuming you have a function to add nodes and edges to your graph
    return nodes.concat(edges);
}

let elements = createGraphFromJson();

let longestPath = null;

const layoutProperties = {
    name: 'd3-force',
    animate: true,
    fixedAfterDragging: false,
    linkId: function id(d) {
        return d.id;
    },
    linkDistance: 200,
    manyBodyDistanceMin: 4,
    manyBodyStrength: -600,
    // radialStrength: .5,
    // radialRadius: 100.0,
    ready: function() {},
    stop: function() {},
    tick: function() {}
};


// Initialize Cytoscape
var cy = cytoscape({
    container: document.getElementById('cy'),
    

    layout: {
        ...layoutProperties,
        maxSimulationTime: 4000,
        randomize: false,
      },

      style: [
        {
          selector: 'node[name]',
          style: {
            'content': 'data(name)'
          }
        },

        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'opacity': 0.25,
          }
        },

        // some style for the extension
        {
          selector: '.eh-handle',
          style: {
            'background-color': 'red',
            'width': 12,
            'height': 12,
            'shape': 'ellipse',
            'overlay-opacity': 0,
            'border-width': 12, // makes the handle easier to hit
            'border-opacity': 0
          }
        },

        {
          selector: '.eh-hover',
          style: {
            'background-color': 'red'
          }
        },

        {
          selector: '.eh-source',
          style: {
            'border-width': 2,
            'border-color': 'red'
          }
        },

        {
          selector: '.eh-target',
          style: {
            'border-width': 2,
            'border-color': 'red'
          }
        },

        {
          selector: '.eh-preview, .eh-ghost-edge',
          style: {
            'background-color': 'red',
            'line-color': 'red',
            'target-arrow-color': 'red',
            'source-arrow-color': 'red'
          }
        },
        {
          selector: '.eh-ghost-edge.eh-preview-active',
          style: {
            'opacity': 0
          }
        },
        {
            selector: '.highlighted',
            style: {
                'background-color': '#3492eb',
                'line-color': '#3492eb',
                'target-arrow-color': '#3492eb',
                'source-arrow-color': '#3492eb'
            }
        }
      ],
      elements: elements,
    });

// the default values of each option are outlined below:
let defaults = {
    canConnect: function( sourceNode, targetNode ){
      // whether an edge can be created between source and target
      return !sourceNode.same(targetNode); // e.g. disallow loops
    },
    edgeParams: function( sourceNode, targetNode ){
      // for edges between the specified source and target
      // return element object to be passed to cy.add() for edge
      return {};
    },
    hoverDelay: 150, // time spent hovering over a target node before it is considered selected
    snap: true, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
    snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
    snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
    noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
    disableBrowserGestures: true // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
  };
  
let eh = cy.edgehandles( );

let lastClickedNode = null;

// adjust all elements with d3 when anything happens
function adjustWithD3(randomize) {
    cy.layout({
        ...layoutProperties,
        randomize,
        maxSimulationTime: 4000,
        // infinite: true
    }).run();
  }


cy.on('dblclick', 'node', function(event) {
    let node = event.target;
    eh.start(node);
    lastClickedNode = node;
  });


// Add double-click event listener to remove an edge
cy.on('dblclick', 'edge', function(event) {
        let edge = event.target;
        edge.remove();
    });

// Add function that creates a new node and edge when clicking on a blank area

function createNodeAndEdge(event) {
    const pos = event.position || event.cyPosition;
    let newNodeId = createId('node_');
    cy.add({
        group: 'nodes',
        data: { id: newNodeId },
        position: { x: pos.x, y: pos.y }
    });
    console.log(`New node created: ${newNodeId}`);

    if (lastClickedNode) {
        cy.add({
            group: 'edges',
            data: {
                id: createId('edge_'),
                source: lastClickedNode.id(),
                target: newNodeId
            }
        });
        console.log(`New edge created from ${lastClickedNode.id()} to ${newNodeId}`);
        lastClickedNode = null; // Reset the last clicked node
    }

    // Show the pop-up div with input box
    const popperDiv = document.getElementById('nameInputBox');
    const nodeNameInput = document.getElementById('nodeNameInput');
    popperDiv.style.display = 'block';
    popperDiv.style.left = `${pos.x}px`;
    popperDiv.style.top = `${pos.y}px`;
    nodeNameInput.value = ''; // Clear the input box
    nodeNameInput.focus();

    // Save the new node ID to use it later
    popperDiv.dataset.nodeId = newNodeId;
}

    // Add tap event listener to create a new node when clicking on a blank area

cy.on('dblclick', function(event) {
    if (event.target === cy) {
        cy.elements().removeClass('highlighted');
        createNodeAndEdge(event);
    }
});

cy.on('tap', function(event) {
    if (lastClickedNode && (event.target === cy)) {
        cy.elements().removeClass('highlighted');
        createNodeAndEdge(event);
}


// Function to update the display
function updateLongestPathDisplay() {
    const displayElement = document.getElementById('longest-path-display');
    displayElement.textContent = `Longest Path: ${longestPath}`;
}

function findShortestPathsFromNode(sourceId) {
    const sourceNode = cy.getElementById(sourceId);

    if (sourceNode.length === 0) {
        return;
    }

    const dijkstra = cy.elements().dijkstra({
        root: sourceNode,
        directed: true, // Set to true if you want to find directed paths
    });

    // Clear previous highlights
    cy.elements().removeClass('highlighted');


    cy.nodes().forEach(targetNode => {
        if (targetNode.id() !== sourceId) {
            const path = dijkstra.pathTo(targetNode);
            const distance = dijkstra.distanceTo(targetNode);
            if ((distance !== Infinity) && (distance > longestPath)) {
                longestPath = distance;
                updateLongestPathDisplay();
            }
                // if the index of the element in the path is odd, it's an edge
            path.forEach((element, index) => {
                if (index % 2 === 1) {
                    element.addClass('highlighted');
                }
            });
            // also, if the path has more than one element, the target node is included
            if (path.length > 1) {
                targetNode.addClass('highlighted');
            }
        }
    });

    
}

cy.on('tap', 'node', function(event) {
    const node = event.target;
    longestPath = null;
    findShortestPathsFromNode(node.id());
    node.removeClass('highlighted');
});


});