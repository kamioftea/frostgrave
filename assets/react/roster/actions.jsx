export const actions = {
    MODE_ROSTER_LIST: 'MODE_ROSTER_LIST',
    MODE_ROSTER:      'MODE_ROSTER',
    MODE_ACCOUNT:     'MODE_ACCOUNT',

    TOGGLE_FILTER: 'TOGGLE_FILTER',

    REQUEST_DATA: 'REQUEST_DATA',
    RECEIVE_DATA: 'RECEIVE_DATA',
};

export const setModeRosterList = () => ({
    type: actions.MODE_ROSTER_LIST
});

export const setModeRoster = rosterId => ({
    type: actions.MODE_ROSTER,
          rosterId
});

export const setModeAccount = () => ({
    type: actions.MODE_ACCOUNT
});

export const toggleFilter = (key, value) => ({
    type: actions.TOGGLE_FILTER,
          key,
          value
});

export const requestData = () => ({
    type: actions.REQUEST_DATA
});
export const receiveData = (error, data) => ({
    type: actions.RECEIVE_DATA,
          error,
          data
});

