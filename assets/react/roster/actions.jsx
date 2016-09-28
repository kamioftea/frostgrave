export const actions = {
    MODE_ROSTER_LIST: 'MODE_ROSTER_LIST',
    MODE_ROSTER:      'MODE_ROSTER',
    MODE_ADD_ROSTER:  'MODE_ADD_ROSTER',
    MODE_ACCOUNT:     'MODE_ACCOUNT',

    TOGGLE_FILTER: 'TOGGLE_FILTER',

    REQUEST_DATA: 'REQUEST_DATA',
    RECEIVE_DATA: 'RECEIVE_DATA',

    ADD_ROSTER:   'ADD_ROSTER',
    ROSTER_ADDED: 'ROSTER_ADDED',

    UPDATE_ROSTER:  'UPDATE_ROSTER',
    ROSTER_UPDATED: 'ROSTER_UPDATED',

    REMOVE_ROSTER:  'REMOVE_ROSTER',
    ROSTER_DELETED: 'ROSTER_REMOVED',

    ADD_ITEM:    'ADD_ITEM',
    REMOVE_ITEM: 'REMOVE_ITEM',

    ADD_APPRENTICE:    'ADD_APPRENTICE',
    REMOVE_APPRENTICE: 'REMOVE_APPRENTICE',

    UPLOAD_FILE:   'UPLOAD_FILE',
    FILE_UPLOADED: 'FILE_UPLOADED',

    ADD_SOLDIER:    'ADD_SOLDIER',
    REMOVE_SOLDIER: 'REMOVE_SOLDIER',

    ADD_SPELL:    'ADD_SPELL',
    REMOVE_SPELL: 'REMOVE_SPELL'

};

export const setModeRosterList = () => ({
    type: actions.MODE_ROSTER_LIST
});

export const setModeRoster = roster_id => ({
    type: actions.MODE_ROSTER,
          roster_id
});

export const setModeAddRoster = () => ({
    type: actions.MODE_ADD_ROSTER
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

export const addRoster = (name, spell_school_id, event_id) => ({
    type: actions.ADD_ROSTER,
          name,
          spell_school_id,
          event_id
});
export const rosterAdded = (error, roster) => ({
    type: actions.ROSTER_ADDED,
          error,
          roster
});

export const updateRoster = (roster_id, key, value) => ({
    type: actions.UPDATE_ROSTER,
          roster_id,
          key,
          value
});
export const rosterUpdated = (error, roster) => ({
    type: actions.ROSTER_UPDATED,
          error,
          roster
});

export const removeRoster = (roster_id) => ({
    type: actions.UPDATE_ROSTER,
          roster_id,
          key,
          value
});
export const rosterRemoved = (error, roster_id) => ({
    type: actions.ROSTER_UPDATED,
          error,
          roster_id
});

export const addItem = (roster_id, target, item) => ({
    type: actions.ADD_ITEM,
          roster_id,
          target,
          item
});
export const removeItem = (roster_id, target, index) => ({
    type: actions.REMOVE_ITEM,
          roster_id,
          target,
          index
});

export const addApprentice = (roster_id) => ({
    type: actions.ADD_APPRENTICE,
          roster_id
});
export const removeApprentice = (roster_id) => ({
    type: actions.REMOVE_APPRENTICE,
          roster_id
});

export const addSoldier = (roster_id, miniature_id) => ({
    type: actions.ADD_SOLDIER,
          roster_id,
          miniature_id
});
export const removeSoldier = (roster_id, index) => ({
    type: actions.REMOVE_SOLDIER,
          roster_id,
          index
});

export const addSpell = (roster_id, spell_school_id, spell_id) => ({
    type: actions.ADD_SPELL,
          roster_id,
          spell_school_id,
          spell_id
});
export const removeSpell = (roster_id, spell_id) => ({
    type: actions.REMOVE_SPELL,
          roster_id,
          spell_id
});

export const uploadFile = (file, extra_data) => ({
    type: actions.UPLOAD_FILE,
          file,
          extra_data
});
export const fileUploaded = (error, file_url, extra_data) => ({
    type: actions.FILE_UPLOADED,
          error,
          file_url,
          extra_data
});


