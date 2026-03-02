/**
 * Mock data for testing
 */

export const mockJournalEvent = {
  timestamp: '2026-02-28T12:00:00.000Z',
  event: 'FSDJump',
  StarSystem: 'Sol',
  SystemAddress: 10,
  StarPos: [0, 0, 0],
  SystemAllegiance: 'Federation',
  JumpDist: 5.5,
  FuelUsed: 0.5,
  FuelLevel: 32.5,
};

export const mockDockedEvent = {
  timestamp: '2026-02-28T12:05:00.000Z',
  event: 'Docked',
  StationName: 'Jameson Memorial',
  StationType: 'Outpost',
  StarSystem: 'Sol',
  SystemAddress: 10,
  StationAllegiance: 'Federation',
  StationServices: ['dock', 'commodities', 'shipyard'],
};

export const mockUndockedEvent = {
  timestamp: '2026-02-28T12:10:00.000Z',
  event: 'Undocked',
  StationName: 'Jameson Memorial',
  StarSystem: 'Sol',
};

export const mockScanEvent = {
  timestamp: '2026-02-28T12:15:00.000Z',
  event: 'Scan',
  StarSystem: 'Sol',
  BodyName: 'Earth',
  BodyID: 3,
  PlanetClass: 'High metal content body',
  Radius: 6371000,
};

export const mockMissionAcceptedEvent = {
  timestamp: '2026-02-28T12:20:00.000Z',
  event: 'MissionAccepted',
  Name: 'Mission_Sightseeing_Criminal_BO',
  Faction: 'Lave Corp',
  MissionID: 987654321,
  Reward: 50000,
};

/**
 * Create an array of mock events for testing
 */
export function createMockEvents(count: number): Array<Record<string, unknown>> {
  const events = [];
  for (let i = 0; i < count; i++) {
    const hour = Math.floor(i / 60);
    const minute = i % 60;
    events.push({
      timestamp: `2026-02-28T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
      event: i % 2 === 0 ? 'FSDJump' : 'Docked',
      StarSystem: i % 3 === 0 ? 'Sol' : 'Alpha Centauri',
      SystemAddress: 10 + i,
      JumpDist: 5.5 + i * 0.1,
      FuelUsed: 0.5,
      FuelLevel: 32.5 - i * 0.1,
    });
  }
  return events;
}

/**
 * Convert raw mock data to ParsedEventData format
 */
export function toParsedEventData(event: Record<string, unknown>) {
  return {
    timestamp: event.timestamp as string,
    event: event.event as string,
    commander: (event.Commander as string) ?? null,
    system_name: (event.StarSystem as string) ?? null,
    station_name: (event.StationName as string) ?? null,
    body: (event.BodyName as string) ?? null,
    raw_json: JSON.stringify(event),
  };
}
