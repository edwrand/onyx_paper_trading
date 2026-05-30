export function parseName(name: string): { matchup: string; outcome: string } {
  const parts = name.split(' ; ')
  return { matchup: parts[0] ?? name, outcome: parts[1] ?? '' }
}
