import { createSelector } from 'reselect';
import { get, groupBy, reject, minBy, maxBy } from 'lodash';
import { tokens, ether, GREEN, RED, ETHER_ADDRESS } from '../helpers';
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

export const myFilledOrdersLoadedSelector = createSelector(
  filledOrdersLoaded,
  (loaded) => loaded
);

export const myFilledOrdersSelector = createSelector(
  account,
  filledOrders,
  (account, orders) => {
    // Find our orders
    orders = orders.filter((o) => o.user === account || o.userFill === account);
    // Sort by date ascending
    orders = orders.sort((a, b) => a.timestamp - b.timestamp);
    // Decorate orders - add display attributes
    orders = decorateMyFilledOrders(orders, account);
    return orders;
  }
);

const decorateMyFilledOrders = (orders, account) => {
  return orders.map((order) => {
    order = decorateOrder(order);
    order = decorateMyFilledOrder(order, account);
    return order;
  });
};

const decorateMyFilledOrder = (order, account) => {
  const myOrder = order.user === account;

  let orderType;
  if (myOrder) {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell';
  } else {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy';
  }

  return {
    ...order,
    orderType,
    orderTypeClass: orderType === 'buy' ? GREEN : RED,
    orderSign: orderType === 'buy' ? '+' : '-',
  };
};

export const myOpenOrdersLoadedSelector = createSelector(
  orderBookLoaded,
  (loaded) => loaded
);

export const myOpenOrdersSelector = createSelector(
  account,
  openOrders,
  (account, orders) => {
    // Filter orders created by current account
    orders = orders.filter((o) => o.user === account);
    // Decorate orders - add display attributes
    orders = decorateMyOpenOrders(orders);
    // Sort orders by date descending
    orders = orders.sort((a, b) => b.timestamp - a.timestamp);
    return orders;
  }
);

const decorateMyOpenOrders = (orders, account) => {
  return orders.map((order) => {
    order = decorateOrder(order);
    order = decorateMyOpenOrder(order, account);
    return order;
  });
};

const decorateMyOpenOrder = (order, account) => {
  let orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell';

  return {
    ...order,
    orderType,
    orderTypeClass: orderType === 'buy' ? GREEN : RED,
  };
};

const orderCancelling = (state) =>
  get(state, 'exchange.orderCancelling', false);
export const orderCancellingSelector = createSelector(
  orderCancelling,
  (status) => status
);

export const priceChartLoadedSelector = createSelector(
  filledOrdersLoaded,
  (loaded) => loaded
);

export const priceChartSelector = createSelector(filledOrders, (orders) => {
  // Sort orders by date ascending to compare history
  orders = orders.sort((a, b) => a.timestamp - b.timestamp);
  // Decorate orders - add display attributes
  orders = orders.map((o) => decorateOrder(o));
  // Get last 2 order for final price & price change
  let secondLastOrder, lastOrder;
  [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length);
  // get last order price
  const lastPrice = get(lastOrder, 'tokenPrice', 0);
  // get second last order price
  const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0);

  return {
    lastPrice,
    lastPriceChange: lastPrice >= secondLastPrice ? '+' : '-',
    series: [
      {
        data: buildGraphData(orders),
      },
    ],
  };
});

const buildGraphData = (orders) => {
  // Group the orders by hour for the graph
  orders = groupBy(orders, (o) =>
    moment.unix(o.timestamp).startOf('hour').format()
  );
  // Get each hour where data exists
  const hours = Object.keys(orders);
  // Build the graph series
  const graphData = hours.map((hour) => {
    // Fetch all the orders from current hour
    const group = orders[hour];
    // Calculate price values - open, high, low, close
    const open = group[0]; // first order
    const high = maxBy(group, 'tokenPrice'); // high price
    const low = minBy(group, 'tokenPrice'); // low price
    const close = group[group.length - 1]; // last order

    return {
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice],
    };
  });

  return graphData;
};
