import {createStore, applyMiddleware} from "redux";
import {actions} from "./actions.jsx";
import {epicMiddleware} from "./epics.jsx";

const modeReducer = (state = actions.MODE_ROSTER_LIST, action) => {
    switch (action.type) {
        case actions.MODE_ROSTER_LIST:
        case actions.MODE_ROSTER:
        case actions.MODE_ACCOUNT:
            return action.type;

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
            if(action.data.spell_schools) {
                return [...action.data.spell_schools]
            }
            return state;

        default:
            return state;
    }
};

const eventsReducer = (state = [], action) => {
    switch (action.type) {
        case actions.RECEIVE_DATA:
            if(action.data.events) {
                return [...action.data.events]
            }
            return state;

        default:
            return state;
    }
};

const userReducer = (state = {}, action) => {
    switch (action.type) {
        case actions.RECEIVE_DATA:
            if(action.data.user) {
                return {...action.data.user}
            }
            return state;

        default:
            return state;
    }
};

const reducer = (state = {}, action) => ({
    mode:          modeReducer(state.mode, action),
    filters:       filtersReducer(state.filters, action),
    spell_schools: spellSchoolReducer(state.spell_schools, action),
    events:        eventsReducer(state.events, action),
    user:          userReducer(state.user, action),
});

export const store = createStore(
    reducer,
    applyMiddleware(epicMiddleware)
);
