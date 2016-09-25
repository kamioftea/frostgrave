import React from "react";
//noinspection ES6UnusedImports
import ReactDOM from "react-dom";
import {connect} from "react-redux";
import {preventDefault} from '../preventDefault.jsx';
import {setModeRoster, setModeAddRoster} from './actions.jsx';

export const RosterList =
    connect(
        ({filters, rosters = []}) => ({filters, rosters}),
        {setModeRoster, setModeAddRoster}
    )(
        ({
            filters, rosters,
            setModeRoster, setModeAddRoster
        }) => {

            return <div className="row">
                <div className="small-12 columns">
                    <div className="pull-right">
                        <a href="#"
                           className="button primary hollow"
                           onClick={preventDefault(setModeAddRoster)}>
                            <i className="fa fa-plus" />
                            {' '}
                            New Roster
                        </a>
                    </div>
                    <ul>
                        {rosters.map(roster => <li key={roster._id}>{roster.name}</li>)}
                    </ul>
                </div>
            </div>
        }
    );
