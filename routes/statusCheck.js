const express = require('express');
const router = express.Router();
const axios = require('axios');
const puppeteer = require('puppeteer');


router.post('/checkStatus', async (req, res) => {
    // Ensures that URLs have been sent in the request body
    if (!req.body.urls) {
        return res.status(400).json({ message: 'URLs not provided' });
    }

    const urls = req.body.urls;
    // Creates an array of promises that sends a GET request to each URL
    const requests = urls.map(url => {

        // Also for the screenshot
        // Launch Puppeteer
        //const browser = await puppeteer.launch();

        // Add "http://" if the user forgot to put it.
        if (!/^https?:\/\//i.test(url)) {
            url = 'http://' + url;
        }

        const start = Date.now(); // Record the start time

        return axios.get(url)
            .then(response => {
                const responseTime = Date.now() - start; // Calculate the response time

                /*
                Test : commit
                // Problems with await !!!
                // Create a new page in the browser
                const page = await browser.newPage();

                // Navigate to the URL
                await page.goto(url);

                // Take a screenshot and save it to a PNG file
                await page.screenshot({ path: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png` });
                */

                return { url, status: 'up', responseTime: responseTime/1000 };
            })
            .catch(error => {
                const responseTime = Date.now() - start; // Calculate the response time
                return { url, status: 'down', responseTime: responseTime/1000 };
            });
    });

    // Wait until all the promises are resolved
    const results = await Promise.all(requests);

    // Sends results in response
    res.json(results);
});

router.get('/checkStatus', function(req, res, next) {
    res.render('index', { title: 'checkStatus: try to do a post request to have a better result.' });
});

module.exports = router;
