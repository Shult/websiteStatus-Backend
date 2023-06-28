const express = require('express');
const bodyParser = require('body-parser');
const app2 = express();



// Middleware pour parser le corps de la requête en JSON
app2.use(bodyParser.json());

// POST route to receive log data
app2.post('/logs', (req, res) => {
    const logsData = req.body;
    console.log("Precheck = "+ logsData.precheck);
    console.log("Postcheck = "+ logsData.postcheck);
    
    res.status(200).json({ message: 'Logs received successfully' });
});

app2.get('/compareLogsTest', function(req, res, next) {
    res.render('index', { title: 'compareLogsTest: try to do a post request to have a better result.' });
});

// Port d'écoute de votre serveur
const port = 3001;
app2.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app2;