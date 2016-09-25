import {createStore, applyMiddleware} from "redux";
import {actions} from "./actions.jsx";
import {epicMiddleware} from "./epics.jsx";

const modeReducer = (state = actions.MODE_ROSTER_LIST, action) => {
    switch (action.type) {
        case actions.MODE_ROSTER_LIST:
        case actions.MODE_ROSTER:
        case actions.MODE_ADD_ROSTER:
        case actions.MODE_ACCOUNT:
            return action.type;

        case actions.ROSTER_ADDED:
            return action.roster ? actions.MODE_ROSTER : state;

        default:
            return state
    }
};

const filtersReducer = (state = {}, action) => {
    switch (action.type) {
        case actions.TOGGLE_FILTER:
            const values = state[action.key] || [];
            const newValues = values.includes(action.value)
                ? values.filter(v => v != action.value)
                : values.concat([action.value]);

            return {...state, [action.key]: newValues};

        default:
            return state;
    }
};

const spellSchoolReducer = (state = [], action) => {
    switch (action.type) {
        case actions.RECEIVE_DATA:
            return action.data.spell_schools
                ? [...action.data.spell_schools]
                : state;

        default:
            return state;
    }
};

const eventsReducer = (state = [], action) => {
    switch (action.type) {
        case actions.RECEIVE_DATA:
            return action.data.events
                ? [...action.data.events]
                : state;

        default:
            return state;
    }
};

const rostersReducer = (state = [], action) => {
    switch (action.type) {
        case actions.RECEIVE_DATA:
            return action.data.rosters
                ? [...action.data.rosters]
                : state;

        case actions.ROSTER_ADDED:
            return action.roster
                ? [...state, action.roster]
                : state;

        default:
            return state;
    }
};

const currentRosterReducer = (state = null, action) => {
    switch (action.type) {
        case actions.ROSTER_ADDED:
            return action.roster
                ? action.roster._id
                : state;

        case actions.MODE_ROSTER:
            return action.roster.roster_id || state;

        default:
            return state
    }
};

const userReducer = (state = {}, action) => {
    switch (action.type) {
        case actions.RECEIVE_DATA:
            return action.data.user
                ? {...action.data.user}
                : state;

        default:
            return state;
    }
};

const reducer = (state = {}, action) => ({
    mode:           modeReducer(state.mode, action),
    filters:        filtersReducer(state.filters, action),
    spell_schools:  spellSchoolReducer(state.spell_schools, action),
    events:         eventsReducer(state.events, action),
    rosters:        rostersReducer(state.roster, action),
    current_roster_id: currentRosterReducer(state.current_roster_id, action),
    user:           userReducer(state.user, action),
});

export const store = createStore(
    reducer,
    applyMiddleware(epicMiddleware)
);
