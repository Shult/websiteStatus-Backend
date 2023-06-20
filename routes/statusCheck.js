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

        // Add "http://" if the user forgot to put it.
        if (!/^https?:\/\//i.test(url)) {
            url = 'http://' + url;
        }

        const start = Date.now(); // Record the start time

        return axios.get(url)
            .then(response => {
                const responseTime = Date.now() - start; // Calculate the response time

                // If the website is up: Take a screenshot of it
                screenshot(url);

                return { url, status: 'up', responseTime: responseTime/1000, screen: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png` };
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

async function screenshot(url) {
    // Lancez un nouveau navigateur
    const browser = await puppeteer.launch();

    // Ouvrez une nouvelle page
    const page = await browser.newPage();

    // Accédez à l'URL spécifiée
    await page.goto(url);

    // Prenez un screenshot et enregistrez-le dans le répertoire spécifié
    await page.screenshot({ path: `screenshots/${url.replace(/[:\/\/]/g, "_")}.png` });

    // Fermez le navigateur
    await browser.close();
}

module.exports = router;
