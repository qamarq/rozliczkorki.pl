const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

export function formatPLN(value: number) {
  return plnFormatter.format(value);
}
