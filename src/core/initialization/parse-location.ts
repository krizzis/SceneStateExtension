export function parseLocationFromScenario(scenarioText: string): string | null {
  const locationMatch = scenarioText.match(/^\[Location\]:\s*(.+)$/im);
  if (!locationMatch) {
    return null;
  }

  const value = locationMatch[1]?.trim();
  return value ? value : null;
}
