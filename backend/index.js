require('dotenv').config(); // load environment variables from .env file

const express = require('express'); // import express
const Web3 = require('web3'); // import web3
const cors = require('cors'); // import cors
const { WebSocketServer, WebSocket } = require('ws'); // import websocket
const axios = require('axios'); // import axios

const app = express(); // create express app
const port = 5001; // ensure the port matches the frontend connection

app.use(cors()); // enable cors

// use environment variable for websocket provider url
const wsProvider = new Web3.providers.WebsocketProvider(process.env.WEBSOCKET_PROVIDER_URL);
const web3 = new Web3(wsProvider);

let contracts = []; // initialize contracts array

// when websocket connects
wsProvider.on('connect', () => {
  console.log('WebSocket Connected');
  subscribeToBlocks(); // subscribe to new blocks
});

// subscribe to new block headers
function subscribeToBlocks() {
  web3.eth.subscribe('newBlockHeaders', async (error, blockHeader) => {
    if (error) {
      console.error('Error subscribing to newBlockHeaders:', error);
      return;
    }
    console.log(`New block received: ${blockHeader.number}`);
    processBlock(blockHeader.number); // process the new block
  });
}

// process a block by its number
async function processBlock(blockNumber) {
  const block = await web3.eth.getBlock(blockNumber, true); // get block with transactions
  console.log(`Processing block: ${blockNumber}, transactions: ${block.transactions.length}`);
  for (const tx of block.transactions) {
    if (!tx.to) { // potential contract creation
      console.log(`Found contract creation tx: ${tx.hash}`);
      await checkForERC20(tx, block); // check if it's an erc20 contract
    }
  }
}

// check if a transaction created an erc20 contract
async function checkForERC20(tx, block) {
  const receipt = await web3.eth.getTransactionReceipt(tx.hash);
  if (receipt && receipt.contractAddress) {
    console.log(`Contract created at: ${receipt.contractAddress}`);
    const isErc20 = await isERC20(receipt.contractAddress);
    console.log(`Is it ERC20? ${isErc20}`);
    if (isErc20) {
      const tokenName = await getTokenName(receipt.contractAddress);
      const telegramLink = await getTelegramLink(receipt.contractAddress);
      const contractInfo = {
        contractAddress: receipt.contractAddress,
        transactionHash: tx.hash,
        blockNumber: block.number,
        timestamp: block.timestamp,
        tokenName: tokenName || `Token at ${receipt.contractAddress}`,
        telegramLink: telegramLink,
        possibleTelegramLink: !telegramLink && tokenName ? `https://t.me/${tokenName.replace(/\s+/g, '')}` : null
      };
      console.log(`ERC20 contract deployed at: ${receipt.contractAddress}`);
      contracts.push(contractInfo); // add to contracts array
      broadcastNewContract(contractInfo); // broadcast the new contract
    }
  }
}

// check if a contract address is an erc20 contract
async function isERC20(contractAddress) {
  const contract = new web3.eth.Contract(erc20ABI, contractAddress);
  try {
    await contract.methods.totalSupply().call();
    await contract.methods.balanceOf('0x0000000000000000000000000000000000000000').call();
    return true; // is erc20
  } catch (error) {
    console.error(`Error checking ERC20 at ${contractAddress}:`, error.message);
    return false; // not erc20
  }
}

// get the token name of an erc20 contract
async function getTokenName(contractAddress) {
  const contract = new web3.eth.Contract(erc20ABI, contractAddress);
  try {
    const name = await contract.methods.name().call();
    console.log(`Token name for ${contractAddress}: ${name}`);
    return name; // return token name
  } catch (error) {
    console.error(`Error fetching token name at ${contractAddress}:`, error.message);
    return `Token at ${contractAddress}`; // fallback name
  }
}

// get the telegram link from the contract's source code
async function getTelegramLink(contractAddress) {
  try {
    const response = await axios.get(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=YourEtherscanAPIKey`);
    const sourceCode = response.data.result[0].SourceCode;
    const telegramLinkMatch = sourceCode.match(/https:\/\/t\.me\/[^\s'"]+/);
    return telegramLinkMatch ? telegramLinkMatch[0] : null; // return link or null
  } catch (error) {
    console.error(`Error fetching source code for ${contractAddress}:`, error.message);
    return null; // return null if error
  }
}

// erc20 abi for contract interaction
const erc20ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "payable": false,
    "type": "function"
  }
];

// endpoint to get contracts
app.get('/api/contracts', (req, res) => {
  console.log('GET /api/contracts called');
  res.json(contracts); // respond with contracts
});

// start the server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// setup websocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send(JSON.stringify(contracts)); // send existing contracts
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// broadcast new contract to all clients
function broadcastNewContract(contract) {
  console.log('Broadcasting new contract:', contract);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify([contract]));
    }
  });
}
