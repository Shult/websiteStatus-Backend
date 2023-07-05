const express = require('express');
const router = express.Router();
const axios = require('axios');
const puppeteer = require('puppeteer');
const dns = require('dns');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');


let timeout = 60000*60; // 60000 ms = 1 min

let attempts = 0;

// Stats
let totalServers = 0;
let upServers = 0;
let downServers = 0;
let upRatio = 0;
let totalResponseTime = 0;
let requestStartTime = 0;

let excelFileName = 'exemple.xlsx';

router.post('/checkStatus', async (req, res) => {
    let timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');;
    let filename;
    // Logger
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.simple(),
        transports: [
            new winston.transports.File({ filename: 'logs/precheck-'+timestamp+'.log'}),
            new winston.transports.Console()
        ]
    });


    // Créer un nouveau classeur
    let wb = xlsx.utils.book_new();

    // Définir les données
    let firstRow = [
        ["URL", "Status"]
    ];

    // Créer une feuille de calcul à partir des données
    let ws = xlsx.utils.aoa_to_sheet(firstRow);

    // Ajouter la feuille de calcul au classeur
    xlsx.utils.book_append_sheet(wb, ws, "Feuille1");

    // Écrire le classeur dans un fichier
    xlsx.writeFile(wb, excelFileName);



    // Ensures that URLs have been sent in the request body
    if (!req.body.urls) {
        return res.status(400).json({ message: 'URLs not provided' });
    }

    const urls = req.body.urls;
    // Creates an array of promises that sends a GET request to each URL
    const requests = urls.map((url, index) => {

        // Add "http://" if the user forgot to put it.
        let addssl = false;
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
            addssl = true;
        }

        // Record the start time
        const start = Date.now();

        // Check the status of the website
        return axios.get(url)
            .then(response => {
                // Calculate the response time
                const responseTime = Date.now() - start;

                // If the website is up: Take a screenshot of it
                screenshot(url);

                // If we have add https://
                if (addssl) {
                    addToExcelFile(url, "up");
                    logger.info("id: " + (index + 1) + ", url: " + url + ", status: up," + " responseTime: " + responseTime / 1000 + ", addssl: " + addssl + ", screen: screenshots/" + url + ".png");
                    return {
                        id: index + 1,
                        url,
                        status: 'up',
                        responseTime: responseTime / 1000,
                        addssl: true,
                        screen: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png`,
                    };
                } else {
                    addToExcelFile(url, "up");
                    logger.info("id: " + (index + 1) + ", url: " + url + ", status: up," + " responseTime: " + responseTime / 1000 + ", addssl: " + addssl + ", screen: screenshots/" + url + ".png");
                    return {
                        id: index + 1,
                        url,
                        status: 'up',
                        responseTime: responseTime / 1000,
                        addssl: false,
                        screen: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png`,
                    };
                }
            })
            .catch(error => {
                console.log("This site ("+url+") is down.");
                const responseTime = Date.now() - start;
                addToExcelFile(url, "down");
                logger.info("id: " + (index + 1) + ", url: " + url + ", status: down," + " responseTime: "+responseTime+", addssl: " + addssl);
                return {
                    id: index + 1,
                    url,
                    status: "down",
                    responseTime: responseTime / 1000,
                    addssl: addssl,
                    //retrynb: attempts,
                    screen: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png`,
                };
            });
    });

    // Wait until all the promises are resolved
    const results = await Promise.all(requests);

    filename = `logs/precheck-${timestamp}`;

    const data = {
        results,
        logs: filename+".log"
    };

    // Stats update
    totalServers = results.length;
    upServers = results.filter(site => site.status === 'up').length;
    downServers = results.filter(site => site.status === 'down').length;
    upRatio = upServers / totalServers;
    totalResponseTime = results.reduce((total, site) => total + site.responseTime, 0);
    const requestEndTime = Date.now();
    const responseTimeStats = (requestEndTime - requestStartTime) / 1000; // Convertissez en secondes

    // Stats print
    console.log('Verification statistics:');
    console.log(`Total number of sites: ${totalServers}`);
    console.log(`Number of UP sites: ${upServers}`);
    console.log(`Number of DOWN sites: ${downServers}`);
    console.log(`Pourcentage of UP sites: ${upRatio*100}%`);
    console.log(`Average response time: ${totalResponseTime/totalServers} seconds`);


    //fs.rename(excelFileName, timestamp);

    // Sends results in response
    res.json(data);
});

// Get request for "checkStatus", not really usefull
router.get('/checkStatus', function(req, res, next) {
    res.render('index', { title: 'checkStatus: try to do a post request to have a better result.' });
});

// Take a screenshot of the website
async function screenshot(url) {

    // Launch a new browser
    const browser = await puppeteer.launch({
        timeout: timeout,
        headless: 'new'   // If on day you have an issues with the website, it's maybe because the version of puppeteer, I'm using the old one because it's seems to be faster, but it may be not supported anymore in the future
    });

    // Open a new page
    const page = await browser.newPage({
        timeout: timeout,
    });

    // Access the specified URL
    await page.goto(url, {timeout: timeout});

    // Take a screenshot and save it in the specified directory
    await page.screenshot({ path: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png` });

    //await page.title();

    // Close browser
    await browser.close();
}

function addToExcelFile(url, status){
    console.log("Add excel file");

    // Read existing workbook
    let workbook = xlsx.readFile(excelFileName);

    // Get the first workbook sheet
    let worksheetName = workbook.SheetNames[0];
    let worksheet = workbook.Sheets[worksheetName];

    // Convert the worksheet into an array of tables
    let data2 = xlsx.utils.sheet_to_json(worksheet, {header: 1});

    // Find the last row
    let lastRow = data2.length;

    // Add new data
    data2.push([url, status]);

    // Convert data into a worksheet
    let newWorksheet = xlsx.utils.aoa_to_sheet(data2);

    // Replace old worksheet with new one
    workbook.Sheets[worksheetName] = newWorksheet;

    // Write workbook to file
    xlsx.writeFile(workbook, excelFileName);
}

// Download logs
router.get('/download/logs/:filename', (req, res) => {
    console.log("Reach");
    const logsFileName = req.params.filename;
    const logsFilePath = path.join(__dirname, '../logs', logsFileName);

    if(logsFileName){
        console.log("exist");
    } else {
        console.log("Don't exist");
    }

    res.download(logsFilePath, logsFileName, (err) => {
        if (err) {
            // Manage download error
            console.error('Error downloading logs:', err);
            res.status(500).json({ message: 'Error downloading logs' });
        }
    });
});

router.get('/download/excel/:filename', (req, res) => {
    console.log("Reach EXCEL");
    const excelFileName = req.params.filename+".xlsx";
    const excelFilePath = path.join(__dirname, '../', excelFileName);

    if(excelFileName){
        console.log("exist");
    } else {
        console.log("Don't exist");
    }

    res.download(excelFilePath, excelFileName, (err) => {
        if (err) {
            // Manage download error
            console.error('Error downloading logs:', err);
            res.status(500).json({ message: 'Error downloading logs' });
        }
    });
});

module.exports = router;
