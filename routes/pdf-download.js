const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const {authenticated} = require('../authenticateRequest');
const {db$} = require('../db-conn');
const {ObjectId} = require('mongodb');
const Rx = require('rxjs');

require('../rxUtil/validate')(Rx.Observable);

var PdfPrinter = require('pdfmake/src/printer');

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
    {
        style:     'header',
        text:      roster.name,
        alignment: 'center'
    }
];

const buildInfo = (roster, event) => [
    leftRightColumns(
        event.name,
        {
            text: [
                {text: 'Cost:', bold: true},
                parseInt(event.points_limit) - parseInt(roster.treasury) + 'gp'
            ]
        })
];

const leftRightColumns = (leftContents, rightContents) => {
    console.log(leftContents, rightContents);

    return {
        columns: [
            Object.assign({alignment: 'left'}, typeof leftContents === 'string' ? {text: leftContents} : leftContents),
            Object.assign({alignment: 'right'}, typeof rightContents === 'string' ? {text: rightContents} : rightContents),
        ]
    }
};

const statBlock = (stat_block, modifiers) => ({
    table: {
        // headers are automatically repeated if the table spans over multiple pages
        // you can declare how many rows should be treated as headers
        headerRows: 1,
        widths: [ '*', '*', '*', '*', '*', '*' ],

        body: [
            [ 'M', 'F', 'S', 'A', 'W', 'H' ].map(text => ({text, bold: true, alignment: 'center'})),
            [ stat_block.move, "+" + stat_block.fight, "+" + stat_block.shoot, stat_block.armour, "+" + stat_block.will, stat_block.health ].map(text => ({text, bold: true, alignment: 'center'})) ,
        ],
    }
});

const filePathFromRelativeUrl = url => {
    const file_parts = ('..' + (url.replace(/^\/upload/, "/uploads"))).split('/');
    const file_path = path.resolve(__dirname, ...file_parts);
    console.log(file_path);
    return fs.existsSync(file_path) ? file_path : null;
};

const buildWizardAndApprentice = (roster, spell_schools) => {
    const buildSpellCaster = (name, label, stat_block, image_path, notes, items) => ({
        columns:   [
            ...(image_path
                ? [
                {
                    image: image_path,
                    width: 100,
                }]
                : []),
            {
                width: '*',
                stack: [
                    leftRightColumns(
                        name,
                        {text: label, style: 'header'}
                    ),
                    {
                        columns:   [
                            {
                                width: '*',
                                stack: [
                                    statBlock(stat_block),
                                    {text: 'Items:', bold: true},
                                    ...items.map(({name}) => name)
                                ]
                            },
                            {
                                width: '33%',
                                stack: [
                                    {text: 'Current Health:', bold: true},
                                    ' ',
                                    ' ',
                                    {text: 'Notes:', bold: true},
                                    notes
                                ]
                            }

                        ]
                    }
                ]
            },

        ],
        columnGap: 10
    });

    const {wizard, apprentice} = roster;
    const spell_school = spell_schools.filter(({_id}) => _id == wizard.spell_school_id)[0];

    return [
        buildSpellCaster(wizard.name, spell_school.name, wizard.stat_block, filePathFromRelativeUrl(wizard.image_url), wizard.notes, wizard.items),
        ...( apprentice
                ? [buildSpellCaster(apprentice.name, 'Apprentice', wizard.stat_block, filePathFromRelativeUrl(apprentice.image_url), apprentice.notes, apprentice.items)]
                : []
        )
    ]
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
        var users$ = db$.mergeMap(db => db.collection('rosters').find().toArray());

        Rx.Observable.zip(roster$, event$, spell_schools$, miniatures$, users$)
            .subscribe(
                ([roster, event, spell_schools, miniatures, users]) => {
                    res.setHeader("Content-Type", "application/pdfDownload");
                    res.setHeader("Content-Disposition", "attachment; filename=\"" + roster.name + ".pdf\"");

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
                            header: {
                                fontSize: 22,
                                font:     'IMFellEnglish',
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
                                        text:  'Second column'
                                    },

                                ],
                                columnGap: 20
                            }
                        ]
                    };

                    console.log(dd);

                    const pdfDoc = printer.createPdfKitDocument(dd);

                    pdfDoc.pipe(res);
                    pdfDoc.end();
                },
                _ => {
                    res.status(500);
                    res.render(
                        'error/error',
                        {status: 500,message: 'Failed to load roster', err: {}}
                    );
                }
            );

    }
);

module.exports = router;
