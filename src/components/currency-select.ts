import { CURRENCY_NAME } from "@/domain/money";
import type { Currency } from "@/domain/types";

/** "United States dollar (USD)" */
export const currencyLabel = (c: Currency) => `${CURRENCY_NAME[c]} (${c})`;
