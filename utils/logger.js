const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const Constants = require('../constants');
const path = require("path");

function initLogger(timestamp){
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.simple(),
        transports: [
            new winston.transports.File({ filename: Constants.LINK_LOGS+timestamp+'.log'}),
            new winston.transports.Console()
        ]
    });
    return logger;
}

function downloadLogs(filename, res){
    console.log("Reach");
    const logsFileName = filename+".log";

    const logsFilePath = path.join(__dirname, "../"+Constants.LINK_LOGS, logsFileName);

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
    console.log("end log");
}

module.exports = {
    initLogger,
    downloadLogs
};