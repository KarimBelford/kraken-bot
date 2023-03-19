const KrakenClient = require('kraken-api')
const axios = require('axios');
const {
    getSymbols
} = require('./triFunctions')

const key = '...'; // API Key
const secret = '...'; // API Private Key
const kraken = new KrakenClient(key, secret);

const pairsUrl = 'https://api.kraken.com/0/public/AssetPairs'


let myCoinPairs = getSymbols(pairsUrl).then(results => console.log(results));
