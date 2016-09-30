import {createStore, applyMiddleware} from "redux";
import {actions} from "./actions.jsx";
import {epicMiddleware} from "./epics.jsx";

const without = (obj, key) => {
    //noinspection UnnecessaryLocalVariableJS
    const {[key]: _, ...rest} = obj;
    return rest;
};

const modeReducer = (state = actions.MODE_ROSTER_LIST, action, prev_roster_id = null) => {
    switch (action.type) {
        case actions.MODE_ROSTER_LIST:
        case actions.MODE_ROSTER:
        case actions.MODE_ADD_ROSTER:
        case actions.MODE_ACCOUNT:
            return action.type;

        case actions.ROSTER_ADDED:
            return action.roster ? actions.MODE_ROSTER : state;

        case actions.ROSTER_REMOVED:
            return state === actions.MODE_ROSTER && prev_roster_id == action.roster_id
                ? actions.MODE_ROSTER_LIST
                : state;

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

            return newValues.length > 0
                ? {...state, [action.key]: newValues}
                : without(state, action.key);

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

const sortByName = arr => arr.sort((a, b) => a.name.localeCompare(b.name));

const rostersReducer = (state = [], action) => {
    switch (action.type) {
        case actions.RECEIVE_DATA:
            return action.data.rosters
                ? sortByName([...action.data.rosters])
                : state;

        case actions.ROSTER_ADDED:
            return action.roster
                ? sortByName([...state, action.roster])
                : state;

        case actions.ROSTER_UPDATED:
            return action.roster
                ? sortByName(
                [
                    ...(state.filter(_ => _._id != action.roster._id)),
                    action.roster
                ])
                : state;

        case actions.ROSTER_REMOVED:
            return state.filter(_ => _._id != action.roster_id);

        default:
            return state;
    }
};

const soldiersReducer = (state = [], action) => {
    switch (action.type) {
        case actions.RECEIVE_DATA:
            return action.data.soldiers
                ? [...action.data.soldiers]
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
            return action.roster_id || state;

        case actions.ROSTER_REMOVED:
            return action.roster_id == state ? null : state;

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

const userMapReducer = (state = {}, action) => {
    switch (action.type) {
        case actions.RECEIVE_DATA:
            return action.data.user_map
                ? {...action.data.user_map}
                : state;

        default:
            return state;
    }
};

const reducer = (state = {}, action) => ({
    mode:              modeReducer(state.mode, action, state.current_roster_id),
    filters:           filtersReducer(state.filters, action),
    spell_schools:     spellSchoolReducer(state.spell_schools, action),
    events:            eventsReducer(state.events, action),
    rosters:           rostersReducer(state.rosters, action),
    soldiers:          soldiersReducer(state.soldiers, action),
    current_roster_id: currentRosterReducer(state.current_roster_id, action),
    user:              userReducer(state.user, action),
    user_map:          userMapReducer(state.user_map, action),
});

export const store = createStore(
    reducer,
    applyMiddleware(epicMiddleware)
);
