const express = require('express');
const pino = require('pino')

//define constants 
const port = 3000;
const host = '0.0.0.0';

//Pino Logger library
const logger = pino({
    level: 'info',
    timestamp: () => `,"time":"${new Date().toISOString()}"`
});


// App 
const app = express();
app.get('/', (req, res) => 
{
res.send('Hello World');
res.send('This is the first step to a long time')
});

logger.info('This is a nodejs app');
logger.info('The app has been dockerized');
logger.info('Orchestration will be done by K8s');
logger.info('Deployment will be setup');
logger.info('This is to test the ELK stack deployment');
logger.info('Hotfix issue 1')


app.listen(port, host);
console.log('\x1b[33m%s\x1b[0m',`Server running at http://${host}:${port}/`);
logger.info('App listening on port 3000')