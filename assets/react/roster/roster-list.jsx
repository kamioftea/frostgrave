import React from "react";
//noinspection ES6UnusedImports
import ReactDOM from "react-dom";
import {connect} from "react-redux";
import {preventDefault} from '../preventDefault.jsx';
import {forAll} from '../iterators.jsx';
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
            function applyFilter(key = null, values = [], roster = {}) {

                const recursiveLookup = (value, path) => {
                    if (path.length == 0) return value;
                    else if (typeof value != 'object') return undefined;
                    else {
                        const [head, ...tail] = path
                        return recursiveLookup(value[head], tail)
                    }
                };

                const testValue = recursiveLookup(roster, key.split('.'));

                return [...values].includes(testValue)
            }

            const filteredRosterList = rosters.filter(roster => forAll((key, values) => applyFilter(key, values, roster))(filters));

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
                        {filteredRosterList.map(roster => (
                            <li key={roster._id}>
                                <a href="#"
                                   className="button secondary hollow"
                                   onClick={preventDefault(() => setModeRoster(roster._id))}>
                                    {roster.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        }
    );
