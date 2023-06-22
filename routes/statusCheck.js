const express = require('express');
const router = express.Router();
const axios = require('axios');
const puppeteer = require('puppeteer');
const dns = require('dns');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment');

// Logger configuration
const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
const filename = `logs/precheck-${timestamp}`;

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        //new winston.transports.File({ filename: 'logs/precheck.log' }),
        new DailyRotateFile({
            filename: filename,
            datePattern: 'YYYY-MM-DD',
            hourPattern: 'HH',
            minutePattern: 'mm',
            secondPattern: 'ss',
            maxSize: '200000m',
            maxFiles: '14d',
        }),
        new winston.transports.Console()
    ]
});

router.post('/checkStatus', async (req, res) => {
    logger.info('Starting precheck...');
    logger.info('Performing website verification...');

    // Ensures that URLs have been sent in the request body
    if (!req.body.urls) {
        return res.status(400).json({ message: 'URLs not provided' });
    }

    const urls = req.body.urls;
    // Creates an array of promises that sends a GET request to each URL
    const requests = urls.map((url, index) => {

        let addssl = false;
        // Add "http://" if the user forgot to put it.
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
            addssl = true;
            console.log("addssl")
        }
        // const addssl = checkSSL(url);
        //
        // if (addssl === null) {
        //     console.log("addSSL NULL")
        // }

        const start = Date.now(); // Record the start time

        return axios.get(url)
            .then(response => {
                const responseTime = Date.now() - start; // Calculate the response time

                // If the website is up: Take a screenshot of it
                screenshot(url);

                console.log( url+", status: 'up', responseTime: "+responseTime/1000+", screen: OK")
                if(addssl){
                    logger.info("id: "+ (index+1) +", url: "+url+", status: up,"+" responseTime: "+ responseTime/1000+", addssl: "+addssl+", screen: screenshots/"+url+".png");
                    return {
                        id: index + 1,
                        url,
                        status: 'up',
                        responseTime: responseTime/1000,
                        addssl: true,
                        screen: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png`,
                    };
                } else {
                    logger.info("id: "+ (index+1) +", url: "+url+", status: up,"+" responseTime: "+ responseTime/1000+", addssl: "+addssl+", screen: screenshots/"+url+".png");
                    return {
                        id: index + 1,
                        url,
                        status: 'up',
                        responseTime: responseTime/1000,
                        addssl: false,
                        screen: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png`,
                    };
                }
            })
            .catch(error => {
                const responseTime = Date.now() - start; // Calculate the response time
                logger.info("id: "+ (index+1) +", url: "+url+", status: down,"+" responseTime: "+ responseTime/1000);
                return {
                    id: index + 1,
                    url, status: 'down',
                    responseTime: responseTime/1000,
                };
            });
    });

    // async function checkSSL(url) {
    //     console.log("Check URL");
    //     return new Promise((resolve, reject) => {
    //         dns.resolve4(url, (err, addresses) => {
    //             if (err || addresses.length === 0) {
    //                 console.log("ERROR");
    //                 resolve(null);
    //             } else {
    //                 console.log("OK");
    //                 resolve(true);
    //             }
    //         });
    //     });
    // }

    // Wait until all the promises are resolved
    const results = await Promise.all(requests);
    logger.info('End precheck...');

    const data = {
        results,
        logs: filename
    };

    // Sends results in response
    //res.json(results);
    res.json(data);

});

router.get('/checkStatus', function(req, res, next) {
    res.render('index', { title: 'checkStatus: try to do a post request to have a better result.' });
});

async function screenshot(url) {
    // Launch a new browser
    const browser = await puppeteer.launch();

    // Open a new page
    const page = await browser.newPage();

    // Access the specified URL
    await page.goto(url);

    // Take a screenshot and save it in the specified directory
    await page.screenshot({ path: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png` });

    await page.title();

    // Close browser
    await browser.close();
}

module.exports = router;
