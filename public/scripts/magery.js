import { actions } from './actions.js'

export const mapState = state => ({
    modeHandler: getModeHandler(state.mode)
})

function getModeHandler(mode) {
    switch (mode) {
        case actions.MODE_ROSTER_LIST: return 'rosterList';
        case actions.MODE_ROSTER:      return 'roster';
        case actions.MODE_ACCOUNT:     return 'account';
    }
}