import React, { useEffect } from 'react';
import './App.css';
import Web3 from 'web3';
import Token from '../abis/Token.json';

function App() {
  useEffect(() => {
    async function loadBlockchainData() {
      const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
      const network = await web3.eth.net.getNetworkType();
      const networkId = await web3.eth.net.getId();
      const accounts = await web3.eth.getAccounts();
      const token = new web3.eth.Contract(
        Token.abi,
        Token.networks[networkId].address
      );

      //const totalSupply = await token.methods.totalSupply().call();
      //console.log('totalSupply', totalSupply);
    }

    loadBlockchainData();
  });

  return (
    <div className="App">
      <h1>hi</h1>
    </div>
  );
}

export default App;
