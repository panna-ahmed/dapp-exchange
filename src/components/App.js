import React, { useEffect } from 'react';
import './App.css';
import Web3 from 'web3';
import {
  loadWeb3,
  loadAccount,
  loadToken,
  loadExchange,
} from '../store/interactions';
import { connect } from 'react-redux';

function App(props) {
  useEffect(() => {
    async function loadBlockchainData(dispatch) {
      const web3 = loadWeb3(dispatch);
      const account = await loadAccount(web3, dispatch);
      const networkId = await web3.eth.net.getId();
      const token = await loadToken(web3, networkId, dispatch);
      loadExchange(web3, networkId, dispatch);
      //const totalSupply = await token.methods.totalSupply().call();
      //console.log('totalSupply', totalSupply);
    }

    loadBlockchainData(props.dispatch);
  });

  return (
    <div className="App">
      <h1>hi</h1>
    </div>
  );
}

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps)(App);
