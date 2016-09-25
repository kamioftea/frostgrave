import React from "react";
//noinspection ES6UnusedImports
import ReactDOM from "react-dom";
import {connect} from "react-redux";
import {preventDefault} from '../preventDefault.jsx';
import {} from './actions.jsx';

export const Roster =
    connect(
        ({current_roster_id, rosters = []}) => ({current_roster_id, rosters}),
        {}
    )(
        ({current_roster_id, rosters}) => {
            const current_roster = rosters.filter(_ => _._id === current_roster_id)[0] || {};

            return <h1>{current_roster.name}</h1>;
        }
    );