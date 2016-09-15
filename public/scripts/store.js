import { actions } from './actions.js'

const modeReducer = (state = actions.MODE_ROSTER_LIST, action) => {
    switch(action.type) {
        case actions.MODE_ROSTER_LIST:
        case actions.MODE_ROSTER:
        case actions.MODE_ACCOUNT:
            return action.type
        
        default: 
            return state
    }
}

const filtersReducer = (state = {}, action) => {
    switch(action.type) {
        case: actions.TOGGLE_FILTER:
            const values = state[key] || [];
            const newValues = values.includes(value))
                ? values.filter(v => v != value)
                : values.concat([value])
                
            return {...state, [key]: newValues}
            
        default:
            return state
    }
}

const reducer = (state, action) => ({
    mode: modeReducer(state.mode, action),
    filters: filtersReducer(state.filters, action) 
})


