import React from "react";
//noinspection ES6UnusedImports
import ReactDOM from "react-dom";
import {connect} from "react-redux";
import {preventDefault} from '../preventDefault.jsx';
import {forAll} from '../iterators.jsx';
import {setModeRoster, setModeAddRoster} from './actions.jsx';

export const RosterList =
    connect(
        ({filters, rosters = [], user_map}) => ({filters, rosters, user_map}),
        {setModeRoster, setModeAddRoster}
    )(
        ({
            filters, rosters, user_map,
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

            return (
                <div>
                    <div className="row">
                        <div className="small-9 columns">
                            <h1>Roster List</h1>
                        </div>
                        <div className="small-3 columns text-right">
                            <a href="#"
                               className="button primary hollow"
                               onClick={preventDefault(setModeAddRoster)}>
                                <i className="fa fa-plus" />
                                {' '}
                                New Roster
                            </a>
                        </div>
                    </div>
                    <div className="align-middle wrapper-container">
                        <div className="row">
                            {filteredRosterList.map(roster => (
                                <div key={roster._id}
                                     className="small-12 medium-4 large-3 columns spaced">
                                    <a href="#"
                                       className="wrapper-container"
                                       onClick={preventDefault(() => setModeRoster(roster._id))}>
                                        <div className="callout text-center wrapper-container">
                                            <img src={roster.wizard.image_url || 'https://placehold.it/300x400?text=' + roster.wizard.name}/>
                                            <h3>{roster.name}</h3>
                                            <h4><small>{user_map[roster.user_id] || '???'}</small></h4>
                                        </div>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }
    );
