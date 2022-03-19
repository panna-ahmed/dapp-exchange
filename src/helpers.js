export const DECIMALS = 10 ** 18;
export const ether = (wei) => {
  if (wei) {
    return wei / DECIMALS;
  }
};

export const tokens = ether;
export const RED = 'danger';
export const GREEN = 'success';
