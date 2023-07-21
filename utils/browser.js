const puppeteer = require('puppeteer');
const fs = require("fs");
const constants = require("constants");




async function stopBrowser(browser, page){
    // Close page
    console.log("Page closed");
    await page.close();

    console.log("Browser closed");
    // Close browser
    await browser.close();
}

async function startBrowser(timeout){
    console.log("Browser started");
    // Launch a new browser
    const browser = await puppeteer.launch({
        timeout: timeout,
        headless: 'new',   // If on day you have an issues with the website, it's maybe because the version of puppeteer, I'm using the old one because it's seems to be faster, but it may be not supported anymore in the future
        protocolTimeout: timeout
    });

    // Open a new page
    const page = await browser.newPage({
        timeout: timeout,
    });
    console.log("New page open");

    return { browser, page };
}

module.exports = {
    startBrowser,
    stopBrowser
};