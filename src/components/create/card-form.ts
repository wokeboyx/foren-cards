export type CardFormErrors = Partial<
  Record<
    "nickname" | "holderId" | "cap" | "daily" | "txn" | "limit" | "permissions",
    string
  >
>;

export const expiryLabel = (e: string) => {
  const [y, m] = e.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
};
