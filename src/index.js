import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import d3Force from 'cytoscape-d3-force';


cytoscape.use( edgehandles );
cytoscape.use( d3Force );

const group = ['hospital', 'clothes', 'computer', 'person', 'flower', 'tree', 'desk', 'house', 'water', 'cup']
const edgegroup = ['has', 'goto', 'love']
const year = ['2017', '2018', '2019']
const MAX_Y = 800
const MAX_X = 1500




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
  function createNodes(num) {
    let datas = []
    for (let i = 0; i < num; i++) {
      let _groupId = group[Math.floor(Math.random() * group.length)]
      let data = {
        id: createId('node_'),
        position: {
          x: Math.random() * MAX_X,
          y: Math.random() * MAX_Y,
        },
        group: _groupId,
        parent: _groupId
      }
      data.label = data.group + '-node' + i
      data.name = "Josh"
      datas.push({
        group: 'nodes',
        data,
        id: data.id
      })
    }
    return datas        
  }
//   function createParent (nodes) {
//     let _parents = Array.from(new Set(nodes.map(node => node.data.group))).filter(p => !nodes.find(node => node.data.id === p) && p !== 'person')
//     return _parents.map(p => {
//       return {
//         group: 'nodes',
//         data: {
//           id: p,
//           label: p
//         },
//         id: p
//       }
//     })
//   }
  function createEdges(nodes, num) {
    let edges = []
    for (let i = 0; i < num - 1; i++) {
      let target = nodes[i + 1].data.id
      let source = nodes[Math.floor(Math.sqrt(i))].data.id
      let edge = {
        target,
        source,
        id: createId('edge_'),
        group: edgegroup[Math.floor(Math.random() * edgegroup.length)],
        time: year[Math.floor(Math.random() * year.length)] + '-' + Math.ceil(Math.random() * 12) + '-' + Math.ceil(Math.random() * 30)
      }
      edge.label = 'edge' + i
      edge.name = 'edge' + i
  
      edges.push({
        data: edge,
        group: 'edges',
        id: edge.id
      })
    }
    return edges
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

//   function createData(nodes, edges) {
//     // let nodes = createNodes(num)
//     // let edges = createEdges(nodes, num)
//     return nodes.concat(edges)// .concat(createParent(nodes))
//   }


  let elements = createGraphFromJson();


// Initialize Cytoscape
var cy = cytoscape({
    container: document.getElementById('cy'),
    

    layout: {
        name: 'd3-force',
        animate: true,
        fixedAfterDragging: false,
        linkId: function id(d) {
            return d.id;
          },
        linkDistance: 200,
        manyBodyStrength: -300,
        maxIterations: 100,
        // maxSimulationTime: 2000,
        ready: function(){},
        stop: function(){},
        tick: function(){},
        randomize: false,
        // infinite: true
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
            'target-arrow-shape': 'triangle'
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
        name: 'd3-force',
        animate: true,
        fixedAfterDragging: false,
        linkId: function id(d) {
            return d.id;
          },
        linkDistance: 80,
        manyBodyStrength: -300,
        maxIterations: 50,
        // maxSimulationTime: 2,
        ready: function(){},
        stop: function(){},
        tick: function(progress) {},
        randomize,
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