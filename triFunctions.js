const axios = require('axios');
const pairsUrl = 'https://api.kraken.com/0/public/AssetPairs'
//get array of pair symbols 
const getSymbols = async (url) => {
    try {   
      const response = await axios.get(url);
      const symbols = Object.keys(response.data.result);
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
        //pairList = triangularPairs.slice(0,10)
        const pairAList = [] 
        for(const pairsA of pairList){
            let aBase = pairsA[0]
            let aQuote = pairsA[1]
            pairAList.push([aBase,aQuote])
            let pairAbox = [aBase,aQuote]
            for(const pairsB of pairList){
                    
                let bBase = pairsB[0]
                let bQuote = pairsB[1]

                if(pairsA !== pairsB){
                    
                    if(bBase === pairAbox[0] || bBase === pairAbox[1] || bQuote === pairAbox[0] || bQuote === pairAbox[1] ){
                        for(const pairsC of pairList){
                            let cBase = pairsC[0]
                            let cQuote = pairsC[1]
                            if(pairsC !== pairsA && pairsC !==pairsB){
                                const combineAll = [pairsA,pairsB,pairsC]
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
                                    console.log(pairsA,pairsB,pairsC)
                                }
                            }
                        }
                    }
                }
            }

        }    
      
    } catch (error) {
        console.error('Error getting symbols: ', error);
    }

    
};

getTriangularPairs(pairsUrl);


module.exports = {
    getSymbols,
    getTriangularPairs
}

