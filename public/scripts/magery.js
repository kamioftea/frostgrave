import { actions } from './actions.js'

export const mapState = state => ({
    modeHandler: getModeHandler(state.mode)
    sidebar:     buildSidebar(state)
})

function getModeHandler(mode) {
    switch (mode) {
        case actions.MODE_ROSTER_LIST: return 'rosterList';
        case actions.MODE_ROSTER:      return 'roster';
        case actions.MODE_ACCOUNT:     return 'account';
    }
}

function buildSidebar = state => ({
    filters: [
        {
            id: "events",
            filterType: "filterGroup"
            label: "Events",
            expanded: false,
            filters: [
                {
                    id: "event-1",
                    label: "Derby - Full Warbands",
                    selected: false
                },
                {
                    id: "event-2",
                    label: "Derby - Wizard Groups",
                    selected: false
                }
            ]
        },
        {
            id: "my-rosters",
            filterType: "filter",
            label: "My Rosters",
            selected: true
        }
    ],
    admin: true
})
