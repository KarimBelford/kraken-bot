const fs = require('fs')
const KrakenClient = require('kraken-api')
const axios = require('axios');
const {
    getSymbols,
    getTriangularPairs,
    getPairPrices,
    calcSurfaceArb
} = require('./triFunctions')

const key = '...'; // API Key
const secret = '...'; // API Private Key
const kraken = new KrakenClient(key, secret);

const pairsUrl = 'https://api.kraken.com/0/public/AssetPairs'
const priceDataUrl = 'https://api.kraken.com/0/public/Ticker'


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

const readJsonFile = (filename) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            const obj = JSON.parse(data);
            resolve(obj);
          } catch (err) {
            reject(err);
          }
        }
      });
    });
  };
  
const step2 = async() => {
    let structuredPairs = await readJsonFile('./arbitragePairs.json')
    let pricedata = await getSymbols(priceDataUrl)
    let structuredPrices = {}
    for(const key in structuredPairs){
        let pricesDict = await getPairPrices(structuredPairs[key],pricedata)
        
        if(pricesDict!==0){
          structuredPrices[key] = pricesDict
          let surfaceArb = calcSurfaceArb(structuredPairs[key],pricesDict)
        }
    }

}



const main = async() => {
  step2()
  //logPairs()
}

main()
