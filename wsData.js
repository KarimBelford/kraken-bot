const WebSocket = require('ws');



const sub2ws = (contract1, contract2, contract3) => {
    const socket = new WebSocket('wss://ws.kraken.com');
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({
        event: 'subscribe',
        pair: [contract1, contract2, contract3],
            name: 'book',
            depth: 10,
      }));
    });

 
  
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (Array.isArray(message)) {
        const tickerData = JSON.stringify(message[1])
        const tradingPair = message[3];
  
        switch (tradingPair) {
          case contract1:
            console.log(`${contract1} - Latest ticker data: ${tickerData}`);
            break;
          case contract2:
            console.log(`${contract2} - Latest ticker data: ${tickerData}`);
            break;
          case contract3:
            console.log(`${contract3} - Latest ticker data: ${tickerData}`);
            break;
          default:
            break;
        }
      }
    });
};

module.exports = {
    sub2ws,
}
  