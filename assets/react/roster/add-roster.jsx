import React from "react";
//noinspection ES6UnusedImports
import ReactDOM from "react-dom";
import {connect} from "react-redux";
import {preventDefault} from '../preventDefault.jsx';
import {addRoster} from './actions.jsx';

const LabelledRow = ({label, htmlFor, children}) => (
    <div className="row">
        <div className="small-4 columns">
            <label htmlFor={htmlFor} className="text-right middle">
                {label}:
            </label>
        </div>
        <div className="small-8 columns text-right">
            {children}
        </div>
    </div>
);

export const AddRoster =
    connect(
        ({spell_schools, events}) => ({spell_schools, events}),
        {addRoster}
    )(React.createClass({
        getInitialState: () => ({
            name:            '',
            spell_school_id: '',
            event_id:        '',
        }),
        render() {
            const {
                spell_schools, events,
                addRoster
            } = this.props;

            const {name, spell_school_id, event_id} = this.state;

            const enabledProps = name && spell_school_id && event_id
                ? { disabled: false, type: 'submit'}
                : {};

            const submitButtonProps = {
                disabled: true,
                type: 'button',
                className: ['button', 'primary'].join(' '),
                ...enabledProps
            };

            const submitButton = <div className="text-right">
                <button {...submitButtonProps}>
                    <i className="fa fa-plus" />
                    {' '}
                    Add Roster
                </button>
            </div>;

            return <form onSubmit={preventDefault(() => addRoster(name, spell_school_id, event_id))}>
                <h1 className="text-primary">Add a New Roster</h1>
                <div className="callout">
                    <LabelledRow label="Name"
                                 htmlFor="name-input">
                        <input type="text"
                               id="name-input"
                               value={name}
                               onChange={e => this.setState({name: e.currentTarget.value})}/>
                    </LabelledRow>
                    <LabelledRow label="Wizard's School"
                                 htmlFor="spell-school-input">
                        <select
                               id="spell-school-input"
                               value={spell_school_id}
                               onChange={e => this.setState({spell_school_id: e.currentTarget.value})}>
                                <option>Please Choose a Spell School</option>
                            {spell_schools.map(spell_school => (
                                <option key={spell_school._id} value={spell_school._id}>{spell_school.name}</option>
                            ))}
                        </select>
                    </LabelledRow>
                    <LabelledRow label="Event"
                                 htmlFor="event-input">
                        <select
                               id="event-input"
                               value={event_id}
                               onChange={e => this.setState({event_id: e.currentTarget.value})}>
                                <option>Please Choose an Event</option>
                            {events.map(event => (
                                <option key={event._id} value={event._id}>{event.name}</option>
                            ))}
                        </select>
                    </LabelledRow>
                    {submitButton}
                </div>
            </form>;
        }
    }));

/**
 <ul class="small-block-grid-2 medium-block-grid-4 large-block-grid-6">
 {{#each filteredRosters key=id}}
 <li>
 <a href="/roster/{{ id }}" onClick="setModeRoster" data-roster-id="{{ id }}">
 <img class="img-responsive" src="{{ wizard.imgUrl }}" alt="" />
 <h2>{{ name }}</h2>
 </a>
 </li>
 {{/each}}
 </ul>*/