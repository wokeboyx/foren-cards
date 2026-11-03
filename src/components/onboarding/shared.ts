export const formatDate = (iso: string | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

export type DetailItem = {
  label: string;
  value?: string | number | null;
  wide?: boolean;
};
