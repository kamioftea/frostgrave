import React from "react";
//noinspection ES6UnusedImports
import ReactDOM from "react-dom";
import {connect} from "react-redux";
import {preventDefault} from '../preventDefault.jsx';
import {objectEntries} from '../iterators.jsx';
import {ClickToEdit} from '../click-to-edit.jsx';
import {ImageUpload} from '../image-upload.jsx';
import {
    setModeRosterList, updateRoster, addItem, removeItem, uploadFile,
    addApprentice, removeApprentice,addSoldier, removeSoldier, removeRoster,
    addSpell, removeSpell
} from './actions.jsx';

const modifier = (value) => parseInt(value) < 0 ? parseInt(value) : '+' + parseInt(value);

const SplitStat = ({base, current, useModifier = false}) => parseInt(base) === parseInt(current)
    ? ( <span>{useModifier ? modifier(base) : base}</span> )
    : ( <span>{useModifier ? modifier(base) : base} / {useModifier ? modifier(current) : current}</span> );


const StatBlock = ({move, fight, shoot, armour, will, health, bonuses}) => (
    <table>
        <thead>
            <tr>
                <th>M</th>
                <th>F</th>
                <th>S</th>
                <th>A</th>
                <th>W</th>
                <th>H</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><SplitStat base={move} current={parseInt(move) + (bonuses.move || 0)} /></td>
                <td><SplitStat base={fight} current={parseInt(fight) + (bonuses.fight || 0)} useModifier={true} /></td>
                <td><SplitStat base={shoot} current={parseInt(shoot) + (bonuses.shoot || 0)} useModifier={true} /></td>
                <td><SplitStat base={armour} current={parseInt(armour) + (bonuses.armour || 0)} /></td>
                <td><SplitStat base={will} current={parseInt(will) + (bonuses.will || 0)} useModifier={true} /></td>
                <td><SplitStat base={health} current={parseInt(health) + (bonuses.health || 0)} /></td>
            </tr>
        </tbody>
    </table>
);

const ItemRow = ({item: {name, cost}, onRemove}) => (
    <div className="row">
        <div className="small-8 columns align-middle">
            {name}
        </div>
        <div className="small-2 columns text-right align-middle">
            {cost ? cost + 'gp' : null}
        </div>
        <div className="small-2 columns text-right align-middle">
            {cost ? (
            <a href="#"
               className="button small alert hollow"
               onClick={preventDefault(() => onRemove())}>
                <i className="fa fa-minus"/>
            </a> )
                : null}
        </div>
    </div>
);

const Miniature = ({
    roster_id, target, name, label, image_url, stat_block, items = [], notes, editable,
    availableItems, updateRoster, addItem, removeItem, uploadFile, remove
}) => {
    // merge each item's bonus into the stat line
    const stat_bonuses = items.reduce(
        (acc, {bonus}) =>
            [...objectEntries(bonus || {})].reduce(
                (acc, [key, value]) => ({...acc, [key]: parseInt(acc[key] || 0) + parseInt(value || 0) }),
                acc
            ),
        {}
    );

    const itemSelect = editable && availableItems.length > 0
        ? (
            <select value={''} onChange={preventDefault((event) => addItem(roster_id, target, JSON.parse(event.currentTarget.value)))}>
                <option value=''>Add an item...</option>
                {availableItems.map(
                    item => (
                        <option key={item.name}
                                value={JSON.stringify(item)}>
                            {item.name} - {item.cost}gp
                        </option>
                    ))}
            </select>)
        : null;

    const removeRow = typeof remove === 'function' && editable
        ? (
            <div className="text-right">
                <a href="#"
                   className="button primary hollow"
                   onClick={preventDefault(() => remove())}>
                    <i className="fa fa-trash"/>
                </a>
            </div>)
        : null;

    return <div className="callout miniature-container">
            <div className="row">
                <div className="small-12 medium-4 columns align-middle">
                    <ImageUpload image_url={image_url || 'https://placehold.it/300x400'}
                                 onDrop={file => uploadFile(file, {roster_id, target})}
                                 title={name + ' - ' + label}/>
                </div>
                <div className="small-12 medium-8 columns">
                    <div className="row miniature-container">
                        <div className="small-12 large-6 columns align-middle">
                            <ClickToEdit editable={editable}
                                         value={name}
                                         onSubmit={value => updateRoster(roster_id, target + '.name', value)}>
                                <h4>
                                    <small className="text-secondary">{name}</small>
                                </h4>
                            </ClickToEdit>
                        </div>
                        <div className="small-12 large-6 columns align-middle large-text-right">
                            <h4>{label}</h4>
                        </div>
                    </div>
                    <StatBlock {...stat_block}
                               bonuses={stat_bonuses}
                    />
                    {(items || []).map((item, i) => (
                        <ItemRow key={i}
                                 item={item}
                                 editable={editable}
                                 onRemove={() => removeItem(roster_id, target, i)} />
                    ))}
                    {itemSelect}
                    <h4>Notes</h4>
                    <ClickToEdit editable={editable}
                                 value={notes || ''}
                                 onSubmit={value => updateRoster(roster_id, target + '.notes', value)}/>
                    {removeRow}
                </div>
            </div>
        </div>;
};

const SpellPicker = React.createClass({
    getInitialState: () => ({
        current_school_id: null
    }),
    render() {
        const {label, spell_schools = [], max_spells = 0, max_per_school = 0, chosen_spells = [], onAddSpell, onRemoveSpell, modifier = 0} = this.props;
        const {current_school_id} = this.state;
        const current_school = spell_schools.filter(({_id}) => current_school_id === null || _id == current_school_id)[0] || {};
        const school_chooser = spell_schools.length > 1
            ? (
                <div className="row">
                    {spell_schools.map(school => {
                        const button_class = ['button', 'expanded']
                            .concat(school._id == current_school._id
                                ? ['primary']
                                : ['secondary', 'hollow']
                            )
                            .join(' ');

                        return <div className="small-4 large-2 columns" key={school._id}>
                            <a href="#"
                               className={button_class}
                               onClick={preventDefault(() => this.setState({current_school_id: school._id}))}>
                                {school.name}
                            </a>
                        </div>
                    })}
                </div> )
            : null;

        return <div className="spell-chooser callout">
            <div className="row align-middle">
                <div className="small-6 columns">
                    <h3>
                        {label}
                    </h3>
                </div>
                <div className="small-6 columns text-right">
                    {max_per_school < max_spells ? <span className="text-secondary">{max_per_school} per school, </span> : ''}
                    {chosen_spells.length} / {max_spells}
                </div>
            </div>
            {school_chooser}
            <div className="row">
                {[...objectEntries(current_school.spells || {})].map(([spell_id, spell]) => {
                    const spell_chosen = chosen_spells.map(_ => _.spell_id).includes(spell_id);
                    const className = ['callout', 'spell', 'clickable', ...[spell_chosen ? 'primary' : 'secondary']].join(' ');
                    return (
                        <div key={spell_id}
                             className="small-12 medium-6 large-3 columns">
                            <div className={className}
                                 onClick={preventDefault(() => spell_chosen ? onRemoveSpell(spell_id) : onAddSpell(current_school._id, spell_id))}>
                            <p className="lead text-center">{spell.name}</p>
                                <p className="text-center">{(Array.isArray(spell.types) ? spell.types : [spell.types]).join(' OR ')}</p>
                                <p><small>{spell.description}</small></p>
                                <div className="base-row">
                                    <strong>{parseInt(spell.base_cost) + parseInt(modifier)}</strong>
                                    <strong>{parseInt(spell.base_cost) + parseInt(modifier) + 2}</strong>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    }
});

export const Roster =
    connect(
        ({current_roster_id, rosters, spell_schools, events, soldiers, user_map, user: {_id: user_id}}) =>
            ({current_roster_id, rosters, spell_schools, events, soldiers, user_map, user_id}),
        {
            setModeRosterList, updateRoster, removeRoster, addItem, removeItem, uploadFile, addApprentice,
            removeApprentice, addSoldier, removeSoldier, addSpell, removeSpell
        }
    )(
        ({
            current_roster_id, rosters, spell_schools, events, soldiers, user_map, user_id,
            setModeRosterList, updateRoster, removeRoster, addItem, removeItem, uploadFile,
            addApprentice, removeApprentice, addSoldier, removeSoldier, addSpell, removeSpell
        }) => {
            const current_roster = rosters.filter(_ => _._id === current_roster_id)[0] || {};
            const spell_school = spell_schools.filter(_ => _._id === current_roster.wizard.spell_school_id)[0];
            const event = events.filter(_ => _._id === current_roster.event_id)[0];
            const editable = current_roster.user_id === user_id;

            const wizard_items = [
                {name: 'Hand weapon', cost: 0},
                {name: 'Staff (Damage dealt and received -1)', cost: 0},
                {name: 'Dagger (Fight +1)', bonus: {fight: 1}, cost: 5},
                {name: 'Two Handed Weapon (Damage +2)', cost: 5},
                {name: 'Bow', cost: 5},
                {name: 'Crossbow (Damage +2, Reload)', cost: 5}
            ];

            const filterItems = (currentItems = [], itemList = []) => {
                const filters = [
                    (list) => {
                        const uniqueCosts = new Set(currentItems.map(item => item.cost));
                        return list.filter(item => !uniqueCosts.has(item.cost))
                    },
                    (list) => {
                        const staffTest = (({name}) => /^Staff/.test(name));
                        const daggerTest = (({name}) => /^Dagger/.test(name));
                        const hasStaff = currentItems.filter(staffTest).length > 0;
                        const hasDagger = currentItems.filter(daggerTest).length > 0;
                        return list.filter(item => (!hasStaff || !daggerTest(item)) && (!hasDagger || !staffTest(item)))
                    }
                ];

                return filters.reduce((list, filter) => filter(list), itemList);
            };

            const applyStatModifiers = (stat_block, modifiers) =>
                [...objectEntries(stat_block)].reduce((acc, [key, value]) => ({...acc, [key]: parseInt(value) + parseInt(modifiers[key] || 0)}), {});

            const apprenticeElement = current_roster.apprentice
                ? <Miniature roster_id={current_roster_id}
                             target="apprentice"
                             {...current_roster.apprentice}
                             stat_block={applyStatModifiers(current_roster.wizard.stat_block, current_roster.apprentice.stat_modifiers)}
                             label="Apprentice"
                             editable={editable}
                             availableItems={filterItems(current_roster.apprentice.items, wizard_items)}
                             updateRoster={updateRoster}
                             addItem={addItem}
                             removeItem={removeItem}
                             uploadFile={uploadFile}
                             remove={() => removeApprentice(current_roster_id)}/>
                : (editable && event && event.apprentice_allowed && current_roster.model_limit > 0
                    ? (
                        <a href="#"
                         className="button primary hollow"
                         onClick={preventDefault(() => addApprentice(current_roster_id))}>
                            <i className="fa fa-plus"/>
                            {' '}
                            Add Apprentice (200gc)
                        </a> )

                    : null );
            const soldierElements = (current_roster.soldiers || []).map((soldier, index) => {

                const baseSoldier = soldiers.filter(_ => _._id == soldier.miniature_id)[0];
                if(!baseSoldier)
                {
                    return null;
                }

                return <Miniature key={index}
                                  roster_id={current_roster_id}
                                  target={'soldiers.' + index}
                                  {...soldier}
                                  stat_block={baseSoldier.stat_block}
                                  label={baseSoldier.name}
                                  editable={editable}
                                  availableItems={[]}
                                  updateRoster={updateRoster}
                                  addItem={addItem}
                                  removeItem={removeItem}
                                  uploadFile={uploadFile}
                                  remove={() => removeSoldier(current_roster_id, index)}/>
            });

            const addSoldierElement = editable && current_roster.model_limit > 0 && current_roster.treasury > 0
                ? (
                    <select value={''} onChange={preventDefault((e) => addSoldier(current_roster_id, e.currentTarget.value))}>
                        <option value={''} >Select a soldier to add...</option>
                        {soldiers.map(soldier =>
                            <option key={soldier._id}
                                    value={soldier._id}
                                    >
                                {soldier.name} - {soldier.cost}gp
                            </option>
                        )}
                    </select> )
                : null;

            const {allied, neutral} = spell_schools.reduce((acc, curr_school)=> {
                if((spell_school.allied_schools || []).includes(curr_school._id)) {
                    return {...acc, allied: [...(acc.allied || []), curr_school]}
                }
                if(![spell_school._id, spell_school.opposed_school].includes(curr_school._id)) {
                    return {...acc, neutral: [...(acc.neutral || []), curr_school]}
                }

                return acc;
            }, {});

            const native_spell_chooser =
                <SpellPicker
                    label={spell_school.name}
                    spell_schools={[spell_school]}
                    max_spells={event.native_spells}
                    max_per_school={event.native_spells}
                    onAddSpell={(spell_school_id, spell_id) => addSpell(current_roster_id, spell_school_id, spell_id)}
                    onRemoveSpell={spell_id => removeSpell(current_roster_id, spell_id)}
                    chosen_spells={
                        (current_roster.spells || [])
                            .filter(({spell_school_id}) => spell_school_id == spell_school._id)
                    }/>;

            const allied_spell_chooser =
                <SpellPicker
                    label='Allied'
                    spell_schools={allied || []}
                    max_spells={event.allied_spells}
                    max_per_school="1"
                    modifier="2"
                    onAddSpell={(spell_school_id, spell_id) => addSpell(current_roster_id, spell_school_id, spell_id)}
                    onRemoveSpell={spell_id => removeSpell(current_roster_id, spell_id)}
                    chosen_spells={
                        (current_roster.spells || [])
                            .filter(({spell_school_id}) => (allied || []).map(_ => _._id).includes(spell_school_id))
                    }/>;

            const neutral_spell_chooser =
                <SpellPicker
                    label='Neutral'
                    spell_schools={neutral || []}
                    max_spells={event.neutral_spells}
                    max_per_school="1"
                    modifier="4"
                    onAddSpell={(spell_school_id, spell_id) => addSpell(current_roster_id, spell_school_id, spell_id)}
                    onRemoveSpell={spell_id => removeSpell(current_roster_id, spell_id)}
                    chosen_spells={
                        (current_roster.spells || [])
                            .filter(({spell_school_id}) => (neutral || []).map(_ => _._id).includes(spell_school_id))
                    }/>;

            return <div>
                <div className="row">
                    <div className="small-10 columns">
                        <ClickToEdit editable={editable}
                                     value={current_roster.name}
                                     onSubmit={value => updateRoster(current_roster._id, 'name', value)}>
                            <h1>{current_roster.name}</h1>
                        </ClickToEdit>
                    </div>
                    <div className="small-2 columns text-right">
                        <a href="#"
                           onClick={preventDefault(setModeRosterList)}>
                            <i className="fa fa-times fa-3x text-secondary"/>
                        </a>
                    </div>
                </div>
                <div className="row">
                    <div className="small-12 large-3 columns large-order-2">
                        <p><strong>User: </strong> {user_map[current_roster.user_id] || '???'}</p>
                        <p><strong>Event: </strong> {event.name || 'N/A'}</p>
                        <p><strong>Treasury: </strong> {current_roster.treasury || 0}gp</p>
                        <p><strong>Space: </strong> {current_roster.model_limit || 0}</p>
                        <p>
                            <a href={'/pdf/roster/' + current_roster_id} className="button alert expanded hollow" >
                                <i className="fa fa-file-pdf-o" />
                                {' '}
                                Download PDF
                            </a>
                        </p>
                    </div>
                    <div className="small-12 large-9 columns large-order-1">
                        <Miniature roster_id={current_roster_id}
                                   target="wizard"
                                   {...current_roster.wizard}
                                   label={spell_school.name}
                                   editable="editable"
                                   availableItems={filterItems(current_roster.wizard.items, wizard_items)}
                                   updateRoster={updateRoster}
                                   addItem={addItem}
                                   removeItem={removeItem}
                                   uploadFile={uploadFile}/>
                        {apprenticeElement}
                        {soldierElements}
                        {addSoldierElement}

                        {native_spell_chooser}
                        {allied_spell_chooser}
                        {neutral_spell_chooser}
                    </div>
                </div>
            </div>;
        }
    );