export function compose({
  date,
  highlights,
}: {
  date: string;
  highlights: string;
}) {
  return `# ${date}\n\n${highlights}`;
}
