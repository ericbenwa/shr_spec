// Collapse the node and all it's children
const collapse = (d) => {

    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }

}

const update = (source) => {

    // Creates a curved (diagonal) path from parent to the child nodes
    const diagonal = (s, d) => {

        const path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;

        return path;

    }

    // Toggle children on click.
    const click = (d) => {

        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }

        update(d);

    }

    // Assigns the x and y position for the nodes
    const treeData = treemap(root);

    // Compute the new tree layout.
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach((d) => { d.y = d.depth * 180 });

    // Update the nodes...
    const node = svg.selectAll('g.node')
        .data(nodes, (d) => { return d.id || (d.id = ++i); });

    // Enter any new modes at the parent's previous position.
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", (d) => {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", (d) => {
            return d._children ? "lightsteelblue" : "#fff";
        });

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", (d) => {
            return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", (d) => {
            return d.children || d._children ? "end" : "start";
        })
        .text((d) => { return d.data.name; });

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", (d) => {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style("fill", (d) => {
            return d._children ? "lightsteelblue" : "#fff";
        })
        .attr('cursor', 'pointer');


    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", (d) => {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // Update the links...
    const link = svg.selectAll('path.link')
        .data(links, (d) => { return d.id; });

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', (d) => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal(o, o);
        });

    // UPDATE
    const linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', (d) => { return diagonal(d, d.parent) });

    // Remove any exiting links
    const linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', (d) => {
            const o = { x: source.x, y: source.y };
            return diagonal(o, o);
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Set the dimensions and margins of the diagram
const margin = {top: 100, right: 200, bottom: 100, left: 200};
const width = 1920 - margin.left - margin.right;
const height = 1080 - margin.top - margin.bottom;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
const svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("
          + margin.left + "," + margin.top + ")");

const duration = 750;
let i = 0;
let root;

// declares a tree layout and assigns the size
const treemap = d3.cluster().size([height, width]);

// Assigns parent, children, height, depth
root = d3.hierarchy(tree, (d) => { return d.children; });
root.x0 = height / 2;
root.y0 = 0;

// Collapse the graph
collapse(root);

update(root);