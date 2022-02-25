export const EVM_REVERT = 'VM Exception while processing transaction: revert';
export const ether = (n) => {
  return new web3.utils.BN(web3.utils.toWei(n.toString(), 'ether'));
};

export const tokens = (n) => ether(n);
