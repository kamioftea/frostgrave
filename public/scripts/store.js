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

const reducer = (state, action) => ({
    mode: modeReducer(state.mode, action)
})


