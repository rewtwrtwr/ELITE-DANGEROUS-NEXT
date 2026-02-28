/**
 * Event Formatter - Elite Dangerous Journal Events
 * Provides bilingual (ru/en) formatting for all journal event types
 */

export type FormatType = 'credits' | 'distance' | 'coords' | 'percent' | 'number' | 'datetime';

export interface EventFieldFormat {
  key: string;
  label: string;
  labelRu: string;
  format?: FormatType;
  optional?: boolean;
}

export interface EventFormat {
  event: string;
  title: string;
  titleRu: string;
  category: string;
  icon: string;
  fields: EventFieldFormat[];
  summaryTemplate: string;
  summaryTemplateRu: string;
}

export interface FormattedField {
  label: string;
  value: string;
}

export interface FormattedEvent {
  title: string;
  titleRu: string;
  category: string;
  icon: string;
  summary: string;
  summaryRu: string;
  details: FormattedField[];
}

export interface CategoryColor {
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  travel: { color: '#4FC3F7', bgColor: 'rgba(79, 195, 247, 0.15)', borderColor: '#4FC3F7' },
  combat: { color: '#FF5252', bgColor: 'rgba(255, 82, 82, 0.15)', borderColor: '#FF5252' },
  trade: { color: '#69F0AE', bgColor: 'rgba(105, 240, 174, 0.15)', borderColor: '#69F0AE' },
  exploration: { color: '#FFD54F', bgColor: 'rgba(255, 213, 79, 0.15)', borderColor: '#FFD54F' },
  engineering: { color: '#B388FF', bgColor: 'rgba(179, 136, 255, 0.15)', borderColor: '#B388FF' },
  missions: { color: '#FF8A65', bgColor: 'rgba(255, 138, 101, 0.15)', borderColor: '#FF8A65' },
  station: { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e' },
  social: { color: '#F48FB1', bgColor: 'rgba(244, 143, 177, 0.15)', borderColor: '#F48FB1' },
  cargo: { color: '#64748b', bgColor: 'rgba(100, 116, 75, 0.15)', borderColor: '#64748b' },
  materials: { color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.15)', borderColor: '#14b8a6' },
  ship: { color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1' },
  carrier: { color: '#A5D6A7', bgColor: 'rgba(165, 214, 167, 0.15)', borderColor: '#A5D6A7' },
  squadron: { color: '#F43f5e', bgColor: 'rgba(244, 63, 94, 0.15)', borderColor: '#F43f5e' },
  powerplay: { color: '#FFB74D', bgColor: 'rgba(255, 183, 77, 0.15)', borderColor: '#FFB74D' },
  game: { color: '#e0e0e0', bgColor: 'rgba(224, 224, 224, 0.15)', borderColor: '#e0e0e0' },
  other: { color: '#B0BEC5', bgColor: 'rgba(176, 190, 197, 0.15)', borderColor: '#B0BEC5' },
  unknown: { color: '#9e9e9e', bgColor: 'rgba(158, 158, 158, 0.15)', borderColor: '#9e9e9e' },
  deprecated: { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.2)', borderColor: '#6b7280' },
};

export const CATEGORY_ICONS: Record<string, string> = {
  travel: '🚀',
  combat: '⚔️',
  trade: '💰',
  exploration: '🔭',
  engineering: '🔧',
  missions: '📋',
  odyssey: '👤',
  fleet: '🛸',
  social: '👥',
  system: '⚙️',
  engine: '🔌',
  other: '📌',
};

function formatCredits(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('en-US').format(value) + ' CR';
}

function formatDistance(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  if (value >= 1000) {
    return (value / 1000).toFixed(2) + ' kLy';
  }
  return value.toFixed(2) + ' Ly';
}

function formatDistanceLs(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + ' M km';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(2) + ' kkm';
  }
  return value.toFixed(2) + ' km';
}

function formatCoords(pos: number[] | undefined): string {
  if (!pos || !Array.isArray(pos) || pos.length < 3) return '';
  return `X:${pos[0].toFixed(1)} Y:${pos[1].toFixed(1)} Z:${pos[2].toFixed(1)}`;
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  return (value * 100).toFixed(1) + '%';
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDatetime(timestamp: string | undefined): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return timestamp;
  }
}

function formatValue(value: unknown, format?: FormatType): string {
  if (value === undefined || value === null) return '';
  
  switch (format) {
    case 'credits':
      return formatCredits(Number(value));
    case 'distance':
      return formatDistance(Number(value));
    case 'coords':
      return formatCoords(value as number[]);
    case 'percent':
      return formatPercent(Number(value));
    case 'number':
      return formatNumber(Number(value));
    case 'datetime':
      return formatDatetime(value as string);
    default:
      if (typeof value === 'number') {
        return formatNumber(value);
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);
  }
}

function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = formatValue(data[key]);
    return value || '-';
  });
}

export function formatEvent(eventType: string, data: Record<string, unknown>): FormattedEvent {
  const format = EVENT_FORMATS[eventType];
  
  if (!format) {
    return formatEventFallback(eventType, data);
  }
  
  const details: FormattedField[] = [];
  
  for (const field of format.fields) {
    const value = data[field.key];
    if (value !== undefined && value !== null && value !== '') {
      details.push({
        label: field.label,
        value: formatValue(value, field.format),
      });
    } else if (!field.optional) {
      details.push({
        label: field.label,
        value: '-',
      });
    }
  }
  
  const summary = interpolateTemplate(format.summaryTemplate, data);
  const summaryRu = interpolateTemplate(format.summaryTemplateRu, data);
  
  return {
    title: format.title,
    titleRu: format.titleRu,
    category: format.category,
    icon: format.icon,
    summary,
    summaryRu,
    details,
  };
}

function formatEventFallback(eventType: string, data: Record<string, unknown>): FormattedEvent {
  const category = getCategoryForEvent(eventType);
  const icon = CATEGORY_ICONS[category] || '📌';
  
  const details: FormattedField[] = [];
  const skipKeys = ['timestamp', 'event', 'event_local'];
  
  for (const [key, value] of Object.entries(data)) {
    if (!skipKeys.includes(key) && value !== undefined && value !== null) {
      details.push({
        label: key,
        value: formatValue(value),
      });
    }
  }
  
  const mainField = data.StarSystem || data.System || data.BodyName || data.Target || data.Name || data.MissionName || '';
  
  return {
    title: eventType,
    titleRu: eventType,
    category,
    icon,
    summary: mainField ? `${eventType} • ${mainField}` : eventType,
    summaryRu: mainField ? `${eventType} • ${mainField}` : eventType,
    details,
  };
}

function getCategoryForEvent(eventType: string): string {
  const categories: Record<string, string[]> = {
    combat: ['Bounty', 'FactionKillBond', 'CapShipBond', 'ShipTargeted', 'Died', 'Interdicted', 'Interdiction', 'HullDamage', 'ShieldState', 'ShieldHit', 'CrimeVictim', 'CrimeRecord', 'CommitCrime', 'EjectCargo', 'PvPKill', 'Resurrect', 'Assassination', 'CombatBond', 'ShieldCell', 'UnderAttack'],
    trade: ['MarketBuy', 'MarketSell', 'BuyTradeData', 'SellTradeData', 'CollectCargo', 'Cargo', 'MiningRefined', 'RefuelAll', 'RefuelPartial', 'Repair', 'RepairAll', 'BuyAmmo', 'BuyDrones', 'SellDrones', 'MaterialTrade', 'TradePromoted', 'BlackMarket', 'SmuggleData'],
    exploration: ['Scan', 'FSSDiscoveryScan', 'FSSAllBodiesFound', 'FSSBodySignals', 'SellExplorationData', 'MultiSellExplorationData', 'CodexEntry', 'ScanOrganic', 'SellOrganicData', 'MaterialCollected', 'MaterialDiscarded', 'MaterialDiscovered', 'DiscoveryScan', 'NavBeaconScan', 'SAAScanComplete', 'SAASignalsFound'],
    travel: ['Location', 'StartJump', 'FSDJump', 'SupercruiseEntry', 'SupercruiseExit', 'Docked', 'Undocked', 'Liftoff', 'Touchdown', 'LeaveBody', 'ApproachBody', 'ApproachSettlement', 'NavRoute', 'FuelScoop', 'JumpSquonk', 'CarrierJump'],
    engineering: ['Synthesise', 'EngineerCraft', 'EngineerProgress', 'EngineerContribution', 'Blueprint', 'ModifyCraft', 'AfmuRepairs', 'ModuleModify', 'Repair', 'Restock', 'UpgradeWeapon', 'UpgradeSuit', 'TechnologyBroker'],
    missions: ['MissionAccepted', 'MissionAbandoned', 'MissionFailed', 'MissionExpired', 'MissionCompleted', 'MissionRedirected', 'Missions', 'MissionReward', 'MissionFailed', 'MissionOnlineCompletion'],
    social: ['Friends', 'WingInvite', 'WingJoin', 'WingAdd', 'WingLeave', 'PowerplayFastTrack', 'PowerplayVote', 'ReceiveText', 'SendText', 'NpcCrewPaidWage', 'NpcCrewRank', 'NpcCrewHire', 'NpcCrewFire', 'CrewMemberJoins', 'CrewMemberQuits', 'CrewMemberRoleChange', 'JoinACrew', 'KickCrewMember'],
    odyssey: ['Embark', 'Disembark', 'Backpack', 'BackpackChange', 'SuitLoadout', 'Loadout', 'BuySuit', 'SellSuit', 'UpgradeSuit', 'BuyWeapon', 'SellWeapon', 'UpgradeWeapon', 'Weapon', 'UseConsumable', 'ActivateEffect', 'SwitchSuit', 'SwitchWeapon', 'CallVehicle', 'CancelDocking', 'CancelTaxi', 'CreateSuitLoadout', 'DeleteSuitLoadout', 'DisembarkDetected', 'DropItem', 'DropItems', 'EdEngineerCraft', 'Elevator', 'EndCrewSquad', 'EndExitOverride', 'EnteredAnomaly', 'EnterSupercruise', 'ExitMatterSupercruise', 'FireMissile', 'FootLanding', 'FootTakeOff', 'FuelScoop', 'HealCrew', 'JetConeBoost', 'JetConeDamage', 'LaunchDrone', 'LaunchFighter', 'LeaveBody', 'LeaveSettlement', 'LiftoffFromBody', 'Market', 'ModuleInfo', 'Music', 'NpcCrewPaidWage', 'NpcCrewRank', 'OpenCargo', 'Parked', 'Powerplay', 'ProcessRawMaterials', 'Progress', 'Promotion', 'QuitGame', 'Rank', 'ReceiveText', 'RebootRepair', 'ReceiveText', 'Rescue', 'Respawn', 'Rest', 'Reward', 'SettlementApproach', 'SettlementLanded', 'ShipLocker', 'ShipTargeted', 'ShowBlindLog', 'ShowContract', 'ShowUpgrade', 'Squadrons', 'StartJump', 'Status', 'Stroll', 'SwitchSuit', 'Taxi', 'TaxiDestroyVehicle', 'Touchdown', 'TransferCargo', 'TurnOn', 'UnderAttack', 'UseItem', 'USSDrop', 'VehicleSwitch', 'WantedInterceptorRescue', 'Weight'],
    fleet: ['CarrierJump', 'CarrierStats', 'CarrierBuy', 'CarrierSell', 'CarrierTradeOrder', 'CarrierBankTransfer', 'CarrierCrewHire', 'CarrierCrewFire', 'CarrierModulePack', 'CarrierShipPack', 'CarrierFuelPool', 'ModuleBuy', 'ModuleSell', 'ModuleStore', 'ModuleRetrieve', 'ShipyardBuy', 'ShipyardSell', 'ShipyardTransfer', 'Outfitting', 'Market', 'StoredShips', 'ShipyardNew', 'ShipyardSell'],
    system: ['Rank', 'Progress', 'Statistics', 'NetworkStatistics', 'ClearSavedGame', 'SavedGame', 'LoadGame', 'Fileheader', 'Shutdown', 'QuitGame', 'StartUp', 'Shutdown', 'Location', 'AllEnergyBanksDepleted', 'AllFieldsDeactivated', 'BaseAtmosphereExtracted', 'BaseBountyBond', 'BaseCargoDownloaded', 'BaseClaimBounty', 'BaseEnteredAnomaly', 'BaseFactionKillBond', 'BaseMissionCompleted', 'BaseMissionFailed', 'BasePowerConsumption', 'BaseRank', 'BaseReputation', 'BaseStored', 'BaseStatistics', 'BaseStatus', 'BuyExplorationData', 'BuyMicroResources', 'BuySuit', 'CargoDepot', 'ChangeEnginePool', 'ChangeStarClass', 'ChangeSystem', 'ChargeECM', 'ChargeFuelCharger', 'Cheer', 'CockpitBreached', 'CodexEntry', 'CollectCargo', 'CollectItems', 'Commander', 'CommitCrime', 'CommunityGoalDiscard', 'CommunityGoalJoin', 'CommunityGoalLeave', 'CommunityGoalReward', 'Continued', 'CosmicRadioSource', 'CrewMemberQuits', 'CrewRoster', 'DatalinkScan', 'DatalinkVoucher', 'DataScanned', 'Death', 'Died', 'DisbandedSquad', 'DiscoveryScan', 'Docked', 'DockingCancelled', 'DockingDenied', 'DockingGranted', 'DockingTimeout', 'DockingRequested', 'DockFighter', 'DropCargo', 'DynamicBrothel', 'EjectCargo', 'Embark', 'EngineerCraft', 'EngineerLegacyConvert', 'EngineerProgress', 'EngineerWork', 'EnteredResonance', 'EscapeInterdiction', 'EscapeVector', 'FactionKillBond', 'FactionMaintenanceBond', 'FactionOperation', 'FactionWar', 'FighterDestroyed', 'FighterLaunched', 'FighterRebuilt', 'FoodWaterConsumed', 'FuelCharger', 'FuelCollecting', 'FuelScooped', 'FSSAllBodiesFound', 'FSSBodySignals', 'FSSDiscoveryScan', 'FSSSignalDiscovered', 'FSDJump', 'FSDTarget', 'GameplayStatistics', 'Geiser', 'GetUserMovement', 'Gravity', 'GunsDeploy', 'GunsLocked', 'Happens', 'HardpointsDeploy', 'HardpointsLocked', 'HeatDamage', 'HeatWarning', 'Herald', 'HullDamage', 'HullRebuilt', 'Interdiction', 'Interdicted', 'ItemCollected', 'ItemDestroyed', 'ItemDropped', 'ItemFound', 'ItemGrieved', 'JoinACrew', 'JoinedSquad', 'JumpClamp', 'JumpDriveActive', 'JumpDriveCharging', 'JumpDriveCoolDown', 'JumpDriveDischarge', 'JumpEnter', 'JumpExit', 'KickCrewMember', 'KillBond', 'Kicked', 'Landed', 'LandingGear', 'LandingGearDeploy', 'LandingTools', 'LaunchDrone', 'LaunchFighter', 'LaunchSRV', 'LeaveBody', 'LeftSquad', 'Liftoff', 'LinkDetected', 'LoadGame', 'Loadout', 'LobbyClosed', 'LobbyOpened', 'Location', 'LockFighter', 'LogError', 'LogJSON', 'LogMessage', 'Maintenance', 'Market', 'MaterialCollected', 'MaterialDiscarded', 'MaterialDiscovered', 'Materials', 'MatterRefining', 'MedicalChute', 'Mercenary', 'MessageReceived', 'MissionAccepted', 'MissionAbandoned', 'MissionCompleted', 'MissionFailed', 'MissionRedirected', 'MissionReward', 'ModuleArray', 'ModuleInfo', 'ModuleRetrieve', 'ModuleStore', 'ModuleSwap', 'MoonScoop', 'MultiCrewAssignment', 'MultiCrewChangeRole', 'MultiCrewEnter', 'MultiCrewExit', 'MultiCrewOtherEnter', 'MultiCrewOtherExit', 'MultiSellExplorationData', 'Music', 'NpcCrewRank', 'NpcCrewHired', 'NpcCrewJoined', 'NpcCrewLeft', 'NpcCrewRevenueShare', 'NpcCrewWage', 'OdysseySuit', 'OnCrimeWatch', 'OnSuitSpecialist', 'Outfitting', 'Overheat', 'OverheatDamage', 'PackRat', 'PassengerManifest', 'Passengers', 'PayBounties', 'PayFines', 'PayLegacyFines', 'PerformanceOverride', 'Persona', 'PilotRank', 'PlanetaryLanding', 'PlayerAvatar', 'PlayerController', 'PlayerCargo', 'PlayerCockpit', 'PlayerCredits', 'PlayerDead', 'PlayerDriving', 'PlayerFlipped', 'PlayerFoot', 'PlayerFuel', 'PlayerHealth', 'PlayerImpulse', 'PlayerInMothership', 'PlayerLanded', 'PlayerLanding', 'PlayerLife', 'PlayerLocation', 'PlayerRescue', 'PlayerShop', 'PlayerSpaceship', 'PlayerStatus', 'PlayerStatusSimple', 'Position', 'Powerplay', 'PowerplayCollect', 'PowerplayDefect', 'PowerplayDeliver', 'PowerplayFastTrack', 'PowerplayJoin', 'PowerplayLeave', 'PowerplayPromotion', 'PowerplaySalary', 'PowerplayVote', 'PowerplayWin', 'PowerSave', 'PrivateGameSlot', 'Promotion', 'ProspectedAsteroid', 'PVPKill', 'Quit', 'RadarPlayerConflict', 'Recharge', 'ReceiveText', 'RefineryFlare', 'Repair', 'RepairDrone', 'RepairMaterials', 'RequestClearance', 'Rescue', 'Resonance', 'Rest', 'RestoreEject', 'Resume', 'Reward', 'RewardCredits', 'RoamingPatrol', 'RoleplayRequest', 'SafeType', 'SaveGame', 'Say', 'Scan', 'ScanOrgans', 'ScanSurface', 'SelfDestruct', 'SendText', 'Sensors', 'SetUserShipName', 'ShieldBench', 'ShieldBoost', 'ShieldCalibration', 'ShieldCell', 'ShieldFadedIn', 'ShieldFadedOut', 'ShieldFeedback', 'ShieldHealth', 'ShieldHit', 'ShieldPip', 'ShieldState', 'ShipCargo', 'ShipComponents', 'ShipCrafts', 'ShipCockpit', 'ShipCrashed', 'ShipDocked', 'ShipEmbarked', 'ShipFighter', 'ShipFlags', 'ShipFlyTo', 'ShipFreeze', 'ShipLanded', 'ShipLaunched', 'ShipManifest', 'ShipNameChange', 'ShipRenamed', 'ShipRolled', 'ShipStatus', 'ShipTargeted', 'ShipTurn', 'Shop', 'Shutdown', 'Silo', 'Situation', 'Sleeper', 'SleeperArchetype', 'SleeperWake', 'Slot', 'SmuggleData', 'Sovereign', 'SpaceAnomaly', 'SpaceStation', 'Spawn', 'SpecialCoordinates', 'StackingBonus', 'StandaloneFalcon', 'StarPos', 'Stars', 'StartJump', 'Statistic', 'Statistics', 'Status', 'StellarDensity', 'StoredShips', 'Suit', 'SuitModule', 'SuitMode', 'SupercruiseAbort', 'SupercruiseEntry', 'SupercruiseExit', 'SupercruiseFlight', 'SupercruiseTarget', 'SystemCoordinates', 'SystemScan', 'SystemStats', 'SystemsShutdown', 'Target', 'TargetedByFaction', 'TaxiDestroyVehicle', 'TaxiInbound', 'TaxiMission', 'TaxiOutbound', 'Team', 'TeamAccepted', 'TeamAudio', 'TeamCandidates', 'TeamChange', 'TeamDestroyed', 'TeamInvite', 'TeamJoined', 'TeamLeft', 'TeamMsg', 'Text', 'Thargoid', 'ThargoidProximity', 'ThargoidReward', 'ThermalConduction', 'ThrustImpacts', 'Thunder', 'Touchdown', 'Trade', 'TradeInstall', 'TradePromoted', 'TradeRemove', 'Trophy', 'Tunnel', 'Turhr', 'UADamage', 'UADetonation', 'UADismissed', 'UAIntel', 'UAResearch', 'UnderAttack', 'UndergroundTelem', 'UnequipWeapon', 'Unfriendly', 'Unknown', 'UnlockItem', 'Unmask', 'Unroll', 'UseConsumable', 'UseLegacyOdometer', 'UseShieldCell', 'UseTime', 'Vanguard', 'VehicleSwitch', 'Vestigial', 'VIPCharacters', 'Virgin', 'Wanted', 'WantedBy', 'Warning', 'Weapon', 'WeaponCost', 'Weather', 'WingAdd', 'WingJoin', 'WingLeave', 'WingUpdate', 'Work', 'WorkDone', 'WSDestroyed', 'WSIng', 'WSOut', 'WSSignal'],
  };
  
  for (const [cat, events] of Object.entries(categories)) {
    if (events.includes(eventType)) {
      return cat;
    }
  }
  
  if (eventType.includes('Mission')) return 'missions';
  if (eventType.includes('Carrier')) return 'fleet';
  if (eventType.includes('Suit') || eventType.includes('Backpack') || eventType.includes('Odyssey')) return 'odyssey';
  
  return 'other';
}

const EVENT_FORMATS: Record<string, EventFormat> = {
  // ==================== TRAVEL ====================
  FSDCharge: {
    event: 'FSDCharge',
    title: 'FSD Charging',
    titleRu: 'Зарядка FSD',
    category: 'travel',
    icon: '⚡',
    fields: [
      { key: 'JumpDist', label: 'Distance', labelRu: 'Дистанция', format: 'distance' },
      { key: 'Boosted', label: 'Boosted', labelRu: 'Усилен' },
    ],
    summaryTemplate: 'Charging • {JumpDist}',
    summaryTemplateRu: 'Зарядка • {JumpDist}',
  },
  FSDTarget: {
    event: 'FSDTarget',
    title: 'FSD Target',
    titleRu: 'Цель FSD',
    category: 'travel',
    icon: '🎯',
    fields: [
      { key: 'Name', label: 'System', labelRu: 'Система' },
      { key: 'Distance', label: 'Distance', labelRu: 'Дистанция', format: 'distance' },
    ],
    summaryTemplate: '{Name} • {Distance}',
    summaryTemplateRu: '{Name} • {Distance}',
  },
  LeaveBody: {
    event: 'LeaveBody',
    title: 'Leave Body',
    titleRu: 'Уход от тела',
    category: 'travel',
    icon: '👋',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'Body', label: 'Body', labelRu: 'Тело' },
    ],
    summaryTemplate: 'Left {Body}',
    summaryTemplateRu: 'Покинул {Body}',
  },
  Location: {
    event: 'Location',
    title: 'Location',
    titleRu: 'Локация',
    category: 'travel',
    icon: '📍',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'System', label: 'System', labelRu: 'Система' },
      { key: 'Body', label: 'Body', labelRu: 'Тело' },
      { key: 'BodyName', label: 'Body', labelRu: 'Тело' },
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
      { key: 'StationType', label: 'Type', labelRu: 'Тип' },
      { key: 'Docked', label: 'Docked', labelRu: 'Пристыкован' },
      { key: 'TaxRate', label: 'Tax Rate', labelRu: 'Налог', format: 'percent' },
      { key: 'Population', label: 'Population', labelRu: 'Население', format: 'number' },
      { key: 'Allegiance', label: 'Allegiance', labelRu: 'Принадлежность' },
      { key: 'Government', label: 'Government', labelRu: 'Правительство' },
      { key: 'Economy', label: 'Economy', labelRu: 'Экономика' },
    ],
    summaryTemplate: '{StarSystem}{System}',
    summaryTemplateRu: '{StarSystem}{System}',
  },
  FSDJump: {
    event: 'FSDJump',
    title: 'Hyperjump',
    titleRu: 'Гиперпрыжок',
    category: 'travel',
    icon: '🚀',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'JumpDist', label: 'Distance', labelRu: 'Дистанция', format: 'distance' },
      { key: 'FuelUsed', label: 'Fuel Used', labelRu: 'Топливо', format: 'number' },
      { key: 'FuelLevel', label: 'Fuel Level', labelRu: 'Топливо', format: 'number' },
      { key: 'StarPos', label: 'Position', labelRu: 'Позиция', format: 'coords' },
      { key: 'SystemSecurity', label: 'Security', labelRu: 'Безопасность' },
      { key: 'SystemAllegiance', label: 'Allegiance', labelRu: 'Принадлежность' },
      { key: 'SystemEconomy', label: 'Economy', labelRu: 'Экономика' },
      { key: 'SystemSecondEconomy', label: '2nd Economy', labelRu: 'Экономика 2' },
    ],
    summaryTemplate: '{StarSystem} • {JumpDist}',
    summaryTemplateRu: '{StarSystem} • {JumpDist}',
  },
  StartJump: {
    event: 'StartJump',
    title: 'Jump Start',
    titleRu: 'Начало прыжка',
    category: 'travel',
    icon: '🚀',
    fields: [
      { key: 'JumpType', label: 'Type', labelRu: 'Тип' },
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'JumpDist', label: 'Distance', labelRu: 'Дистанция', format: 'distance' },
    ],
    summaryTemplate: '{JumpType} • {StarSystem}',
    summaryTemplateRu: '{JumpType} • {StarSystem}',
  },
  SupercruiseEntry: {
    event: 'SupercruiseEntry',
    title: 'Supercruise Entry',
    titleRu: 'Вход в сверхкрейсерский режим',
    category: 'travel',
    icon: '⚡',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
    ],
    summaryTemplate: 'Supercruise • {StarSystem}',
    summaryTemplateRu: 'Сверхкрейсер • {StarSystem}',
  },
  SupercruiseExit: {
    event: 'SupercruiseExit',
    title: 'Supercruise Exit',
    titleRu: 'Выход из сверхкрейсерского режима',
    category: 'travel',
    icon: '🛑',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'Body', label: 'Body', labelRu: 'Тело' },
    ],
    summaryTemplate: '{StarSystem} • {Body}',
    summaryTemplateRu: '{StarSystem} • {Body}',
  },
  DockingRequested: {
    event: 'DockingRequested',
    title: 'Docking Requested',
    titleRu: 'Запрос стыковки',
    category: 'travel',
    icon: '📡',
    fields: [
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
    ],
    summaryTemplate: 'Requesting {StationName}',
    summaryTemplateRu: 'Запрос {StationName}',
  },
  DockingGranted: {
    event: 'DockingGranted',
    title: 'Docking Granted',
    titleRu: 'Стыковка разрешена',
    category: 'travel',
    icon: '✅',
    fields: [
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
      { key: 'LandingPad', label: 'Pad', labelRu: 'Пад', format: 'number' },
    ],
    summaryTemplate: '{StationName} • Pad {LandingPad}',
    summaryTemplateRu: '{StationName} • Пад {LandingPad}',
  },
  DockingDenied: {
    event: 'DockingDenied',
    title: 'Docking Denied',
    titleRu: 'Стыковка отклонена',
    category: 'travel',
    icon: '❌',
    fields: [
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
      { key: 'Reason', label: 'Reason', labelRu: 'Причина' },
    ],
    summaryTemplate: 'Denied: {Reason}',
    summaryTemplateRu: 'Отклонено: {Reason}',
  },
  Docked: {
    event: 'Docked',
    title: 'Docked',
    titleRu: 'Пристыкован',
    category: 'travel',
    icon: '🛬',
    fields: [
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
      { key: 'StationType', label: 'Type', labelRu: 'Тип' },
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'LandingPad', label: 'Landing Pad', labelRu: 'Посадочная площадка' },
      { key: 'StationEconomies', label: 'Economies', labelRu: 'Экономики' },
      { key: 'StationGovernment', label: 'Government', labelRu: 'Правительство' },
      { key: 'StationAllegiance', label: 'Allegiance', labelRu: 'Принадлежность' },
      { key: 'DistFromStarLS', label: 'Distance', labelRu: 'Расстояние', format: 'distance' },
    ],
    summaryTemplate: '{StationName} ({StationType})',
    summaryTemplateRu: '{StationName} ({StationType})',
  },
  Undocked: {
    event: 'Undocked',
    title: 'Undocked',
    titleRu: 'Отстыкован',
    category: 'travel',
    icon: '🛫',
    fields: [
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
      { key: 'StationType', label: 'Type', labelRu: 'Тип' },
    ],
    summaryTemplate: 'Left {StationName}',
    summaryTemplateRu: 'Покинул {StationName}',
  },
  Liftoff: {
    event: 'Liftoff',
    title: 'Liftoff',
    titleRu: 'Взлёт',
    category: 'travel',
    icon: '🔼',
    fields: [
      { key: 'Planet', label: 'Planet', labelRu: 'Планета' },
      { key: 'Latitude', label: 'Latitude', labelRu: 'Широта', format: 'number' },
      { key: 'Longitude', label: 'Longitude', labelRu: 'Долгота', format: 'number' },
    ],
    summaryTemplate: 'Liftoff from {Planet}',
    summaryTemplateRu: 'Взлёт с {Planet}',
  },
  Touchdown: {
    event: 'Touchdown',
    title: 'Touchdown',
    titleRu: 'Посадка',
    category: 'travel',
    icon: '🔽',
    fields: [
      { key: 'Planet', label: 'Planet', labelRu: 'Планета' },
      { key: 'Latitude', label: 'Latitude', labelRu: 'Широта', format: 'number' },
      { key: 'Longitude', label: 'Longitude', labelRu: 'Долгота', format: 'number' },
    ],
    summaryTemplate: 'Touchdown on {Planet}',
    summaryTemplateRu: 'Посадка на {Planet}',
  },
  ApproachBody: {
    event: 'ApproachBody',
    title: 'Approach Body',
    titleRu: 'Сближение с телом',
    category: 'travel',
    icon: '🎯',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'Body', label: 'Body', labelRu: 'Тело' },
      { key: 'Distance', label: 'Distance', labelRu: 'Расстояние', format: 'distance' },
    ],
    summaryTemplate: '{Body}',
    summaryTemplateRu: '{Body}',
  },
  ApproachSettlement: {
    event: 'ApproachSettlement',
    title: 'Approach Settlement',
    titleRu: 'Сближение с поселением',
    category: 'travel',
    icon: '🏘️',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
      { key: 'MarketID', label: 'Market ID', labelRu: 'ID рынка', format: 'number' },
      { key: 'Latitude', label: 'Latitude', labelRu: 'Широта', format: 'number' },
      { key: 'Longitude', label: 'Longitude', labelRu: 'Долгота', format: 'number' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  FuelScoop: {
    event: 'FuelScoop',
    title: 'Fuel Scoop',
    titleRu: 'Заправка',
    category: 'travel',
    icon: '⛽',
    fields: [
      { key: 'Scooped', label: 'Scooped', labelRu: 'Зачерпнуто', format: 'number' },
      { key: 'Total', label: 'Total', labelRu: 'Всего', format: 'number' },
    ],
    summaryTemplate: '+{Scooped} → {Total}',
    summaryTemplateRu: '+{Scooped} → {Total}',
  },
  NavBeaconScan: {
    event: 'NavBeaconScan',
    title: 'Nav Beacon Scan',
    titleRu: 'Скан навимаяка',
    category: 'travel',
    icon: '📡',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'NumBodies', label: 'Bodies', labelRu: 'Тел', format: 'number' },
    ],
    summaryTemplate: '{StarSystem} • {NumBodies} bodies',
    summaryTemplateRu: '{StarSystem} • {NumBodies} тел',
  },
  NavRoute: {
    event: 'NavRoute',
    title: 'Nav Route',
    titleRu: 'Маршрут',
    category: 'travel',
    icon: '🧭',
    fields: [
      { key: 'Route', label: 'Route', labelRu: 'Маршрут' },
    ],
    summaryTemplate: 'Route updated',
    summaryTemplateRu: 'Маршрут обновлён',
  },
  CarrierJump: {
    event: 'CarrierJump',
    title: 'Carrier Jump',
    titleRu: 'Прыжок носителя',
    category: 'travel',
    icon: '🛸',
    fields: [
      { key: 'CarrierName', label: 'Carrier', labelRu: 'Носитель' },
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'JumpDist', label: 'Distance', labelRu: 'Дистанция', format: 'distance' },
    ],
    summaryTemplate: '{CarrierName} → {StarSystem}',
    summaryTemplateRu: '{CarrierName} → {StarSystem}',
  },

  // ==================== COMBAT ====================
  Bounty: {
    event: 'Bounty',
    title: 'Bounty',
    titleRu: 'Награба',
    category: 'combat',
    icon: '💵',
    fields: [
      { key: 'Target', label: 'Target', labelRu: 'Цель' },
      { key: 'Target_Localised', label: 'Target', labelRu: 'Цель' },
      { key: 'TotalReward', label: 'Reward', labelRu: 'Награда', format: 'credits' },
      { key: 'VictimFaction', label: 'Faction', labelRu: 'Фракция' },
      { key: 'SharedWithOthers', label: 'Shared', labelRu: 'Разделено', format: 'credits' },
    ],
    summaryTemplate: '{Target} • {TotalReward}',
    summaryTemplateRu: '{Target} • {TotalReward}',
  },
  FactionKillBond: {
    event: 'FactionKillBond',
    title: 'Faction Kill Bond',
    titleRu: 'Награда за убийство',
    category: 'combat',
    icon: '💰',
    fields: [
      { key: 'Reward', label: 'Reward', labelRu: 'Награда', format: 'credits' },
      { key: 'AwardingFaction', label: 'Faction', labelRu: 'Фракция' },
      { key: 'VictimFaction', label: 'Victim Faction', labelRu: 'Фракция жертвы' },
    ],
    summaryTemplate: '{Reward}',
    summaryTemplateRu: '{Reward}',
  },
  CapShipBond: {
    event: 'CapShipBond',
    title: 'Capital Ship Bond',
    titleRu: 'Награда за эсминец',
    category: 'combat',
    icon: '⚓',
    fields: [
      { key: 'Reward', label: 'Reward', labelRu: 'Награда', format: 'credits' },
      { key: 'AwardingFaction', label: 'Faction', labelRu: 'Фракция' },
    ],
    summaryTemplate: '{Reward}',
    summaryTemplateRu: '{Reward}',
  },
  Died: {
    event: 'Died',
    title: 'Died',
    titleRu: 'Погиб',
    category: 'combat',
    icon: '💀',
    fields: [
      { key: 'KillerName', label: 'Killer', labelRu: 'Убийца' },
      { key: 'KillerShip', label: 'Ship', labelRu: 'Корабль' },
      { key: 'KillerRank', label: 'Rank', labelRu: 'Ранг' },
      { key: 'VictimFaction', label: 'Faction', labelRu: 'Фракция' },
    ],
    summaryTemplate: 'Killed by {KillerName}',
    summaryTemplateRu: 'Убит {KillerName}',
  },
  Interdicted: {
    event: 'Interdicted',
    title: 'Interdicted',
    titleRu: 'Перехвачен',
    category: 'combat',
    icon: '🔒',
    fields: [
      { key: 'Interdictor', label: 'Interdictor', labelRu: 'Перехватчик' },
      { key: 'IsPlayer', label: 'Player', labelRu: 'Игрок' },
      { key: 'CombatRank', label: 'Rank', labelRu: 'Ранг' },
      { key: 'Faction', label: 'Faction', labelRu: 'Фракция' },
    ],
    summaryTemplate: 'By {Interdictor}',
    summaryTemplateRu: '{Interdictor}',
  },
  Interdiction: {
    event: 'Interdiction',
    title: 'Interdiction',
    titleRu: 'Перехват',
    category: 'combat',
    icon: '🎯',
    fields: [
      { key: 'Target', label: 'Target', labelRu: 'Цель' },
      { key: 'Success', label: 'Success', labelRu: 'Успех' },
      { key: 'IsPlayer', label: 'Player', labelRu: 'Игрок' },
      { key: 'Faction', label: 'Faction', labelRu: 'Фракция' },
    ],
    summaryTemplate: '{Target} • {Success}',
    summaryTemplateRu: '{Target} • {Success}',
  },
  ShipTargeted: {
    event: 'ShipTargeted',
    title: 'Ship Targeted',
    titleRu: 'Цель захвачена',
    category: 'combat',
    icon: '🎯',
    fields: [
      { key: 'TargetLocked', label: 'Locked', labelRu: 'Захвачено' },
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
      { key: 'Ship_Localised', label: 'Ship', labelRu: 'Корабль' },
    ],
    summaryTemplate: '{Ship}',
    summaryTemplateRu: '{Ship}',
  },
  HullDamage: {
    event: 'HullDamage',
    title: 'Hull Damage',
    titleRu: 'Повреждение корпуса',
    category: 'combat',
    icon: '🛡️',
    fields: [
      { key: 'Health', label: 'Health', labelRu: 'Здоровье', format: 'percent' },
      { key: 'Attacker', label: 'Attacker', labelRu: 'Атакующий' },
    ],
    summaryTemplate: 'Hull: {Health}',
    summaryTemplateRu: 'Корпус: {Health}',
  },
  ShieldHit: {
    event: 'ShieldHit',
    title: 'Shield Hit',
    titleRu: 'Попадание в щит',
    category: 'combat',
    icon: '🔰',
    fields: [
      { key: 'Health', label: 'Shield', labelRu: 'Щит', format: 'percent' },
      { key: 'Attacker', label: 'Attacker', labelRu: 'Атакующий' },
    ],
    summaryTemplate: 'Shield: {Health}',
    summaryTemplateRu: 'Щит: {Health}',
  },
  ShieldState: {
    event: 'ShieldState',
    title: 'Shield State',
    titleRu: 'Состояние щитов',
    category: 'combat',
    icon: '🔰',
    fields: [
      { key: 'ShieldsDown', label: 'Down', labelRu: 'Опущены' },
    ],
    summaryTemplate: '{ShieldsDown}',
    summaryTemplateRu: '{ShieldsDown}',
  },
  CrimeVictim: {
    event: 'CrimeVictim',
    title: 'Crime Victim',
    titleRu: 'Жертва преступления',
    category: 'combat',
    icon: '🚨',
    fields: [
      { key: 'Offender', label: 'Offender', labelRu: 'Преступник' },
      { key: 'CrimeType', label: 'Crime', labelRu: 'Преступление' },
      { key: 'Fine', label: 'Fine', labelRu: 'Штраф', format: 'credits' },
      { key: 'Bounty', label: 'Bounty', labelRu: 'Награда', format: 'credits' },
    ],
    summaryTemplate: '{CrimeType} by {Offender}',
    summaryTemplateRu: '{CrimeType} от {Offender}',
  },
  CommitCrime: {
    event: 'CommitCrime',
    title: 'Commit Crime',
    titleRu: 'Совершено преступление',
    category: 'combat',
    icon: '⚠️',
    fields: [
      { key: 'CrimeType', label: 'Crime', labelRu: 'Преступление' },
      { key: 'Faction', label: 'Faction', labelRu: 'Фракция' },
      { key: 'Victim', label: 'Victim', labelRu: 'Жертва' },
      { key: 'Fine', label: 'Fine', labelRu: 'Штраф', format: 'credits' },
      { key: 'Bounty', label: 'Bounty', labelRu: 'Награда', format: 'credits' },
    ],
    summaryTemplate: '{CrimeType}',
    summaryTemplateRu: '{CrimeType}',
  },
  PvPKill: {
    event: 'PvPKill',
    title: 'PvP Kill',
    titleRu: 'Убийство игрока',
    category: 'combat',
    icon: '⚔️',
    fields: [
      { key: 'Target', label: 'Target', labelRu: 'Цель' },
    ],
    summaryTemplate: 'Killed {Target}',
    summaryTemplateRu: 'Убит {Target}',
  },
  Resurrect: {
    event: 'Resurrect',
    title: 'Resurrect',
    titleRu: 'Воскрешение',
    category: 'combat',
    icon: '💖',
    fields: [
      { key: 'Option', label: 'Option', labelRu: 'Опция' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
      { key: 'Bankrupt', label: 'Bankrupt', labelRu: 'Банкрот' },
    ],
    summaryTemplate: '{Option} • {Cost}',
    summaryTemplateRu: '{Option} • {Cost}',
  },
  ShieldCell: {
    event: 'ShieldCell',
    title: 'Shield Cell',
    titleRu: 'Щитовая ячейка',
    category: 'combat',
    icon: '🔋',
    fields: [
      { key: 'ShieldCell', label: 'Cell', labelRu: 'Ячейка', format: 'number' },
      { key: 'Duration', label: 'Duration', labelRu: 'Длительность', format: 'number' },
    ],
    summaryTemplate: 'Used Shield Cell',
    summaryTemplateRu: 'Использована щитовая ячейка',
  },
  UnderAttack: {
    event: 'UnderAttack',
    title: 'Under Attack',
    titleRu: 'Под атакой',
    category: 'combat',
    icon: '⚠️',
    fields: [
      { key: 'Attacker', label: 'Attacker', labelRu: 'Атакующий' },
    ],
    summaryTemplate: 'By {Attacker}',
    summaryTemplateRu: '{Attacker}',
  },

  // ==================== TRADE ====================
  MarketBuy: {
    event: 'MarketBuy',
    title: 'Market Buy',
    titleRu: 'Покупка',
    category: 'trade',
    icon: '🛒',
    fields: [
      { key: 'MarketID', label: 'Market ID', labelRu: 'ID рынка', format: 'number' },
      { key: 'Type', label: 'Item', labelRu: 'Товар' },
      { key: 'Type_Localised', label: 'Item', labelRu: 'Товар' },
      { key: 'Quantity', label: 'Qty', labelRu: 'Кол-во', format: 'number' },
      { key: 'BuyPrice', label: 'Price', labelRu: 'Цена', format: 'credits' },
      { key: 'TotalCost', label: 'Total', labelRu: 'Всего', format: 'credits' },
    ],
    summaryTemplate: '{Type} x{Quantity} • {TotalCost}',
    summaryTemplateRu: '{Type} x{Quantity} • {TotalCost}',
  },
  MarketSell: {
    event: 'MarketSell',
    title: 'Market Sell',
    titleRu: 'Продажа',
    category: 'trade',
    icon: '💵',
    fields: [
      { key: 'MarketID', label: 'Market ID', labelRu: 'ID рынка', format: 'number' },
      { key: 'Type', label: 'Item', labelRu: 'Товар' },
      { key: 'Type_Localised', label: 'Item', labelRu: 'Товар' },
      { key: 'Quantity', label: 'Qty', labelRu: 'Кол-во', format: 'number' },
      { key: 'SellPrice', label: 'Price', labelRu: 'Цена', format: 'credits' },
      { key: 'TotalSale', label: 'Total', labelRu: 'Всего', format: 'credits' },
      { key: 'Profit', label: 'Profit', labelRu: 'Прибыль', format: 'credits' },
    ],
    summaryTemplate: '{Type} x{Quantity} • {TotalSale}',
    summaryTemplateRu: '{Type} x{Quantity} • {TotalSale}',
  },
  CollectCargo: {
    event: 'CollectCargo',
    title: 'Collect Cargo',
    titleRu: 'Сбор груза',
    category: 'trade',
    icon: '📦',
    fields: [
      { key: 'Type', label: 'Item', labelRu: 'Товар' },
      { key: 'Type_Localised', label: 'Item', labelRu: 'Товар' },
      { key: 'Quantity', label: 'Qty', labelRu: 'Кол-во', format: 'number' },
    ],
    summaryTemplate: '{Type}',
    summaryTemplateRu: '{Type}',
  },
  EjectCargo: {
    event: 'EjectCargo',
    title: 'Eject Cargo',
    titleRu: 'Выброс груза',
    category: 'trade',
    icon: '🗑️',
    fields: [
      { key: 'Type', label: 'Item', labelRu: 'Товар' },
      { key: 'Type_Localised', label: 'Item', labelRu: 'Товар' },
      { key: 'Quantity', label: 'Qty', labelRu: 'Кол-во', format: 'number' },
      { key: 'Abandoned', label: 'Abandoned', labelRu: 'Брошен' },
    ],
    summaryTemplate: '{Type} x{Quantity}',
    summaryTemplateRu: '{Type} x{Quantity}',
  },
  MiningRefined: {
    event: 'MiningRefined',
    title: 'Mining Refined',
    titleRu: 'Переработка',
    category: 'trade',
    icon: '💎',
    fields: [
      { key: 'Type', label: 'Mineral', labelRu: 'Минерал' },
      { key: 'Type_Localised', label: 'Mineral', labelRu: 'Минерал' },
      { key: 'Quantity', label: 'Qty', labelRu: 'Кол-во', format: 'number' },
    ],
    summaryTemplate: '{Type} x{Quantity}',
    summaryTemplateRu: '{Type} x{Quantity}',
  },
  ProspectedAsteroid: {
    event: 'ProspectedAsteroid',
    title: 'Prospected Asteroid',
    titleRu: 'Астероид исследован',
    category: 'trade',
    icon: '🌑',
    fields: [
      { key: 'Body', label: 'Body', labelRu: 'Тело' },
    ],
    summaryTemplate: '{Body}',
    summaryTemplateRu: '{Body}',
  },
  AsteroidCracked: {
    event: 'AsteroidCracked',
    title: 'Asteroid Cracked',
    titleRu: 'Астероид взорван',
    category: 'trade',
    icon: '💥',
    fields: [
      { key: 'Body', label: 'Body', labelRu: 'Тело' },
    ],
    summaryTemplate: '{Body}',
    summaryTemplateRu: '{Body}',
  },
  LaunchDrone: {
    event: 'LaunchDrone',
    title: 'Launch Drone',
    titleRu: 'Дрон запущен',
    category: 'trade',
    icon: '🚁',
    fields: [],
    summaryTemplate: 'Drone launched',
    summaryTemplateRu: 'Дрон запущен',
  },
  RefuelAll: {
    event: 'RefuelAll',
    title: 'Refuel',
    titleRu: 'Заправка',
    category: 'trade',
    icon: '⛽',
    fields: [
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
      { key: 'Amount', label: 'Amount', labelRu: 'Количество', format: 'number' },
    ],
    summaryTemplate: '{Amount} • {Cost}',
    summaryTemplateRu: '{Amount} • {Cost}',
  },
  RefuelPartial: {
    event: 'RefuelPartial',
    title: 'Refuel Partial',
    titleRu: 'Частичная заправка',
    category: 'trade',
    icon: '⛽',
    fields: [
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
      { key: 'Amount', label: 'Amount', labelRu: 'Количество', format: 'number' },
    ],
    summaryTemplate: '{Amount} • {Cost}',
    summaryTemplateRu: '{Amount} • {Cost}',
  },
  Repair: {
    event: 'Repair',
    title: 'Repair',
    titleRu: 'Ремонт',
    category: 'trade',
    icon: '🔧',
    fields: [
      { key: 'Item', label: 'Item', labelRu: 'Элемент' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
      { key: 'Health', label: 'Health', labelRu: 'Здоровье', format: 'percent' },
    ],
    summaryTemplate: '{Item} • {Cost}',
    summaryTemplateRu: '{Item} • {Cost}',
  },
  RepairAll: {
    event: 'RepairAll',
    title: 'Repair All',
    titleRu: 'Полный ремонт',
    category: 'trade',
    icon: '🔧',
    fields: [
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: 'Full repair • {Cost}',
    summaryTemplateRu: 'Полный • {Cost}',
  },
  BuyAmmo: {
    event: 'BuyAmmo',
    title: 'Buy Ammo',
    titleRu: 'Покупка боеприпасов',
    category: 'trade',
    icon: '🔫',
    fields: [
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Cost}',
    summaryTemplateRu: '{Cost}',
  },
  BuyDrones: {
    event: 'BuyDrones',
    title: 'Buy Drones',
    titleRu: 'Покупка дронов',
    category: 'trade',
    icon: '🤖',
    fields: [
      { key: 'Type', label: 'Type', labelRu: 'Тип' },
      { key: 'Quantity', label: 'Qty', labelRu: 'Кол-во', format: 'number' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: 'x{Quantity} • {Cost}',
    summaryTemplateRu: 'x{Quantity} • {Cost}',
  },
  SellDrones: {
    event: 'SellDrones',
    title: 'Sell Drones',
    titleRu: 'Продажа дронов',
    category: 'trade',
    icon: '🤖',
    fields: [
      { key: 'Type', label: 'Type', labelRu: 'Тип' },
      { key: 'Quantity', label: 'Qty', labelRu: 'Кол-во', format: 'number' },
      { key: 'TotalSale', label: 'Total', labelRu: 'Всего', format: 'credits' },
    ],
    summaryTemplate: 'x{Quantity} • {TotalSale}',
    summaryTemplateRu: 'x{Quantity} • {TotalSale}',
  },
  MaterialTrade: {
    event: 'MaterialTrade',
    title: 'Material Trade',
    titleRu: 'Обмен материалами',
    category: 'trade',
    icon: '🔄',
    fields: [
      { key: 'MarketID', label: 'Market ID', labelRu: 'ID рынка', format: 'number' },
      { key: 'TraderType', label: 'Type', labelRu: 'Тип' },
      { key: 'Paid', label: 'Paid', labelRu: 'Отдано' },
      { key: 'Received', label: 'Received', labelRu: 'Получено' },
    ],
    summaryTemplate: '{Paid} → {Received}',
    summaryTemplateRu: '{Paid} → {Received}',
  },
  TradePromoted: {
    event: 'TradePromoted',
    title: 'Trade Rank',
    titleRu: 'Торговый ранг',
    category: 'trade',
    icon: '📈',
    fields: [
      { key: 'Rank', label: 'Rank', labelRu: 'Ранг', format: 'number' },
    ],
    summaryTemplate: 'Trade rank: {Rank}',
    summaryTemplateRu: 'Торговый ранг: {Rank}',
  },

  // ==================== EXPLORATION ====================
  Scan: {
    event: 'Scan',
    title: 'Scan',
    titleRu: 'Скан',
    category: 'exploration',
    icon: '🔍',
    fields: [
      { key: 'BodyName', label: 'Body', labelRu: 'Тело' },
      { key: 'StarType', label: 'Star Type', labelRu: 'Тип звезды' },
      { key: 'StarSubclass', label: 'Subclass', labelRu: 'Подкласс', format: 'number' },
      { key: 'DistanceFromArrivalLS', label: 'Distance', labelRu: 'Расстояние', format: 'distance' },
      { key: 'SurfaceGravity', label: 'Gravity', labelRu: 'Гравитация', format: 'number' },
      { key: 'SurfaceTemperature', label: 'Temp', labelRu: 'Температура', format: 'number' },
      { key: 'Radius', label: 'Radius', labelRu: 'Радиус', format: 'number' },
      { key: 'SemiMajorAxis', label: 'Semi-Major', labelRu: 'Большая полуось', format: 'number' },
      { key: 'Eccentricity', label: 'Eccentricity', labelRu: 'Эксцентриситет', format: 'number' },
      { key: 'OrbitalInclination', label: 'Inclination', labelRu: 'Наклонение', format: 'number' },
      { key: 'Periapsis', label: 'Periapsis', labelRu: 'Периапсис', format: 'number' },
      { key: 'RotationalPeriod', label: 'Rotation', labelRu: 'Период вращения', format: 'number' },
      { key: 'AxialTilt', label: 'Tilt', labelRu: 'Наклон оси', format: 'number' },
      { key: 'AtmosphereType', label: 'Atmosphere', labelRu: 'Атмосфера' },
      { key: 'AtmosphereComposition', label: 'Atmo Comp', labelRu: 'Атмосфера' },
      { key: 'SolidComposition', label: 'Solid', labelRu: 'Твердое' },
      { key: 'Materials', label: 'Materials', labelRu: 'Материалы' },
      { key: 'OrbitalPeriod', label: 'Orbital Period', labelRu: 'Орбитальный период', format: 'number' },
    ],
    summaryTemplate: '{BodyName} • {StarType}',
    summaryTemplateRu: '{BodyName} • {StarType}',
  },
  FSSDiscoveryScan: {
    event: 'FSSDiscoveryScan',
    title: 'FSS Scan',
    titleRu: 'FSS скан',
    category: 'exploration',
    icon: '📡',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'Bodies', label: 'Bodies', labelRu: 'Тел', format: 'number' },
    ],
    summaryTemplate: '{Bodies} bodies',
    summaryTemplateRu: '{Bodies} тел',
  },
  DiscoveryScan: {
    event: 'DiscoveryScan',
    title: 'Discovery Scan',
    titleRu: 'Discovery Scan',
    category: 'exploration',
    icon: '📡',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'Bodies', label: 'Bodies', labelRu: 'Тел', format: 'number' },
    ],
    summaryTemplate: '{Bodies} bodies',
    summaryTemplateRu: '{Bodies} тел',
  },
  FSSSignalDiscovered: {
    event: 'FSSSignalDiscovered',
    title: 'Signal Discovered',
    titleRu: 'Сигнал обнаружен',
    category: 'exploration',
    icon: '📳',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'SignalName', label: 'Signal', labelRu: 'Сигнал' },
      { key: 'SignalType', label: 'Type', labelRu: 'Тип' },
    ],
    summaryTemplate: '{SignalType}',
    summaryTemplateRu: '{SignalType}',
  },
  SAASignalsFound: {
    event: 'SAASignalsFound',
    title: 'DSS Signals',
    titleRu: 'Сигналы DSS',
    category: 'exploration',
    icon: '🎯',
    fields: [
      { key: 'BodyName', label: 'Body', labelRu: 'Тело' },
      { key: 'Signals', label: 'Signals', labelRu: 'Сигналы' },
    ],
    summaryTemplate: '{BodyName}',
    summaryTemplateRu: '{BodyName}',
  },
  SAAScanComplete: {
    event: 'SAAScanComplete',
    title: 'DSS Complete',
    titleRu: 'DSS завершён',
    category: 'exploration',
    icon: '✅',
    fields: [
      { key: 'BodyName', label: 'Body', labelRu: 'Тело' },
      { key: 'ProbesUsed', label: 'Probes', labelRu: 'Зонды', format: 'number' },
      { key: 'BaseValue', label: 'Value', labelRu: 'Ценность', format: 'credits' },
    ],
    summaryTemplate: '{BodyName} • {ProbesUsed} probes',
    summaryTemplateRu: '{BodyName} • {ProbesUsed} зондов',
  },
  FSSAllBodiesFound: {
    event: 'FSSAllBodiesFound',
    title: 'All Bodies Found',
    titleRu: 'Все тела найдены',
    category: 'exploration',
    icon: '✅',
    fields: [
      { key: 'StarSystem', label: 'System', labelRu: 'Система' },
      { key: 'Count', label: 'Count', labelRu: 'Кол-во', format: 'number' },
    ],
    summaryTemplate: '{Count} bodies',
    summaryTemplateRu: '{Count} тел',
  },
  FSSBodySignals: {
    event: 'FSSBodySignals',
    title: 'Body Signals',
    titleRu: 'Сигналы тела',
    category: 'exploration',
    icon: '📶',
    fields: [
      { key: 'BodyName', label: 'Body', labelRu: 'Тело' },
      { key: 'SignalCount', label: 'Signals', labelRu: 'Сигналы', format: 'number' },
    ],
    summaryTemplate: '{SignalCount} signals',
    summaryTemplateRu: '{SignalCount} сигналов',
  },
  SellExplorationData: {
    event: 'SellExplorationData',
    title: 'Sell Data',
    titleRu: 'Продажа данных',
    category: 'exploration',
    icon: '💰',
    fields: [
      { key: 'Systems', label: 'Systems', labelRu: 'Системы' },
      { key: 'Discovered', label: 'Discovered', labelRu: 'Открыто' },
      { key: 'BaseValue', label: 'Base', labelRu: 'База', format: 'credits' },
      { key: 'Bonus', label: 'Bonus', labelRu: 'Бонус', format: 'credits' },
      { key: 'TotalEarnings', label: 'Total', labelRu: 'Всего', format: 'credits' },
    ],
    summaryTemplate: '{TotalEarnings}',
    summaryTemplateRu: '{TotalEarnings}',
  },
  MultiSellExplorationData: {
    event: 'MultiSellExplorationData',
    title: 'Sell Data',
    titleRu: 'Продажа данных',
    category: 'exploration',
    icon: '💰',
    fields: [
      { key: 'Discovered', label: 'Discovered', labelRu: 'Открыто' },
      { key: 'TotalEarnings', label: 'Total', labelRu: 'Всего', format: 'credits' },
    ],
    summaryTemplate: '{TotalEarnings}',
    summaryTemplateRu: '{TotalEarnings}',
  },
  CodexEntry: {
    event: 'CodexEntry',
    title: 'Codex Entry',
    titleRu: 'Запись кодекса',
    category: 'exploration',
    icon: '📖',
    fields: [
      { key: 'EntryID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
      { key: 'Name_Localised', label: 'Name', labelRu: 'Имя' },
      { key: 'Category', label: 'Category', labelRu: 'Категория' },
      { key: 'SubCategory', label: 'SubCategory', labelRu: 'Подкатегория' },
      { key: 'Region', label: 'Region', labelRu: 'Регион' },
      { key: 'System', label: 'System', labelRu: 'Система' },
      { key: 'IsNew', label: 'New', labelRu: 'Новое' },
      { key: 'NewTraitsDiscovered', label: 'New Traits', labelRu: 'Новые черты' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  ScanOrganic: {
    event: 'ScanOrganic',
    title: 'Scan Organic',
    titleRu: 'Скан органики',
    category: 'exploration',
    icon: '🧬',
    fields: [
      { key: 'ScanType', label: 'Type', labelRu: 'Тип' },
      { key: 'Genus', label: 'Genus', labelRu: 'Род' },
      { key: 'Genus_Localised', label: 'Genus', labelRu: 'Род' },
      { key: 'Species', label: 'Species', labelRu: 'Вид' },
      { key: 'Species_Localised', label: 'Species', labelRu: 'Вид' },
      { key: 'GrowthStage', label: 'Growth', labelRu: 'Рост' },
      { key: 'Age', label: 'Age', labelRu: 'Возраст', format: 'number' },
      { key: 'Value', label: 'Value', labelRu: 'Ценность', format: 'credits' },
    ],
    summaryTemplate: '{Species}',
    summaryTemplateRu: '{Species}',
  },
  SellOrganicData: {
    event: 'SellOrganicData',
    title: 'Sell Organic Data',
    titleRu: 'Продажа данных организмов',
    category: 'exploration',
    icon: '🧬',
    fields: [
      { key: 'BioData', label: 'Data', labelRu: 'Данные' },
      { key: 'TotalEarnings', label: 'Total', labelRu: 'Всего', format: 'credits' },
    ],
    summaryTemplate: '{TotalEarnings}',
    summaryTemplateRu: '{TotalEarnings}',
  },
  MaterialCollected: {
    event: 'MaterialCollected',
    title: 'Material Collected',
    titleRu: 'Материал собран',
    category: 'exploration',
    icon: '🔬',
    fields: [
      { key: 'Name', label: 'Material', labelRu: 'Материал' },
      { key: 'Name_Localised', label: 'Material', labelRu: 'Материал' },
      { key: 'Count', label: 'Count', labelRu: 'Кол-во', format: 'number' },
    ],
    summaryTemplate: '{Name} x{Count}',
    summaryTemplateRu: '{Name} x{Count}',
  },
  MaterialDiscarded: {
    event: 'MaterialDiscarded',
    title: 'Material Discarded',
    titleRu: 'Материал выброшен',
    category: 'exploration',
    icon: '🗑️',
    fields: [
      { key: 'Name', label: 'Material', labelRu: 'Материал' },
      { key: 'Count', label: 'Count', labelRu: 'Кол-во', format: 'number' },
    ],
    summaryTemplate: '{Name} x{Count}',
    summaryTemplateRu: '{Name} x{Count}',
  },
  MaterialDiscovered: {
    event: 'MaterialDiscovered',
    title: 'Material Discovered',
    titleRu: 'Материал открыт',
    category: 'exploration',
    icon: '✨',
    fields: [
      { key: 'Name', label: 'Material', labelRu: 'Материал' },
      { key: 'Name_Localised', label: 'Material', labelRu: 'Материал' },
      { key: 'Category', label: 'Category', labelRu: 'Категория' },
      { key: 'DiscoveryNumber', label: '#', labelRu: '#', format: 'number' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },

  // ==================== ENGINEERING ====================
  EngineerCraft: {
    event: 'EngineerCraft',
    title: 'Engineered',
    titleRu: 'Инженеринг',
    category: 'engineering',
    icon: '🔧',
    fields: [
      { key: 'Engineer', label: 'Engineer', labelRu: 'Инженер' },
      { key: 'Engineer_Localised', label: 'Engineer', labelRu: 'Инженер' },
      { key: 'Blueprint', label: 'Blueprint', labelRu: 'Чертеж' },
      { key: 'Blueprint_Localised', label: 'Blueprint', labelRu: 'Чертеж' },
      { key: 'Level', label: 'Level', labelRu: 'Уровень', format: 'number' },
      { key: 'Quality', label: 'Quality', labelRu: 'Качество', format: 'percent' },
      { key: 'Ingredients', label: 'Ingredients', labelRu: 'Ингредиенты' },
      { key: 'Module', label: 'Module', labelRu: 'Модуль' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Engineer} • {Blueprint} G{Level}',
    summaryTemplateRu: '{Engineer} • {Blueprint} G{Level}',
  },
  EngineerApply: {
    event: 'EngineerApply',
    title: 'Engineer Apply',
    titleRu: 'Модуль улучшен',
    category: 'engineering',
    icon: '🔧',
    fields: [
      { key: 'Engineer', label: 'Engineer', labelRu: 'Инженер' },
      { key: 'Blueprint', label: 'Blueprint', labelRu: 'Чертеж' },
    ],
    summaryTemplate: '{Engineer} • {Blueprint}',
    summaryTemplateRu: '{Engineer} • {Blueprint}',
  },
  Synthesis: {
    event: 'Synthesis',
    title: 'Synthesis',
    titleRu: 'Синтез',
    category: 'engineering',
    icon: '⚗️',
    fields: [
      { key: 'Name', label: 'Module', labelRu: 'Модуль' },
      { key: 'Materials', label: 'Materials', labelRu: 'Материалы' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  Synthesise: {
    event: 'Synthesise',
    title: 'Synthesise',
    titleRu: 'Синтез',
    category: 'engineering',
    icon: '⚗️',
    fields: [
      { key: 'Name', label: 'Module', labelRu: 'Модуль' },
      { key: 'Materials', label: 'Materials', labelRu: 'Материалы' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  EngineerProgress: {
    event: 'EngineerProgress',
    title: 'Engineer Progress',
    titleRu: 'Прогресс инженера',
    category: 'engineering',
    icon: '📊',
    fields: [
      { key: 'Engineer', label: 'Engineer', labelRu: 'Инженер' },
      { key: 'Rank', label: 'Rank', labelRu: 'Ранг', format: 'number' },
      { key: 'Progress', label: 'Progress', labelRu: 'Прогресс' },
    ],
    summaryTemplate: '{Engineer}: {Progress}',
    summaryTemplateRu: '{Engineer}: {Progress}',
  },
  AfmuRepairs: {
    event: 'AfmuRepairs',
    title: 'AFMU Repair',
    titleRu: 'Ремонт AFMU',
    category: 'engineering',
    icon: '🔧',
    fields: [
      { key: 'Module', label: 'Module', labelRu: 'Модуль' },
      { key: 'Module_Localised', label: 'Module', labelRu: 'Модуль' },
      { key: 'FullyRepaired', label: 'Fully', labelRu: 'Полностью' },
      { key: 'Health', label: 'Health', labelRu: 'Здоровье', format: 'percent' },
    ],
    summaryTemplate: '{Module}',
    summaryTemplateRu: '{Module}',
  },
  ModuleModify: {
    event: 'ModuleModify',
    title: 'Module Modified',
    titleRu: 'Модуль модифицирован',
    category: 'engineering',
    icon: '🔧',
    fields: [
      { key: 'Module', label: 'Module', labelRu: 'Модуль' },
      { key: 'Module_Localised', label: 'Module', labelRu: 'Модуль' },
      { key: 'Health', label: 'Health', labelRu: 'Здоровье', format: 'percent' },
    ],
    summaryTemplate: '{Module}',
    summaryTemplateRu: '{Module}',
  },
  UpgradeWeapon: {
    event: 'UpgradeWeapon',
    title: 'Weapon Upgrade',
    titleRu: 'Улучшение оружия',
    category: 'engineering',
    icon: '🔫',
    fields: [
      { key: 'Name', label: 'Weapon', labelRu: 'Оружие' },
      { key: 'Class', label: 'Class', labelRu: 'Класс' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  UpgradeSuit: {
    event: 'UpgradeSuit',
    title: 'Suit Upgrade',
    titleRu: 'Улучшение скафандра',
    category: 'engineering',
    icon: '👤',
    fields: [
      { key: 'Name', label: 'Suit', labelRu: 'Скафандр' },
      { key: 'Class', label: 'Class', labelRu: 'Класс' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },

  // ==================== MISSIONS ====================
  MissionAccepted: {
    event: 'MissionAccepted',
    title: 'Mission Accepted',
    titleRu: 'Миссия принята',
    category: 'missions',
    icon: '📋',
    fields: [
      { key: 'MissionID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Name', label: 'Mission', labelRu: 'Миссия' },
      { key: 'Name_Localised', label: 'Mission', labelRu: 'Миссия' },
      { key: 'Category', label: 'Category', labelRu: 'Категория' },
      { key: 'Expiry', label: 'Expiry', labelRu: 'Истекает' },
      { key: 'Reward', label: 'Reward', labelRu: 'Награда', format: 'credits' },
      { key: 'Faction', label: 'Faction', labelRu: 'Фракция' },
      { key: 'TargetType', label: 'Target Type', labelRu: 'Тип цели' },
      { key: 'TargetType_Localised', label: 'Target Type', labelRu: 'Тип цели' },
      { key: 'TargetType', label: 'Target', labelRu: 'Цель' },
    ],
    summaryTemplate: '{Name} • {Reward}',
    summaryTemplateRu: '{Name} • {Reward}',
  },
  MissionCompleted: {
    event: 'MissionCompleted',
    title: 'Mission Completed',
    titleRu: 'Миссия выполнена',
    category: 'missions',
    icon: '✅',
    fields: [
      { key: 'MissionID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Name', label: 'Mission', labelRu: 'Миссия' },
      { key: 'Name_Localised', label: 'Mission', labelRu: 'Миссия' },
      { key: 'Reward', label: 'Reward', labelRu: 'Награда', format: 'credits' },
      { key: 'Faction', label: 'Faction', labelRu: 'Фракция' },
      { key: 'PermitsAwarded', label: 'Permits', labelRu: 'Разрешения' },
      { key: 'CommodityReward', label: 'Commodities', labelRu: 'Товары' },
      { key: 'MaterialsReward', label: 'Materials', labelRu: 'Материалы' },
    ],
    summaryTemplate: '{Name} • {Reward}',
    summaryTemplateRu: '{Name} • {Reward}',
  },
  MissionFailed: {
    event: 'MissionFailed',
    title: 'Mission Failed',
    titleRu: 'Миссия провалена',
    category: 'missions',
    icon: '❌',
    fields: [
      { key: 'MissionID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Name', label: 'Mission', labelRu: 'Миссия' },
      { key: 'Fine', label: 'Fine', labelRu: 'Штраф', format: 'credits' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  MissionAbandoned: {
    event: 'MissionAbandoned',
    title: 'Mission Abandoned',
    titleRu: 'Миссия покинута',
    category: 'missions',
    icon: '🚫',
    fields: [
      { key: 'MissionID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Name', label: 'Mission', labelRu: 'Миссия' },
      { key: 'Fine', label: 'Fine', labelRu: 'Штраф', format: 'credits' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  MissionRedirected: {
    event: 'MissionRedirected',
    title: 'Mission Redirected',
    titleRu: 'Миссия перенаправлена',
    category: 'missions',
    icon: '➡️',
    fields: [
      { key: 'MissionID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Name', label: 'Mission', labelRu: 'Миссия' },
      { key: 'NewDestinationStation', label: 'New Station', labelRu: 'Новая станция' },
      { key: 'OldDestinationStation', label: 'Old Station', labelRu: 'Старая станция' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  Missions: {
    event: 'Missions',
    title: 'Missions List',
    titleRu: 'Список миссий',
    category: 'missions',
    icon: '📋',
    fields: [
      { key: 'Active', label: 'Active', labelRu: 'Активные', format: 'number' },
    ],
    summaryTemplate: '{Active} active',
    summaryTemplateRu: '{Active} активных',
  },
  MissionReward: {
    event: 'MissionReward',
    title: 'Mission Reward',
    titleRu: 'Награда миссии',
    category: 'missions',
    icon: '💰',
    fields: [
      { key: 'MissionID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Reward', label: 'Reward', labelRu: 'Награда', format: 'credits' },
    ],
    summaryTemplate: '{Reward}',
    summaryTemplateRu: '{Reward}',
  },

  // ==================== SOCIAL ====================
  Friends: {
    event: 'Friends',
    title: 'Friends',
    titleRu: 'Друзья',
    category: 'social',
    icon: '👥',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
      { key: 'Status', label: 'Status', labelRu: 'Статус' },
    ],
    summaryTemplate: '{Name}: {Status}',
    summaryTemplateRu: '{Name}: {Status}',
  },
  WingInvite: {
    event: 'WingInvite',
    title: 'Wing Invite',
    titleRu: 'Приглашение в крыло',
    category: 'social',
    icon: '🕊️',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
    ],
    summaryTemplate: 'Invited {Name}',
    summaryTemplateRu: 'Приглашён {Name}',
  },
  WingJoin: {
    event: 'WingJoin',
    title: 'Wing Join',
    titleRu: 'Вступление в крыло',
    category: 'social',
    icon: '🕊️',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
    ],
    summaryTemplate: 'Joined wing with {Name}',
    summaryTemplateRu: 'Присоединился к {Name}',
  },
  WingLeave: {
    event: 'WingLeave',
    title: 'Wing Leave',
    titleRu: 'Покидание крыла',
    category: 'social',
    icon: '🕊️',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
    ],
    summaryTemplate: 'Left wing',
    summaryTemplateRu: 'Покинул крыло',
  },
  ReceiveText: {
    event: 'ReceiveText',
    title: 'Message Received',
    titleRu: 'Сообщение получено',
    category: 'social',
    icon: '💬',
    fields: [
      { key: 'From', label: 'From', labelRu: 'От' },
      { key: 'Message', label: 'Message', labelRu: 'Сообщение' },
      { key: 'Channel', label: 'Channel', labelRu: 'Канал' },
    ],
    summaryTemplate: '{From}: {Message}',
    summaryTemplateRu: '{From}: {Message}',
  },
  SendText: {
    event: 'SendText',
    title: 'Message Sent',
    titleRu: 'Сообщение отправлено',
    category: 'social',
    icon: '💬',
    fields: [
      { key: 'To', label: 'To', labelRu: 'Кому' },
      { key: 'Message', label: 'Message', labelRu: 'Сообщение' },
      { key: 'Channel', label: 'Channel', labelRu: 'Канал' },
    ],
    summaryTemplate: 'To {To}: {Message}',
    summaryTemplateRu: '{To}: {Message}',
  },
  NpcCrewPaidWage: {
    event: 'NpcCrewPaidWage',
    title: 'NPC Crew Wage',
    titleRu: 'ЗП наёмника',
    category: 'social',
    icon: '💵',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
      { key: 'Amount', label: 'Amount', labelRu: 'Сумма', format: 'credits' },
    ],
    summaryTemplate: '{Name}: {Amount}',
    summaryTemplateRu: '{Name}: {Amount}',
  },
  NpcCrewHire: {
    event: 'NpcCrewHire',
    title: 'NPC Crew Hired',
    titleRu: 'Нанят наёмник',
    category: 'social',
    icon: '👤',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
      { key: 'Rank', label: 'Rank', labelRu: 'Ранг' },
    ],
    summaryTemplate: '{Name} • {Cost}',
    summaryTemplateRu: '{Name} • {Cost}',
  },
  NpcCrewFire: {
    event: 'NpcCrewFire',
    title: 'NPC Crew Fired',
    titleRu: 'Уволен наёмник',
    category: 'social',
    icon: '👤',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
    ],
    summaryTemplate: 'Fired {Name}',
    summaryTemplateRu: 'Уволен {Name}',
  },
  CrewMemberJoins: {
    event: 'CrewMemberJoins',
    title: 'Crew Joins',
    titleRu: 'Член экипажа присоединился',
    category: 'social',
    icon: '👤',
    fields: [
      { key: 'Crew', label: 'Crew', labelRu: 'Экипаж' },
    ],
    summaryTemplate: '{Crew} joined',
    summaryTemplateRu: '{Crew} присоединился',
  },
  CrewMemberQuits: {
    event: 'CrewMemberQuits',
    title: 'Crew Quits',
    titleRu: 'Член экипажа ушёл',
    category: 'social',
    icon: '👤',
    fields: [
      { key: 'Crew', label: 'Crew', labelRu: 'Экипаж' },
    ],
    summaryTemplate: '{Crew} quit',
    summaryTemplateRu: '{Crew} ушёл',
  },
  CrewMemberRoleChange: {
    event: 'CrewMemberRoleChange',
    title: 'Crew Role Change',
    titleRu: 'Смена роли экипажа',
    category: 'social',
    icon: '👤',
    fields: [
      { key: 'Crew', label: 'Crew', labelRu: 'Экипаж' },
      { key: 'Role', label: 'Role', labelRu: 'Роль' },
    ],
    summaryTemplate: '{Crew}: {Role}',
    summaryTemplateRu: '{Crew}: {Role}',
  },
  JoinACrew: {
    event: 'JoinACrew',
    title: 'Join Crew',
    titleRu: 'Вступление в экипаж',
    category: 'social',
    icon: '👥',
    fields: [
      { key: 'Captain', label: 'Captain', labelRu: 'Капитан' },
    ],
    summaryTemplate: 'Joined {Captain}',
    summaryTemplateRu: 'Присоединился к {Captain}',
  },
  KickCrewMember: {
    event: 'KickCrewMember',
    title: 'Kick Crew',
    titleRu: 'Удаление из экипажа',
    category: 'social',
    icon: '👋',
    fields: [
      { key: 'Crew', label: 'Crew', labelRu: 'Экипаж' },
    ],
    summaryTemplate: 'Kicked {Crew}',
    summaryTemplateRu: 'Удалён {Crew}',
  },

  // ==================== ODYSSEY ====================
  Embark: {
    event: 'Embark',
    title: 'Embark',
    titleRu: 'Покинуть корабль',
    category: 'odyssey',
    icon: '👣',
    fields: [
      { key: 'Teleport', label: 'Teleport', labelRu: 'Телепорт' },
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
      { key: 'Station', label: 'Station', labelRu: 'Станция' },
      { key: 'Body', label: 'Body', labelRu: 'Тело' },
    ],
    summaryTemplate: 'On foot',
    summaryTemplateRu: 'Пешком',
  },
  Disembark: {
    event: 'Disembark',
    title: 'Disembark',
    titleRu: 'Сесть на корабль',
    category: 'odyssey',
    icon: '🚀',
    fields: [
      { key: 'Teleport', label: 'Teleport', labelRu: 'Телепорт' },
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
      { key: 'Station', label: 'Station', labelRu: 'Станция' },
      { key: 'Body', label: 'Body', labelRu: 'Тело' },
    ],
    summaryTemplate: 'In ship',
    summaryTemplateRu: 'В корабле',
  },
  Backpack: {
    event: 'Backpack',
    title: 'Backpack',
    titleRu: 'Рюкзак',
    category: 'odyssey',
    icon: '🎒',
    fields: [
      { key: 'Items', label: 'Items', labelRu: 'Предметы' },
    ],
    summaryTemplate: 'Backpack updated',
    summaryTemplateRu: 'Рюкзак обновлён',
  },
  BackpackChange: {
    event: 'BackpackChange',
    title: 'Backpack Change',
    titleRu: 'Изменение рюкзака',
    category: 'odyssey',
    icon: '🎒',
    fields: [
      { key: 'Added', label: 'Added', labelRu: 'Добавлено' },
      { key: 'Removed', label: 'Removed', labelRu: 'Удалено' },
    ],
    summaryTemplate: 'Backpack changed',
    summaryTemplateRu: 'Рюкзак изменён',
  },
  SuitLoadout: {
    event: 'SuitLoadout',
    title: 'Suit Loadout',
    titleRu: 'Конфиг скафандра',
    category: 'odyssey',
    icon: '👤',
    fields: [
      { key: 'LoadoutName', label: 'Name', labelRu: 'Имя' },
      { key: 'SuitName', label: 'Suit', labelRu: 'Скафандр' },
    ],
    summaryTemplate: '{SuitName} - {LoadoutName}',
    summaryTemplateRu: '{SuitName} - {LoadoutName}',
  },
  Loadout: {
    event: 'Loadout',
    title: 'Loadout',
    titleRu: 'Конфигурация',
    category: 'odyssey',
    icon: '⚙️',
    fields: [
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
      { key: 'ShipID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Modules', label: 'Modules', labelRu: 'Модули' },
    ],
    summaryTemplate: '{Ship}',
    summaryTemplateRu: '{Ship}',
  },
  BuySuit: {
    event: 'BuySuit',
    title: 'Buy Suit',
    titleRu: 'Покупка скафандра',
    category: 'odyssey',
    icon: '👤',
    fields: [
      { key: 'Name', label: 'Suit', labelRu: 'Скафандр' },
      { key: 'Name_Localised', label: 'Suit', labelRu: 'Скафандр' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Name} • {Cost}',
    summaryTemplateRu: '{Name} • {Cost}',
  },
  SellSuit: {
    event: 'SellSuit',
    title: 'Sell Suit',
    titleRu: 'Продажа скафандра',
    category: 'odyssey',
    icon: '👤',
    fields: [
      { key: 'Name', label: 'Suit', labelRu: 'Скафандр' },
      { key: 'Cost', label: 'Value', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Name} • {Cost}',
    summaryTemplateRu: '{Name} • {Cost}',
  },
  BuyWeapon: {
    event: 'BuyWeapon',
    title: 'Buy Weapon',
    titleRu: 'Покупка оружия',
    category: 'odyssey',
    icon: '🔫',
    fields: [
      { key: 'Name', label: 'Weapon', labelRu: 'Оружие' },
      { key: 'Name_Localised', label: 'Weapon', labelRu: 'Оружие' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Name} • {Cost}',
    summaryTemplateRu: '{Name} • {Cost}',
  },
  SellWeapon: {
    event: 'SellWeapon',
    title: 'Sell Weapon',
    titleRu: 'Продажа оружия',
    category: 'odyssey',
    icon: '🔫',
    fields: [
      { key: 'Name', label: 'Weapon', labelRu: 'Оружие' },
      { key: 'Cost', label: 'Value', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{Name} • {Cost}',
    summaryTemplateRu: '{Name} • {Cost}',
  },
  SwitchSuit: {
    event: 'SwitchSuit',
    title: 'Switch Suit',
    titleRu: 'Смена скафандра',
    category: 'odyssey',
    icon: '👤',
    fields: [
      { key: 'SuitName', label: 'Suit', labelRu: 'Скафандр' },
      { key: 'Loadout', label: 'Loadout', labelRu: 'Конфиг' },
    ],
    summaryTemplate: '{SuitName}',
    summaryTemplateRu: '{SuitName}',
  },
  SwitchWeapon: {
    event: 'SwitchWeapon',
    title: 'Switch Weapon',
    titleRu: 'Смена оружия',
    category: 'odyssey',
    icon: '🔫',
    fields: [
      { key: 'WeaponName', label: 'Weapon', labelRu: 'Оружие' },
      { key: 'Loadout', label: 'Loadout', labelRu: 'Конфиг' },
    ],
    summaryTemplate: '{WeaponName}',
    summaryTemplateRu: '{WeaponName}',
  },
  UseConsumable: {
    event: 'UseConsumable',
    title: 'Use Consumable',
    titleRu: 'Использование расходника',
    category: 'odyssey',
    icon: '💊',
    fields: [
      { key: 'Name', label: 'Item', labelRu: 'Предмет' },
      { key: 'Name_Localised', label: 'Item', labelRu: 'Предмет' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  ActivateEffect: {
    event: 'ActivateEffect',
    title: 'Activate Effect',
    titleRu: 'Активация эффекта',
    category: 'odyssey',
    icon: '✨',
    fields: [
      { key: 'Name', label: 'Effect', labelRu: 'Эффект' },
      { key: 'Name_Localised', label: 'Effect', labelRu: 'Эффект' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },

  // ==================== FLEET ====================
  CarrierStats: {
    event: 'CarrierStats',
    title: 'Carrier Stats',
    titleRu: 'Статистика носителя',
    category: 'fleet',
    icon: '🛸',
    fields: [
      { key: 'CarrierName', label: 'Name', labelRu: 'Имя' },
      { key: 'CarrierID', label: 'ID', labelRu: 'ID' },
      { key: 'Balance', label: 'Balance', labelRu: 'Баланс', format: 'credits' },
      { key: 'ReserveBalance', label: 'Reserve', labelRu: 'Резерв', format: 'credits' },
    ],
    summaryTemplate: '{CarrierName}',
    summaryTemplateRu: '{CarrierName}',
  },
  CarrierBuy: {
    event: 'CarrierBuy',
    title: 'Carrier Buy',
    titleRu: 'Покупка носителя',
    category: 'fleet',
    icon: '🛸',
    fields: [
      { key: 'CarrierName', label: 'Name', labelRu: 'Имя' },
      { key: 'Price', label: 'Price', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{CarrierName} • {Price}',
    summaryTemplateRu: '{CarrierName} • {Price}',
  },
  CarrierJumpRequest: {
    event: 'CarrierJumpRequest',
    title: 'Carrier Jump Request',
    titleRu: 'Запрос прыжка носителя',
    category: 'fleet',
    icon: '⏳',
    fields: [
      { key: 'CarrierName', label: 'Carrier', labelRu: 'Носитель' },
      { key: 'SystemName', label: 'System', labelRu: 'Система' },
    ],
    summaryTemplate: '{CarrierName} → {SystemName}',
    summaryTemplateRu: '{CarrierName} → {SystemName}',
  },
  CarrierDepositFuel: {
    event: 'CarrierDepositFuel',
    title: 'Carrier Fuel',
    titleRu: 'Заправка носителя',
    category: 'fleet',
    icon: '⛽',
    fields: [],
    summaryTemplate: 'Fuel deposited',
    summaryTemplateRu: 'Топливо загружено',
  },
  CarrierSell: {
    event: 'CarrierSell',
    title: 'Carrier Sell',
    titleRu: 'Продажа носителя',
    category: 'fleet',
    icon: '🛸',
    fields: [
      { key: 'CarrierName', label: 'Name', labelRu: 'Имя' },
      { key: 'Price', label: 'Price', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{CarrierName} • {Price}',
    summaryTemplateRu: '{CarrierName} • {Price}',
  },
  CarrierBankTransfer: {
    event: 'CarrierBankTransfer',
    title: 'Bank Transfer',
    titleRu: 'Перевод на носитель',
    category: 'fleet',
    icon: '💸',
    fields: [
      { key: 'CarrierName', label: 'Carrier', labelRu: 'Носитель' },
      { key: 'Amount', label: 'Amount', labelRu: 'Сумма', format: 'credits' },
      { key: 'Deposit', label: 'Deposit', labelRu: 'Депозит' },
    ],
    summaryTemplate: '{Amount}',
    summaryTemplateRu: '{Amount}',
  },
  ModuleBuy: {
    event: 'ModuleBuy',
    title: 'Buy Module',
    titleRu: 'Покупка модуля',
    category: 'fleet',
    icon: '🔩',
    fields: [
      { key: 'Slot', label: 'Slot', labelRu: 'Слот' },
      { key: 'BuyItem', label: 'Module', labelRu: 'Модуль' },
      { key: 'BuyPrice', label: 'Price', labelRu: 'Цена', format: 'credits' },
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
    ],
    summaryTemplate: '{BuyItem} • {BuyPrice}',
    summaryTemplateRu: '{BuyItem} • {BuyPrice}',
  },
  ModuleSell: {
    event: 'ModuleSell',
    title: 'Sell Module',
    titleRu: 'Продажа модуля',
    category: 'fleet',
    icon: '🔩',
    fields: [
      { key: 'Slot', label: 'Slot', labelRu: 'Слот' },
      { key: 'SellItem', label: 'Module', labelRu: 'Модуль' },
      { key: 'SellPrice', label: 'Price', labelRu: 'Цена', format: 'credits' },
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
    ],
    summaryTemplate: '{SellItem} • {SellPrice}',
    summaryTemplateRu: '{SellItem} • {SellPrice}',
  },
  ModuleSwap: {
    event: 'ModuleSwap',
    title: 'Module Swap',
    titleRu: 'Замена модуля',
    category: 'fleet',
    icon: '🔄',
    fields: [
      { key: 'FromSlot', label: 'From', labelRu: 'Из слота' },
      { key: 'ToSlot', label: 'To', labelRu: 'В слот' },
    ],
    summaryTemplate: '{FromSlot} → {ToSlot}',
    summaryTemplateRu: '{FromSlot} → {ToSlot}',
  },
  ModuleStore: {
    event: 'ModuleStore',
    title: 'Store Module',
    titleRu: 'Хранение модуля',
    category: 'fleet',
    icon: '📦',
    fields: [
      { key: 'Slot', label: 'Slot', labelRu: 'Слот' },
      { key: 'Item', label: 'Module', labelRu: 'Модуль' },
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
    ],
    summaryTemplate: '{Item}',
    summaryTemplateRu: '{Item}',
  },
  ModuleRetrieve: {
    event: 'ModuleRetrieve',
    title: 'Retrieve Module',
    titleRu: 'Получение модуля',
    category: 'fleet',
    icon: '📦',
    fields: [
      { key: 'Slot', label: 'Slot', labelRu: 'Слот' },
      { key: 'Item', label: 'Module', labelRu: 'Модуль' },
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
    ],
    summaryTemplate: '{Item}',
    summaryTemplateRu: '{Item}',
  },
  ShipyardBuy: {
    event: 'ShipyardBuy',
    title: 'Buy Ship',
    titleRu: 'Покупка корабля',
    category: 'fleet',
    icon: '🚀',
    fields: [
      { key: 'ShipType', label: 'Ship', labelRu: 'Корабль' },
      { key: 'ShipPrice', label: 'Price', labelRu: 'Цена', format: 'credits' },
      { key: 'StoreOldShip', label: 'Trade-in', labelRu: 'Обмен' },
    ],
    summaryTemplate: '{ShipType} • {ShipPrice}',
    summaryTemplateRu: '{ShipType} • {ShipPrice}',
  },
  ShipyardSell: {
    event: 'ShipyardSell',
    title: 'Sell Ship',
    titleRu: 'Продажа корабля',
    category: 'fleet',
    icon: '🚀',
    fields: [
      { key: 'ShipType', label: 'Ship', labelRu: 'Корабль' },
      { key: 'ShipPrice', label: 'Price', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{ShipType} • {ShipPrice}',
    summaryTemplateRu: '{ShipType} • {ShipPrice}',
  },
  ShipyardTransfer: {
    event: 'ShipyardTransfer',
    title: 'Transfer Ship',
    titleRu: 'Перемещение корабля',
    category: 'fleet',
    icon: '🚀',
    fields: [
      { key: 'ShipType', label: 'Ship', labelRu: 'Корабль' },
      { key: 'ShipID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Distance', label: 'Distance', labelRu: 'Расстояние', format: 'distance' },
      { key: 'TransferPrice', label: 'Price', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{ShipType} → {Distance}',
    summaryTemplateRu: '{ShipType} → {Distance}',
  },
  Outfitting: {
    event: 'Outfitting',
    title: 'Outfitting',
    titleRu: 'Аутфиттинг',
    category: 'fleet',
    icon: '🔧',
    fields: [
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
      { key: 'ShipID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'Modules', label: 'Modules', labelRu: 'Модули' },
    ],
    summaryTemplate: '{Ship}',
    summaryTemplateRu: '{Ship}',
  },
  Market: {
    event: 'Market',
    title: 'Market',
    titleRu: 'Рынок',
    category: 'fleet',
    icon: '🏪',
    fields: [
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
      { key: 'MarketID', label: 'ID', labelRu: 'ID', format: 'number' },
    ],
    summaryTemplate: '{StationName}',
    summaryTemplateRu: '{StationName}',
  },
  StoredShips: {
    event: 'StoredShips',
    title: 'Stored Ships',
    titleRu: 'Корабли на хранении',
    category: 'fleet',
    icon: '🚀',
    fields: [
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
    ],
    summaryTemplate: 'Stored ships',
    summaryTemplateRu: 'Корабли на хранении',
  },
  ShipyardNew: {
    event: 'ShipyardNew',
    title: 'New Ship',
    titleRu: 'Новый корабль',
    category: 'fleet',
    icon: '🚀',
    fields: [
      { key: 'ShipType', label: 'Ship', labelRu: 'Корабль' },
      { key: 'ShipID', label: 'ID', labelRu: 'ID', format: 'number' },
    ],
    summaryTemplate: '{ShipType}',
    summaryTemplateRu: '{ShipType}',
  },

  // ==================== SYSTEM ====================
  Rank: {
    event: 'Rank',
    title: 'Rank',
    titleRu: 'Ранг',
    category: 'system',
    icon: '🎖️',
    fields: [
      { key: 'Combat', label: 'Combat', labelRu: 'Бой', format: 'number' },
      { key: 'Trade', label: 'Trade', labelRu: 'Торговля', format: 'number' },
      { key: 'Explore', label: 'Explore', labelRu: 'Исследование', format: 'number' },
      { key: 'Empire', label: 'Empire', labelRu: 'Империя', format: 'number' },
      { key: 'Federation', label: 'Federation', labelRu: 'Федерация', format: 'number' },
      { key: 'CQC', label: 'CQC', labelRu: 'CQC', format: 'number' },
    ],
    summaryTemplate: 'Ranks updated',
    summaryTemplateRu: 'Ранги обновлены',
  },
  Progress: {
    event: 'Progress',
    title: 'Progress',
    titleRu: 'Прогресс',
    category: 'system',
    icon: '📊',
    fields: [
      { key: 'Combat', label: 'Combat', labelRu: 'Бой', format: 'percent' },
      { key: 'Trade', label: 'Trade', labelRu: 'Торговля', format: 'percent' },
      { key: 'Explore', label: 'Explore', labelRu: 'Исследование', format: 'percent' },
      { key: 'Empire', label: 'Empire', labelRu: 'Империя', format: 'percent' },
      { key: 'Federation', label: 'Federation', labelRu: 'Федерация', format: 'percent' },
      { key: 'CQC', label: 'CQC', labelRu: 'CQC', format: 'percent' },
    ],
    summaryTemplate: 'Progress updated',
    summaryTemplateRu: 'Прогресс обновлён',
  },
  Statistics: {
    event: 'Statistics',
    title: 'Statistics',
    titleRu: 'Статистика',
    category: 'system',
    icon: '📈',
    fields: [
      { key: 'Bank_Account', label: 'Bank', labelRu: 'Банк' },
      { key: 'Combat', label: 'Combat', labelRu: 'Бой' },
      { key: 'Trade', label: 'Trade', labelRu: 'Торговля' },
      { key: 'Exploration', label: 'Exploration', labelRu: 'Исследование' },
      { key: 'Mining', label: 'Mining', labelRu: 'Добыча' },
    ],
    summaryTemplate: 'Statistics',
    summaryTemplateRu: 'Статистика',
  },
  LoadGame: {
    event: 'LoadGame',
    title: 'Load Game',
    titleRu: 'Загрузка',
    category: 'system',
    icon: '🎮',
    fields: [
      { key: 'Commander', label: 'Commander', labelRu: 'Командир' },
      { key: 'Ship', label: 'Ship', labelRu: 'Корабль' },
      { key: 'ShipID', label: 'ID', labelRu: 'ID', format: 'number' },
      { key: 'GameMode', label: 'Mode', labelRu: 'Режим' },
      { key: 'Credits', label: 'Credits', labelRu: 'Кредиты', format: 'credits' },
      { key: 'Loan', label: 'Loan', labelRu: 'Кредит', format: 'credits' },
    ],
    summaryTemplate: '{Commander} • {Ship}',
    summaryTemplateRu: '{Commander} • {Ship}',
  },
  Cargo: {
    event: 'Cargo',
    title: 'Cargo',
    titleRu: 'Груз',
    category: 'system',
    icon: '📦',
    fields: [
      { key: 'Count', label: 'Count', labelRu: 'Кол-во', format: 'number' },
      { key: 'Inventory', label: 'Inventory', labelRu: 'Инвентарь' },
    ],
    summaryTemplate: '{Count} items',
    summaryTemplateRu: '{Count} предметов',
  },
  Materials: {
    event: 'Materials',
    title: 'Materials',
    titleRu: 'Материалы',
    category: 'system',
    icon: '🔬',
    fields: [
      { key: 'Raw', label: 'Raw', labelRu: 'Сырье' },
      { key: 'Manufactured', label: 'Manufactured', labelRu: 'Манufactured' },
      { key: 'Encoded', label: 'Encoded', labelRu: 'Encoded' },
    ],
    summaryTemplate: 'Materials updated',
    summaryTemplateRu: 'Материалы обновлены',
  },
  ClearSavedGame: {
    event: 'ClearSavedGame',
    title: 'Clear Save',
    titleRu: 'Очистка сохранения',
    category: 'system',
    icon: '🗑️',
    fields: [
      { key: 'Commander', label: 'Commander', labelRu: 'Командир' },
    ],
    summaryTemplate: 'Save cleared',
    summaryTemplateRu: 'Сохранение очищено',
  },
  Fileheader: {
    event: 'Fileheader',
    title: 'File Header',
    titleRu: 'Заголовок файла',
    category: 'system',
    icon: '📄',
    fields: [
      { key: 'gameversion', label: 'Version', labelRu: 'Версия' },
      { key: 'build', label: 'Build', labelRu: 'Сборка' },
    ],
    summaryTemplate: 'v{gameversion}',
    summaryTemplateRu: 'v{gameversion}',
  },
  Shutdown: {
    event: 'Shutdown',
    title: 'Shutdown',
    titleRu: 'Выключение',
    category: 'system',
    icon: '🔴',
    fields: [],
    summaryTemplate: 'Game closed',
    summaryTemplateRu: 'Игра закрыта',
  },
  NewCommander: {
    event: 'NewCommander',
    title: 'New Commander',
    titleRu: 'Новый командир',
    category: 'system',
    icon: '✨',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  Reputation: {
    event: 'Reputation',
    title: 'Reputation',
    titleRu: 'Репутация',
    category: 'system',
    icon: '💎',
    fields: [
      { key: 'Faction', label: 'Faction', labelRu: 'Фракция' },
      { key: 'FactionState', label: 'State', labelRu: 'Состояние' },
    ],
    summaryTemplate: '{Faction}',
    summaryTemplateRu: '{Faction}',
  },
  Commander: {
    event: 'Commander',
    title: 'Commander',
    titleRu: 'Командир',
    category: 'system',
    icon: '👤',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
      { key: 'FID', label: 'FID', labelRu: 'FID' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  Passengers: {
    event: 'Passengers',
    title: 'Passengers',
    titleRu: 'Пассажиры',
    category: 'system',
    icon: '👥',
    fields: [
      { key: 'Manifest', label: 'Manifest', labelRu: 'Манифест' },
    ],
    summaryTemplate: 'Passengers',
    summaryTemplateRu: 'Пассажиры',
  },
  QuitGame: {
    event: 'QuitGame',
    title: 'Quit Game',
    titleRu: 'Выход',
    category: 'system',
    icon: '🚪',
    fields: [
      { key: 'Commanders', label: 'Commanders', labelRu: 'Командиры', format: 'number' },
    ],
    summaryTemplate: 'Quit',
    summaryTemplateRu: 'Выход',
  },
  Promotion: {
    event: 'Promotion',
    title: 'Promotion',
    titleRu: 'Повышение',
    category: 'system',
    icon: '⭐',
    fields: [
      { key: 'Combat', label: 'Combat', labelRu: 'Бой', format: 'number' },
      { key: 'Trade', label: 'Trade', labelRu: 'Торговля', format: 'number' },
      { key: 'Explore', label: 'Explore', labelRu: 'Исследование', format: 'number' },
      { key: 'Empire', label: 'Empire', labelRu: 'Империя', format: 'number' },
      { key: 'Federation', label: 'Federation', labelRu: 'Федерация', format: 'number' },
    ],
    summaryTemplate: 'Promoted',
    summaryTemplateRu: 'Повышен',
  },
  Powerplay: {
    event: 'Powerplay',
    title: 'Powerplay',
    titleRu: 'Powerplay',
    category: 'system',
    icon: '👑',
    fields: [
      { key: 'Power', label: 'Power', labelRu: 'Сила' },
      { key: 'Rank', label: 'Rank', labelRu: 'Ранг', format: 'number' },
      { key: 'Merits', label: 'Merits', labelRu: 'Заслуги', format: 'number' },
    ],
    summaryTemplate: '{Power}: {Rank}',
    summaryTemplateRu: '{Power}: {Rank}',
  },
  PowerplayJoin: {
    event: 'PowerplayJoin',
    title: 'Powerplay Join',
    titleRu: 'Вступление в Powerplay',
    category: 'system',
    icon: '👑',
    fields: [
      { key: 'Power', label: 'Power', labelRu: 'Сила' },
    ],
    summaryTemplate: 'Joined {Power}',
    summaryTemplateRu: 'Присоединился к {Power}',
  },
  PowerplayLeave: {
    event: 'PowerplayLeave',
    title: 'Powerplay Leave',
    titleRu: 'Выход из Powerplay',
    category: 'system',
    icon: '👑',
    fields: [
      { key: 'Power', label: 'Power', labelRu: 'Сила' },
    ],
    summaryTemplate: 'Left {Power}',
    summaryTemplateRu: 'Покинул {Power}',
  },
  PowerplaySalary: {
    event: 'PowerplaySalary',
    title: 'Powerplay Salary',
    titleRu: 'Зарплата Powerplay',
    category: 'system',
    icon: '💰',
    fields: [
      { key: 'Power', label: 'Power', labelRu: 'Сила' },
      { key: 'Amount', label: 'Amount', labelRu: 'Сумма', format: 'credits' },
    ],
    summaryTemplate: '{Amount}',
    summaryTemplateRu: '{Amount}',
  },
  CommunityGoalJoin: {
    event: 'CommunityGoalJoin',
    title: 'CG Join',
    titleRu: 'Участие в CG',
    category: 'system',
    icon: '🎯',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
      { key: 'Tier', label: 'Tier', labelRu: 'Уровень' },
    ],
    summaryTemplate: '{Name}',
    summaryTemplateRu: '{Name}',
  },
  CommunityGoalReward: {
    event: 'CommunityGoalReward',
    title: 'CG Reward',
    titleRu: 'Награда CG',
    category: 'system',
    icon: '🎁',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
      { key: 'Reward', label: 'Reward', labelRu: 'Награда', format: 'credits' },
    ],
    summaryTemplate: '{Name}: {Reward}',
    summaryTemplateRu: '{Name}: {Reward}',
  },
  DataScanned: {
    event: 'DataScanned',
    title: 'Data Scanned',
    titleRu: 'Данные отсканированы',
    category: 'system',
    icon: '📡',
    fields: [
      { key: 'Type', label: 'Type', labelRu: 'Тип' },
    ],
    summaryTemplate: '{Type}',
    summaryTemplateRu: '{Type}',
  },
  DatalinkScan: {
    event: 'DatalinkScan',
    title: 'Datalink Scan',
    titleRu: 'Скан даталинка',
    category: 'system',
    icon: '📡',
    fields: [
      { key: 'Message', label: 'Message', labelRu: 'Сообщение' },
    ],
    summaryTemplate: 'Datalink',
    summaryTemplateRu: 'Даталинк',
  },
  DatalinkVoucher: {
    event: 'DatalinkVoucher',
    title: 'Datalink Voucher',
    titleRu: 'Выплата за даталинк',
    category: 'system',
    icon: '💰',
    fields: [
      { key: 'Reward', label: 'Reward', labelRu: 'Награда', format: 'credits' },
      { key: 'VictimFaction', label: 'Faction', labelRu: 'Фракция' },
      { key: 'PayeeFaction', label: 'Payee', labelRu: 'Получатель' },
    ],
    summaryTemplate: '{Reward}',
    summaryTemplateRu: '{Reward}',
  },
  Music: {
    event: 'Music',
    title: 'Music',
    titleRu: 'Музыка',
    category: 'system',
    icon: '🎵',
    fields: [
      { key: 'MusicTrack', label: 'Track', labelRu: 'Трек' },
    ],
    summaryTemplate: '{MusicTrack}',
    summaryTemplateRu: '{MusicTrack}',
  },
  ModuleInfo: {
    event: 'ModuleInfo',
    title: 'Module Info',
    titleRu: 'Инфо о модуле',
    category: 'system',
    icon: '🔩',
    fields: [
      { key: 'Modules', label: 'Modules', labelRu: 'Модули' },
    ],
    summaryTemplate: 'Modules',
    summaryTemplateRu: 'Модули',
  },
  ShipLocker: {
    event: 'ShipLocker',
    title: 'Ship Locker',
    titleRu: 'Корабельный арсенал',
    category: 'system',
    icon: '📦',
    fields: [
      { key: 'Items', label: 'Items', labelRu: 'Предметы' },
    ],
    summaryTemplate: 'Ship locker',
    summaryTemplateRu: 'Корабельный арсенал',
  },
  SelfDestruct: {
    event: 'SelfDestruct',
    title: 'Self Destruct',
    titleRu: 'Самоуничтожение',
    category: 'system',
    icon: '💥',
    fields: [
      { key: 'Player', label: 'Player', labelRu: 'Игрок' },
    ],
    summaryTemplate: 'Self destruct',
    summaryTemplateRu: 'Самоуничтожение',
  },
  RebootRepair: {
    event: 'RebootRepair',
    title: 'Reboot Repair',
    titleRu: 'Перезагрузка ремонта',
    category: 'system',
    icon: '🔄',
    fields: [
      { key: 'Modules', label: 'Modules', labelRu: 'Модули' },
    ],
    summaryTemplate: 'Reboot repair',
    summaryTemplateRu: 'Перезагрузка ремонта',
  },
  CargoDepot: {
    event: 'CargoDepot',
    title: 'Cargo Depot',
    titleRu: 'Грузовой терминал',
    category: 'system',
    icon: '📦',
    fields: [
      { key: 'MissionID', label: 'Mission', labelRu: 'Миссия', format: 'number' },
      { key: 'Count', label: 'Count', labelRu: 'Кол-во', format: 'number' },
      { key: 'StartMarketID', label: 'Start', labelRu: 'Старт', format: 'number' },
      { key: 'EndMarketID', label: 'End', labelRu: 'Конец', format: 'number' },
    ],
    summaryTemplate: 'Cargo depot',
    summaryTemplateRu: 'Грузовой терминал',
  },
  TechnologyBroker: {
    event: 'TechnologyBroker',
    title: 'Technology Broker',
    titleRu: 'Техноброкер',
    category: 'system',
    icon: '🔧',
    fields: [
      { key: 'BrokerType', label: 'Type', labelRu: 'Тип' },
      { key: 'Item', label: 'Item', labelRu: 'Предмет' },
      { key: 'ItemsUnlocked', label: 'Unlocked', labelRu: 'Открыто', format: 'number' },
      { key: 'Materials', label: 'Materials', labelRu: 'Материалы' },
    ],
    summaryTemplate: 'Technology broker',
    summaryTemplateRu: 'Техноброкер',
  },
  // ==================== MEDIUM & RARE EVENTS ====================
  NavRouteClear: {
    event: 'NavRouteClear',
    title: 'Route Cleared',
    titleRu: 'Маршрут очищен',
    category: 'travel',
    icon: '🗑️',
    fields: [],
    summaryTemplate: 'Route cleared',
    summaryTemplateRu: 'Маршрут очищен',
  },
  DetailedScan: {
    event: 'DetailedScan',
    title: 'Detailed Scan',
    titleRu: 'Детальное сканирование',
    category: 'exploration',
    icon: '🔍',
    fields: [
      { key: 'BodyName', label: 'Body', labelRu: 'Тело' },
      { key: 'ScanValue', label: 'Value', labelRu: 'Ценность', format: 'credits' },
    ],
    summaryTemplate: '{BodyName}',
    summaryTemplateRu: '{BodyName}',
  },
  Screenshot: {
    event: 'Screenshot',
    title: 'Screenshot',
    titleRu: 'Скриншот',
    category: 'exploration',
    icon: '📸',
    fields: [
      { key: 'Filename', label: 'File', labelRu: 'Файл' },
    ],
    summaryTemplate: 'Screenshot',
    summaryTemplateRu: 'Скриншот',
  },
  BuyExplorationData: {
    event: 'BuyExplorationData',
    title: 'Buy Data',
    titleRu: 'Покупка данных',
    category: 'exploration',
    icon: '📈',
    fields: [
      { key: 'System', label: 'System', labelRu: 'Система' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{System}',
    summaryTemplateRu: '{System}',
  },
  BuyTradeData: {
    event: 'BuyTradeData',
    title: 'Buy Trade Data',
    titleRu: 'Данные торговли',
    category: 'trade',
    icon: '📈',
    fields: [
      { key: 'System', label: 'System', labelRu: 'Система' },
      { key: 'Cost', label: 'Cost', labelRu: 'Цена', format: 'credits' },
    ],
    summaryTemplate: '{System}',
    summaryTemplateRu: '{System}',
  },
  USSDrop: {
    event: 'USSDrop',
    title: 'USS Drop',
    titleRu: 'USS',
    category: 'trade',
    icon: '📡',
    fields: [
      { key: 'USSType', label: 'Type', labelRu: 'Тип' },
    ],
    summaryTemplate: 'USS',
    summaryTemplateRu: 'USS',
  },
  PayFines: {
    event: 'PayFines',
    title: 'Pay Fines',
    titleRu: 'Штрафы оплачены',
    category: 'system',
    icon: '💸',
    fields: [
      { key: 'Amount', label: 'Amount', labelRu: 'Сумма', format: 'credits' },
    ],
    summaryTemplate: '{Amount}',
    summaryTemplateRu: '{Amount}',
  },
  PayBounties: {
    event: 'PayBounties',
    title: 'Pay Bounties',
    titleRu: 'Награды оплачены',
    category: 'system',
    icon: '💀',
    fields: [
      { key: 'Amount', label: 'Amount', labelRu: 'Сумма', format: 'credits' },
    ],
    summaryTemplate: '{Amount}',
    summaryTemplateRu: '{Amount}',
  },
  EscapeInterdiction: {
    event: 'EscapeInterdiction',
    title: 'Escape Interdiction',
    titleRu: 'Уход от перехвата',
    category: 'combat',
    icon: '🏃',
    fields: [],
    summaryTemplate: 'Escaped',
    summaryTemplateRu: 'Ушёл',
  },
  HeatWarning: {
    event: 'HeatWarning',
    title: 'Heat Warning',
    titleRu: 'Предупреждение о жаре',
    category: 'combat',
    icon: '⚠️',
    fields: [
      { key: 'Heat', label: 'Heat', labelRu: 'Жара', format: 'number' },
    ],
    summaryTemplate: 'Heat: {Heat}',
    summaryTemplateRu: 'Жара: {Heat}',
  },
  HeatDamage: {
    event: 'HeatDamage',
    title: 'Heat Damage',
    titleRu: 'Повреждение от жары',
    category: 'combat',
    icon: '🌡️',
    fields: [],
    summaryTemplate: 'Heat damage',
    summaryTemplateRu: 'Повреждение от жары',
  },
  FighterDestroyed: {
    event: 'FighterDestroyed',
    title: 'Fighter Destroyed',
    titleRu: 'Истребитель уничтожен',
    category: 'combat',
    icon: '💥',
    fields: [],
    summaryTemplate: 'Fighter lost',
    summaryTemplateRu: 'Истребитель потерян',
  },
  LaunchFighter: {
    event: 'LaunchFighter',
    title: 'Launch Fighter',
    titleRu: 'Запуск истребителя',
    category: 'combat',
    icon: '🚀',
    fields: [],
    summaryTemplate: 'Fighter launched',
    summaryTemplateRu: 'Истребитель запущен',
  },
  DockingCancelled: {
    event: 'DockingCancelled',
    title: 'Docking Cancelled',
    titleRu: 'Стыковка отменена',
    category: 'travel',
    icon: '🚫',
    fields: [
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
    ],
    summaryTemplate: 'Cancelled',
    summaryTemplateRu: 'Отменено',
  },
  DockingTimeout: {
    event: 'DockingTimeout',
    title: 'Docking Timeout',
    titleRu: 'Таймаут стыковки',
    category: 'travel',
    icon: '⏱️',
    fields: [
      { key: 'StationName', label: 'Station', labelRu: 'Станция' },
    ],
    summaryTemplate: 'Timeout',
    summaryTemplateRu: 'Таймаут',
  },
  ScanBaryCentre: {
    event: 'ScanBaryCentre',
    title: 'Scan BaryCentre',
    titleRu: 'Скан барицентра',
    category: 'exploration',
    icon: '⚖️',
    fields: [],
    summaryTemplate: 'Barycentre scanned',
    summaryTemplateRu: 'Барицентр отсканирован',
  },
  WingAdd: {
    event: 'WingAdd',
    title: 'Wing Add',
    titleRu: 'В крыло добавлен',
    category: 'social',
    icon: '🦅',
    fields: [
      { key: 'Name', label: 'Name', labelRu: 'Имя' },
    ],
    summaryTemplate: '{Name} added',
    summaryTemplateRu: '{Name} добавлен',
  },
  NpcCrewRank: {
    event: 'NpcCrewRank',
    title: 'NPC Crew Rank',
    titleRu: 'Ранг NPC экипажа',
    category: 'social',
    icon: '🎖️',
    fields: [
      { key: 'NpcName', label: 'Name', labelRu: 'Имя' },
      { key: 'Rank', label: 'Rank', labelRu: 'Ранг' },
    ],
    summaryTemplate: '{NpcName}: {Rank}',
    summaryTemplateRu: '{NpcName}: {Rank}',
  },
  NpcCrewTerminated: {
    event: 'NpcCrewTerminated',
    title: 'NPC Terminated',
    titleRu: 'NPC уволен',
    category: 'social',
    icon: '👋',
    fields: [
      { key: 'NpcName', label: 'Name', labelRu: 'Имя' },
    ],
    summaryTemplate: '{NpcName} terminated',
    summaryTemplateRu: '{NpcName} уволен',
  },
  QuitACrew: {
    event: 'QuitACrew',
    title: 'Quit Crew',
    titleRu: 'Покинул экипаж',
    category: 'social',
    icon: '🚪',
    fields: [],
    summaryTemplate: 'Left crew',
    summaryTemplateRu: 'Покинул экипаж',
  },
  CarrierJumpCancelled: {
    event: 'CarrierJumpCancelled',
    title: 'Jump Cancelled',
    titleRu: 'Прыжок отменён',
    category: 'fleet',
    icon: '🚫',
    fields: [],
    summaryTemplate: 'Jump cancelled',
    summaryTemplateRu: 'Прыжок отменён',
  },
  CarrierNameChanged: {
    event: 'CarrierNameChanged',
    title: 'Name Changed',
    titleRu: 'Имя изменено',
    category: 'fleet',
    icon: '✏️',
    fields: [],
    summaryTemplate: 'Name changed',
    summaryTemplateRu: 'Имя изменено',
  },
  CarrierDecommission: {
    event: 'CarrierDecommission',
    title: 'Decommission',
    titleRu: 'Списание носителя',
    category: 'fleet',
    icon: '🗑️',
    fields: [],
    summaryTemplate: 'Decommissioned',
    summaryTemplateRu: 'Списан',
  },
  CarrierTradeOrder: {
    event: 'CarrierTradeOrder',
    title: 'Trade Order',
    titleRu: 'Торговый приказ',
    category: 'fleet',
    icon: '📋',
    fields: [],
    summaryTemplate: 'Trade order',
    summaryTemplateRu: 'Торговый приказ',
  },
  CarrierDockingPermission: {
    event: 'CarrierDockingPermission',
    title: 'Docking Permission',
    titleRu: 'Разрешение на стыковку',
    category: 'fleet',
    icon: '🔐',
    fields: [],
    summaryTemplate: 'Permissions changed',
    summaryTemplateRu: 'Разрешения изменены',
  },
  BookDropship: {
    event: 'BookDropship',
    title: 'Book Dropship',
    titleRu: 'Заказ десантника',
    category: 'odyssey',
    icon: '🚁',
    fields: [],
    summaryTemplate: 'Dropship booked',
    summaryTemplateRu: 'Десантник заказан',
  },
  BookTaxi: {
    event: 'BookTaxi',
    title: 'Book Taxi',
    titleRu: 'Заказ такси',
    category: 'odyssey',
    icon: '🚕',
    fields: [],
    summaryTemplate: 'Taxi booked',
    summaryTemplateRu: 'Такси заказано',
  },
  CancelDropship: {
    event: 'CancelDropship',
    title: 'Cancel Dropship',
    titleRu: 'Десантник отменён',
    category: 'odyssey',
    icon: '🚫',
    fields: [],
    summaryTemplate: 'Dropship cancelled',
    summaryTemplateRu: 'Десантник отменён',
  },
  CancelTaxi: {
    event: 'CancelTaxi',
    title: 'Cancel Taxi',
    titleRu: 'Такси отменено',
    category: 'odyssey',
    icon: '🚫',
    fields: [],
    summaryTemplate: 'Taxi cancelled',
    summaryTemplateRu: 'Такси отменено',
  },
  BuyMicroResources: {
    event: 'BuyMicroResources',
    title: 'Buy Micro Resources',
    titleRu: 'Покупка микроресурсов',
    category: 'odyssey',
    icon: '💰',
    fields: [],
    summaryTemplate: 'Resources bought',
    summaryTemplateRu: 'Ресурсы куплены',
  },
  CockpitBreached: {
    event: 'CockpitBreached',
    title: 'Cockpit Breached',
    titleRu: 'Кабина повреждена',
    category: 'system',
    icon: '💨',
    fields: [],
    summaryTemplate: 'Cockpit breached',
    summaryTemplateRu: 'Кабина повреждена',
  },
  ShipPowerDown: {
    event: 'ShipPowerDown',
    title: 'Power Down',
    titleRu: 'Корабль выключен',
    category: 'system',
    icon: '🔴',
    fields: [],
    summaryTemplate: 'Power down',
    summaryTemplateRu: 'Выключен',
  },
  ShipPowerUp: {
    event: 'ShipPowerUp',
    title: 'Power Up',
    titleRu: 'Корабль включен',
    category: 'system',
    icon: '🟢',
    fields: [],
    summaryTemplate: 'Power up',
    summaryTemplateRu: 'Включен',
  },
  ExperimentalSynthesis: {
    event: 'ExperimentalSynthesis',
    title: 'Experimental Synthesis',
    titleRu: 'Экспериментальный синтез',
    category: 'engineering',
    icon: '⚗️',
    fields: [],
    summaryTemplate: 'Experimental',
    summaryTemplateRu: 'Экспериментальный',
  },
  ShipyardSwap: {
    event: 'ShipyardSwap',
    title: 'Ship Swap',
    titleRu: 'Смена корабля',
    category: 'fleet',
    icon: '🔁',
    fields: [
      { key: 'ShipType', label: 'Ship', labelRu: 'Корабль' },
    ],
    summaryTemplate: '{ShipType}',
    summaryTemplateRu: '{ShipType}',
  },
};

export { EVENT_FORMATS };
