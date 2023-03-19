const KrakenClient = require('kraken-api')
const axios = require('axios');
const {
    getSymbols,
    getTriangularPairs
} = require('./triFunctions')

const key = '...'; // API Key
const secret = '...'; // API Private Key
const kraken = new KrakenClient(key, secret);

const pairsUrl = 'https://api.kraken.com/0/public/AssetPairs'




const main = async() => {
    let myCoinPairs = await getSymbols(pairsUrl)
    let triangularPairs = await getTriangularPairs(pairsUrl)
    console.log(triangularPairs)
}
main()