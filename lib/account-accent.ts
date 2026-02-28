const GOLDEN_ANGLE = 137.508;

export const getAccountAccentColor = (accountId: number) => {
  const normalizedId = Math.abs(accountId);
  const hue = (normalizedId * GOLDEN_ANGLE) % 360;

  return `hsl(${hue.toFixed(1)} 90% 75%)`;
};
