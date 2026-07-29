const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/**
 * '2026-08-26' → '26 de agosto'. Se formatea a mano en vez de con
 * toLocaleDateString porque esa API depende del locale del dispositivo:
 * una usuaria con el teléfono en inglés vería "August 26" en una pantalla
 * que por lo demás está en español.
 */
export function formatDateEs(iso: string, withYear = false): string {
  const [year, month, day] = iso.split("-").map(Number);
  const base = `${day} de ${MONTHS[month - 1]}`;
  return withYear ? `${base} de ${year}` : base;
}

export function greetingForHour(hour: number): string {
  if (hour < 6) return "Buenas noches";
  if (hour < 13) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}
