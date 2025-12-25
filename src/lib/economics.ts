export const canAfford = (balance: number | string, price: number, fee: number) => {
  const bal = Number(balance) || 0;
  return bal >= (price + fee);
};
