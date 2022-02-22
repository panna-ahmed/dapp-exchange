import { EVM_REVERT, tokens } from './helpers';

const Token = artifacts.require('./Token');
require('chai').use(require('chai-as-promised')).should();

contract('Token', ([deployer, receiver]) => {
  let token;
  const totalSupply = tokens(100000).toString();
  beforeEach(async () => {
    token = await Token.new();
  });
  describe('deployment', () => {
    it('tracks the name', async () => {
      const result = await token.name();
      result.should.equal('DApp Token');
    });

    it('tracks the symbol', async () => {
      const result = await token.symbol();
      result.should.equal('DAPP');
    });

    it('tracks the decimals', async () => {
      const result = await token.decimals();
      result.toString().should.equal('18');
    });

    it('tracks the supply', async () => {
      const result = await token.totalSupply();
      result.toString().should.equal(totalSupply.toString());
    });

    it('assigns total supply to the deployer', async () => {
      const result = await token.balanceOf(deployer);
      result.toString().should.equal(totalSupply.toString());
    });
  });

  describe('sending tokens', () => {
    let amount;
    let result;

    describe('success', () => {
      beforeEach(async () => {
        amount = tokens(100);
        result = await token.transfer(receiver, amount, {
          from: deployer,
        });
      });

      it('transfers token balances', async () => {
        let balanceOf = await token.balanceOf(deployer);
        balanceOf.toString().should.equal(tokens(99900).toString());
        balanceOf = await token.balanceOf(receiver);
        balanceOf.toString().should.equal(tokens(100).toString());
      });

      it('emits transfer', () => {
        const log = result.logs[0];
        log.event.should.eq('Transfer');
        const event = log.args;
        event.from.toString().should.equal(deployer, 'from is correct');
        event.to.toString().should.equal(receiver, 'to is correct');
        event.value
          .toString()
          .should.equal(amount.toString(), 'amount is correct');
      });
    });

    describe('failure', () => {
      it('rejects insufficient balance', async () => {
        let invalidAmount = tokens(100000000);
        await token
          .transfer(receiver, invalidAmount, { from: deployer })
          .should.be.rejectedWith(EVM_REVERT);

        invalidAmount = tokens(10);
        await token
          .transfer(deployer, invalidAmount, { from: receiver })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it('rejects invalid recipients', async () => {
        await token.transfer(0x0, amount, { from: deployer }).should.be
          .rejected;
      });
    });
  });
});
