import * as constants from '@/store/constants';
import Controller from '@/handlers/controller';
import Market from '@/handlers/market';
import Token from '@/handlers/token';

const state = {
  markets: [],
  factor: 1e16,
  mantissa: 1e6,
};

const actions = {
  [constants.CONTROLLER_GET_MARKETS]: ({ commit, dispatch }) => {
    const controller = new Controller();
    controller.eventualMarketAddresses
      .then((marketAddresses) => {
        const markets = marketAddresses.map((marketAddress, idx) => ({
          id: idx,
          address: marketAddress,
          token: {
            address: null,
            name: null,
            symbol: null,
            decimals: null,
          },
          borrowRate: null,
          price: null,
          cash: null,
          supplied: null,
          borrowed: null,
        }));
        commit(constants.CONTROLLER_SET_PROPERTY, { markets });
        dispatch(constants.CONTROLLER_GET_MARKETS_TOKENS, { marketAddresses });
        dispatch(constants.CONTROLLER_GET_MARKETS_CASH, { marketAddresses });
        dispatch(constants.CONTROLLER_GET_MARKETS_PRICE, { marketAddresses });
        dispatch(constants.CONTROLLER_GET_MARKETS_BORROW_RATE, { marketAddresses });
        dispatch(constants.CONTROLLER_GET_MARKETS_TOTAL_BORROWS, { marketAddresses });
        dispatch(constants.CONTROLLER_GET_MARKETS_TOTAL_SUPPLIES, { marketAddresses });
      });
  },
  [constants.CONTROLLER_GET_MARKETS_TOKENS]: ({ commit }, { marketAddresses }) => {
    const marketIntances = marketAddresses.map((marketAddress) => new Market(marketAddress));
    marketIntances.forEach((marketInstance, marketIndex) => {
      marketInstance.eventualTokenAddress
        .then((tokenAddress) => {
          const token = new Token(tokenAddress);
          commit(constants.CONTROLLER_SET_MARKET_TOKEN_ADDRESS, { marketIndex, tokenAddress });
          return [
            token.eventualName,
            token.eventualSymbol,
            token.eventualDecimals,
          ];
        })
        .then((tokenPromises) => Promise.all(tokenPromises))
        .then(([tokenName, tokenSymbol, tokenDecimals]) => {
          commit(constants.CONTROLLER_SET_MARKET_TOKEN_NAME, { marketIndex, tokenName });
          commit(constants.CONTROLLER_SET_MARKET_TOKEN_SYMBOL, { marketIndex, tokenSymbol });
          commit(constants.CONTROLLER_SET_MARKET_TOKEN_DECIMALS, { marketIndex, tokenDecimals });
        });
    });
  },
  [constants.CONTROLLER_GET_MARKETS_CASH]: ({ commit }, { marketAddresses }) => {
    const marketsCashPromeses = marketAddresses
      .map((marketAddress) => new Market(marketAddress).eventualCash);
    Promise.all(marketsCashPromeses)
      .then((marketsCash) => {
        marketsCash.forEach((marketCash, idx) => {
          commit(constants.CONTROLLER_SET_MARKET_CASH, { marketIndex: idx, marketCash });
        });
      });
  },
  [constants.CONTROLLER_GET_MARKETS_PRICE]: ({ commit }, { marketAddresses }) => {
    const marketsPricePromeses = marketAddresses
      .map((marketAddress) => new Controller().getPrice(marketAddress));
    Promise.all(marketsPricePromeses)
      .then((marketsPrice) => {
        marketsPrice.forEach((marketPrice, idx) => {
          commit(constants.CONTROLLER_SET_MARKET_PRICE, { marketIndex: idx, marketPrice });
        });
      });
  },
  [constants.CONTROLLER_GET_MARKETS_BORROW_RATE]: ({ commit }, { marketAddresses }) => {
    const marketsBorrowRatePromeses = marketAddresses
      .map((marketAddress) => new Market(marketAddress).getBorrowRate());
    Promise.all(marketsBorrowRatePromeses)
      .then((marketsBorrowRate) => {
        marketsBorrowRate.forEach((marketBorrowRate, idx) => {
          commit(constants.CONTROLLER_SET_MARKET_BORROW_RATE,
            { marketIndex: idx, marketBorrowRate });
        });
      });
  },
  [constants.CONTROLLER_GET_MARKETS_TOTAL_BORROWS]: ({ commit }, { marketAddresses }) => {
    const marketsTotalBorrowsPromeses = marketAddresses
      .map((marketAddress) => new Market(marketAddress).getUpdatedTotalBorrows());
    Promise.all(marketsTotalBorrowsPromeses)
      .then((marketsTotalBorrows) => {
        marketsTotalBorrows.forEach((marketBorrows, idx) => {
          commit(constants.CONTROLLER_SET_MARKET_TOTAL_BORROWS,
            { marketIndex: idx, marketBorrows });
        });
      });
  },
  [constants.CONTROLLER_GET_MARKETS_TOTAL_SUPPLIES]: ({ commit }, { marketAddresses }) => {
    const marketsTotalSuppliesPromeses = marketAddresses
      .map((marketAddress) => new Market(marketAddress).getUpdatedTotalSupply());
    Promise.all(marketsTotalSuppliesPromeses)
      .then((marketsTotalSupplies) => {
        marketsTotalSupplies.forEach((marketSupplies, idx) => {
          commit(constants.CONTROLLER_SET_MARKET_TOTAL_SUPPLIES,
            { marketIndex: idx, marketSupplies });
        });
      });
  },
  [constants.CONTROLLER_MARKET_UPDATE_BORROW_RATE]:
    ({ commit }, { marketIndex, marketBorrowRate }) => {
      commit(constants.CONTROLLER_SET_MARKET_BORROW_RATE, { marketIndex, marketBorrowRate });
    },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_MARKET_GET_CASH]: ({ commit, state }, { marketIndex }) => {
    const market = new Market(state.markets[marketIndex].address);
    market.eventualCash
      .then((marketCash) => {
        commit(constants.CONTROLLER_SET_MARKET_CASH, { marketIndex, marketCash });
      });
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_MARKET_GET_BORROW_RATE]: ({ commit, state }, { marketIndex }) => {
    const market = new Market(state.markets[marketIndex].address);
    market.getBorrowRate()
      .then((marketBorrowRate) => {
        commit(constants.CONTROLLER_SET_MARKET_BORROW_RATE, { marketIndex, marketBorrowRate });
      });
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_MARKET_GET_TOTAL_BORROWS]: ({ commit, state }, { marketIndex }) => {
    const market = new Market(state.markets[marketIndex].address);
    market.getUpdatedTotalBorrows()
      .then((marketBorrows) => {
        commit(constants.CONTROLLER_SET_MARKET_TOTAL_BORROWS, { marketIndex, marketBorrows });
      });
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_MARKET_GET_TOTAL_SUPPLIES]: ({ commit, state }, { marketIndex }) => {
    const market = new Market(state.markets[marketIndex].address);
    market.getUpdatedTotalSupply()
      .then((marketSupplies) => {
        commit(constants.CONTROLLER_SET_MARKET_TOTAL_SUPPLIES, { marketIndex, marketSupplies });
      });
  },
  [constants.CONTROLLER_MARKET_UPDATE]: ({ dispatch }, marketIndex) => {
    dispatch(constants.CONTROLLER_MARKET_GET_CASH, { marketIndex });
    dispatch(constants.CONTROLLER_MARKET_GET_BORROW_RATE, { marketIndex });
    dispatch(constants.CONTROLLER_MARKET_GET_TOTAL_BORROWS, { marketIndex });
    dispatch(constants.CONTROLLER_MARKET_GET_TOTAL_SUPPLIES, { marketIndex });
  },
};

const mutations = {
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_PROPERTY]: (state, data) => {
    const [[property, value]] = Object.entries(data);
    state[property] = value;
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_MARKET_TOKEN_ADDRESS]: (state, { marketIndex, tokenAddress }) => {
    state.markets[marketIndex].token.address = tokenAddress;
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_MARKET_TOKEN_NAME]: (state, { marketIndex, tokenName }) => {
    state.markets[marketIndex].token.name = tokenName;
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_MARKET_TOKEN_SYMBOL]: (state, { marketIndex, tokenSymbol }) => {
    state.markets[marketIndex].token.symbol = tokenSymbol;
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_MARKET_TOKEN_DECIMALS]: (state, { marketIndex, tokenDecimals }) => {
    state.markets[marketIndex].token.decimals = Number(tokenDecimals);
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_MARKET_CASH]: (state, { marketIndex, marketCash }) => {
    state.markets[marketIndex].cash = Number(marketCash);
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_MARKET_PRICE]: (state, { marketIndex, marketPrice }) => {
    state.markets[marketIndex].price = Number(marketPrice);
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_MARKET_BORROW_RATE]: (state, { marketIndex, marketBorrowRate }) => {
    state.markets[marketIndex].borrowRate = Number(marketBorrowRate);
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_MARKET_TOTAL_BORROWS]: (state, { marketIndex, marketBorrows }) => {
    state.markets[marketIndex].borrowed = Number(marketBorrows);
  },
  // eslint-disable-next-line no-shadow
  [constants.CONTROLLER_SET_MARKET_TOTAL_SUPPLIES]: (state, { marketIndex, marketSupplies }) => {
    state.markets[marketIndex].supplied = Number(marketSupplies);
  },
};

const getters = {};

export default {
  state,
  actions,
  mutations,
  getters,
};
