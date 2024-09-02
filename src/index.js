import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import d3Force from 'cytoscape-d3-force';


cytoscape.use( edgehandles );
cytoscape.use( d3Force );


function generateJson() {
    const elements = cy.elements().jsons();
    return JSON.stringify(elements, null, 2);
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

document.getElementById('download-json').addEventListener('click', downloadJson);

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

document.getElementById('load-json').addEventListener('click', function() {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', handleFileInput);


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

const layoutProperties = {
    name: 'd3-force',
    animate: true,
    fixedAfterDragging: false,
    linkId: function id(d) {
        return d.id;
    },
    linkDistance: 200,
    manyBodyStrength: -300,
    ready: function() {},
    stop: function() {},
    tick: function() {}
};


// Initialize Cytoscape
var cy = cytoscape({
    container: document.getElementById('cy'),
    

    layout: {
        ...layoutProperties,
        maxIterations: 100,
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



document.getElementById('draw-on').addEventListener('click', function() {
    eh.enableDrawMode();
});

document.getElementById('draw-off').addEventListener('click', function() {
    eh.disableDrawMode();
});

document.getElementById('start').addEventListener('click', function() {
    eh.start( cy.$('node:selected') );
});

document.getElementById('adjust').addEventListener('click', function() {
    adjustWithD3(false);
});

document.getElementById('adjust-and-randomize').addEventListener('click', function() {
    adjustWithD3(true);
});

let lastClickedNode = null;

// adjust all elements with d3 when anything happens
function adjustWithD3(randomize) {
    cy.layout({
        ...layoutProperties,
        randomize,
        maxIterations: 50,
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
    let pos = event.position;
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
}

    // Add tap event listener to create a new node when clicking on a blank area

cy.on('dblclick', function(event) {
    if (event.target === cy) {
        createNodeAndEdge(event);
    }
});

cy.on('tap', function(event) {
    if (lastClickedNode && (event.target === cy)) {
        createNodeAndEdge(event);
}

});