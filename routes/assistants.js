const express = require('express');
const mysql = require('mysql');
var app = express.Router();
var pdfMake = require('pdfmake/build/pdfmake.js');
var pdfFonts = require('pdfmake/build/vfs_fonts.js');
pdfMake.vfs = pdfFonts.pdfMake.vfs;


const HEADERS = [ 
    { text: "Nombre", bold: true },
    { text: "Ciudad", bold: true },
];

function buildTableBody(headers, data, columns) {
    var body = [];

    body.push(headers);

    data.forEach(function (row) {
        var dataRow = [];

        columns.forEach(function (column) {
            dataRow.push(row[column].toString());
        })

        body.push(dataRow);
    });

    return body;
}

function table(headers, data, columns) {
    return {
        table: {
            headerRows: 1,
            body: buildTableBody(headers, data, columns)
        }
    };
}

// Create connection
const db = mysql.createConnection({
    host: '192.168.1.26',
    user: 'heroes_admin',
    password: 'admin123',
    database: 'heroes_fest'
});

// Connect
db.connect((err) => {
    if (err) {
        console.log('DB disconnected!');
        throw err;
    }
});

// Select single assistant
app.get('/:institution', (req, res) => {
    const company = req.params.institution;
    let sql = `SELECT CONCAT(nombre, " ", apellidos) as name, ciudad as city FROM asistentes WHERE institución = "${company}"`;
    let query = db.query(sql, (err, results) => {
        if (err) throw err;
        var current_datetime = new Date();
        var format_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes();
        //PDF
        var docDefinition = {
            footer: {
                columns: [
                    `Reporte generado: ${format_date}`,
                    { text: `${results.length} resultados encontrados`, alignment: 'right' }
                ]
            },
            content: [
                { text: `Reporte de la empresa ${company} - Asistencia Heroes Fest 2017`, style: 'title' },
                table(HEADERS, results, Object.keys(results[0]))
            ],
            styles: {
                title: {
                    fontSize: 22,
                    bold: true
                }
            }
        };


        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        pdfDocGenerator.getBase64((data) => {
            res.set('Content-Type', 'application/pdf');
            res.send(Buffer.from(data.toString('utf-8'), 'base64'));
        });

    });
});

module.exports = app;