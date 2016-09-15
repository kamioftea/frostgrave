export const actions = {
    MODE_ROSTER_LIST: 'MODE_ROSTER_LIST',
    MODE_ROSTER:      'MODE_ROSTER',
    MODE_ACCOUNT:     'MODE_ACCOUNT',
    
    TOGGLE_FILTER:    'TOGGLE_FILTER'
}

const setModeRosterList = (filters = {}) => ({
    type: actions.MODE_ROSTER_LIST,
          filters
})

const setModeRoster = rosterId => ({
    type: actions.MODE_ROSTER,
          rosterId
})

const setModeAccount = () => ({
    type: actions.MODE_ACCOUNT
})

const toggleFilter = (key, value) => ({
    type: actions.TOGGLE_FILTER,
          key,
          value
})
