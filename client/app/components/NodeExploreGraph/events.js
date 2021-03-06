
/*
 * Events specific to NodeOverviewGraph
 */
import * as d3 from 'd3'
import { colora, colorb, colorc, colorNode } from '../../graph/util'

export default (actions) => {

    const clickSubscriptionsById = {

    }

    return {
        nodeClickNoDrag: (selection) => {
            /*
             * Render node tooltip
             */
            selection.on('click', (d) => {
                actions.router.push(`/app/nodes/${d.id}`)
            })
        },
        nodeDoubleClick: (d) => {
            d.fixed = false;
            simulation.restart();
        },
        nodeMouseOver: () => {
            // simulation.stop();

        },
        nodeMouseOut: () => {
            /*
             * TODO: only when node tooltip is not shown
             */
            // simulation.restart();
        },
        linkDoubleClick: (d) => {
            /*
             * call removeEdge() here
             */
            actions.removeEdge(d.id)
        }
    }
}
