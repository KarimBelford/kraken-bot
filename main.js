const fs = require('fs')
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

const logPairs = async () => {
    let getTriPairs = await getTriangularPairs(pairsUrl)
    const jsonString = JSON.stringify(getTriPairs);
  
    // Create a new filename based on the current timestamp
    const filename = `arbitragePairs.json`;
  
    // Delete the previous file with the same name, if it exists
    fs.unlink(filename, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(err);
      } else {
        // Write the JSON string to a file with the new filename
        fs.writeFile(filename, jsonString, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`Output written to file ${filename} successfully.`);
          }
        });
      }
    });
  }
  
logPairs();


const main = async() => {
    let myCoinPairs = await getSymbols(pairsUrl)
    let triangularPairs = await getTriangularPairs(pairsUrl)
}
