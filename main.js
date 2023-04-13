const fs = require('fs')
const KrakenClient = require('kraken-api')
const WebSocket = require('ws');
const axios = require('axios');
const {
    getSymbols,
    getTriangularPairs,
    getPairPrices,
    calcSurfaceArb,
    getOrderBookData,
    placeOrder
} = require('./triFunctions');
const { sub2ws } = require('./wsData');

const key = '7T7NAVdA4j/KrnD9EaIDG2JFn5qJW20CbjgKZU6Fha2OMByRktcEdXwb'; // API Key
const secret = 'x37vmW7KskvyyMEnCqoUCObiSGeZhcUqy+oYJ+bEe3GwaXVwL42351vfmapUAXvl3Oz9kKXY9+AmNHCELrHvUw=='; // API Private Key
const kraken = new KrakenClient(key, secret);

const pairsUrl = 'https://api.kraken.com/0/public/AssetPairs'
const priceDataUrl = 'https://api.kraken.com/0/public/Ticker'

const getTicker = async() =>{
  console.log(await kraken.api('Balance'));
  
}
//getTicker()
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
  
const surfaceArbInfo = async() => {
  
    let structuredPairs = await readJsonFile('./arbitragePairs.json')
    let pricedata = await getSymbols(priceDataUrl)
    let structuredPrices = {}
    let trade1Coin
    let trade2Coin
    let trade3Coin
    

    for(const key in structuredPairs){
     
        let pricesDict = await getPairPrices(structuredPairs[key],pricedata)
        
        if(pricesDict!==0){
          structuredPrices[key] = pricesDict
          let surfaceArb = await calcSurfaceArb(structuredPairs[key],pricesDict)
          if(surfaceArb!==0){
            const realRateData = await getOrderBookData(surfaceArb)
            
            if(realRateData!==0){
              console.log(realRateData)
              let {startingAmount,contract1,contract2,contract3,aproxQuantityT1,aproxQuantityT2,aproxQuantityT3,directionTrade1,directionTrade2,directionTrade3}= realRateData
              console.log(aproxQuantityT1,aproxQuantityT2,aproxQuantityT3)
              if(directionTrade1 === 'quoteToBase'){
                trade1Coin = await placeOrder(contract1,directionTrade1,aproxQuantityT1)
              }else{
                trade1Coin = await placeOrder(contract1,directionTrade1,startingAmount)
              }

              if(directionTrade2 === 'quoteToBase'){
                trade2Coin = await placeOrder(contract2,directionTrade2,aproxQuantityT2)
              }else{
                trade2Coin = await placeOrder(contract2,directionTrade2,trade1Coin)
              }

              if(directionTrade3 === 'quoteToBase'){
                trade3Coin = await placeOrder(contract3,directionTrade3,aproxQuantityT3)
              }else{
                trade3Coin = await placeOrder(contract3,directionTrade3,trade2Coin)
              }

            }
           
            
          }
        }
      
    }

}



const main = async() => {
  const dayInMillis = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const exitAfterADay = () => process.exit(); // function to exit the process after a day

  console.log('Setting up 5-second interval...');
  // call the surfaceArbInfo() function every 30 seconds
  const intervalId = setInterval(async() => {
    try {
      //logPairs()
      console.log('running')
      await surfaceArbInfo()
      console.log('done')
    } catch (error) {
      console.error(error);
    }
  }, 5000);

  // schedule the exit function to be called after a day
  setTimeout(() => {
    clearInterval(intervalId); // clear the interval
    exitAfterADay(); // exit the process
  }, dayInMillis);

  console.log('Interval set up.');
}

main()






