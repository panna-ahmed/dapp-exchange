import { web3 } from '@openzeppelin/test-helpers/src/setup';
import { EVM_REVERT, tokens, ether } from './helpers';

const Exchange = artifacts.require('./Exchange');
const Token = artifacts.require('./Token');

const { constants } = require('@openzeppelin/test-helpers');

require('chai').use(require('chai-as-promised')).should();

contract('Exchange', ([deployer, feeAccount, user1]) => {
  let exchange, token;
  const feePercent = 10;
  beforeEach(async () => {
    token = await Token.new();
    token.transfer(user1, tokens(100), { from: deployer });
    exchange = await Exchange.new(feeAccount, feePercent);
  });
  describe('deployment', () => {
    it('tracks the fee account', async () => {
      const result = await exchange.feeAccount();
      result.should.equal(feeAccount);
    });

    it('tracks the fee percent', async () => {
      const result = await exchange.feePercent();
      result.toString().should.equal(feePercent.toString());
    });
  });

  describe('fallback', () => {
    it('reverts when ether is sent', async () => {
      await exchange
        .sendTransaction({ value: 1, from: user1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe('depositing ether', () => {
    let amount, result;
    beforeEach(async () => {
      amount = ether(1);
      result = await exchange.depositEther({ from: user1, value: amount });
    });

    it('tracks the ether deposit', async () => {
      const balance = await exchange.tokens(constants.ZERO_ADDRESS, user1);
      balance.toString().should.equal(amount.toString());
    });

    it('emits deposit', () => {
      const log = result.logs[0];
      log.event.should.eq('Deposit');
      const event = log.args;
      event.token
        .toString()
        .should.equal(constants.ZERO_ADDRESS, 'token is correct');
      event.user.toString().should.equal(user1, 'user is correct');
      event.amount
        .toString()
        .should.equal(amount.toString(), 'amount is correct');
      event.balance
        .toString()
        .should.equal(amount.toString(), 'balance is correct');
    });
  });

  describe('depositing tokens', () => {
    let result, amount;

    beforeEach(async () => {
      amount = tokens(10);
    });

    describe('success', async () => {
      beforeEach(async () => {
        await token.approve(exchange.address, amount, { from: user1 });
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        });
      });

      it('tracks the token deposit', async () => {
        let balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());
        balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal(amount.toString());
      });

      it('emits deposit', () => {
        const log = result.logs[0];
        log.event.should.eq('Deposit');
        const event = log.args;
        event.token.toString().should.equal(token.address, 'token is correct');
        event.user.toString().should.equal(user1, 'user is correct');
        event.amount
          .toString()
          .should.equal(amount.toString(), 'amount is correct');
        event.balance
          .toString()
          .should.equal(amount.toString(), 'balance is correct');
      });
    });

    describe('failure', async () => {
      it('rejects ether deposit', async () => {
        await exchange
          .depositToken(constants.ZERO_ADDRESS, amount, {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it('fails when no tokens are approved', async () => {
        await exchange
          .depositToken(token.address, amount, {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });
});
