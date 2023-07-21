const xlsx = require('xlsx');
const Constants = require('../constants');
const path = require("path");

function initExcel(timestamp){
    excelFileName = timestamp+'.xlsx';
    // Create a new workbook
    let wb = xlsx.utils.book_new();

    // Define data
    let firstRow = [
        ["URL", "Status"]
    ];

    // Create a spreadsheet from the data
    let ws = xlsx.utils.aoa_to_sheet(firstRow);

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, "Feuille1");

    // Write workbook to file
    xlsx.writeFile(wb, Constants.LINK_EXCELS+excelFileName);
}

function addToExcelFile(url, status){
    console.log("Add excel file");

    // Read existing workbook
    let workbook = xlsx.readFile(Constants.LINK_EXCELS+excelFileName);

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
    xlsx.writeFile(workbook, Constants.LINK_EXCELS+excelFileName);
}

function downloadExcel(filename, res){
    console.log("Reach EXCEL");
    const excelFileName = filename+".xlsx";
    const excelFilePath = path.join(__dirname, "../"+Constants.LINK_EXCELS, excelFileName);

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
}


module.exports = {
    initExcel,
    addToExcelFile,
    downloadExcel
};