const axios = require('axios');
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

module.exports = {
    getSymbols
}

