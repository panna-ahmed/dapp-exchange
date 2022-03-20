import { createSelector } from 'reselect';
import { get, groupBy, reject } from 'lodash';
import { tokens, ether, GREEN, RED } from '../helpers';
import moment from 'moment';

const { constants } = require('@openzeppelin/test-helpers');

const account = (state) => get(state, 'web3.account');
export const accountSelector = createSelector(account, (a) => a);

const exchange = (state) => get(state, 'exchange.contract');
export const exchangeSelector = createSelector(exchange, (a) => a);

const tokenLoaded = (state) => get(state, 'token.loaded', false);
export const tokenLoadedSelector = createSelector(tokenLoaded, (a) => a);

const exchangeLoaded = (state) => get(state, 'exchange.loaded', false);
export const exchangeLoadedSelector = createSelector(exchangeLoaded, (a) => a);

export const contractLoadedSelector = createSelector(
  tokenLoaded,
  exchangeLoaded,
  (tl, el) => tl && el
);

const allOrdersLoaded = (state) =>
  get(state, 'exchange.allOrders.loaded', false);
const allOrders = (state) => get(state, 'exchange.allOrders.data', []);

const cancelledOrdersLoaded = (state) =>
  get(state, 'exchange.cancelledOrders.loaded', false);
export const cancelledOrdersLoadedSelector = createSelector(
  cancelledOrdersLoaded,
  (loaded) => loaded
);

const cancelledOrders = (state) =>
  get(state, 'exchange.cancelledOrders.data', false);
export const cancelledOrdersSelector = createSelector(
  cancelledOrders,
  (o) => o
);

const filledOrdersLoaded = (state) =>
  get(state, 'exchange.filledOrders.loaded', false);
export const filledOrdersLoadedSelector = createSelector(
  filledOrdersLoaded,
  (loaded) => loaded
);

const filledOrders = (state) => get(state, 'exchange.filledOrders.data', []);
export const filledOrdersSelector = createSelector(filledOrders, (orders) => {
  orders = orders.sort((a, b) => a.timestamp - b.timestamp);
  orders = decorateFilledOrders(orders);
  orders = orders.sort((a, b) => b.timestamp - a.timestamp);
  return orders;
});

const decorateFilledOrders = (orders) => {
  let previousOrder = orders[0];
  return orders.map((order) => {
    order = decorateOrder(order);
    order = decorateFilledOrder(order, previousOrder);
    previousOrder = order;
    return order;
  });
};

const decorateOrder = (order) => {
  let etherAmount, tokenAmount;

  if (order.tokenGive == constants.ZERO_ADDRESS) {
    etherAmount = order.amountGive;
    tokenAmount = order.amountGet;
  } else {
    etherAmount = order.amountGet;
    tokenAmount = order.amountGive;
  }

  const precision = 10000;
  let tokenPrice = etherAmount / tokenAmount;
  tokenPrice = Math.round(tokenPrice * precision) / precision;

  return {
    ...order,
    etherAmount: ether(etherAmount),
    tokenAmount: tokens(tokenAmount),
    tokenPrice,
    formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D'),
  };
};

const decorateFilledOrder = (order, previousOrder) => {
  return {
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder),
  };
};

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
  if (previousOrder.id == orderId) {
    return GREEN;
  }

  if (previousOrder.tokenPrice <= tokenPrice) {
    return GREEN;
  } else {
    return RED;
  }
};

const openOrders = (state) => {
  const all = allOrders(state);
  const cancelled = cancelledOrders(state);
  const filled = filledOrders(state);

  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some((o) => o.id === order.id);
    const orderCancelled = cancelled.some((o) => o.id === order.id);
    return orderFilled || orderCancelled;
  });

  return openOrders;
};

const orderBookLoaded = (state) =>
  cancelledOrdersLoaded(state) &&
  filledOrdersLoaded(state) &&
  allOrdersLoaded(state);
export const orderBookLoadedSelector = createSelector(
  orderBookLoaded,
  (a) => a
);

export const orderBookSelector = createSelector(openOrders, (orders) => {
  orders = decorateOrderBookOrders(orders);
  orders = groupBy(orders, 'orderType');
  const buyOrders = get(orders, 'buy', []);
  orders = {
    ...orders,
    buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice),
  };

  const sellOrders = get(orders, 'sell', []);
  orders = {
    ...orders,
    sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice),
  };
  return orders;
});

const decorateOrderBookOrders = (orders) => {
  return orders.map((o) => {
    o = decorateOrder(o);
    o = decorateOrderBookOrder(o);
    return o;
  });
};

const decorateOrderBookOrder = (order) => {
  const orderType = order.tokenGive === constants.ZERO_ADDRESS ? 'buy' : 'sell';
  return {
    ...order,
    orderType,
    orderTypeClass: orderType === 'buy' ? GREEN : RED,
    orderFillClass: orderType === 'buy' ? 'sell' : 'buy',
  };
};
