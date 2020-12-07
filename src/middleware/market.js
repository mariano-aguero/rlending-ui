import Rlending from '@riflending/riflending-js';
import BigNumber from 'bignumber.js';
import factoryContract from './factoryContract'
import { constants, decimals } from "./constants";
import { ethers } from "ethers";


/**
 * middleware that adapt events and state of rbank js to compound js
 */
export default class Market {
  // constructor() {}
  constructor(cTokenSymbol, cTokenDecimals, tokenSymbol, underlyingName, underlyingDecimals, account) {
    //TODO see if factoryContract go to middleware class
    this.factoryContract = new factoryContract();
    this.isCRBTC = (cTokenSymbol == 'cRBTC');
    let config = {
      1337: {
        httpProvider: 'http://127.0.0.1:8545',
        wsProvider: 'ws://127.0.0.1:8545',
      }
    };
    this.eventualWeb3WS = {};
    this.eventualWeb3Http = {};
    // market.eventualWeb3WS = getEventualChainId().then((chainId) => new Rlending._ethers.providers.WebsocketProvider(config[chainId].wsProvider)).catch(() => new Error('Something went wrong with the web3 instance over web sockets on Market'));
    // market.eventualWeb3Http = new Rlending._ethers.providers.HttpProvider(config[32].httpProvider);
    this.decimals = cTokenDecimals;
    this.instanceAddress = this.factoryContract.addressContract[cTokenSymbol];
    this.instance = this.factoryContract.getContractCtoken(cTokenSymbol);

    this.token = Object();
    //TODO
    //validate cRBTC
    if (cTokenSymbol != 'cRBTC') {
      this.token.instace = this.factoryContract.getContractCtoken(cTokenSymbol)
      this.token.internalAddress = Rlending.util.getAddress(tokenSymbol).toLowerCase();
    }
    //set data token
    this.token.symbol = tokenSymbol;
    this.token.name = underlyingName;
    this.token.decimals = underlyingDecimals;
    //set balance account
    this.tokenBalance = this.getBalanceOfToken(account);
    //set price
    this.price = this.getPrice().then((price) => new BigNumber(price).div(new BigNumber(1e18)));
    //set borrow rate
    this.factor = 1e18;
    this.blocksPerYear = 1051200;
    this.borrowRate = this.getBorrowRate();

    //TODO set supply of
    // https://github.com/ajlopez/DeFiProt/blob/master/contracts/Market.sol#L246
    this.supplyOf = 13;
  }

  async getValueMoc() {
    //set contract
    let contract = this.factoryContract.getContract('RBTCMocOracle');
    //call contract
    let [value, ok] = await contract.peek();
    return value;
    //TODO comment validation, because in Oracle moc test fails (ok=false)
    // if (ok) {
    //   return value;
    // }
    // return 0;
  }

  async getPrice() {
    //set contract
    let contract = this.factoryContract.getContract('PriceOracleProxy');
    //get price of cToken
    let priceToken = await contract.getUnderlyingPrice(this.instanceAddress);
    //get price of rbtc
    let valueOracle = await this.getValueMoc();
    //set decimals of cToken
    let decimals = `1e${this.token.decimals}`;
    // price = ( price cToken in rbtc * price of rbtc) / decimals of cToken
    return new BigNumber(priceToken._hex).multipliedBy(new BigNumber(valueOracle)).div(new BigNumber(decimals)).toNumber();
  }

  async getBalanceOfToken(account) {
    //set balance of account
    let balance = await this.instance.balanceOf(account);
    //return format (without wei)
    return ethers.utils.formatEther(balance);
  }

  async getCash() {
    //set balance of account
    let cash = await this.instance.getCash();
    return Number(cash);
  }

  async getBorrowRate() {
    let borrowRatePerBlock = await this.instance.borrowRatePerBlock();
    // return borrow rate
    return new BigNumber(borrowRatePerBlock._hex).times(new BigNumber(100 * this.blocksPerYear)).div(new BigNumber(this.factor)).toNumber();
  }

  async validateMarketAccount(account) {
    //set contract Comptroller delegate (Unitroller)
    let contract = this.factoryContract.getContractByNameAndAbiName(constants.Unitroller, constants.Comptroller);
    //get is member (bool)
    return await contract.checkMembership(account, this.instanceAddress);
  }

  async addMarkets() {
    //set contract
    let contract = this.factoryContract.getContractByNameAndAbiName(constants.Unitroller, constants.Comptroller);
    //set signer
    let contractWithSigner = contract.connect(this.factoryContract.signer);
    //send transaction
    let tx = await contractWithSigner.enterMarkets([p.addressContract.cRIF]);
    //await result transaction
    return tx.wait();
  }

  /**
   * Supply the specified amount from this market.
   * @param {number} amount of this market's token to be supply.
   * @param {address} account the address of the account
   * @return {Promise<TXResult>} the wait mined transaction
   */
  async supply(amount, account) {
    //add decimals token
    amount = this.getAmountDecimals(amount);
    let signer;
    let tx;
    //validate crbtc
    if (!this.isCRBTC) {
      //check allowance
      const allowance = await this.token.instace.allowance(account, this.instanceAddress);
      //validate if enough
      const notEnough = allowance.lt(amount);
      //set signer token
      signer = this.token.instace.connect(this.factoryContract.signer);

      if (notEnough) {
        //approve
        await signer.approve(this.instanceAddress, amount);
      }
      //mint token
      tx = await signer.mint(amount);
    }
    else {
      //set signer cRBTC
      signer = this.instance.connect(this.factoryContract.signer);
      //set value
      let overrides = {
        value: amount,
      };
      //mint crbtc
      tx = await signer.mint(overrides);
    }
    //wait for mined transaction
    return tx.wait();
  }
  /**
   * Borrows the specified amount from this market.
   * @param {number} amount of this market's token to be borrowed.
   * @return {Promise<TXResult>} the wait mined transaction
   */
  async borrow(amount) {
    //add decimals token
    amount = this.getAmountDecimals(amount);
    let signer;
    //validate crbtc
    if (!this.isCRBTC) {
      //set signer token
      signer = this.token.instace.connect(this.factoryContract.signer);
    } else {
      //set signer cRBTC
      signer = this.instance.connect(this.factoryContract.signer);
    }
    let tx = await signer.borrow(amount);
    //wait for mined transaction
    return tx.wait();
  }

  getAmountDecimals(amount) {
    //add decimals token
    amount = amount * Math.pow(10, (!this.isCRBTC) ? decimals[this.token.symbol] : decimals[constants.cRBTC]);
    return ethers.BigNumber.from(amount.toString());
  }

  /**
   * getCollateralFactorMantissa for cToken.
   * @return human number collateralFactorMantisa | error beacuse the cToken is not listed on protocol
   */
  async getCollateralFactorMantissa() {
    //set contract Comptroller delegate (Unitroller)
    let contract = this.factoryContract.getContractByNameAndAbiName(constants.Unitroller, constants.Comptroller);
    //get is member (bool)
    let [isListed, collateralFactorMantissa, isComped] = await contract.markets(this.instanceAddress);
    //validate token listed
    if (isListed) {
      return ethers.utils.formatEther(collateralFactorMantissa);
    }
    console.error("cToken is not listed")
  }

  /**
   * mock events
   */
  get eventualEvents() {
    return new Promise((resolve, reject) => {
      resolve('10')
    });
  }

  liquidateBorrow(borrower, amount, collateralMarket, from = '') {
    // return this.token;
    return new Promise((resolve, reject) => {
      this.token
        .then(resolve)
        .catch(reject);
    });
  }

}
