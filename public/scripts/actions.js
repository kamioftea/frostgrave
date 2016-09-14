export const actions = {
    MODE_ROSTER_LIST: 'MODE_ROSTER_LIST',
    MODE_ROSTER:      'MODE_ROSTER',
    MODE_ACCOUNT:     'MODE_ACCOUNT'
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
