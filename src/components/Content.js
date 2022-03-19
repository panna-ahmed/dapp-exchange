import React, { Component } from 'react';
import { connect } from 'react-redux';
import { exchangeSelector } from '../store/selectors';
import { loadAllOrders } from '../store/interactions';
import Trades from './Trades';

class Content extends Component {
  componentWillMount() {
    this.loadBlockchainData(this.props);
  }

  async loadBlockchainData(props) {
    const { dispatch, exchange } = props;
    await loadAllOrders(this.props.exchange, dispatch);
    //await subscribeToEvents(exchange, dispatch);
  }

  render() {
    return (
      <div className="content">
        <div className="vertical-split"></div>
        <div className="vertical-split"></div>
        <Trades />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    exchange: exchangeSelector(state),
  };
}

export default connect(mapStateToProps)(Content);