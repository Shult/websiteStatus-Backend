// Constants file for the project
const Constants = require('../constants');

// Library
const express = require('express');
const router = express.Router();
const axios = require('axios');
const puppeteer = require('puppeteer');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment');
const fs = require('fs');

// File
const browserUtil = require('../utils/browser');
const excelUtil = require('../utils/excel');
const loggerUtil = require('../utils/logger');
const statsUtil = require('../utils/stats');

// for browser
let browser= null;
let page = null;

// Timeout
let timeout = Constants.VALUE_TIMEOUT; // 60000 ms = 1 min

// POST Request for checking webSite (Most important part of the website)
router.post('/checkStatus', async (req, res) => {
    const { browser, page } = await browserUtil.startBrowser(timeout);

    // Get the date and time to have unique file (Logs and screenshots)
    let timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
    let filename;

    // Init logger file
    const logger = loggerUtil.initLogger(timestamp);

    // Init excel file
    excelUtil.initExcel(timestamp);


    // ------------------------------- MAIN FUNCTION: START -------------------------------------------
    // Ensures that URLs have been sent in the request body
    if (!req.body.urls) {
        return res.status(400).json({ message: 'URLs not provided' });
    }

    // Put all urls from the txt file in a variable
    const urls = req.body.urls;

    // Init the table for the result
    let results = [];

    // For each websites do this
    for(let index = 0; index < urls.length; index++) {
        console.log("index = "+(index+1)+"/"+urls.length);

        let url = urls[index];

        // Add "http://" if the user forgot to put it.
        let addssl = false;
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
            addssl = true;
        }

        // Record the start time
        const start = Date.now();

        // Path to save screenshot
        let pathScreen = Constants.LINK_SCREENSHOTS+timestamp;

        try {
            // Check the status of the website
            const response = await axios.get(url);

            // take screenshot and wait for it to finish
            await screenshot(url, timestamp, browser, page);
            //await browserUtil.screenshot(url, timestamp, browser, page);

            // Calculate the response time
            const responseTime = Date.now() - start;

            // Add the data to the excel file
            excelUtil.addToExcelFile(url, "up");

            // Write log
            logger.info("id: " + (index + 1) + ", url: " + url + ", status: up," + " responseTime: " + responseTime / 1000 + ", addssl: " + addssl + ", screen: screenshots/" + url + ".png");

            // Result
            let result = {
                id: index + 1,
                url,
                status: 'up',
                responseTime: responseTime / 1000,
                addssl: addssl,
                screen: pathScreen+"\\"+url.replace(/[:\/\/]/g, "_")+".png"
            };

            // add result to results array
            results.push(result);

        } catch (error) {
            console.log("This site ("+url+") is down.");

            // Calculate the response time
            const responseTime = Date.now() - start;

            // Add the data to the excel file
            excelUtil.addToExcelFile(url, "down");

            // Write log
            logger.info("id: " + (index + 1) + ", url: " + url + ", status: down," + " responseTime: "+responseTime+", addssl: " + addssl);

            // Result
            let result = {
                id: index + 1,
                url,
                status: "down",
                responseTime: responseTime / 1000,
                addssl: addssl,
                screen: pathScreen+"\\"+url.replace(/[:\/\/]/g, "_")+".png",
            };

            // add result to results array
            results.push(result);
        }
    }
// ------------------------------- MAIN FUNCTION: END -------------------------------------------

    // Path of the logs to send
    filename = timestamp;

    // Get stats
    let stats = statsUtil.getStats(results);

    // Stop the browser
    await browserUtil.stopBrowser(browser, page);

    // Response of the API: All the data that we send to the frontend. results contain all the information
    const data = {
        results,
        logs: filename,
        nbTotalSites: stats.totalSites,
        nbUpSites: stats.upSites
    };

    // Sends results in response
    res.json(data);
});

// Take a screenshot of the website
async function screenshot(url, timestamp, browser, page) {
    // Access the specified URL
    await page.goto(url, {timeout: timeout});

    // Path for the screenshots
    let path = Constants.LINK_SCREENSHOTS+timestamp+'\\';

    // Check if the directory already exist (Error handler)
    fs.access(path, (error) => {
        if (error) {
            // Use fs.mkdir to create the directory
            fs.mkdir(path, { recursive: true }, (error) => {
                if (error) {
                    console.error('An error occurred: ', error);
                } else {
                    console.log('New directory successfully created.');
                }
            });
        } else {
            //console.log('Directory already exists.');
        }
    });

    // Take a screenshot and save it in the specified directory
    await page.screenshot({
        path: path+url.replace(/[:\/\/]/g, "_")+'.png'
    });
    console.log("Screenshot taken: "+ url);
}

// Download logs
router.get('/download/logs/:filename', (req, res) => {
    loggerUtil.downloadLogs(req.params.filename, res);
});

// Download Excel file
router.get('/download/excel/:filename', (req, res) => {
    excelUtil.downloadExcel(req.params.filename, res);
});

// ONLY FOR TESTING EASILY THE API: Get request for "checkStatus", not really usefull
router.get('/checkStatus', function(req, res, next) {
    res.render('index', { title: 'checkStatus: try to do a post request to have a better result.' });
});

module.exports = router;