import React from "react";
//noinspection ES6UnusedImports
import ReactDOM from "react-dom";
import {connect} from "react-redux";
import {preventDefault} from '../preventDefault.jsx';
import {toggleFilter, setModeAccount, setModeRosterList} from './actions.jsx';

const FilterGroup = React.createClass({
    getInitialState: () => ({
        expanded: false,
    }),
    render(){
        const {label, items} = this.props;
        const {expanded} = this.state;

        return (
            <li aria-label={label} aria-expanded={expanded} aria-haspopup="true" className="is-accordion-submenu-parent" role="tab">
                <a tabIndex="-1" href="#" onClick={preventDefault(() => this.setState(({expanded}) => ({expanded: !expanded})))}>{label}</a>
                <ul aria-label={label} style={{display: expanded ? 'block' : 'none'}} role="tabpanel" aria-hidden={!expanded} className="menu vertical nested submenu is-accordion-submenu">
                    {items}
                </ul>
            </li>
        )
    }
});

const Filter = ({label, selected, onClick}) => {
    const classes = ['is-submenu-item', 'is-accordion-submenu-item']
            .concat(selected ? ['active'] : [])
            .join(' ');

    return <li className={classes} role="menuitem">
        <a href="#" onClick={preventDefault(onClick)}>{label}</a>
    </li>
};

export const Sidebar =
    connect(
        ({filters, events, spell_schools, user}) => ({filters, events, spell_schools, user}),
        {toggleFilter, setModeRosterList, setModeAccount}
    )(
        ({
            filters, events, spell_schools, user,
            toggleFilter, setModeRosterList, setModeAccount
        }) => {

            const toggleAndSetMode = (key, value) => {
                setModeRosterList();
                toggleFilter(key, value)
            };

            const eventFilterProps = {
                items: events.map(event => {
                    const props = {
                        key: event._id,
                        label: event.name,
                        selected: (filters.event_id || []).includes(event._id),
                        onClick: () => toggleAndSetMode('event_id', event._id)
                    };
                    return <Filter {...props} />
                }),
                label: 'Events'
            };
            const eventFilters = events
                ? <FilterGroup {...eventFilterProps} />
                : null;

            const spellSchoolFilterProps = {
                items: spell_schools.map(spellSchool => {
                    const props = {
                        key: spellSchool._id,
                        label: spellSchool.name,
                        selected: (filters['wizard.spell_school_id'] || []).includes(spellSchool._id),
                        onClick: () => toggleAndSetMode('wizard.spell_school_id', spellSchool._id)
                    };
                    return <Filter {...props} />
                }),
                label: 'Wizard'
            };
            const spellSchoolFilters = spell_schools
                ? <FilterGroup {...spellSchoolFilterProps} />
                : null;

            const userFilter = user
                ? <Filter label="My Rosters"
                        selected={(filters.user_id || []).includes(user._id)}
                        onClick={() => toggleAndSetMode('user_id', user._id)} />
                : null;

            const adminLink = (user.roles || []).includes('Admin')
                ? <a href="/admin" className="button alert hollow expanded">
                    <i className="fa fa-cogs" /> Admin
                  </a>
                : null;

            return (
                <div>
                    <div className="text-center" onClick={preventDefault(setModeRosterList)} style={{cursor: 'pointer'}}>
                        <img src="/images/frostgrave-banner.png" alt="Frostgrave"/>
                        <h5>Frostgrave Roster Management</h5>
                    </div>
                    <ul aria-multiselectable="true" role="tablist" className="vertical menu">
                        {eventFilters}
                        {spellSchoolFilters}
                        {userFilter}
                    </ul>
                    <br />
                    <p>
                        <a href="#"
                           className="button primary hollow expanded"
                           onClick={preventDefault(setModeAccount)}>
                            <i className="fa fa-user" /> My Account
                        </a>
                    </p>
                    <p>
                        {adminLink}
                    </p>
                </div>
            )
        }
    );
