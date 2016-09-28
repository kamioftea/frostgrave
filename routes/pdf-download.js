const fs = require('fs');
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

const getHeader = (roster, event) => [
    {
        image:     'file://../public/images/frostgrave-banner.png',
        width:     300,
        alignment: 'center'
    },
    {
        style:     'header',
        text:      roster.name,
        alignment: 'center'
    },
    {
        text:      event.name,
        alignment: 'center'
    }
];

const getInfo = (roster, event) => [
    {
        columns: [
            {
                text: [
                    {text: 'Cost:', bold: true},
                    parseInt(event.points_limit) - parseInt(roster.treasury) + 'gp'
                ]
            }
        ]
    }
];

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
                                        // auto-sized columns have their widths based on their content
                                        width: '50%',
                                        stack: [
                                            ...getHeader(roster, event),
                                            ...getInfo(roster, event),
                                        ]
                                    },
                                    {
                                        // star-sized columns fill the remaining space
                                        // if there's more than one star-column, available width is divided equally
                                        width: '*',
                                        text:  'Second column'
                                    },

                                ],
                                columnGap: 20
                            }
                        ]
                    };

                    const pdfDoc = printer.createPdfKitDocument(dd);

                    pdfDoc.pipe(res);
                    pdfDoc.end();
                },
                err => {
                    res.status(500);
                    res.render(
                        'error/error',
                        Object.assign(
                            {status: 500},
                            app.get('env') === 'development'
                                ? {message: err.message, err}
                                : {message: 'Failed to load roster', err: {}}
                        )
                    );
                }
            );

    }
);

module.exports = router;
