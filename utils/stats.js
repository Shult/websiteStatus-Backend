const Constants = require('../constants');

function getStats(results){
    // Stats update
    totalSites = results.length;
    upSites = results.filter(site => site.status === 'up').length;
    downSites = results.filter(site => site.status === 'down').length;
    upRatio = upSites / totalSites;
    totalResponseTime = results.reduce((total, site) => total + site.responseTime, 0);
    const requestEndTime = Date.now();
    const responseTimeStats = (requestEndTime) / 1000;

    // Stats print
    console.log('Verification statistics:');
    console.log(`Total number of sites: ${totalSites}`);
    console.log(`Number of UP sites: ${upSites}`);
    console.log(`Number of DOWN sites: ${downSites}`);
    console.log(`Pourcentage of UP sites: ${upRatio*100}%`);
    console.log(`Average response time: ${totalResponseTime/totalSites} seconds`);

    return { totalSites, upSites };
}

module.exports = {
    getStats
};