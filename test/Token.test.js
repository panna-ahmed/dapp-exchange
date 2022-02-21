const Token = artifacts.require('./Token');
require('chai').use(require('chai-as-promised')).should();
contract('Token', (accounts) => {
  let token;
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

    it('tracks the name', async () => {
      const result = await token.decimals();
      result.toString().should.equal('18');
    });

    it('tracks the name', async () => {
      const result = await token.totalSupply();
      result.toString().should.equal('100000000000000000000000');
    });
  });
});
