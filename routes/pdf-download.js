const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const {authenticated} = require('../authenticateRequest');
const {db$} = require('../db-conn');
const {ObjectId} = require('mongodb');
const Rx = require('rxjs');
const {objectEntries} = require("../iterators");
const PdfPrinter = require('pdfmake/src/printer');

require('../rxUtil/validate')(Rx.Observable);

const fonts = {
    Roboto:        {
        normal:      './public/fonts/Roboto-normal-400.ttf',
        bold:        './public/fonts/Roboto-normal-700.ttf',
        italics:     './public/fonts/Roboto-italic-400.ttf',
        bolditalics: './public/fonts/Roboto-italic-700.ttf'
    },
    Lato:          {
        normal:      './public/fonts/Lato-normal-400.ttf',
        bold:        './public/fonts/Lato-normal-700.ttf',
        italics:     './public/fonts/Lato-italic-400.ttf',
        bolditalics: './public/fonts/Lato-italic-700.ttf'
    },
    IMFellEnglish: {
        normal:  './public/fonts/IM_Fell_English-normal-400.ttf',
        italics: './public/fonts/IM_Fell_English-italic-400.ttf',
    }
};

const printer = new PdfPrinter(fonts);

const buildHeader = (roster, event) => [
    {
        image:     'file://../public/images/frostgrave-banner.png',
        width:     300,
        alignment: 'center'
    },
    ' ',
    {
        style:     'header',
        text:      roster.name,
        alignment: 'center'
    },
    ' '
];

const buildInfo = (roster, event) => [
    leftRightColumns(
        event.name,
        {
            text: [
                {text: 'Cost: ', bold: true},
                parseInt(event.points_limit) - parseInt(roster.treasury) + 'gp'
            ]
        })
];

const leftRightColumns = (leftContents, rightContents) => {
    return {
        columns: [
            Object.assign({alignment: 'left'}, typeof leftContents === 'string' ? {text: leftContents} : leftContents),
            Object.assign({alignment: 'right'}, typeof rightContents === 'string' ? {text: rightContents} : rightContents),
        ]
    }
};

const statBlock = (stat_block, modifiers = {}, items = [], small) => {

    const modifier = (value) => parseInt(value) < 0 ? parseInt(value) : '+' + parseInt(value);

    const split_stat = (base, current, useModifier = false) => {
        return parseInt(base) === parseInt(current)
            ? (useModifier ? modifier(base) : base + "")
            : (useModifier ? modifier(base) : base + "" / useModifier ? modifier(current) : current + "");
    };

    const stat_bonuses = items.reduce(
        (acc, {bonus}) =>
            [...objectEntries(bonus || {})].reduce(
                (acc, [key, value]) => Object.assign({}, acc, {[key]: parseInt(acc[key] || 0) + parseInt(value || 0)}),
                acc
            ),
        {}
    );

    const modified_stats = [...objectEntries(stat_block)].reduce(
        (acc, [key, value]) => Object.assign({}, acc, {[key]: parseInt(value) + parseInt(modifiers[key] || 0)}),
        {}
    );

    return {
        table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths:     ['*', '*', '*', '*', '*', '*'],

            body: [
                ['M', 'F', 'S', 'A', 'W', 'H'].map(text => ({text, bold: true, alignment: 'center', style: small ? 'small' : 'default'})),
                [
                    split_stat(modified_stats.move, modified_stats.move + (stat_bonuses.move || 0)),
                    split_stat(modified_stats.fight, modified_stats.fight + (stat_bonuses.fight || 0), true),
                    split_stat(modified_stats.shoot, modified_stats.shoot + (stat_bonuses.shoot || 0), true),
                    split_stat(modified_stats.armour, modified_stats.armour + (stat_bonuses.armour || 0)),
                    split_stat(modified_stats.will, modified_stats.will + (stat_bonuses.will || 0), true),
                    split_stat(modified_stats.health, modified_stats.health + (stat_bonuses.health || 0))
                ].map(text => ({text, bold: true, alignment: 'center', style: small ? 'small' : 'default'})),
            ],
        }
    }
};

const filePathFromRelativeUrl = url => {
    if (!url) {
        return undefined;
    }

    const file_parts = ('..' + (url.replace(/^\/upload/, "/uploads"))).split('/');
    const file_path = path.resolve(__dirname, ...file_parts);
    const existsSync = fs.existsSync(file_path);
    console.log(url, file_path, existsSync);

    return existsSync ? file_path : undefined;
};

const buildMiniature = (name, label, stat_block, modifiers, image_path, notes, items, small = false) => {
    const picture = {
        text:  ' ',
        width: small ? 45 : 100,
        stack: (image_path ? [{image: image_path, width: small ? 45 : 100,}] : []).concat({text: ' ', style: 'x_small'})
    };
    const itemTexts = items.map(({name}) => name);
    console.log(itemTexts);
    const itemsSection = small ? [itemTexts.join(', ')] : itemTexts;

    const mainSection = {
        style: small ? 'small' : 'default',
        width: '*',
        stack: [
            leftRightColumns(
                {text: name, style: 'header_small', color: '#666'},
                {text: label, style: small ? 'header_small' : 'header'}
            ),
            {
                columns: [
                    {
                        width: '*',
                        stack: [
                            statBlock(stat_block, modifiers, items, small),
                            {text: 'Items: ', bold: true},
                            ...itemsSection
                        ]
                    },
                    {
                        width: '33%',
                        stack: [
                            {text: 'Current Health: ', bold: true, style: small ? 'small' : 'default'},
                            ' ',
                            small ? '' : ' ',
                            {text: 'Notes: ', bold: true, style: small ? 'small' : 'default'},
                            {text: notes, style: small ? 'x_small' : 'small'}
                        ]
                    }

                ]
            }
        ]
    };

    return {
        columns:   [picture, mainSection],
        columnGap: 10
    }
};

const buildWizardAndApprentice = (roster, spell_schools) => {
    const {wizard, apprentice} = roster;
    const spell_school = spell_schools.filter(({_id}) => _id == wizard.spell_school_id)[0];

    return [
        buildMiniature(wizard.name, spell_school.name, wizard.stat_block, {}, filePathFromRelativeUrl(wizard.image_url), wizard.notes, wizard.items),
        ...( apprentice
                ? [' ', buildMiniature(apprentice.name, 'Apprentice', wizard.stat_block, apprentice.stat_modifiers, filePathFromRelativeUrl(apprentice.image_url), apprentice.notes, apprentice.items)]
                : []
        )
    ]
};


const buildSoldier = (soldier, miniatures, picture_on_left = true) => {
    const miniature = miniatures.filter(_ => _._id.equals(soldier.miniature_id))[0];
    return buildMiniature(soldier.name, miniature.name, miniature.stat_block, {}, filePathFromRelativeUrl(soldier.image_url), miniature.notes, soldier.items, true, picture_on_left);
};

const buildSpells = function (roster, spell_schools) {
    const rowCount = Math.ceil(roster.spells.length / 5);
    const columnCount = Math.ceil(roster.spells.length / rowCount);

    console.log(roster.spells.length, rowCount, columnCount);

    const spellBlocks = roster.spells.map(({spell_id, spell_school_id}) => {
            const spell_school = spell_schools.filter(_ => _._id.equals(spell_school_id))[0];
            const spell = spell_school.spells[spell_id];

            const modifier = spell_school_id == roster.wizard.spell_school_id ? 0
                : ((roster.wizard.allied_schools || []).includes(spell_school_id) ? 2
                : (roster.wizard.opposed_school != spell_school_id ? 4
                : 6));

            return {
                name:        spell.name,
                school:      spell_school.name,
                type:        Array.isArray(spell.types) ? spell.types.join(' OR ') : spell.types,
                description: spell.description,
                cost:        parseInt(spell.base_cost) + modifier,
                modifier:    modifier,
            }
        })
        .sort((a, b) => b.cost - a.cost || b.modifier - a.modifier || a.name.localeCompare(b.name))
        .map(({name, school, type, description, cost}) => [
            {
                columns: [
                    {
                        width:     '*',
                        text:      cost + "",
                        alignment: 'left'
                    },

                    {
                        width: '60%',
                        text:  school,
                        style: 'spell_school'
                    },

                    {
                        width:     '*',
                        text:      cost + 2 + "",
                        alignment: 'right'
                    },

                ]
            },
            {text: name, style: 'spell_name'},
            {text: type, style: 'spell_type'},
            ' ',
            {text: description, style: 'spell_description'},
            ' '
        ]);
        //.map(contents => ({ width: Math.floor(100 / columnCount) + "%", stack: contents}));
    const reduceToRows = (array, rowLength) => {
        const iter = (rows, arr) =>
            arr.length === 0
                ? rows
                : iter([...rows, arr.slice(0, rowLength)], arr.slice(rowLength));
        return iter([], array);
    };

    const spellRows = reduceToRows(spellBlocks, columnCount);

    return {
        table: {
            headerRows: 1,
            widths: new Array(columnCount).fill('*'),

            body: spellRows
        }
    };

    // return spellRows.map(row => ({
    //     columns: [...row],
    //     columnGap: 30,
    // }))
};

router.get('/roster/:id',
    authenticated(),
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        var roster$ = db$.mergeMap(db => db.collection('rosters').findOne({_id}))
            .validate(roster => !!roster, "Failed to find roster");

        var event$ = roster$.mergeMap(roster =>
            db$.mergeMap(db => db.collection('events').findOne({_id: ObjectId(roster.event_id)}))
        );
        var spell_schools$ = db$.mergeMap(db => db.collection('spell_schools').find().toArray());
        var miniatures$ = db$.mergeMap(db => db.collection('miniatures').find().toArray());

        Rx.Observable.zip(roster$, event$, spell_schools$, miniatures$)
            .subscribe(
                ([roster, event, spell_schools, miniatures]) => {
                    res.setHeader("Content-Type", "application/pdfDownload");
                    res.setHeader("Content-Disposition", "attachment; filename=\"" + roster.name + ".pdf\"");
                    const isSmallList = !roster.apprentice && roster.soldiers.length < 5 && roster.spells.length < 6;

                    const dd = {
                        pageSize: 'A4',

                        // by default we use portrait, you can change it to landscape if you wish
                        pageOrientation: 'landscape',

                        // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
                        pageMargins: [20, 30, 20, 30],

                        defaultStyle: {
                            font: 'Lato'
                        },
                        styles:       {
                            x_small:           {
                                fontSize: 6,
                            },
                            small:             {
                                fontSize: 8
                            },
                            header:            {
                                fontSize: 23,
                                font:     'IMFellEnglish',
                            },
                            header_small:      {
                                fontSize: 12,
                                font:     'IMFellEnglish',
                            },
                            spell_school:      {
                                alignment: 'center',
                                fontSize:  10,
                                font:      'IMFellEnglish'
                            },
                            spell_name:        {
                                alignment: 'center',
                                fontSize:  14,
                                font:      'IMFellEnglish'
                            },
                            spell_type:        {
                                alignment: 'center',
                                fontSize:  9,
                            },
                            spell_description: {
                                alignment: 'center',
                                fontSize:  7,
                            },
                        },
                        content:      [
                            {
                                columns:   [
                                    {
                                        width: '60%',
                                        stack: [
                                            ...buildHeader(roster, event),
                                            ...buildInfo(roster, event),
                                            ' ',
                                            ...buildWizardAndApprentice(roster, spell_schools)
                                        ]
                                    },
                                    {
                                        width: '*',
                                        stack: roster.soldiers.map((soldier, i) => buildSoldier(soldier, miniatures, i % 2 == 0))
                                    },

                                ],
                                columnGap: 20,
                                pageBreak: isSmallList ? undefined : 'after'
                            },
                            {text: 'Spells', style: 'header', alignment: 'center'},
                            ' ',
                            buildSpells(roster, spell_schools)
                        ]
                    };

                    const pdfDoc = printer.createPdfKitDocument(dd);

                    pdfDoc.pipe(res);
                    pdfDoc.end();
                },
                _ => {
                    res.status(500);
                    res.render(
                        'error/error',
                        {status: 500, message: 'Failed to load roster', err: {}}
                    );
                }
            );
    }
);

module.exports = router;
