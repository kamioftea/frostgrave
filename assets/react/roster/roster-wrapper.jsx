import React from "react";
//noinspection ES6UnusedImports
import ReactDOM from "react-dom";

import {connect} from "react-redux";
import {actions} from "./actions.jsx";
import {Sidebar} from "./sidebar.jsx"

export const RosterWrapper =
    connect(
        ({mode}) => ({mode}),
        null
    )(
        ({mode}) => (
            <div className="main-container row expanded">
                <div className="main medium-order-2 small-12 medium-8 large-9 columns">
                    {{
                        [actions.MODE_ROSTER_LIST]: 'Roster List',
                        [actions.MODE_ROSTER]:      'Roster',
                        [actions.MODE_ACCOUNT]:     'Account'
                    }[mode]}
                </div>
                <div className="sidebar-menu medium-order-1 small-12 medium-4 large-3 columns">
                    <Sidebar />
                </div>
            </div>
        )
    );