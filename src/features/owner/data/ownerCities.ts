/**
 * City options for ground create/edit. `id` must match `cities.id` / `grounds.city_id` in the DB.
 */
export const OWNER_CITY_OPTIONS: { id: string; label: string }[] = [
  { id: "1", label: "Porbandar" },
  { id: "2", label: "Rajkot" },
  { id: "3", label: "Jamnagar" },
  { id: "4", label: "Ahmedabad" },
  { id: "5", label: "Surat" },
  { id: "6", label: "Nadiad" },
  { id: "7", label: "Amreli" },
  { id: "8", label: "Bhavnagar" },
];

export function cityLabelForId(cityId: string | null | undefined): string {
  if (!cityId) return "—";
  const found = OWNER_CITY_OPTIONS.find((c) => c.id === cityId);
  return found?.label ?? "—";
}
