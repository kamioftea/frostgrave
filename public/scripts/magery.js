import { actions } from './actions.js'

export const mapState = state => ({
    modeHandler:     getModeHandler(state.mode)
    sidebar:         buildSidebar(state)
    filteredRosters: buildFilteredRosterList(state)
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

const buildFilteredRosterList = state => 
    state.rosterList.filter(roster => 
        state.filters.every(filter => applyFilter(filter, roster))
    );
    
function applyFilter(filter, roster) {
    const recursiveLookup = (value, path) => {
        if (path.length == 0) return value
        else if (typeof value != 'object') return undefined
        else {
            const [head, ...tail] = path
            return recursiveLookup(value[head], tail)
        }
    }
    
    const testValue = recursiveLookup(roster, filter.key.split('.'))
    
    return [...filter.values].includes(testValue)
}
