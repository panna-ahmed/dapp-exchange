import React, { useEffect } from 'react';
import './App.css';
import {
  loadWeb3,
  loadAccount,
  loadToken,
  loadExchange,
} from '../store/interactions';
import { connect } from 'react-redux';
import Navbar from './Navbar';
import Content from './Content';
import { contractLoadedSelector } from '../store/selectors';

function App(props) {
  useEffect(() => {
    async function loadBlockchainData(dispatch) {
      const web3 = loadWeb3(dispatch);
      const account = await loadAccount(web3, dispatch);
      const networkId = await web3.eth.net.getId();
      const token = await loadToken(web3, networkId, dispatch);

      if (!token) {
        alert('Token smart contract not deployed on current network');
      }

      const exchange = await loadExchange(web3, networkId, dispatch);
      if (!exchange) {
        alert('Exchange smart contract not deployed on current network');
      }
    }

    loadBlockchainData(props.dispatch);
  });

  return (
    <div className="App">
      <Navbar />
      {props.contractsLoaded ? <Content /> : <div className="content"></div>}
    </div>
  );
}

function mapStateToProps(state) {
  return {
    contractLoaded: contractLoadedSelector(state),
  };
}

export default connect(mapStateToProps)(App);
