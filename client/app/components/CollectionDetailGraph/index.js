import _ from 'lodash'
import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'

// TODO: only import things you need - 2016-07-25
import * as d3 from 'd3'
// import './styles.css'

import { browserHistory } from 'react-router'

import createZoom from '../../graph/zoom'
import createSimulation from '../../graph/simulation'
import { arrowHead } from '../../graph/svgdefs.js'
import { NODE_RADIUS, WIDTH, HEIGHT } from '../../graph/constants'
import createDrag from '../../graph/drag'
import createEvents from '../../graph/events'
import createCustomEvents from './events'
import createLinkUpdates from '../../graph/link'
import createNodeUpdates from '../../graph/node'
import { colora, colorb, colorc, colorNode } from '../../graph/util'

class CollectionDetailGraph extends React.Component {
    constructor(props) {
        super(props)

        this.update = this.update.bind(this)
    }

    update(nextProps) {
        /*
         * Go through the enter,update,exit cycle
        */
        let { nodes, links } = nextProps

        const nodeById = d3.map()

        // set extra properties here
        nodes.forEach(node => {
            nodeById.set(node.id, node)
        })

        links.forEach(link => {
            link.source = nodeById.get(link.start)
            link.target = nodeById.get(link.end)
            link.source.r = NODE_RADIUS;
            link.target.r = NODE_RADIUS;

            // link.curved = link.end
            link.curved = _.includes(this.props.adjacencyMap[link.end], link.start)
        })

        var node = this.d3Graph.selectAll('.node')
            // .data(nodes, node => node.id + "_" + node.properties.modified)
            .data(nodes, node => node.id)

        // EXIT selection
        node.exit().call(this.nodeUpdates.exitNode)
        // ENTER selection
        node.enter().append('g').call(this.nodeUpdates.enterNode).call(this.nodeDrag)
            // ENTER + UPDATE selection
            .merge(node).call(this.nodeUpdates.updateNode)

        var link = this.d3Graph.selectAll('.node-link')
            .data(links, link => link.id)

        // EXIT selection
        link.exit().remove()
        // ENTER selection
        link.enter().insert('g', ":first-child").call(this.linkUpdates.enterLink)
            // .merge(link).call(updateLink)

        this.simulation.nodes(nodes)

        this.simulation.force("link")
            .links(links)

        if (nodes.length !== this.props.nodes.length || links.length !== this.props.links.length) {
            this.simulation.alpha(0.8).restart();
        }
    }

    componentDidMount() {
        const { collectionId, loadNode, removeEdge, showGraphSideBar, connectNodes } = this.props

        this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));
        this.d3Graph
            .append('defs')
            .call(arrowHead)

        const { simulation, ticked } = createSimulation(WIDTH, HEIGHT)
        this.simulation = simulation
        this.ticked = ticked

        this.zoom = createZoom(this.d3Graph, WIDTH, HEIGHT)

        this.events = createEvents({
            loadNode,
            removeEdge,
            showGraphSideBar,
        })
        const customEvents = createCustomEvents({
            loadNode,
            removeEdge,
            showGraphSideBar,
            router: this.props.router,
            collectionId,
        })

        const forceDrag = createDrag(this.simulation)({ connect: connectNodes }, customEvents.nodeClickNoDrag)
        this.nodeDrag = d3.drag()
            .on('drag', forceDrag.drag.bind(this))
            .on('start', forceDrag.dragstart.bind(this))
            .on('end', forceDrag.dragend.bind(this))

        const nodeEnterEvents = [
            // this.customEvents.nodeClickNoDrag   
        ]

        this.nodeUpdates = createNodeUpdates({
            events: this.events,
            zoom: this.zoom,
            paddingPercent: 0.95,
        })(nodeEnterEvents)
        this.linkUpdates = createLinkUpdates(this.events)()

        // append tooltip to the dom
        // this.d3Graph.call(nodeTooltip)
        // this.d3Graph.call(linkTooltip)

        this.update(this.props)

        this.simulation.on('tick', () => {
            // after force calculation starts, call updateGraph
            // which uses d3 to manipulate the attributes,
            // and React doesn't have to go through lifecycle on each tick
            this.d3Graph.call(this.ticked);
        });


        setTimeout(() => {
            colorNode(d3.select(`#node-${this.props.selected}`))
        }, 0)
    }

    shouldComponentUpdate(nextProps) {
        this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));

        this.update(nextProps)

        if (nextProps.selected && nextProps.selected !== this.props.selected) {
            setTimeout(() => {
                colorNode(d3.select(`#node-${nextProps.selected}`))
            }, 0)
        }

        return false
    }

    render() {
        return (
            <div id="nodeOverviewGraph" className="svg-container">
                <svg 
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="svg-content"
                >
                    <g ref='graph' />
                </svg>
        </div>

        )
    }
}
CollectionDetailGraph.propTypes = {
    nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
    links: PropTypes.arrayOf(PropTypes.object).isRequired,

    connectNodes: PropTypes.func.isRequired,
}

import { withRouter } from 'react-router'

export default withRouter(CollectionDetailGraph)
