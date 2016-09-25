require('es6-promise').polyfill();
require('isomorphic-fetch');

import React from "react";
import ReactDOM from "react-dom";
import {Provider} from "react-redux";
import {RosterWrapper} from "./roster-wrapper.jsx";
import {store} from "./store.jsx"
import {requestData} from "./actions.jsx"

/*
 * - ~Setup redux~
 * - ~Fetch data~
 * - render sidebar
 * - add roster flow
 * - render roster list
 * - view roster
 * - upload images
 * - add/remove apprentice
 * - add/remove soldiers
 * - account management
 * - pdf download
 */

ReactDOM.render(
    <Provider store={store}>
        <RosterWrapper />
    </Provider>,
    document.getElementById('roster-container')
);

store.dispatch(requestData());