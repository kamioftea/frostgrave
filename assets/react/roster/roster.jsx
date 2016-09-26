import React from "react";
//noinspection ES6UnusedImports
import ReactDOM from "react-dom";
import {connect} from "react-redux";
import {preventDefault} from '../preventDefault.jsx';
import {objectEntries} from '../iterators.jsx';
import {ClickToEdit} from '../click-to-edit.jsx';
import {ImageUpload} from '../image-upload.jsx';
import {setModeRosterList, updateRoster, addItem, removeItem, uploadFile, addApprentice, removeApprentice,addSoldier, removeSoldier, removeRoster} from './actions.jsx';

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
            <select value={''}>
                <option value=''>Add an item...</option>
                {availableItems.map(
                    item => <option key={item.name}
                                    value={item.name}
                                    onClick={preventDefault(() => addItem(roster_id, target, item))}>{item.name} - {item.cost}gp</option>)}
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
                <div className="small-4 columns align-middle">
                    <ImageUpload image_url={image_url || 'https://placehold.it/200x300'}
                                 onDrop={file => uploadFile(file, {roster_id, target})}
                                 title={name + ' - ' + label}/>
                </div>
                <div className="expand columns">
                    <div className="row miniature-container">
                        <div className="small-12 large-6 columns align-middle">
                            <ClickToEdit editable={editable}
                                         value={name}
                                         onSubmit={value => updateRoster(roster_id, target + '.name', value)}>
                                <h2>
                                    <small className="text-secondary">{name}</small>
                                </h2>
                            </ClickToEdit>
                        </div>
                        <div className="small-12 large-6 columns align-middle large-text-right">
                            <h2>{label}</h2>
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

export const Roster =
    connect(
        ({current_roster_id, rosters, spell_schools, events, soldiers, user_map, user: {_id: user_id}}) => ({current_roster_id, rosters, spell_schools, events, soldiers, user_map, user_id}),
        {setModeRosterList, updateRoster, removeRoster, addItem, removeItem, uploadFile, addApprentice, removeApprentice, addSoldier, removeSoldier}
    )(
        ({
            current_roster_id, rosters, spell_schools, events, soldiers, user_map, user_id,
            setModeRosterList, updateRoster, removeRoster, addItem, removeItem, uploadFile, addApprentice, removeApprentice, addSoldier, removeSoldier
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
                    <select value={''}>
                        <option value={''}>Select a soldier to add...</option>
                        {soldiers.map(soldier =>
                            <option key={soldier._id}
                                    value={soldier._id}
                                    onClick={preventDefault((e) => addSoldier(current_roster_id, e.currentTarget.value))}>
                                {soldier.name} - {soldier.cost}gp
                            </option>
                        )}
                    </select> )
                : null;

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
                        <p><strong>Treasury: </strong> {current_roster.treasury || 0}gp</p>
                        <p><strong>Space: </strong> {current_roster.model_limit || 0}</p>
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
                    </div>
                </div>
            </div>;
        }
    );