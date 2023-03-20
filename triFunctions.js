const axios = require('axios');
const pairsUrl = 'https://api.kraken.com/0/public/AssetPairs'
const priceDataUrl = 'https://api.kraken.com/0/public/Ticker'
//get array of pair symbols 
const getSymbols = async (url) => {
    try {   
      const response = await axios.get(url);
      const symbols = response.data.result;
      console.log(symbols)
      return symbols;
      
    } catch (error) {
      console.error('Error getting symbols: ', error);
    }
};

const getTriangularPairs = async (url) => {
    try {   
        const response = await axios.get(url);
        const symbols = response.data.result;
        let triangularPairs = []
        for (const [coin, info] of Object.entries(symbols)) {
            triangularPairs.push([info.base,info.quote])        
        }
        let pairList = triangularPairs
        let duplicates = {}
        let triangularPairsList = {}
       // pairList = triangularPairs.slice(0,100) 
        for(const pairsA of pairList){
            let aBase = pairsA[0]
            let aQuote = pairsA[1]
            let pairAsymbol = aBase+aQuote
            let pairAbox = [aBase,aQuote]
     
            for(const pairsB of pairList){
                    
                let bBase = pairsB[0]
                let bQuote = pairsB[1]
                let pairBsymbol = bBase+bQuote
    
                if(pairsA !== pairsB){
                    if(bBase === pairAbox[0] || bBase === pairAbox[1] || bQuote === pairAbox[0] || bQuote === pairAbox[1] ){
                        for(const pairsC of pairList){
                            let cBase = pairsC[0]
                            let cQuote = pairsC[1]
                            let pairCsymbol = cBase+cQuote
                            if(pairsC !== pairsA && pairsC !==pairsB){
                                const combineAll = [pairAsymbol,pairBsymbol,pairCsymbol]
                                const pairsBox = [aBase,aQuote,bBase,bQuote,cBase,cQuote]
                                let countcBase = 0
                                for(let i = 0; i<6;i++){
                                    if(pairsBox[i]=== cBase){
                                        countcBase++
                                    }
                                }
    
                                let countcQoute = 0
                                for(let i = 0; i<6;i++){
                                    if(pairsBox[i]=== cQuote){
                                        countcQoute++
                                    }
                                }
    
                                if(countcBase ===2 && countcQoute === 2 && cBase!== cQuote){
                                    let uniqueItem = combineAll.sort().join('')
                                    
                                    if(duplicates[uniqueItem] === undefined){
                                        duplicates[uniqueItem] = uniqueItem
                                        
                                        let pairInfo = {
                                            "abase": aBase,
                                            "aQuote": aQuote,
                                            "bbase": bBase,
                                            "bQuote": bQuote,
                                            "cbase": cBase,
                                            "cQuote": cQuote,
                                            "pairA": pairAsymbol,
                                            "pairB": pairBsymbol,
                                            "pairC": pairCsymbol,
                                        }
                                        triangularPairsList[uniqueItem] = pairInfo;                                       
                                    }
                                    
                                   
                                }
                            }
                        }
                    }
                }
             }
    
        }
        return triangularPairsList  
      
    } catch (error) {
        console.error('Error getting symbols: ', error);
    }

    
};

const getPairPrices = async(pair,priceData) => {
    let pairA = pair.pairA
    let pairB = pair.pairB
    let pairC = pair.pairC

    console.log(priceData)
}

module.exports = {
    getSymbols,
    getTriangularPairs,
    getPairPrices
}

