const axios = require('axios');
const pairsUrl = 'https://api.kraken.com/0/public/AssetPairs'
const priceDataUrl = 'https://api.kraken.com/0/public/Ticker'
const orderbookURL ='https://api.kraken.com/0/public/Depth'
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
//get available triangular arbitrage pairs
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
       pairList = triangularPairs.slice(0,547) 
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
//get the price info for all pairs 
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
//calculate if there is a surface arbitrage opertunity 
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
    let acquiredCoinT1 = 0;
    let acquiredCoinT2 = 0;
    let acquiredCoinT3 = 0;
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
            directionTrade1 = "quoteToBase";
        }
        contract1 = pairA
        acquiredCoinT1 = startingAmount * swap1Rate

        
        if(direction === "forward"){
            //Scenario 1 check if aQoute === bQoute
            if(aQuote=== bQuote && calculated ===0){
                swap2Rate = 1/bAsk
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
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
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 2 check if aQoute === bBase
            }else if(aQuote === bBase && calculated ===0){
                swap2Rate = bBid
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
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
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 3 check if aQoute === cQoute
            }else if(aQuote=== cQuote && calculated ===0){
                swap2Rate = 1/cAsk
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
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

                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 4 aQoute === cBase
            }else{
                swap2Rate = cBid
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
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
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            }
            
        }
        if(direction === "reverse"){
            //Scenario 1 check if aBase === bQoute
            if(aBase=== bQuote && calculated ===0){
                swap2Rate = 1/bAsk
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
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
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 2 check if aQoute === bBase
            }else if(aBase === bBase && calculated ===0){
                swap2Rate = bBid
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
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
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 3 check if aQoute === cQoute
            }else if(aBase=== cQuote && calculated ===0){
                swap2Rate = 1/cAsk
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
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

                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 4 aQoute === cBase
            }else{
                swap2Rate = cBid
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
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
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            }
           
            // console.log(direction,pairA,pairB,pairC,startingAmount,acquiredCoinT3)
            
        }
        //calculate profit

        let profitLoss = acquiredCoinT3 - startingAmount;
        let profitLossPercent = profitLoss!==0?(profitLoss/startingAmount)*100:0;    
        let trade1Details = `Start with ${startingAmount} ${swap1}. Swap at ${swap1Rate} for ${acquiredCoinT1} ${swap2}`
        let trade2Details = `Swap ${acquiredCoinT1} ${swap2} at ${swap2Rate} for ${acquiredCoinT2} ${swap3}`
        let trade3Details = `Swap ${acquiredCoinT2} ${swap3} at ${swap3Rate} for ${acquiredCoinT3} ${swap1}`
        
        if(profitLossPercent>minSurfaceRate){
            surfaceRateDict = {
                "swap1": swap1,
                "swap2": swap2,
                "swap3": swap3,
                "contract1": contract1,
                "contract2": contract2,
                "contract3": contract3,
                "directionTrade1": directionTrade1,
                "directionTrade2": directionTrade2,
                "directionTrade3": directionTrade3,
                "startingAmount": startingAmount,
                "acquiredCoinT1": acquiredCoinT1,
                "acquiredCoinT2": acquiredCoinT2,
                "acquiredCoinT3": acquiredCoinT3,
                "swap1Rate": swap1Rate,
                "swap2Rate": swap2Rate,
                "swap3Rate": swap3Rate,
                "profitLoss": profitLoss,
                "profitLossPercent": profitLossPercent,
                "direction": direction,
                "trade_description_1": trade1Details,
                "trade_description_2": trade2Details,
                "trade_description_3": trade3Details
            }

            return surfaceRateDict
        }
    }
    return 0

}
//get depth of order book for triangular pair
const getOrderBookData = async(surfaceArb) => {
    let {swap1,directionTrade1,contract1,contract2,contract3} = surfaceArb
    console.log(contract1)

    try {   
        
        const {bidPriceDepth:bidPriceDepth1,askPriceDepth1} = await getOrderBookDepth(contract1)
        console.log(bidPriceDepth1)
        const priceUpdate1 = reformatData(askPriceDepth1,bidPriceDepth1,directionTrade1)
        console.log(priceUpdate1,directionTrade1)
        // const orderbookDepth2 = await getOrderbookDepth(contract2)
        // const orderbookDepth3 = await getOrderbookDepth(contract3)
       
        return ;
        
      } catch (error) {
        console.error('Error getting orderbook: ', error);
      }
}

const getOrderBookDepth = async(contract) => {
    const orderbookURL =`https://api.kraken.com/0/public/Depth?pair=${contract}&count=20`
    const response = await axios.get(orderbookURL);
    const orderbookDepth = response.data.result;
    const {asks:askPriceDepth, bids:bidPriceDepth} = orderbookDepth[contract];

    return {
        bidPriceDepth,
        askPriceDepth
    }
}

const reformatData = (askPriceData,bidPriceData,contractDirection) => {
    let priceList = []
    if(contractDirection === 'baseToQuote'){
        for(price of askPriceData){
            let askPrice = Number(price[0])
            let newPrice = askPrice != 0? 1/askPrice:0
            let newQuantity = Number(price[1])*askPrice
            priceList.push([newPrice,newQuantity])
        }
    } 
    if(contractDirection === 'quoteToBase'){
        for(price of bidPriceData){
            let bidPrice = Number(price[0])
            let newPrice = bidPrice != 0? bidPrice:0
            let newQuantity = Number(price[1])
            priceList.push([newPrice,newQuantity])
        }
    }
    return priceList

}


module.exports = {
    getSymbols,
    getTriangularPairs,
    getPairPrices,
    calcSurfaceArb,
    getOrderBookData
}

