const axios = require('axios');
const pairsUrl = 'https://api.kraken.com/0/public/AssetPairs'
const priceDataUrl = 'https://api.kraken.com/0/public/Ticker'
//get array of pair symbols 
const getSymbols = async (url) => {
    try {   
      const response = await axios.get(url);
      const symbols = response.data.result;
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
                                            "aBase": aBase,
                                            "aQuote": aQuote,
                                            "bBase": bBase,
                                            "bQuote": bQuote,
                                            "cBase": cBase,
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

    let pairAask, pairAbid, pairBask, pairBbid, pairCask, pairCbid;
    
    for (const symbol in priceData) {
        if (symbol === pairA) {
          pairAask = priceData[symbol].a[0];
          pairAbid = priceData[symbol].b[0];
        } else if (symbol === pairB) {
          pairBask = priceData[symbol].a[0];
          pairBbid = priceData[symbol].b[0];
        } else if (symbol === pairC) {
          pairCask = priceData[symbol].a[0];
          pairCbid = priceData[symbol].b[0];
        }        
      }
      if (pairAask === undefined || pairAbid === undefined || 
        pairBask === undefined || pairBbid === undefined || 
        pairCask === undefined || pairCbid === undefined) {
        
        return 0;
    // if (pairAask === undefined || pairAask === '0' || pairAbid === undefined || pairAbid === '0' || pairBask === undefined || pairBask === '0' || pairBbid === undefined || pairBbid === '0' || pairCask === undefined || pairCask === '0' || pairCbid === undefined || pairCbid === '0') {
    //     return 0;
    } else {
        return {
            "pairAask": pairAask,
            "pairAbid": pairAbid,
            "pairBask": pairBask,
            "pairBbid": pairBbid,
            "pairCask": pairCask,
            "pairCbid": pairCbid,
        }
    }
}

const calcSurfaceArb = async(pair,priceDict) => {
    let startingAmount = 1;
    let minSurfaceRate = 0;
    let surfaceRateDict = {};
    let contract1;
    let contract2;
    let contract3;
    let directionTrade1 = "";
    let directionTrade2 = "";
    let directionTrade3 = "";
    let aquiredCoinT1 = 0;
    let aquiredCoinT2 = 0;
    let aquiredCoinT3 = 0;
    let calculated = 0;
    //pair info
    const aBase = pair.aBase;
    const aQuote = pair.aQuote;
    const bBase = pair.bBase;
    const bQuote = pair.bQuote;
    const cBase = pair.cBase;
    const cQuote = pair.cQuote;
    const pairA = pair.pairA;
    const pairB = pair.pairB;
    const pairC = pair.pairC;

    //price info
    const aAsk = priceDict.pairAask; 
    const aBid = priceDict.pairAbid;
    const bAsk = priceDict.pairBask; 
    const bBid = priceDict.pairBbid;
    const cAsk = priceDict.pairCask;
    const cBid = priceDict.pairCbid;

    /*Trade rules
        To go from base to qoute(left to right)
            swaprate = bid
        To go from qoute to base(right to left)
            swaprate = 1/ask        
     */
    let directionList = ["forward","reverse"];
    for(direction of directionList){
        let swap1;
        let swap2;
        let swap3;
        let swap1Rate;
        let swap2Rate;
        let swap3Rate;

        //starting with abase and swapping for aquote
        if(direction === "forward"){
            swap1 = aBase;
            swap2 = aQuote;
            swap1Rate = aBid
            directionTrade1 = "baseToQuote";
        }
        if(direction === "reverse"){
            swap1 = aQuote;
            swap2 = aBase;
            swap1Rate = 1/aAsk
            directionTrade1 = "QuoteToBase";
        }
        contract1 = pairA
        aquiredCoinT1 = startingAmount * swap1Rate

        
        if(direction === "forward"){
            //Scenario 1 check if aQoute === bQoute
            if(aQuote=== bQuote && calculated ===0){
                swap2Rate = 1/bAsk
                aquiredCoinT2 = aquiredCoinT1 * swap2Rate
                directionTrade2 = "quoteToBase"
                contract2 = pairB

                if(bBase===cBase){
                    swap3 = cBase
                    swap3Rate = cBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairC
                }else{
                    swap3 = cQuote
                    swap3Rate = 1/cAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairC
                }
                aquiredCoinT3 = aquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 2 check if aQoute === bBase
            }else if(aQuote === bBase && calculated ===0){
                swap2Rate = bBid
                aquiredCoinT2 = aquiredCoinT1 * swap2Rate
                directionTrade2 = "baseToQuote"
                contract2 = pairB

                if(bQuote===cBase){
                    swap3 = cBase
                    swap3Rate = cBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairC
                }else{
                    swap3 = cQuote
                    swap3Rate = 1/cAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairC
                }
                aquiredCoinT3 = aquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 3 check if aQoute === cQoute
            }else if(aQuote=== cQuote && calculated ===0){
                swap2Rate = 1/cAsk
                aquiredCoinT2 = aquiredCoinT1 * swap2Rate
                directionTrade2 = "quoteToBase"
                contract2 = pairC

                if(cBase===bBase){
                    swap3 = bBase
                    swap3Rate = bBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairB
                }else{
                    swap3 = bQuote
                    swap3Rate = 1/bAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairB
                }

                aquiredCoinT3 = aquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 4 aQoute === cBase
            }else{
                swap2Rate = cBid
                aquiredCoinT2 = aquiredCoinT1 * swap2Rate
                directionTrade2 = "baseToQuote"
                contract2 = pairC

                if(cQuote===bBase){
                    swap3 = bBase
                    swap3Rate = bBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairB
                }else{
                    swap3 = bQuote
                    swap3Rate = 1/bAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairB
                }
                aquiredCoinT3 = aquiredCoinT2 * swap3Rate
                calculated = 1
            }
            
        }
        if(direction === "reverse"){
            //Scenario 1 check if aBase === bQoute
            if(aBase=== bQuote && calculated ===0){
                swap2Rate = 1/bAsk
                aquiredCoinT2 = aquiredCoinT1 * swap2Rate
                directionTrade2 = "quoteToBase"
                contract2 = pairB

                if(bBase===cBase){
                    swap3 = cBase
                    swap3Rate = cBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairC
                }else{
                    swap3 = cQuote
                    swap3Rate = 1/cAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairC
                }
                aquiredCoinT3 = aquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 2 check if aQoute === bBase
            }else if(aBase === bBase && calculated ===0){
                swap2Rate = bBid
                aquiredCoinT2 = aquiredCoinT1 * swap2Rate
                directionTrade2 = "baseToQuote"
                contract2 = pairB

                if(bQuote===cBase){
                    swap3 = cBase
                    swap3Rate = cBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairC
                }else{
                    swap3 = cQuote
                    swap3Rate = 1/cAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairC
                }
                aquiredCoinT3 = aquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 3 check if aQoute === cQoute
            }else if(aBase=== cQuote && calculated ===0){
                swap2Rate = 1/cAsk
                aquiredCoinT2 = aquiredCoinT1 * swap2Rate
                directionTrade2 = "quoteToBase"
                contract2 = pairC

                if(cBase===bBase){
                    swap3 = bBase
                    swap3Rate = bBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairB
                }else{
                    swap3 = bQuote
                    swap3Rate = 1/bAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairB
                }

                aquiredCoinT3 = aquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 4 aQoute === cBase
            }else{
                swap2Rate = cBid
                aquiredCoinT2 = aquiredCoinT1 * swap2Rate
                directionTrade2 = "baseToQuote"
                contract2 = pairC

                if(cQuote===bBase){
                    swap3 = bBase
                    swap3Rate = bBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairB
                }else{
                    swap3 = bQuote
                    swap3Rate = 1/bAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairB
                }
                aquiredCoinT3 = aquiredCoinT2 * swap3Rate
                calculated = 1
            }
            if(direction==="reverse"){
                console.log(direction,pairA,pairB,pairC,startingAmount,aquiredCoinT3)
            
            }
            // console.log(direction,pairA,pairB,pairC,startingAmount,aquiredCoinT3)
            
        }
    }
}

module.exports = {
    getSymbols,
    getTriangularPairs,
    getPairPrices,
    calcSurfaceArb
}

