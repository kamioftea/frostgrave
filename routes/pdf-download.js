const fs = require('fs');
const express = require('express');
const router = express.Router();
const {authenticated} = require('../authenticateRequest');
const {db$} = require('../db-conn');
const {ObjectId} = require('mongodb');
var PdfPrinter = require('pdfmake/src/printer');

const fonts = {
    Roboto: {
        normal: './public/fonts/Roboto-normal-400.ttf',
        bold: './public/fonts/Roboto-normal-700.ttf',
        italics: './public/fonts/Roboto-italic-400.ttf',
        bolditalics: './public/fonts/Roboto-italic-700.ttf'
    },
    Lato: {
        normal: './public/fonts/Lato-normal-400.ttf',
        bold: './public/fonts/Lato-normal-700.ttf',
        italics: './public/fonts/Lato-italic-400.ttf',
        bolditalics: './public/fonts/Lato-italic-700.ttf'
    },
    IMFellEnglish: {
        normal: './public/fonts/IM_Fell_English-normal-400.ttf',
        italics: './public/fonts/IM_Fell_English-italic-400.ttf',
    }
};

const printer = new PdfPrinter(fonts);

router.get('/roster/:id',
    authenticated(),
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        db$.mergeMap(db => db.collection('rosters').findOne({_id}))
            .subscribe(
                roster => {
                    res.setHeader("Content-Type", "application/pdfDownload");
                    res.setHeader("Content-Disposition", "attachment; filename=\"" + roster.name +".pdf\"");

                    const dd = {
                        content: [
                            'First paragraph',
                            'Another paragraph'
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
