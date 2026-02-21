/**
 * Elite Dangerous Complete Events Catalog
 * Полный каталог всех событий журнала Elite Dangerous
 */

export interface EventField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  descriptionEn: string;
  example?: string | number | boolean | unknown[];
  required?: boolean;
}

export interface EventExample {
  timestamp: string;
  event: string;
  [key: string]: unknown;
}

export interface EventRelationship {
  before?: string[];
  after?: string[];
}

export interface EventDefinition {
  category: string;
  label: string;
  labelEn: string;
  icon: string;
  description: string;
  descriptionEn: string;
  fields: EventField[];
  example: EventExample;
  relationships: EventRelationship;
  difficulty?: 'simple' | 'medium' | 'complex';
  frequency?: 'common' | 'medium' | 'rare';
  isRare?: boolean;
  isDeprecated?: boolean;
}

export const EVENTS_CATALOG: Record<string, EventDefinition> = {
  // ==========================================================================
  // NAVIGATION & TRAVEL - Навигация и путешествия
  // ==========================================================================

  FSDJump: {
    category: 'navigation',
    label: 'Прыжок в систему',
    labelEn: 'FSD Jump',
    icon: '🌌',
    description: 'Переход корабля в новую систему через гипердвигатель',
    descriptionEn: 'Hyperspace jump to new star system',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Название системы', descriptionEn: 'System name', example: 'Sol', required: true },
      { name: 'StarPos', type: 'array', description: 'Координаты [x,y,z]', descriptionEn: 'Coordinates [x,y,z]', example: [0, 0, 0] },
      { name: 'SystemAddress', type: 'number', description: 'ID системы', descriptionEn: 'System ID', example: 1234567890123 },
      { name: 'JumpDist', type: 'number', description: 'Расстояние (с.л.)', descriptionEn: 'Distance (ly)', example: 12.345 },
      { name: 'FuelUsed', type: 'number', description: 'Исп. топлива', descriptionEn: 'Fuel used', example: 0.54321 },
      { name: 'FuelLevel', type: 'number', description: 'Топлива осталось', descriptionEn: 'Fuel remaining', example: 15.2 },
    ],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'FSDJump', StarSystem: 'Sol', StarPos: [0, 0, 0], JumpDist: 12.345, FuelUsed: 0.54, FuelLevel: 15.2 },
    relationships: { before: ['StartJump', 'FSDCharge'], after: ['Scan', 'SupercruiseEntry', 'Location'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  FSDCharge: {
    category: 'navigation',
    label: 'Зарядка FSD',
    labelEn: 'FSD Charging',
    icon: '⚡',
    description: 'Начало зарядки гипердвигателя',
    descriptionEn: 'Hyperdrive charging started',
    fields: [
      { name: 'JumpDist', type: 'number', description: 'Расстояние', descriptionEn: 'Distance', example: 12.345 },
      { name: 'Boosted', type: 'boolean', description: 'Усилитель', descriptionEn: 'Boosted', example: false },
    ],
    example: { timestamp: '2024-05-20T11:59:55Z', event: 'FSDCharge', JumpDist: 12.345, Boosted: false },
    relationships: { before: [], after: ['FSDJump', 'FSDTarget'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  StartJump: {
    category: 'navigation',
    label: 'Начало прыжка',
    labelEn: 'Start Jump',
    icon: '🚀',
    description: 'Начало гиперпрыжка',
    descriptionEn: 'Hyperspace jump initiated',
    fields: [
      { name: 'JumpType', type: 'string', description: 'Тип прыжка', descriptionEn: 'Jump type', example: 'Hyperspace', required: true },
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
      { name: 'Distance', type: 'number', description: 'Расстояние', descriptionEn: 'Distance', example: 12.345 },
    ],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'StartJump', JumpType: 'Hyperspace', StarSystem: 'Sol', Distance: 12.345 },
    relationships: { before: ['FSDCharge'], after: ['FSDJump'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  FSDTarget: {
    category: 'navigation',
    label: 'Цель FSD',
    labelEn: 'FSD Target',
    icon: '🎯',
    description: 'Выбрана целевая система',
    descriptionEn: 'Target system selected',
    fields: [
      { name: 'Name', type: 'string', description: 'Название', descriptionEn: 'Name', example: 'Sol' },
      { name: 'Distance', type: 'number', description: 'Расстояние', descriptionEn: 'Distance', example: 12.345 },
    ],
    example: { timestamp: '2024-05-20T11:55:00Z', event: 'FSDTarget', Name: 'Sol', Distance: 12.345 },
    relationships: { before: ['NavRoute'], after: ['FSDCharge'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  SupercruiseEntry: {
    category: 'navigation',
    label: 'Вход в суперкруиз',
    labelEn: 'Supercruise Entry',
    icon: '🚀',
    description: 'Вход в режим суперкруиза',
    descriptionEn: 'Entered supercruise',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
    ],
    example: { timestamp: '2024-05-20T12:05:00Z', event: 'SupercruiseEntry', StarSystem: 'Sol' },
    relationships: { before: ['FSDJump'], after: ['SupercruiseExit', 'ApproachBody'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  SupercruiseExit: {
    category: 'navigation',
    label: 'Выход из суперкруиза',
    labelEn: 'Supercruise Exit',
    icon: '🛑',
    description: 'Выход из режима суперкруиза',
    descriptionEn: 'Exited supercruise',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
      { name: 'Body', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Earth' },
    ],
    example: { timestamp: '2024-05-20T12:10:00Z', event: 'SupercruiseExit', StarSystem: 'Sol', Body: 'Earth' },
    relationships: { before: ['SupercruiseEntry', 'ApproachBody'], after: ['Touchdown', 'Liftoff'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  ApproachBody: {
    category: 'navigation',
    label: 'Приближение к телу',
    labelEn: 'Approach Body',
    icon: '🛸',
    description: 'Приближение к небесному телу',
    descriptionEn: 'Approaching celestial body',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
      { name: 'Body', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Earth' },
      { name: 'BodyID', type: 'number', description: 'ID тела', descriptionEn: 'Body ID', example: 17 },
    ],
    example: { timestamp: '2024-05-20T12:08:00Z', event: 'ApproachBody', StarSystem: 'Sol', Body: 'Earth' },
    relationships: { before: ['SupercruiseEntry'], after: ['LeaveBody', 'SupercruiseExit'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  LeaveBody: {
    category: 'navigation',
    label: 'Уход от тела',
    labelEn: 'Leave Body',
    icon: '👋',
    description: 'Уход от небесного тела',
    descriptionEn: 'Leaving celestial body',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
      { name: 'Body', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Earth' },
    ],
    example: { timestamp: '2024-05-20T12:09:00Z', event: 'LeaveBody', StarSystem: 'Sol', Body: 'Earth' },
    relationships: { before: ['ApproachBody'], after: ['SupercruiseEntry'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  Liftoff: {
    category: 'navigation',
    label: 'Взлёт',
    labelEn: 'Liftoff',
    icon: '🛫',
    description: 'Взлёт с поверхности',
    descriptionEn: 'Lifted off from surface',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
      { name: 'Body', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Earth' },
    ],
    example: { timestamp: '2024-05-20T13:00:00Z', event: 'Liftoff', StarSystem: 'Sol', Body: 'Earth' },
    relationships: { before: ['Touchdown'], after: ['SupercruiseEntry'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  Touchdown: {
    category: 'navigation',
    label: 'Посадка',
    labelEn: 'Touchdown',
    icon: '🦶',
    description: 'Посадка на поверхность',
    descriptionEn: 'Touched down on surface',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
      { name: 'Body', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Earth' },
    ],
    example: { timestamp: '2024-05-20T12:30:00Z', event: 'Touchdown', StarSystem: 'Sol', Body: 'Earth' },
    relationships: { before: ['SupercruiseExit', 'Liftoff'], after: ['Liftoff'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  Location: {
    category: 'navigation',
    label: 'Локация',
    labelEn: 'Location',
    icon: '📍',
    description: 'Текущее местоположение',
    descriptionEn: 'Current location',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol', required: true },
      { name: 'Docked', type: 'boolean', description: 'Пристыкован', descriptionEn: 'Docked', example: false },
      { name: 'StationName', type: 'string', description: 'Станция', descriptionEn: 'Station', example: 'Jameson Memorial' },
    ],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'Location', StarSystem: 'Sol', Docked: false },
    relationships: { before: ['LoadGame', 'Docked'], after: ['FSDJump'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  NavRoute: {
    category: 'navigation',
    label: 'Маршрут',
    labelEn: 'NavRoute',
    icon: '🗺️',
    description: 'Запланированный маршрут',
    descriptionEn: 'Planned route',
    fields: [
      { name: 'Route', type: 'array', description: 'Точки маршрута', descriptionEn: 'Route waypoints', example: [] },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'NavRoute', Route: [] },
    relationships: { before: [], after: ['FSDTarget'] },
    difficulty: 'complex',
    frequency: 'medium',
  },

  NavRouteClear: {
    category: 'navigation',
    label: 'Маршрут очищен',
    labelEn: 'NavRoute Cleared',
    icon: '🗑️',
    description: 'Маршрут очищён',
    descriptionEn: 'Route cleared',
    fields: [],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'NavRouteClear' },
    relationships: { before: ['NavRoute'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // STATION & DOCKING - Станции и стыковка
  // ==========================================================================

  Docked: {
    category: 'station',
    label: 'Пристыкован',
    labelEn: 'Docked',
    icon: '🏠',
    description: 'Пристыкован к станции',
    descriptionEn: 'Docked at station',
    fields: [
      { name: 'StationName', type: 'string', description: 'Станция', descriptionEn: 'Station', example: 'Jameson Memorial', required: true },
      { name: 'StationType', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'Orbis' },
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Shinrarta Dezhra', required: true },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Docked', StationName: 'Jameson Memorial', StationType: 'Orbis', StarSystem: 'Shinrarta Dezhra' },
    relationships: { before: ['DockingGranted'], after: ['Undocked', 'Market', 'Outfitting'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  Undocked: {
    category: 'station',
    label: 'Отстыковка',
    labelEn: 'Undocked',
    icon: '🚪',
    description: 'Отстыковка от станции',
    descriptionEn: 'Undocked from station',
    fields: [
      { name: 'StationName', type: 'string', description: 'Станция', descriptionEn: 'Station', example: 'Jameson Memorial' },
    ],
    example: { timestamp: '2024-05-20T11:00:00Z', event: 'Undocked', StationName: 'Jameson Memorial' },
    relationships: { before: ['Docked'], after: ['SupercruiseEntry', 'Liftoff'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  DockingRequested: {
    category: 'station',
    label: 'Запрос стыковки',
    labelEn: 'Docking Requested',
    icon: '📡',
    description: 'Запрос на стыковку',
    descriptionEn: 'Docking requested',
    fields: [
      { name: 'StationName', type: 'string', description: 'Станция', descriptionEn: 'Station', example: 'Jameson Memorial', required: true },
    ],
    example: { timestamp: '2024-05-20T09:55:00Z', event: 'DockingRequested', StationName: 'Jameson Memorial' },
    relationships: { before: [], after: ['DockingGranted', 'DockingDenied'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  DockingGranted: {
    category: 'station',
    label: 'Стыковка разрешена',
    labelEn: 'Docking Granted',
    icon: '✅',
    description: 'Стыковка разрешена',
    descriptionEn: 'Docking granted',
    fields: [
      { name: 'StationName', type: 'string', description: 'Станция', descriptionEn: 'Station', example: 'Jameson Memorial' },
      { name: 'LandingPad', type: 'number', description: 'Пад', descriptionEn: 'Landing pad', example: 12 },
    ],
    example: { timestamp: '2024-05-20T09:56:00Z', event: 'DockingGranted', StationName: 'Jameson Memorial', LandingPad: 12 },
    relationships: { before: ['DockingRequested'], after: ['Docked'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  DockingDenied: {
    category: 'station',
    label: 'Стыковка отклонена',
    labelEn: 'Docking Denied',
    icon: '❌',
    description: 'Стыковка отклонена',
    descriptionEn: 'Docking denied',
    fields: [
      { name: 'StationName', type: 'string', description: 'Станция', descriptionEn: 'Station', example: 'Jameson Memorial' },
      { name: 'Reason', type: 'string', description: 'Причина', descriptionEn: 'Reason', example: 'Too fast' },
    ],
    example: { timestamp: '2024-05-20T09:56:00Z', event: 'DockingDenied', StationName: 'Jameson Memorial', Reason: 'Too fast' },
    relationships: { before: ['DockingRequested'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // EXPLORATION & SCANNING - Исследование и сканирование
  // ==========================================================================

  Scan: {
    category: 'exploration',
    label: 'Сканирование',
    labelEn: 'Scan',
    icon: '🔭',
    description: 'Базовое сканирование тела',
    descriptionEn: 'Basic body scan',
    fields: [
      { name: 'BodyName', type: 'string', description: 'Название', descriptionEn: 'Name', example: 'Earth', required: true },
      { name: 'BodyID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 17 },
      { name: 'Type', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'Planet' },
      { name: 'SubType', type: 'string', description: 'Подтип', descriptionEn: 'Subtype', example: 'Earthlike world' },
    ],
    example: { timestamp: '2024-05-20T12:15:00Z', event: 'Scan', BodyName: 'Earth', BodyID: 17, Type: 'Planet', SubType: 'Earthlike world' },
    relationships: { before: ['FSDJump', 'DiscoveryScan'], after: ['DetailedScan', 'SellExplorationData'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  DetailedScan: {
    category: 'exploration',
    label: 'Детальное сканирование',
    labelEn: 'Detailed Scan',
    icon: '🔍',
    description: 'Детальное сканирование тела',
    descriptionEn: 'Detailed body scan',
    fields: [
      { name: 'BodyName', type: 'string', description: 'Название', descriptionEn: 'Name', example: 'Earth', required: true },
      { name: 'ScanValue', type: 'number', description: 'Ценность', descriptionEn: 'Scan value', example: 1000 },
    ],
    example: { timestamp: '2024-05-20T12:20:00Z', event: 'DetailedScan', BodyName: 'Earth', ScanValue: 1000 },
    relationships: { before: ['Scan'], after: ['SellExplorationData'] },
    difficulty: 'complex',
    frequency: 'common',
  },

  DiscoveryScan: {
    category: 'exploration',
    label: 'Discovery Scan',
    labelEn: 'Discovery Scan',
    icon: '📡',
    description: 'Сканирование системы',
    descriptionEn: 'System discovery scan',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol', required: true },
      { name: 'Bodies', type: 'number', description: 'Найдено тел', descriptionEn: 'Bodies found', example: 10 },
    ],
    example: { timestamp: '2024-05-20T12:10:00Z', event: 'DiscoveryScan', StarSystem: 'Sol', Bodies: 10 },
    relationships: { before: ['FSDJump'], after: ['Scan'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  FSSDiscoveryScan: {
    category: 'exploration',
    label: 'FSS Scan',
    labelEn: 'FSS Discovery Scan',
    icon: '📶',
    description: 'Сканирование FSS',
    descriptionEn: 'Full Spectrum Scanner scan',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol', required: true },
      { name: 'Bodies', type: 'number', description: 'Тела', descriptionEn: 'Bodies', example: 10 },
    ],
    example: { timestamp: '2024-05-20T12:12:00Z', event: 'FSSDiscoveryScan', StarSystem: 'Sol', Bodies: 10 },
    relationships: { before: ['DiscoveryScan'], after: ['Scan', 'FSSSignalDiscovered'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  FSSSignalDiscovered: {
    category: 'exploration',
    label: 'Сигнал обнаружен',
    labelEn: 'FSS Signal Discovered',
    icon: '📳',
    description: 'Сигнал найден при FSS',
    descriptionEn: 'Signal discovered in FSS',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
      { name: 'SignalName', type: 'string', description: 'Сигнал', descriptionEn: 'Signal', example: '$USS_Backup;' },
      { name: 'SignalType', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'USS' },
    ],
    example: { timestamp: '2024-05-20T12:13:00Z', event: 'FSSSignalDiscovered', StarSystem: 'Sol', SignalName: '$USS_Backup;', SignalType: 'USS' },
    relationships: { before: ['FSSDiscoveryScan'], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  SAAScanComplete: {
    category: 'exploration',
    label: 'DSS Scan завершён',
    labelEn: 'DSS Scan Complete',
    icon: '🎯',
    description: 'Сканирование DSS завершено',
    descriptionEn: 'DSS scan complete',
    fields: [
      { name: 'BodyName', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Earth', required: true },
      { name: 'ProbesUsed', type: 'number', description: 'Зондов', descriptionEn: 'Probes used', example: 5 },
      { name: 'BaseValue', type: 'number', description: 'Базовая ценность', descriptionEn: 'Base value', example: 1000 },
    ],
    example: { timestamp: '2024-05-20T12:25:00Z', event: 'SAAScanComplete', BodyName: 'Earth', ProbesUsed: 5, BaseValue: 1000 },
    relationships: { before: ['SAASignalsFound'], after: [] },
    difficulty: 'medium',
    frequency: 'common',
  },

  MaterialCollected: {
    category: 'exploration',
    label: 'Материал собран',
    labelEn: 'Material Collected',
    icon: '🔬',
    description: 'Материал собран',
    descriptionEn: 'Material collected',
    fields: [
      { name: 'Category', type: 'string', description: 'Категория', descriptionEn: 'Category', example: 'Element', required: true },
      { name: 'Name', type: 'string', description: 'Название', descriptionEn: 'Name', example: 'Iron', required: true },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Count', example: 3 },
    ],
    example: { timestamp: '2024-05-20T12:30:00Z', event: 'MaterialCollected', Category: 'Element', Name: 'Iron', Count: 3 },
    relationships: { before: ['Scan'], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  SellExplorationData: {
    category: 'exploration',
    label: 'Продажа данных',
    labelEn: 'Sell Exploration Data',
    icon: '💰',
    description: 'Продажа данных',
    descriptionEn: 'Selling exploration data',
    fields: [
      { name: 'TotalValue', type: 'number', description: 'Сумма', descriptionEn: 'Total', example: 1500 },
    ],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'SellExplorationData', TotalValue: 1500 },
    relationships: { before: ['Scan', 'DetailedScan'], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  CodexEntry: {
    category: 'exploration',
    label: 'Запись кодекса',
    labelEn: 'Codex Entry',
    icon: '📖',
    description: 'Новая запись в кодексе',
    descriptionEn: 'New Codex entry',
    fields: [
      { name: 'Name', type: 'string', description: 'Название', descriptionEn: 'Name', example: '$Codex_Ent_Thargoid_Probe_Name;' },
      { name: 'Name_Localised', type: 'string', description: 'Локализованное', descriptionEn: 'Localized', example: 'Thargoid Probe' },
    ],
    example: { timestamp: '2024-05-20T12:50:00Z', event: 'CodexEntry', Name: '$Codex_Ent_Thargoid_Probe_Name;', Name_Localised: 'Thargoid Probe' },
    relationships: { before: ['Scan'], after: [] },
    difficulty: 'medium',
    frequency: 'rare',
  },

  // ==========================================================================
  // COMBAT - Бой
  // ==========================================================================

  Bounty: {
    category: 'combat',
    label: 'Награда',
    labelEn: 'Bounty',
    icon: '💵',
    description: 'Получена награда',
    descriptionEn: 'Bounty received',
    fields: [
      { name: 'Faction', type: 'string', description: 'Фракция', descriptionEn: 'Faction', example: 'Federation' },
      { name: 'Target', type: 'string', description: 'Цель', descriptionEn: 'Target', example: 'Python' },
      { name: 'Reward', type: 'number', description: 'Сумма', descriptionEn: 'Reward', example: 10000 },
    ],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'Bounty', Faction: 'Federation', Target: 'Python', Reward: 10000 },
    relationships: { before: ['ShipTargeted', 'UnderAttack'], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  Died: {
    category: 'combat',
    label: 'Смерть',
    labelEn: 'Died',
    icon: '💀',
    description: 'Корабль уничтожен',
    descriptionEn: 'Ship destroyed',
    fields: [
      { name: 'KillerName', type: 'string', description: 'Убийца', descriptionEn: 'Killer', example: 'Cmdr John Doe' },
      { name: 'KillerShip', type: 'string', description: 'Корабль убийцы', descriptionEn: 'Killer ship', example: 'federation_corvette' },
    ],
    example: { timestamp: '2024-05-20T17:00:00Z', event: 'Died', KillerName: 'Cmdr John Doe', KillerShip: 'federation_corvette' },
    relationships: { before: ['HullDamage', 'ShieldState', 'UnderAttack'], after: ['Resurrect'] },
    difficulty: 'complex',
    frequency: 'medium',
  },

  Resurrect: {
    category: 'combat',
    label: 'Воскрешение',
    labelEn: 'Resurrect',
    icon: '✨',
    description: 'Пилот воскрешён',
    descriptionEn: 'Resurrected',
    fields: [
      { name: 'Option', type: 'string', description: 'Опция', descriptionEn: 'Option', example: 'rebuy' },
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 50000 },
    ],
    example: { timestamp: '2024-05-20T17:10:00Z', event: 'Resurrect', Option: 'rebuy', Cost: 50000 },
    relationships: { before: ['Died'], after: ['Loadout'] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  Interdiction: {
    category: 'combat',
    label: 'Перехват',
    labelEn: 'Interdiction',
    icon: '⚔️',
    description: 'Перехват корабля',
    descriptionEn: 'Ship interdicted',
    fields: [
      { name: 'Success', type: 'boolean', description: 'Успех', descriptionEn: 'Success', example: true, required: true },
      { name: 'Target', type: 'string', description: 'Цель', descriptionEn: 'Target', example: 'Cmdr Jane' },
    ],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'Interdiction', Success: true, Target: 'Cmdr Jane' },
    relationships: { before: ['ShipTargeted'], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  Interdicted: {
    category: 'combat',
    label: 'Перехвачен',
    labelEn: 'Interdicted',
    icon: '🚨',
    description: 'Был перехвачен',
    descriptionEn: 'Was interdicted',
    fields: [
      { name: 'Submitted', type: 'boolean', description: 'Сдался', descriptionEn: 'Submitted', example: false, required: true },
      { name: 'Interdictor', type: 'string', description: 'Перехватчик', descriptionEn: 'Interdictor', example: 'Cmdr John' },
    ],
    example: { timestamp: '2024-05-20T14:05:00Z', event: 'Interdicted', Submitted: false, Interdictor: 'Cmdr John' },
    relationships: { before: [], after: ['EscapeInterdiction'] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  ShipTargeted: {
    category: 'combat',
    label: 'Цель захвачена',
    labelEn: 'Ship Targeted',
    icon: '🎯',
    description: 'Корабль в прицеле',
    descriptionEn: 'Ship targeted',
    fields: [
      { name: 'TargetLocked', type: 'boolean', description: 'Захвачено', descriptionEn: 'Target locked', example: true },
      { name: 'Ship', type: 'string', description: 'Корабль', descriptionEn: 'Ship', example: 'python' },
    ],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'ShipTargeted', TargetLocked: true, Ship: 'python' },
    relationships: { before: [], after: ['Interdiction', 'Bounty'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  UnderAttack: {
    category: 'combat',
    label: 'Под атакой',
    labelEn: 'Under Attack',
    icon: '🔥',
    description: 'Под атакой',
    descriptionEn: 'Under attack',
    fields: [
      { name: 'Target', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'fire' },
    ],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'UnderAttack', Target: 'fire' },
    relationships: { before: [], after: ['Bounty', 'Died'] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  ShieldState: {
    category: 'combat',
    label: 'Щиты',
    labelEn: 'Shield State',
    icon: '🛡️',
    description: 'Состояние щитов',
    descriptionEn: 'Shield state changed',
    fields: [
      { name: 'ShieldsUp', type: 'boolean', description: 'Щиты подняты', descriptionEn: 'Shields up', example: true },
    ],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'ShieldState', ShieldsUp: false },
    relationships: { before: [], after: ['HullDamage'] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  HullDamage: {
    category: 'combat',
    label: 'Повреждение корпуса',
    labelEn: 'Hull Damage',
    icon: '🔧',
    description: 'Повреждение корпуса',
    descriptionEn: 'Hull damage',
    fields: [
      { name: 'Health', type: 'number', description: 'Прочность', descriptionEn: 'Health', example: 0.5 },
    ],
    example: { timestamp: '2024-05-20T15:05:00Z', event: 'HullDamage', Health: 0.5 },
    relationships: { before: ['ShieldState'], after: ['Died'] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  // ==========================================================================
  // TRADING & ECONOMY - Торговля
  // ==========================================================================

  MarketBuy: {
    category: 'trade',
    label: 'Покупка',
    labelEn: 'Market Buy',
    icon: '🛒',
    description: 'Покупка товара',
    descriptionEn: 'Buying goods',
    fields: [
      { name: 'MarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 1234567890, required: true },
      { name: 'Type', type: 'string', description: 'Товар', descriptionEn: 'Type', example: 'foodcartridges', required: true },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Count', example: 10 },
      { name: 'BuyPrice', type: 'number', description: 'Цена', descriptionEn: 'Price', example: 125 },
      { name: 'TotalCost', type: 'number', description: 'Сумма', descriptionEn: 'Total', example: 1250 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'MarketBuy', MarketID: 1234567890, Type: 'foodcartridges', Count: 10, BuyPrice: 125, TotalCost: 1250 },
    relationships: { before: ['Market'], after: ['Cargo'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  MarketSell: {
    category: 'trade',
    label: 'Продажа',
    labelEn: 'Market Sell',
    icon: '💰',
    description: 'Продажа товара',
    descriptionEn: 'Selling goods',
    fields: [
      { name: 'MarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 1234567890, required: true },
      { name: 'Type', type: 'string', description: 'Товар', descriptionEn: 'Type', example: 'foodcartridges', required: true },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Count', example: 10 },
      { name: 'SellPrice', type: 'number', description: 'Цена', descriptionEn: 'Price', example: 150 },
      { name: 'TotalSale', type: 'number', description: 'Сумма', descriptionEn: 'Total', example: 1500 },
    ],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'MarketSell', MarketID: 1234567890, Type: 'foodcartridges', Count: 10, SellPrice: 150, TotalSale: 1500 },
    relationships: { before: ['CollectCargo'], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  CollectCargo: {
    category: 'trade',
    label: 'Сбор груза',
    labelEn: 'Collect Cargo',
    icon: '📦',
    description: 'Сбор груза',
    descriptionEn: 'Collecting cargo',
    fields: [
      { name: 'Type', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'foodcartridges' },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Count', example: 1 },
    ],
    example: { timestamp: '2024-05-20T11:00:00Z', event: 'CollectCargo', Type: 'foodcartridges', Count: 1 },
    relationships: { before: [], after: ['MarketSell', 'EjectCargo'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  // ==========================================================================
  // MINING - Добыча
  // ==========================================================================

  MiningRefined: {
    category: 'mining',
    label: 'Переработка',
    labelEn: 'Mining Refined',
    icon: '⚙️',
    description: 'Добыча переработана',
    descriptionEn: 'Mined resource refined',
    fields: [
      { name: 'Type', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'Gold', required: true },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Count', example: 1 },
    ],
    example: { timestamp: '2024-05-20T11:00:00Z', event: 'MiningRefined', Type: 'Gold', Count: 1 },
    relationships: { before: ['ProspectedAsteroid'], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  ProspectedAsteroid: {
    category: 'mining',
    label: 'Астероид исследован',
    labelEn: 'Prospected Asteroid',
    icon: '🌑',
    description: 'Астероид исследован',
    descriptionEn: 'Asteroid prospected',
    fields: [
      { name: 'Body', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Asteroid' },
    ],
    example: { timestamp: '2024-05-20T10:30:00Z', event: 'ProspectedAsteroid', Body: 'Asteroid' },
    relationships: { before: [], after: ['MiningRefined', 'AsteroidCracked'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  AsteroidCracked: {
    category: 'mining',
    label: 'Астероид взорван',
    labelEn: 'Asteroid Cracked',
    icon: '💥',
    description: 'Астероид разрушен',
    descriptionEn: 'Asteroid cracked',
    fields: [
      { name: 'Body', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Asteroid' },
    ],
    example: { timestamp: '2024-05-20T10:45:00Z', event: 'AsteroidCracked', Body: 'Asteroid' },
    relationships: { before: ['ProspectedAsteroid'], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  // ==========================================================================
  // MISSIONS - Миссии
  // ==========================================================================

  MissionAccepted: {
    category: 'mission',
    label: 'Миссия принята',
    labelEn: 'Mission Accepted',
    icon: '📋',
    description: 'Миссия принята',
    descriptionEn: 'Mission accepted',
    fields: [
      { name: 'MissionID', type: 'number', description: 'ID миссии', descriptionEn: 'Mission ID', example: 12345, required: true },
      { name: 'Name', type: 'string', description: 'Название', descriptionEn: 'Name', example: 'Mission_Name_01' },
      { name: 'Faction', type: 'string', description: 'Фракция', descriptionEn: 'Faction', example: 'Federation' },
      { name: 'Reward', type: 'number', description: 'Награда', descriptionEn: 'Reward', example: 10000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'MissionAccepted', MissionID: 12345, Name: 'Mission_Name_01', Faction: 'Federation', Reward: 10000 },
    relationships: { before: [], after: ['MissionCompleted', 'MissionFailed', 'MissionAbandoned'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  MissionCompleted: {
    category: 'mission',
    label: 'Миссия выполнена',
    labelEn: 'Mission Completed',
    icon: '✅',
    description: 'Миссия выполнена',
    descriptionEn: 'Mission completed',
    fields: [
      { name: 'MissionID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 12345, required: true },
      { name: 'Name', type: 'string', description: 'Название', descriptionEn: 'Name', example: 'Mission_Name_01' },
      { name: 'Reward', type: 'number', description: 'Награда', descriptionEn: 'Reward', example: 10000 },
    ],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'MissionCompleted', MissionID: 12345, Name: 'Mission_Name_01', Reward: 10000 },
    relationships: { before: ['MissionAccepted'], after: [] },
    difficulty: 'medium',
    frequency: 'common',
  },

  MissionAbandoned: {
    category: 'mission',
    label: 'Миссия отменена',
    labelEn: 'Mission Abandoned',
    icon: '❌',
    description: 'Миссия отменена',
    descriptionEn: 'Mission abandoned',
    fields: [
      { name: 'MissionID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 12345 },
    ],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'MissionAbandoned', MissionID: 12345 },
    relationships: { before: ['MissionAccepted'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // ENGINEERING - Инженерия
  // ==========================================================================

  EngineerCraft: {
    category: 'engineering',
    label: 'Создание',
    labelEn: 'Engineer Craft',
    icon: '⚒️',
    description: 'Создание модуля',
    descriptionEn: 'Module crafted',
    fields: [
      { name: 'Engineer', type: 'string', description: 'Инженер', descriptionEn: 'Engineer', example: 'The Dweller', required: true },
      { name: 'BlueprintName', type: 'string', description: 'Чертеж', descriptionEn: 'Blueprint', example: 'Weapon_HeavyLaser_1', required: true },
      { name: 'Level', type: 'number', description: 'Уровень', descriptionEn: 'Level', example: 1 },
      { name: 'Quality', type: 'number', description: 'Качество', descriptionEn: 'Quality', example: 1.0 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'EngineerCraft', Engineer: 'The Dweller', BlueprintName: 'Weapon_HeavyLaser_1', Level: 1, Quality: 1.0 },
    relationships: { before: [], after: [] },
    difficulty: 'complex',
    frequency: 'common',
  },

  EngineerApply: {
    category: 'engineering',
    label: 'Модуль улучшен',
    labelEn: 'Engineer Apply',
    icon: '🔧',
    description: 'Улучшение модуля',
    descriptionEn: 'Module upgraded',
    fields: [
      { name: 'Engineer', type: 'string', description: 'Инженер', descriptionEn: 'Engineer', example: 'The Dweller' },
      { name: 'BlueprintName', type: 'string', description: 'Чертеж', descriptionEn: 'Blueprint', example: 'Weapon_HeavyLaser_1' },
    ],
    example: { timestamp: '2024-05-20T10:30:00Z', event: 'EngineerApply', Engineer: 'The Dweller', BlueprintName: 'Weapon_HeavyLaser_1' },
    relationships: { before: [], after: [] },
    difficulty: 'medium',
    frequency: 'common',
  },

  // ==========================================================================
  // OUTFITTING - Модули
  // ==========================================================================

  ModuleBuy: {
    category: 'outfitting',
    label: 'Покупка модуля',
    labelEn: 'Module Buy',
    icon: '🔩',
    description: 'Покупка модуля',
    descriptionEn: 'Module purchased',
    fields: [
      { name: 'Slot', type: 'string', description: 'Слот', descriptionEn: 'Slot', example: 'Slot02' },
      { name: 'BuyItem', type: 'string', description: 'Модуль', descriptionEn: 'Module', example: 'int_cargorack_size1_class1' },
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 1000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'ModuleBuy', Slot: 'Slot02', BuyItem: 'int_cargorack_size1_class1', Cost: 1000 },
    relationships: { before: ['Outfitting'], after: ['Loadout'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  ModuleSell: {
    category: 'outfitting',
    label: 'Продажа модуля',
    labelEn: 'Module Sell',
    icon: '💵',
    description: 'Продажа модуля',
    descriptionEn: 'Module sold',
    fields: [
      { name: 'Slot', type: 'string', description: 'Слот', descriptionEn: 'Slot', example: 'Slot02' },
      { name: 'SellPrice', type: 'number', description: 'Цена', descriptionEn: 'Price', example: 500 },
    ],
    example: { timestamp: '2024-05-20T11:00:00Z', event: 'ModuleSell', Slot: 'Slot02', SellPrice: 500 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ModuleSwap: {
    category: 'outfitting',
    label: 'Замена модуля',
    labelEn: 'Module Swap',
    icon: '🔄',
    description: 'Замена модуля',
    descriptionEn: 'Module swapped',
    fields: [
      { name: 'FromSlot', type: 'string', description: 'Из слота', descriptionEn: 'From slot', example: 'Slot02' },
      { name: 'ToSlot', type: 'string', description: 'В слот', descriptionEn: 'To slot', example: 'Slot03' },
    ],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'ModuleSwap', FromSlot: 'Slot02', ToSlot: 'Slot03' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // SHIPYARD - Верфь
  // ==========================================================================

  ShipyardBuy: {
    category: 'shipyard',
    label: 'Покупка корабля',
    labelEn: 'Shipyard Buy',
    icon: '🚀',
    description: 'Покупка корабля',
    descriptionEn: 'Ship purchased',
    fields: [
      { name: 'ShipType', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'diamondback', required: true },
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 500000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'ShipyardBuy', ShipType: 'diamondback', Cost: 500000 },
    relationships: { before: ['Shipyard'], after: ['Loadout'] },
    difficulty: 'medium',
    frequency: 'rare',
  },

  ShipyardSell: {
    category: 'shipyard',
    label: 'Продажа корабля',
    labelEn: 'Shipyard Sell',
    icon: '💸',
    description: 'Продажа корабля',
    descriptionEn: 'Ship sold',
    fields: [
      { name: 'ShipType', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'diamondback' },
      { name: 'SellPrice', type: 'number', description: 'Цена', descriptionEn: 'Price', example: 250000 },
    ],
    example: { timestamp: '2024-05-20T11:00:00Z', event: 'ShipyardSell', ShipType: 'diamondback', SellPrice: 250000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ShipyardSwap: {
    category: 'shipyard',
    label: 'Смена корабля',
    labelEn: 'Shipyard Swap',
    icon: '🔁',
    description: 'Смена корабля',
    descriptionEn: 'Ship swapped',
    fields: [
      { name: 'ShipType', type: 'string', description: 'Новый', descriptionEn: 'New', example: 'python' },
    ],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'ShipyardSwap', ShipType: 'python' },
    relationships: { before: [], after: ['Loadout'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  // ==========================================================================
  // CREW & SOCIAL - Социальное
  // ==========================================================================

  CrewMemberJoins: {
    category: 'social',
    label: 'Член экипажа присоединился',
    labelEn: 'Crew Member Joins',
    icon: '👤',
    description: 'Новый член экипажа',
    descriptionEn: 'Crew member joined',
    fields: [
      { name: 'Crew', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'John Doe' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CrewMemberJoins', Crew: 'John Doe' },
    relationships: { before: [], after: ['CrewMemberQuits'] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  JoinACrew: {
    category: 'social',
    label: 'Присоединился к экипажу',
    labelEn: 'Join A Crew',
    icon: '👥',
    description: 'Присоединение к экипажу',
    descriptionEn: 'Joined crew',
    fields: [
      { name: 'Captain', type: 'string', description: 'Капитан', descriptionEn: 'Captain', example: 'Cmdr Jane' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'JoinACrew', Captain: 'Cmdr Jane' },
    relationships: { before: [], after: ['QuitACrew'] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  WingAdd: {
    category: 'social',
    label: 'В крыло добавлен',
    labelEn: 'Wing Add',
    icon: '🦅',
    description: 'Добавлен в крыло',
    descriptionEn: 'Added to wing',
    fields: [
      { name: 'Name', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'Cmdr Jane' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'WingAdd', Name: 'Cmdr Jane' },
    relationships: { before: [], after: ['WingLeave'] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  WingJoin: {
    category: 'social',
    label: 'Присоединился к крылу',
    labelEn: 'Wing Join',
    icon: '🤝',
    description: 'Создано крыло',
    descriptionEn: 'Wing joined',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'WingJoin' },
    relationships: { before: [], after: ['WingLeave'] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  WingLeave: {
    category: 'social',
    label: 'Покинул крыло',
    labelEn: 'Wing Leave',
    icon: '👋',
    description: 'Покинул крыло',
    descriptionEn: 'Left wing',
    fields: [],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'WingLeave' },
    relationships: { before: ['WingAdd', 'WingJoin'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  Friends: {
    category: 'social',
    label: 'Друг',
    labelEn: 'Friends',
    icon: '👫',
    description: 'Статус друга',
    descriptionEn: 'Friend status',
    fields: [
      { name: 'Name', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'Cmdr Jane' },
      { name: 'Status', type: 'string', description: 'Статус', descriptionEn: 'Status', example: 'Added' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Friends', Name: 'Cmdr Jane', Status: 'Added' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // FLEET CARRIERS - Флотилии
  // ==========================================================================

  CarrierJump: {
    category: 'carrier',
    label: 'Прыжок носителя',
    labelEn: 'Carrier Jump',
    icon: '🚀',
    description: 'Прыжок носителя',
    descriptionEn: 'Carrier jumped',
    fields: [
      { name: 'CarrierID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 1234567890 },
      { name: 'SystemName', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierJump', CarrierID: 1234567890, SystemName: 'Sol' },
    relationships: { before: ['CarrierJumpRequest'], after: [] },
    difficulty: 'medium',
    frequency: 'common',
  },

  CarrierJumpRequest: {
    category: 'carrier',
    label: 'Запрос прыжка',
    labelEn: 'Carrier Jump Request',
    icon: '⏳',
    description: 'Запрос прыжка',
    descriptionEn: 'Jump requested',
    fields: [
      { name: 'CarrierID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 1234567890 },
      { name: 'SystemName', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
    ],
    example: { timestamp: '2024-05-20T09:55:00Z', event: 'CarrierJumpRequest', CarrierID: 1234567890, SystemName: 'Sol' },
    relationships: { before: [], after: ['CarrierJump', 'CarrierJumpCancelled'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  CarrierStats: {
    category: 'carrier',
    label: 'Статистика носителя',
    labelEn: 'Carrier Stats',
    icon: '📊',
    description: 'Статистика носителя',
    descriptionEn: 'Carrier stats',
    fields: [
      { name: 'CarrierID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 1234567890 },
      { name: 'Name', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'XYZ-01' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierStats', CarrierID: 1234567890, Name: 'XYZ-01' },
    relationships: { before: ['CarrierBuy'], after: [] },
    difficulty: 'complex',
    frequency: 'common',
  },

  CarrierBankTransfer: {
    category: 'carrier',
    label: 'Банковский перевод',
    labelEn: 'Carrier Bank Transfer',
    icon: '🏦',
    description: 'Перевод на носитель',
    descriptionEn: 'Carrier transfer',
    fields: [
      { name: 'CarrierID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 1234567890 },
      { name: 'Type', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'deposit' },
      { name: 'Amount', type: 'number', description: 'Сумма', descriptionEn: 'Amount', example: 1000000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierBankTransfer', CarrierID: 1234567890, Type: 'deposit', Amount: 1000000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  // ==========================================================================
  // ODYSSEY - Одиссей
  // ==========================================================================

  Embark: {
    category: 'odyssey',
    label: 'Посадка',
    labelEn: 'Embark',
    icon: '🚀',
    description: 'Посадка на поверхность',
    descriptionEn: 'Embarking to surface',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
      { name: 'Body', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Earth' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Embark', StarSystem: 'Sol', Body: 'Earth' },
    relationships: { before: ['Disembark'], after: ['Disembark'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  Disembark: {
    category: 'odyssey',
    label: 'Высадка',
    labelEn: 'Disembark',
    icon: '🦶',
    description: 'Высадка на поверхность',
    descriptionEn: 'Disembarking to surface',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Sol' },
      { name: 'Body', type: 'string', description: 'Тело', descriptionEn: 'Body', example: 'Earth' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Disembark', StarSystem: 'Sol', Body: 'Earth' },
    relationships: { before: ['Embark'], after: ['Embark'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  SuitLoadout: {
    category: 'odyssey',
    label: 'Снаряжение',
    labelEn: 'Suit Loadout',
    icon: '👕',
    description: 'Снаряжение скафандра',
    descriptionEn: 'Suit loadout',
    fields: [
      { name: 'Name', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'Combat Suit' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SuitLoadout', Name: 'Combat Suit' },
    relationships: { before: [], after: [] },
    difficulty: 'medium',
    frequency: 'common',
  },

  BuySuit: {
    category: 'odyssey',
    label: 'Куплен костюм',
    labelEn: 'Buy Suit',
    icon: '🛍️',
    description: 'Покупка скафандра',
    descriptionEn: 'Suit purchased',
    fields: [
      { name: 'Name', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'Combat Suit' },
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 10000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'BuySuit', Name: 'Combat Suit', Cost: 10000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  BuyWeapon: {
    category: 'odyssey',
    label: 'Куплено оружие',
    labelEn: 'Buy Weapon',
    icon: '🔫',
    description: 'Покупка оружия',
    descriptionEn: 'Weapon purchased',
    fields: [
      { name: 'Name', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'Assault Rifle' },
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 5000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'BuyWeapon', Name: 'Assault Rifle', Cost: 5000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // GAME - Игра
  // ==========================================================================

  LoadGame: {
    category: 'game',
    label: 'Игра загружена',
    labelEn: 'Load Game',
    icon: '🎮',
    description: 'Загрузка игры',
    descriptionEn: 'Game loaded',
    fields: [
      { name: 'Commander', type: 'string', description: 'Командир', descriptionEn: 'Commander', example: 'Cmdr John' },
      { name: 'Ship', type: 'string', description: 'Корабль', descriptionEn: 'Ship', example: 'python' },
      { name: 'GameMode', type: 'string', description: 'Режим', descriptionEn: 'Mode', example: 'Open' },
      { name: 'Credits', type: 'number', description: 'Кредиты', descriptionEn: 'Credits', example: 1000000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'LoadGame', Commander: 'Cmdr John', Ship: 'python', GameMode: 'Open', Credits: 1000000 },
    relationships: { before: [], after: ['Location'] },
    difficulty: 'medium',
    frequency: 'common',
  },

  Shutdown: {
    category: 'game',
    label: 'Выход из игры',
    labelEn: 'Shutdown',
    icon: '🛑',
    description: 'Выход из игры',
    descriptionEn: 'Game shutdown',
    fields: [],
    example: { timestamp: '2024-05-20T20:00:00Z', event: 'Shutdown' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  NewCommander: {
    category: 'game',
    label: 'Новый командир',
    labelEn: 'New Commander',
    icon: '✨',
    description: 'Создание командира',
    descriptionEn: 'New commander created',
    fields: [
      { name: 'Name', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'Cmdr John' },
    ],
    example: { timestamp: '2024-01-01T00:00:00Z', event: 'NewCommander', Name: 'Cmdr John' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  Rank: {
    category: 'game',
    label: 'Ранг',
    labelEn: 'Rank',
    icon: '🎖️',
    description: 'Изменение ранга',
    descriptionEn: 'Rank change',
    fields: [
      { name: 'Combat', type: 'number', description: 'Бой', descriptionEn: 'Combat', example: 8 },
      { name: 'Trade', type: 'number', description: 'Торговля', descriptionEn: 'Trade', example: 5 },
      { name: 'Explore', type: 'number', description: 'Исследование', descriptionEn: 'Explore', example: 3 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Rank', Combat: 8, Trade: 5, Explore: 3 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  Progress: {
    category: 'game',
    label: 'Прогресс',
    labelEn: 'Progress',
    icon: '📈',
    description: 'Прогресс',
    descriptionEn: 'Progress',
    fields: [
      { name: 'Combat', type: 'number', description: 'Бой', descriptionEn: 'Combat', example: 50 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Progress', Combat: 50 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  Statistics: {
    category: 'game',
    label: 'Статистика',
    labelEn: 'Statistics',
    icon: '📊',
    description: 'Общая статистика',
    descriptionEn: 'Overall statistics',
    fields: [
      { name: 'Bank_Account', type: 'object', description: 'Счёт', descriptionEn: 'Account', example: {} },
      { name: 'Combat', type: 'object', description: 'Бой', descriptionEn: 'Combat', example: {} },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Statistics', Bank_Account: {}, Combat: {} },
    relationships: { before: [], after: [] },
    difficulty: 'complex',
    frequency: 'common',
  },

  Reputation: {
    category: 'game',
    label: 'Репутация',
    labelEn: 'Reputation',
    icon: '💎',
    description: 'Изменение репутации',
    descriptionEn: 'Reputation change',
    fields: [
      { name: 'Faction', type: 'string', description: 'Фракция', descriptionEn: 'Faction', example: 'Federation' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Reputation', Faction: 'Federation' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  // ==========================================================================
  // SHIP SYSTEMS - Корабельные системы
  // ==========================================================================

  FuelScoop: {
    category: 'ship',
    label: 'Дозаправка',
    labelEn: 'Fuel Scoop',
    icon: '⛽',
    description: 'Заправка от звезды',
    descriptionEn: 'Fuel scooped',
    fields: [
      { name: 'Scooped', type: 'number', description: 'Заправлено', descriptionEn: 'Scooped', example: 0.5 },
      { name: 'Total', type: 'number', description: 'Всего', descriptionEn: 'Total', example: 15.5 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'FuelScoop', Scooped: 0.5, Total: 15.5 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  RefuelAll: {
    category: 'ship',
    label: 'Полная дозаправка',
    labelEn: 'Refuel All',
    icon: '🛢️',
    description: 'Полная заправка',
    descriptionEn: 'Fully refueled',
    fields: [
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 100 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'RefuelAll', Cost: 100 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  RebootRepair: {
    category: 'ship',
    label: 'Перезагрузка',
    labelEn: 'Reboot Repair',
    icon: '🔄',
    description: 'Перезагрузка систем',
    descriptionEn: 'System reboot repair',
    fields: [],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'RebootRepair' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  SelfDestruct: {
    category: 'ship',
    label: 'Самоуничтожение',
    labelEn: 'Self Destruct',
    icon: '💣',
    description: 'Самоуничтожение',
    descriptionEn: 'Self destruct',
    fields: [],
    example: { timestamp: '2024-05-20T17:00:00Z', event: 'SelfDestruct' },
    relationships: { before: [], after: ['Resurrect'] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // COMMS - Связь
  // ==========================================================================

  ReceiveText: {
    category: 'comms',
    label: 'Сообщение',
    labelEn: 'Receive Text',
    icon: '💬',
    description: 'Получено сообщение',
    descriptionEn: 'Message received',
    fields: [
      { name: 'From', type: 'string', description: 'От', descriptionEn: 'From', example: 'Cmdr Jane' },
      { name: 'Message', type: 'string', description: 'Текст', descriptionEn: 'Message', example: 'Hello!' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'ReceiveText', From: 'Cmdr Jane', Message: 'Hello!' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  SendText: {
    category: 'comms',
    label: 'Отправлено сообщение',
    labelEn: 'Send Text',
    icon: '📤',
    description: 'Отправлено сообщение',
    descriptionEn: 'Message sent',
    fields: [
      { name: 'To', type: 'string', description: 'Кому', descriptionEn: 'To', example: 'Cmdr Jane' },
      { name: 'Message', type: 'string', description: 'Текст', descriptionEn: 'Message', example: 'Hello!' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SendText', To: 'Cmdr Jane', Message: 'Hello!' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  // ==========================================================================
  // LEGAL - Право
  // ==========================================================================

  PayFines: {
    category: 'legal',
    label: 'Штрафы оплачены',
    labelEn: 'Pay Fines',
    icon: '💸',
    description: 'Оплата штрафов',
    descriptionEn: 'Fines paid',
    fields: [
      { name: 'Amount', type: 'number', description: 'Сумма', descriptionEn: 'Amount', example: 1000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'PayFines', Amount: 1000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  PayBounties: {
    category: 'legal',
    label: 'Награды оплачены',
    labelEn: 'Pay Bounties',
    icon: '💀',
    description: 'Оплата наград',
    descriptionEn: 'Bounties paid',
    fields: [
      { name: 'Amount', type: 'number', description: 'Сумма', descriptionEn: 'Amount', example: 5000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'PayBounties', Amount: 5000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // POWERPLAY
  // ==========================================================================

  PowerplayJoin: {
    category: 'powerplay',
    label: 'Powerplay присоединение',
    labelEn: 'Powerplay Join',
    icon: '✅',
    description: 'Присоединение к Powerplay',
    descriptionEn: 'Joined power',
    fields: [
      { name: 'Power', type: 'string', description: 'Сила', descriptionEn: 'Power', example: 'Li Yong-Rui' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'PowerplayJoin', Power: 'Li Yong-Rui' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // INVENTORY - Инвентарь
  // ==========================================================================

  Cargo: {
    category: 'cargo',
    label: 'Груз',
    labelEn: 'Cargo',
    icon: '📦',
    description: 'Инвентарь груза',
    descriptionEn: 'Cargo inventory',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Cargo' },
    relationships: { before: [], after: [] },
    difficulty: 'medium',
    frequency: 'common',
  },

  Materials: {
    category: 'materials',
    label: 'Материалы',
    labelEn: 'Materials',
    icon: '🔬',
    description: 'Инвентарь материалов',
    descriptionEn: 'Materials inventory',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Materials' },
    relationships: { before: [], after: [] },
    difficulty: 'complex',
    frequency: 'common',
  },

  Loadout: {
    category: 'ship',
    label: 'Конфигурация',
    labelEn: 'Loadout',
    icon: '⚙️',
    description: 'Конфигурация корабля',
    descriptionEn: 'Ship loadout',
    fields: [
      { name: 'Ship', type: 'string', description: 'Корабль', descriptionEn: 'Ship', example: 'python' },
      { name: 'ShipID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 1 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Loadout', Ship: 'python', ShipID: 1 },
    relationships: { before: [], after: [] },
    difficulty: 'complex',
    frequency: 'common',
  },

  Passengers: {
    category: 'mission',
    label: 'Пассажиры',
    labelEn: 'Passengers',
    icon: '👥',
    description: 'Список пассажиров',
    descriptionEn: 'Passenger list',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Passengers' },
    relationships: { before: [], after: [] },
    difficulty: 'medium',
    frequency: 'medium',
  },

  Missions: {
    category: 'mission',
    label: 'Миссии',
    labelEn: 'Missions',
    icon: '📋',
    description: 'Список миссий',
    descriptionEn: 'Mission list',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Missions' },
    relationships: { before: [], after: [] },
    difficulty: 'medium',
    frequency: 'medium',
  },

  Powerplay: {
    category: 'powerplay',
    label: 'Powerplay',
    labelEn: 'Powerplay',
    icon: '⭐',
    description: 'Статус Powerplay',
    descriptionEn: 'Powerplay status',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Powerplay' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  Commander: {
    category: 'game',
    label: 'Командир',
    labelEn: 'Commander',
    icon: '👤',
    description: 'Данные командира',
    descriptionEn: 'Commander data',
    fields: [
      { name: 'Name', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'Cmdr John' },
    ],
    example: { timestamp: '2024-01-01T00:00:00Z', event: 'Commander', Name: 'Cmdr John' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ClearSavedGame: {
    category: 'game',
    label: 'Игра очищена',
    labelEn: 'Clear Saved Game',
    icon: '🗑️',
    description: 'Очистка сохранения',
    descriptionEn: 'Clear saved game',
    fields: [],
    example: { timestamp: '2024-01-01T00:00:00Z', event: 'ClearSavedGame' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // RARE EVENTS - Редкие события
  // ==========================================================================

  FighterDestroyed: {
    category: 'combat',
    label: 'Истребитель уничтожен',
    labelEn: 'Fighter Destroyed',
    icon: '💥',
    description: 'Истребитель уничтожен',
    descriptionEn: 'Fighter destroyed',
    fields: [],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'FighterDestroyed' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
    isRare: true,
  },

  SRVDestroyed: {
    category: 'odyssey',
    label: 'SRV уничтожен',
    labelEn: 'SRV Destroyed',
    icon: '💥',
    description: 'SRV уничтожен',
    descriptionEn: 'SRV destroyed',
    fields: [],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'SRVDestroyed' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
    isRare: true,
  },

  HeatWarning: {
    category: 'combat',
    label: 'Предупреждение о жаре',
    labelEn: 'Heat Warning',
    icon: '⚠️',
    description: 'Предупреждение о перегреве',
    descriptionEn: 'Heat warning',
    fields: [
      { name: 'Heat', type: 'number', description: 'Жара', descriptionEn: 'Heat', example: 100 },
    ],
    example: { timestamp: '2024-05-20T15:55:00Z', event: 'HeatWarning', Heat: 100 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  HeatDamage: {
    category: 'combat',
    label: 'Повреждение от жары',
    labelEn: 'Heat Damage',
    icon: '🌡️',
    description: 'Повреждение от перегрева',
    descriptionEn: 'Heat damage',
    fields: [],
    example: { timestamp: '2024-05-20T16:00:00Z', event: 'HeatDamage' },
    relationships: { before: ['HeatWarning'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CommitCrime: {
    category: 'combat',
    label: 'Преступление',
    labelEn: 'Commit Crime',
    icon: '🚔',
    description: 'Совершено преступление',
    descriptionEn: 'Crime committed',
    fields: [
      { name: 'CrimeType', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'murder' },
      { name: 'Faction', type: 'string', description: 'Фракция', descriptionEn: 'Faction', example: 'Federation' },
    ],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'CommitCrime', CrimeType: 'murder', Faction: 'Federation' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  EscapeInterdiction: {
    category: 'combat',
    label: 'Уход от перехвата',
    labelEn: 'Escape Interdiction',
    icon: '🏃',
    description: 'Успешный уход',
    descriptionEn: 'Escaped interdiction',
    fields: [],
    example: { timestamp: '2024-05-20T14:06:00Z', event: 'EscapeInterdiction' },
    relationships: { before: ['Interdicted'], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  Promotion: {
    category: 'combat',
    label: 'Повышение',
    labelEn: 'Promotion',
    icon: '🎖️',
    description: 'Повышение ранга',
    descriptionEn: 'Rank promotion',
    fields: [
      { name: 'Rank', type: 'string', description: 'Ранг', descriptionEn: 'Rank', example: 'Deadly' },
    ],
    example: { timestamp: '2024-05-20T19:00:00Z', event: 'Promotion', Rank: 'Deadly' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  PVPKill: {
    category: 'combat',
    label: 'PVP Убийство',
    labelEn: 'PVP Kill',
    icon: '⚔️',
    description: 'Убит игрок',
    descriptionEn: 'Player killed',
    fields: [
      { name: 'Opponent', type: 'string', description: 'Противник', descriptionEn: 'Opponent', example: 'Cmdr Jane' },
    ],
    example: { timestamp: '2024-05-20T18:00:00Z', event: 'PVPKill', Opponent: 'Cmdr Jane' },
    relationships: { before: ['ShipTargeted'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CapShipBond: {
    category: 'combat',
    label: 'Капитальная награда',
    labelEn: 'Capital Ship Bond',
    icon: '🏆',
    description: 'Награда за капитальный корабль',
    descriptionEn: 'Capital ship bond',
    fields: [
      { name: 'Reward', type: 'number', description: 'Сумма', descriptionEn: 'Reward', example: 100000 },
    ],
    example: { timestamp: '2024-05-20T16:00:00Z', event: 'CapShipBond', Reward: 100000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
    isRare: true,
  },

  FactionKillBond: {
    category: 'combat',
    label: 'Уничтожение фракции',
    labelEn: 'Faction Kill Bond',
    icon: '☠️',
    description: 'Награда за уничтожение',
    descriptionEn: 'Faction kill bond',
    fields: [
      { name: 'Reward', type: 'number', description: 'Сумма', descriptionEn: 'Reward', example: 5000 },
    ],
    example: { timestamp: '2024-05-20T15:30:00Z', event: 'FactionKillBond', Reward: 5000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  NpcCrewRank: {
    category: 'social',
    label: 'Ранг NPC экипажа',
    labelEn: 'NPC Crew Rank',
    icon: '🎖️',
    description: 'Ранг NPC члена экипажа',
    descriptionEn: 'NPC crew rank',
    fields: [
      { name: 'NpcName', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'John' },
      { name: 'Rank', type: 'string', description: 'Ранг', descriptionEn: 'Rank', example: 'Intermediate' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'NpcCrewRank', NpcName: 'John', Rank: 'Intermediate' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  NpcCrewTerminated: {
    category: 'social',
    label: 'NPC уволен',
    labelEn: 'NPC Crew Terminated',
    icon: '👋',
    description: 'NPC член экипажа уволен',
    descriptionEn: 'NPC crew terminated',
    fields: [
      { name: 'NpcName', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'John' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'NpcCrewTerminated', NpcName: 'John' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CrewMemberQuits: {
    category: 'social',
    label: 'Член экипажа вышел',
    labelEn: 'Crew Member Quits',
    icon: '👋',
    description: 'Член экипажа ушёл',
    descriptionEn: 'Crew member left',
    fields: [
      { name: 'Crew', type: 'string', description: 'Имя', descriptionEn: 'Name', example: 'John Doe' },
    ],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'CrewMemberQuits', Crew: 'John Doe' },
    relationships: { before: ['CrewMemberJoins'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  QuitACrew: {
    category: 'social',
    label: 'Покинул экипаж',
    labelEn: 'Quit A Crew',
    icon: '🚪',
    description: 'Покинул экипаж',
    descriptionEn: 'Left crew',
    fields: [],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'QuitACrew' },
    relationships: { before: ['JoinACrew'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  MaterialTrade: {
    category: 'materials',
    label: 'Обмен материалов',
    labelEn: 'Material Trade',
    icon: '🔄',
    description: 'Обмен материалами',
    descriptionEn: 'Material trade',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'MaterialTrade' },
    relationships: { before: [], after: [] },
    difficulty: 'medium',
    frequency: 'rare',
  },

  TechnologyBroker: {
    category: 'materials',
    label: 'Техноброкер',
    labelEn: 'Technology Broker',
    icon: '🤖',
    description: 'Техноброкер',
    descriptionEn: 'Tech broker',
    fields: [
      { name: 'Item', type: 'string', description: 'Предмет', descriptionEn: 'Item', example: 'Tech' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'TechnologyBroker', Item: 'Tech' },
    relationships: { before: [], after: [] },
    difficulty: 'complex',
    frequency: 'rare',
  },

  Synthesis: {
    category: 'engineering',
    label: 'Синтез',
    labelEn: 'Synthesis',
    icon: '⚗️',
    description: 'Синтез боеприпасов',
    descriptionEn: 'Ammo synthesis',
    fields: [],
    example: { timestamp: '2024-05-20T11:00:00Z', event: 'Synthesis' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ExperimentalSynthesis: {
    category: 'engineering',
    label: 'Экспериментальный синтез',
    labelEn: 'Experimental Synthesis',
    icon: '⚗️',
    description: 'Экспериментальное улучшение',
    descriptionEn: 'Experimental synthesis',
    fields: [],
    example: { timestamp: '2024-05-20T10:45:00Z', event: 'ExperimentalSynthesis' },
    relationships: { before: ['EngineerCraft'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ModuleStore: {
    category: 'outfitting',
    label: 'Модуль в хранилище',
    labelEn: 'Module Store',
    icon: '📦',
    description: 'Модуль в хранилище',
    descriptionEn: 'Module stored',
    fields: [],
    example: { timestamp: '2024-05-20T13:00:00Z', event: 'ModuleStore' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ModuleRetrieve: {
    category: 'outfitting',
    label: 'Модуль из хранилища',
    labelEn: 'Module Retrieve',
    icon: '📤',
    description: 'Модуль из хранилища',
    descriptionEn: 'Module retrieved',
    fields: [],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'ModuleRetrieve' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierBuy: {
    category: 'carrier',
    label: 'Покупка носителя',
    labelEn: 'Carrier Buy',
    icon: '💰',
    description: 'Покупка носителя',
    descriptionEn: 'Carrier purchased',
    fields: [
      { name: 'CarrierID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 1234567890 },
    ],
    example: { timestamp: '2024-01-01T00:00:00Z', event: 'CarrierBuy', CarrierID: 1234567890 },
    relationships: { before: [], after: ['CarrierStats'] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierJumpCancelled: {
    category: 'carrier',
    label: 'Прыжок отменён',
    labelEn: 'Carrier Jump Cancelled',
    icon: '🚫',
    description: 'Прыжок отменён',
    descriptionEn: 'Jump cancelled',
    fields: [],
    example: { timestamp: '2024-05-20T09:58:00Z', event: 'CarrierJumpCancelled' },
    relationships: { before: ['CarrierJumpRequest'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierNameChanged: {
    category: 'carrier',
    label: 'Имя носителя изменено',
    labelEn: 'Carrier Name Changed',
    icon: '✏️',
    description: 'Имя изменено',
    descriptionEn: 'Name changed',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierNameChanged' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierDecommission: {
    category: 'carrier',
    label: 'Списание носителя',
    labelEn: 'Carrier Decommission',
    icon: '🗑️',
    description: 'Носитель списан',
    descriptionEn: 'Carrier decommissioned',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierDecommission' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierDepositFuel: {
    category: 'carrier',
    label: 'Заправка носителя',
    labelEn: 'Carrier Deposit Fuel',
    icon: '⛽',
    description: 'Заправка носителя',
    descriptionEn: 'Carrier fuel',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierDepositFuel' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  BookDropship: {
    category: 'odyssey',
    label: 'Заказ десантника',
    labelEn: 'Book Dropship',
    icon: '🚁',
    description: 'Заказ десантного корабля',
    descriptionEn: 'Dropship booked',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'BookDropship' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  BookTaxi: {
    category: 'odyssey',
    label: 'Заказ такси',
    labelEn: 'Book Taxi',
    icon: '🚕',
    description: 'Заказ такси',
    descriptionEn: 'Taxi booked',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'BookTaxi' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CancelDropship: {
    category: 'odyssey',
    label: 'Десантник отменён',
    labelEn: 'Cancel Dropship',
    icon: '🚫',
    description: 'Отмена десантника',
    descriptionEn: 'Dropship cancelled',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CancelDropship' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CancelTaxi: {
    category: 'odyssey',
    label: 'Такси отменено',
    labelEn: 'Cancel Taxi',
    icon: '🚫',
    description: 'Отмена такси',
    descriptionEn: 'Taxi cancelled',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CancelTaxi' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  SellSuit: {
    category: 'odyssey',
    label: 'Продажа костюма',
    labelEn: 'Sell Suit',
    icon: '💵',
    description: 'Продажа скафандра',
    descriptionEn: 'Suit sold',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SellSuit' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  SellWeapon: {
    category: 'odyssey',
    label: 'Продажа оружия',
    labelEn: 'Sell Weapon',
    icon: '💵',
    description: 'Продажа оружия',
    descriptionEn: 'Weapon sold',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SellWeapon' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CockpitBreached: {
    category: 'ship',
    label: 'Кабина повреждена',
    labelEn: 'Cockpit Breached',
    icon: '💨',
    description: 'Кабина повреждена',
    descriptionEn: 'Cockpit breached',
    fields: [],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'CockpitBreached' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  AFMURepairs: {
    category: 'ship',
    label: 'AFMU ремонт',
    labelEn: 'AFMU Repairs',
    icon: '🔧',
    description: 'Ремонт AFMU',
    descriptionEn: 'AFMU repair',
    fields: [],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'AFMURepairs' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ShipPowerDown: {
    category: 'ship',
    label: 'Корабль выключен',
    labelEn: 'Ship Power Down',
    icon: '🔴',
    description: 'Корабль выключен',
    descriptionEn: 'Ship powered down',
    fields: [],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'ShipPowerDown' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ShipPowerUp: {
    category: 'ship',
    label: 'Корабль включен',
    labelEn: 'Ship Power Up',
    icon: '🟢',
    description: 'Корабль включен',
    descriptionEn: 'Ship powered up',
    fields: [],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'ShipPowerUp' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  Screenshot: {
    category: 'exploration',
    label: 'Скриншот',
    labelEn: 'Screenshot',
    icon: '📸',
    description: 'Скриншот сделан',
    descriptionEn: 'Screenshot taken',
    fields: [
      { name: 'Filename', type: 'string', description: 'Файл', descriptionEn: 'Filename', example: 'Screenshot_001.png' },
    ],
    example: { timestamp: '2024-05-20T12:40:00Z', event: 'Screenshot', Filename: 'Screenshot_001.png' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  BuyTradeData: {
    category: 'trade',
    label: 'Данные торговли',
    labelEn: 'Buy Trade Data',
    icon: '📈',
    description: 'Покупка торговых данных',
    descriptionEn: 'Buying trade data',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'BuyTradeData' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  USSDrop: {
    category: 'trade',
    label: 'USS',
    labelEn: 'USS Drop',
    icon: '📡',
    description: 'Добыча из USS',
    descriptionEn: 'USS cargo drop',
    fields: [],
    example: { timestamp: '2024-05-20T11:15:00Z', event: 'USSDrop' },
    relationships: { before: ['FSSSignalDiscovered'], after: ['CollectCargo'] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  LaunchDrone: {
    category: 'mining',
    label: 'Дрон запущен',
    labelEn: 'Launch Drone',
    icon: '🚁',
    description: 'Запуск дрона',
    descriptionEn: 'Drone launched',
    fields: [],
    example: { timestamp: '2024-05-20T10:31:00Z', event: 'LaunchDrone' },
    relationships: { before: [], after: ['ProspectedAsteroid'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  DockingCancelled: {
    category: 'station',
    label: 'Стыковка отменена',
    labelEn: 'Docking Cancelled',
    icon: '🚫',
    description: 'Запрос стыковки отменён',
    descriptionEn: 'Docking cancelled',
    fields: [],
    example: { timestamp: '2024-05-20T09:57:00Z', event: 'DockingCancelled' },
    relationships: { before: ['DockingRequested'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  DockingTimeout: {
    category: 'station',
    label: 'Таймаут стыковки',
    labelEn: 'Docking Timeout',
    icon: '⏱️',
    description: 'Время стыковки истекло',
    descriptionEn: 'Docking timeout',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'DockingTimeout' },
    relationships: { before: ['DockingRequested'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  FSSAllBodiesFound: {
    category: 'exploration',
    label: 'Все тела найдены',
    labelEn: 'FSS All Bodies Found',
    icon: '✅',
    description: 'Все тела в системе обнаружены',
    descriptionEn: 'All bodies in system discovered',
    fields: [],
    example: { timestamp: '2024-05-20T12:15:00Z', event: 'FSSAllBodiesFound' },
    relationships: { before: ['FSSDiscoveryScan'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  FSSBodySignals: {
    category: 'exploration',
    label: 'Сигналы тела',
    labelEn: 'FSS Body Signals',
    icon: '📊',
    description: 'Сигналы обнаруженные у тела при FSS',
    descriptionEn: 'Signals found at body during FSS',
    fields: [],
    example: { timestamp: '2024-05-20T12:14:00Z', event: 'FSSBodySignals' },
    relationships: { before: ['FSSDiscoveryScan'], after: [] },
    difficulty: 'medium',
    frequency: 'medium',
  },

  SAASignalsFound: {
    category: 'exploration',
    label: 'Сигналы DSS',
    labelEn: 'DSS Signals Found',
    icon: '📊',
    description: 'Сигналы для картографирования DSS',
    descriptionEn: 'DSS signals found',
    fields: [],
    example: { timestamp: '2024-05-20T12:24:00Z', event: 'SAASignalsFound' },
    relationships: { before: ['Scan'], after: ['SAAScanComplete'] },
    difficulty: 'medium',
    frequency: 'medium',
  },

  NavBeaconScan: {
    category: 'exploration',
    label: 'Nav Beacon Scan',
    labelEn: 'Nav Beacon Scan',
    icon: '📡',
    description: 'Сканирование Nav Beacon',
    descriptionEn: 'Navigation beacon scan',
    fields: [],
    example: { timestamp: '2024-05-20T12:11:00Z', event: 'NavBeaconScan' },
    relationships: { before: ['FSDJump'], after: ['Scan'] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  MultiSellExplorationData: {
    category: 'exploration',
    label: 'Продажа данных',
    labelEn: 'Multi-Sell Exploration Data',
    icon: '💰',
    description: 'Продажа данных исследования',
    descriptionEn: 'Selling exploration data',
    fields: [],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'MultiSellExplorationData' },
    relationships: { before: ['Scan', 'DetailedScan'], after: [] },
    difficulty: 'medium',
    frequency: 'common',
  },

  MaterialDiscarded: {
    category: 'exploration',
    label: 'Материал выброшен',
    labelEn: 'Material Discarded',
    icon: '🗑️',
    description: 'Материал выброшен',
    descriptionEn: 'Material discarded',
    fields: [],
    example: { timestamp: '2024-05-20T12:35:00Z', event: 'MaterialDiscarded' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  MaterialDiscovered: {
    category: 'exploration',
    label: 'Материал открыт',
    labelEn: 'Material Discovered',
    icon: '💎',
    description: 'Новый материал открыт',
    descriptionEn: 'New material discovered',
    fields: [],
    example: { timestamp: '2024-05-20T12:31:00Z', event: 'MaterialDiscovered' },
    relationships: { before: ['MaterialCollected'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  BuyExplorationData: {
    category: 'exploration',
    label: 'Покупка данных',
    labelEn: 'Buy Exploration Data',
    icon: '📈',
    description: 'Покупка данных системы',
    descriptionEn: 'Buying exploration data',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'BuyExplorationData' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  EjectCargo: {
    category: 'trade',
    label: 'Выброс груза',
    labelEn: 'Eject Cargo',
    icon: '🗑️',
    description: 'Выброс груза',
    descriptionEn: 'Ejecting cargo',
    fields: [],
    example: { timestamp: '2024-05-20T11:30:00Z', event: 'EjectCargo' },
    relationships: { before: ['CollectCargo'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierTradeOrder: {
    category: 'carrier',
    label: 'Торговый приказ',
    labelEn: 'Carrier Trade Order',
    icon: '📋',
    description: 'Торговый приказ носителя',
    descriptionEn: 'Carrier trade order',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierTradeOrder' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierDockingPermission: {
    category: 'carrier',
    label: 'Разрешение на стыковку',
    labelEn: 'Carrier Docking Permission',
    icon: '🔐',
    description: 'Изменены разрешения на стыковку',
    descriptionEn: 'Docking permissions changed',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierDockingPermission' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierShipPack: {
    category: 'carrier',
    label: 'Пакет кораблей',
    labelEn: 'Carrier Ship Pack',
    icon: '🚀',
    description: 'Пакет кораблей носителя',
    descriptionEn: 'Carrier ship pack',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierShipPack' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierModulePack: {
    category: 'carrier',
    label: 'Пакет модулей',
    labelEn: 'Carrier Module Pack',
    icon: '🔩',
    description: 'Пакет модулей носителя',
    descriptionEn: 'Carrier module pack',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierModulePack' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierCrewServices: {
    category: 'carrier',
    label: 'Услуги экипажа',
    labelEn: 'Carrier Crew Services',
    icon: '👥',
    description: 'Услуги экипажа носителя',
    descriptionEn: 'Carrier crew services',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierCrewServices' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierFinance: {
    category: 'carrier',
    label: 'Финансы носителя',
    labelEn: 'Carrier Finance',
    icon: '💰',
    description: 'Финансы носителя',
    descriptionEn: 'Carrier finance',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierFinance' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CarrierCancelDecommission: {
    category: 'carrier',
    label: 'Отмена списания',
    labelEn: 'Cancel Decommission',
    icon: '🔄',
    description: 'Отмена списания носителя',
    descriptionEn: 'Cancel decommission',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CarrierCancelDecommission' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  PowerplayCollect: {
    category: 'powerplay',
    label: 'Powerplay сбор',
    labelEn: 'Powerplay Collect',
    icon: '⭐',
    description: 'Сбор для Powerplay',
    descriptionEn: 'Powerplay collect',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'PowerplayCollect' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  PowerplayDefect: {
    category: 'powerplay',
    label: 'Powerplay переход',
    labelEn: 'Powerplay Defect',
    icon: '🔄',
    description: 'Переход к другой силе',
    descriptionEn: 'Defected to power',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'PowerplayDefect' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  DataScanned: {
    category: 'data',
    label: 'Данные взломаны',
    labelEn: 'Data Scanned',
    icon: '💻',
    description: 'Данные взломаны',
    descriptionEn: 'Data scanned',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'DataScanned' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // Squadrons
  SquadronCreated: {
    category: 'social',
    label: 'Эскадрон создан',
    labelEn: 'Squadron Created',
    icon: '🏰',
    description: 'Создан новый эскадрон',
    descriptionEn: 'New squadron created',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SquadronCreated' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  JoinedSquadron: {
    category: 'social',
    label: 'Присоединился к эскадрону',
    labelEn: 'Joined Squadron',
    icon: '🏰',
    description: 'Присоединение к эскадрону',
    descriptionEn: 'Joined squadron',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'JoinedSquadron' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  LeftSquadron: {
    category: 'social',
    label: 'Покинул эскадрон',
    labelEn: 'Left Squadron',
    icon: '🏰',
    description: 'Покинул эскадрон',
    descriptionEn: 'Left squadron',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'LeftSquadron' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  KickedFromSquadron: {
    category: 'social',
    label: 'Исключён из эскадрона',
    labelEn: 'Kicked From Squadron',
    icon: '🏰',
    description: 'Исключение из эскадрона',
    descriptionEn: 'Kicked from squadron',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'KickedFromSquadron' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  SquadronDemotion: {
    category: 'social',
    label: 'Понижение в эскадроне',
    labelEn: 'Squadron Demotion',
    icon: '🏰',
    description: 'Понижение в звании эскадрона',
    descriptionEn: 'Squadron demotion',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SquadronDemotion' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  SquadronPromotion: {
    category: 'social',
    label: 'Повышение в эскадроне',
    labelEn: 'Squadron Promotion',
    icon: '🏰',
    description: 'Повышение в звании эскадрона',
    descriptionEn: 'Squadron promotion',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SquadronPromotion' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  SquadronStartup: {
    category: 'social',
    label: 'Эскадрон создан',
    labelEn: 'Squadron Startup',
    icon: '🏰',
    description: 'Эскадрон основан',
    descriptionEn: 'Squadron startup',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SquadronStartup' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  WonATrophyForSquadron: {
    category: 'social',
    label: 'Трофей эскадрона',
    labelEn: 'Won A Trophy For Squadron',
    icon: '🏆',
    description: 'Выигран трофей для эскадрона',
    descriptionEn: 'Won trophy for squadron',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'WonATrophyForSquadron' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  SharedBookmarkToSquadron: {
    category: 'social',
    label: 'Закладка отправлена',
    labelEn: 'Shared Bookmark To Squadron',
    icon: '🔖',
    description: 'Закладка отправлена эскадрону',
    descriptionEn: 'Bookmark shared to squadron',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SharedBookmarkToSquadron' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // STARTUP & SYSTEM - Запуск и система
  // ==========================================================================

  Fileheader: {
    category: 'game',
    label: 'Заголовок файла',
    labelEn: 'File Header',
    icon: '📄',
    description: 'Заголовок журнального файла',
    descriptionEn: 'Journal file header',
    fields: [
      { name: 'part', type: 'number', description: 'Часть файла', descriptionEn: 'Part number', example: 1, required: true },
      { name: 'gameversion', type: 'string', description: 'Версия игры', descriptionEn: 'Game version', example: '4.0.0.1400', required: true },
      { name: 'build', type: 'string', description: 'Сборка', descriptionEn: 'Build', example: 'r429496', required: true },
    ],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'Fileheader', part: 1, gameversion: '4.0.0.1400', build: 'r429496' },
    relationships: { before: [], after: ['LoadGame'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  StartUp: {
    category: 'game',
    label: 'Запуск',
    labelEn: 'Start Up',
    icon: '🚀',
    description: 'Игра запущена',
    descriptionEn: 'Game started',
    fields: [],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'StartUp' },
    relationships: { before: ['Fileheader'], after: ['LoadGame'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  Continue: {
    category: 'game',
    label: 'Продолжение',
    labelEn: 'Continued',
    icon: '▶️',
    description: 'Журнал продолжен (новый файл)',
    descriptionEn: 'Journal continued (new file)',
    fields: [
      { name: 'Part', type: 'number', description: 'Номер части', descriptionEn: 'Part number', example: 2 },
    ],
    example: { timestamp: '2024-05-20T20:00:00Z', event: 'Continue', Part: 2 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
    isRare: true,
  },

  // ==========================================================================
  // SHIP OPERATIONS - Операции с кораблём
  // ==========================================================================

  DockFighter: {
    category: 'ship',
    label: 'Истребитель докован',
    labelEn: 'Dock Fighter',
    icon: '🚁',
    description: 'Истребитель возвратился на корабль',
    descriptionEn: 'Fighter docked to mothership',
    fields: [
      { name: 'ID', type: 'number', description: 'ID истребителя', descriptionEn: 'Fighter ID', example: 1 },
    ],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'DockFighter', ID: 1 },
    relationships: { before: ['LaunchFighter'], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
    isRare: true,
  },

  DockSRV: {
    category: 'ship',
    label: 'SRV докован',
    labelEn: 'Dock SRV',
    icon: '🚙️',
    description: 'SRV возвращён на корабль',
    descriptionEn: 'SRV docked to ship',
    fields: [
      { name: 'ID', type: 'number', description: 'ID SRV', descriptionEn: 'SRV ID', example: 2 },
      { name: 'SRVType', type: 'string', description: 'Тип SRV', descriptionEn: 'SRV type', example: 'SRV' },
    ],
    example: { timestamp: '2024-05-20T15:00:00Z', event: 'DockSRV', ID: 2, SRVType: 'SRV' },
    relationships: { before: ['LaunchSRV'], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
    isRare: true,
  },

  LaunchFighter: {
    category: 'ship',
    label: 'Запуск истребителя',
    labelEn: 'Launch Fighter',
    icon: '🚀',
    description: 'Истребитель запущен',
    descriptionEn: 'Fighter launched',
    fields: [
      { name: 'Loadout', type: 'string', description: 'Конфигурация', descriptionEn: 'Loadout', example: 'starter' },
      { name: 'ID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 1 },
      { name: 'PlayerControlled', type: 'boolean', description: 'Игрок управляет', descriptionEn: 'Player controlled', example: true },
    ],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'LaunchFighter', Loadout: 'starter', ID: 1, PlayerControlled: true },
    relationships: { before: [], after: ['DockFighter', 'FighterDestroyed'] },
    difficulty: 'simple',
    frequency: 'rare',
    isRare: true,
  },

  LaunchSRV: {
    category: 'ship',
    label: 'Запуск SRV',
    labelEn: 'Launch SRV',
    icon: '🚙️',
    description: 'SRV запущен с корабля',
    descriptionEn: 'SRV launched from ship',
    fields: [
      { name: 'Loadout', type: 'string', description: 'Конфигурация', descriptionEn: 'Loadout', example: 'starter' },
      { name: 'ID', type: 'number', description: 'ID', descriptionEn: 'ID', example: 2 },
      { name: 'SRVType', type: 'string', description: 'Тип SRV', descriptionEn: 'SRV type', example: 'SRV' },
    ],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'LaunchSRV', Loadout: 'starter', ID: 2, SRVType: 'SRV' },
    relationships: { before: [], after: ['DockSRV', 'SRVDestroyed'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  FighterRebuilt: {
    category: 'ship',
    label: 'Истребитель восстановлен',
    labelEn: 'Fighter Rebuilt',
    icon: '🔧',
    description: 'Истребитель восстановлен в ангаре',
    descriptionEn: 'Fighter rebuilt in hangar',
    fields: [
      { name: 'Loadout', type: 'string', description: 'Конфигурация', descriptionEn: 'Loadout', example: 'starter' },
    ],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'FighterRebuilt', Loadout: 'starter' },
    relationships: { before: ['FighterDestroyed'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  VehicleSwitch: {
    category: 'ship',
    label: 'Смена транспорта',
    labelEn: 'Vehicle Switch',
    icon: '🔄',
    description: 'Переключение управления между кораблём и истребителем/SRV',
    descriptionEn: 'Switch control between ship and fighter/SRV',
    fields: [
      { name: 'To', type: 'string', description: 'На что переключено', descriptionEn: 'Switch to', example: 'Fighter' },
    ],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'VehicleSwitch', To: 'Fighter' },
    relationships: { before: ['LaunchFighter', 'LaunchSRV'], after: ['DockFighter', 'DockSRV'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  SystemsShutdown: {
    category: 'ship',
    label: 'Системы отключены',
    labelEn: 'Systems Shutdown',
    icon: '⚫',
    description: 'Системы корабля отключены',
    descriptionEn: 'Ship systems shutdown',
    fields: [],
    example: { timestamp: '2024-05-20T16:00:00Z', event: 'SystemsShutdown' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
    isRare: true,
  },

  // ==========================================================================
  // SCAN & DETAILED INFO - Сканы и детализации
  // ==========================================================================

  ScanBaryCentre: {
    category: 'exploration',
    label: 'Скан барицентра',
    labelEn: 'Scan Bary Centre',
    icon: '⚖️',
    description: 'Сканирование барицентра двойной системы',
    descriptionEn: 'Scan barycenter of binary star system',
    fields: [
      { name: 'StarSystem', type: 'string', description: 'Звёздная система', descriptionEn: 'Star system', example: 'Col 285 Sector YX-N b21-1' },
      { name: 'SystemAddress', type: 'number', description: 'Адрес системы', descriptionEn: 'System address', example: 2867561768401 },
      { name: 'BodyID', type: 'number', description: 'ID тела', descriptionEn: 'Body ID', example: 10 },
      { name: 'SemiMajorAxis', type: 'number', description: 'Большая полуось', descriptionEn: 'Semi-major axis', example: 2107998251914.978 },
      { name: 'Eccentricity', type: 'number', description: 'Эксцентриситет', descriptionEn: 'Eccentricity', example: 0.033074 },
      { name: 'OrbitalInclination', type: 'number', description: 'Орбитальное наклонение', descriptionEn: 'Orbital inclination', example: 0.019013 },
      { name: 'Periapsis', type: 'number', description: 'Периапсис', descriptionEn: 'Periapsis', example: 342.187341 },
      { name: 'OrbitalPeriod', type: 'number', description: 'Орбитальный период', descriptionEn: 'Orbital period', example: 3739380657.67 },
      { name: 'AscendingNode', type: 'number', description: 'Восходящий узел', descriptionEn: 'Ascending node', example: -31.477241 },
      { name: 'MeanAnomaly', type: 'number', description: 'Средняя аномалия', descriptionEn: 'Mean anomaly', example: 64.03028 },
    ],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'ScanBaryCentre', StarSystem: 'Col 285 Sector YX-N b21-1', SystemAddress: 2867561768401, BodyID: 10 },
    relationships: { before: ['Scan'], after: [] },
    difficulty: 'complex',
    frequency: 'rare',
    isRare: true,
  },

  // ==========================================================================
  // MISSIONS - Продолжение
  // ==========================================================================

  MissionRedirected: {
    category: 'mission',
    label: 'Миссия перенаправлена',
    labelEn: 'Mission Redirected',
    icon: '🔄',
    description: 'Миссия получила новую точку назначения',
    descriptionEn: 'Mission updated with new destination',
    fields: [
      { name: 'MissionID', type: 'number', description: 'ID миссии', descriptionEn: 'Mission ID', example: 65367315 },
      { name: 'Name', type: 'string', description: 'Миссия', descriptionEn: 'Mission', example: 'Mission_Name_01' },
      { name: 'NewDestinationStation', type: 'string', description: 'Новая станция', descriptionEn: 'New station', example: 'Metcalf Orbital' },
      { name: 'OldDestinationStation', type: 'string', description: 'Старая станция', descriptionEn: 'Old station', example: 'Cuffey Orbital' },
      { name: 'NewDestinationSystem', type: 'string', description: 'Новая система', descriptionEn: 'New system', example: 'Cemiess' },
      { name: 'OldDestinationSystem', type: 'string', description: 'Старая система', descriptionEn: 'Old system', example: 'Vequess' },
    ],
    example: { timestamp: '2024-05-20T09:04:07Z', event: 'MissionRedirected', MissionID: 65367315, NewDestinationStation: 'Metcalf Orbital', OldDestinationStation: 'Cuffey Orbital', NewDestinationSystem: 'Cemiess', OldDestinationSystem: 'Vequess' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // CREW & MULTICREW - Экипаж и мультите игрок
  // ==========================================================================

  EndCrewSession: {
    category: 'crew',
    label: 'Сессия экипажа завершена',
    labelEn: 'End Crew Session',
    icon: '🚪',
    description: 'Капитан распустил экипаж',
    descriptionEn: 'Captain disbanded the crew',
    fields: [
      { name: 'OnCrime', type: 'boolean', description: 'Из-за преступления', descriptionEn: 'Due to crime', example: false },
      { name: 'Telepresence', type: 'boolean', description: 'Телеприсутствие', descriptionEn: 'Telepresence', example: false },
    ],
    example: { timestamp: '2024-05-20T14:00:00Z', event: 'EndCrewSession', OnCrime: false, Telepresence: false },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
    isRare: true,
  },

  // ==========================================================================
  // STATION SERVICES - Услуги станции
  // ==========================================================================

  BuyAmmo: {
    category: 'station',
    label: 'Покупка боеприпасов',
    labelEn: 'Buy Ammo',
    icon: '🔫',
    description: 'Покупка боеприпасов',
    descriptionEn: 'Purchasing ammunition',
    fields: [
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 80 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'BuyAmmo', Cost: 80 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  BuyDrones: {
    category: 'station',
    label: 'Покупка дронов',
    labelEn: 'Buy Drones',
    icon: '🤖',
    description: 'Покупка дронов',
    descriptionEn: 'Purchasing drones',
    fields: [
      { name: 'Type', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'Collection' },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Count', example: 2 },
      { name: 'BuyPrice', type: 'number', description: 'Цена', descriptionEn: 'Price', example: 101 },
      { name: 'TotalCost', type: 'number', description: 'Всего', descriptionEn: 'Total', example: 202 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'BuyDrones', Type: 'Drones', Count: 2, BuyPrice: 101, TotalCost: 202 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  SellDrones: {
    category: 'station',
    label: 'Продажа дронов',
    labelEn: 'Sell Drones',
    icon: '🤖',
    description: 'Продажа дронов',
    descriptionEn: 'Selling drones',
    fields: [
      { name: 'Type', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'Drones' },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Count', example: 1 },
      { name: 'SellPrice', type: 'number', description: 'Цена', descriptionEn: 'Price', example: 91 },
      { name: 'TotalSale', type: 'number', description: 'Всего', descriptionEn: 'Total', example: 91 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SellDrones', Type: 'Drones', Count: 1, SellPrice: 91, TotalSale: 91 },
    relationships: { before: ['LaunchDrone'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // OTHER EVENTS - Другие события
  // ==========================================================================

  DatalinkScan: {
    category: 'other',
    label: 'Datalink скан',
    labelEn: 'Datalink Scan',
    icon: '💾',
    description: 'Сканирование далинка',
    descriptionEn: 'Scanning datalink',
    fields: [
      { name: 'Message', type: 'string', description: 'Сообщение', descriptionEn: 'Message', example: 'Data uploaded successfully' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'DatalinkScan', Message: 'Data uploaded successfully' },
    relationships: { before: [], after: ['DatalinkVoucher'] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  DatalinkVoucher: {
    category: 'other',
    label: 'Дatalink ваучер',
    labelEn: 'Datalink Voucher',
    icon: '🧾',
    description: 'Награда за сканирование далинка',
    descriptionEn: 'Reward for scanning datalink',
    fields: [
      { name: 'Reward', type: 'number', description: 'Награда', descriptionEn: 'Reward', example: 50000 },
      { name: 'PayeeFaction', type: 'string', description: 'Фракция-получатель', descriptionEn: 'Payee faction', example: 'Pilots Federation' },
      { name: 'VictimFaction', type: 'string', description: 'Фракция-жертва', descriptionEn: 'Victim faction', example: 'Pilots Federation' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'DatalinkVoucher', Reward: 50000, PayeeFaction: 'Pilots Federation', VictimFaction: 'Pilots Federation' },
    relationships: { before: ['DatalinkScan'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  JetConeBoost: {
    category: 'other',
    label: 'Ускорение джет-струи',
    labelEn: 'Jet Cone Boost',
    icon: '⚡',
    description: 'Получен буст от джет-струи',
    descriptionEn: 'Boost received from jet cone',
    fields: [
      { name: 'BoostValue', type: 'number', description: 'Значение буста', descriptionEn: 'Boost value', example: 100 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'JetConeBoost', BoostValue: 100 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
    isRare: true,
  },

  JetConeDamage: {
    category: 'other',
    label: 'Повреждение джет-струи',
    labelEn: 'Jet Cone Damage',
    icon: '🌋️',
    description: 'Получено повреждение от джет-струи',
    descriptionEn: 'Damage from jet cone',
    fields: [
      { name: 'Module', type: 'string', description: 'Повреждённый модуль', descriptionEn: 'Damaged module', example: 'int_powerdistribution_size3_class5' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'JetConeDamage', Module: 'int_powerdistribution_size3_class5' },
    relationships: { before: [], after: ['HullDamage'] },
    difficulty: 'simple',
    frequency: 'rare',
    isRare: true,
  },

  Scanned: {
    category: 'other',
    label: 'Сканирование завершено',
    labelEn: 'Scanned',
    icon: '📡',
    description: 'Ваш корабль просканирован',
    descriptionEn: 'Your ship has been scanned',
    fields: [
      { name: 'ScanType', type: 'string', description: 'Тип скана', descriptionEn: 'Scan type', example: 'Cargo' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Scanned', ScanType: 'Cargo' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  SupercruiseDestinationDrop: {
    category: 'navigation',
    label: 'Выход в точку назначения',
    labelEn: 'Supercruise Destination Drop',
    icon: '📍',
    description: 'Выход из суперкруиза в точку назначения',
    descriptionEn: 'Drop from supercruise at targeted destination',
    fields: [
      { name: 'Type', type: 'string', description: 'Тип точки', descriptionEn: 'Type', example: 'Azeban City' },
      { name: 'Threat', type: 'number', description: 'Уровень угрозы', descriptionEn: 'Threat level', example: 0 },
    ],
    example: { timestamp: '2024-05-20T12:00:00Z', event: 'SupercruiseDestinationDrop', Type: 'Azeban City', Threat: 0 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  // ==========================================================================
  // STATION & CARRIER SERVICES - Сервисы станции и носителя
  // ==========================================================================

  CargoDepot: {
    category: 'mission',
    label: 'Грузовой склад',
    labelEn: 'Cargo Depot',
    icon: '📦',
    description: 'Работа с грузовой точкой для крыльевой миссии',
    descriptionEn: 'Handling cargo depot for wing mission',
    fields: [
      { name: 'MissionID', type: 'number', description: 'ID миссии', descriptionEn: 'Mission ID', example: 65394170 },
      { name: 'UpdateType', type: 'string', description: 'Тип обновления', descriptionEn: 'Update type', example: 'Deliver' },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Count', example: 8 },
      { name: 'CargoType', type: 'string', description: 'Тип груза', descriptionEn: 'Cargo type', example: 'BasicMedicines' },
    ],
    example: { timestamp: '2024-05-20T15:47:03Z', event: 'CargoDepot', MissionID: 65394170, UpdateType: 'Deliver', CargoType: 'BasicMedicines', Count: 8 },
    relationships: { before: [], after: [] },
    difficulty: 'medium',
    frequency: 'rare',
  },

  Market: {
    category: 'trade',
    label: 'Комодитный рынок',
    labelEn: 'Commodity Market',
    icon: '📊',
    description: 'Доступ к рынку товаров',
    descriptionEn: 'Accessing commodity market',
    fields: [
      { name: 'MarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 128678535, required: true },
      { name: 'StationName', type: 'string', description: 'Станция', descriptionEn: 'Station', example: 'Black Hide' },
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Wyrd' },
    ],
    example: { timestamp: '2024-05-20T10:11:38Z', event: 'Market', MarketID: 128678535, StationName: 'Black Hide', StarSystem: 'Wyrd' },
    relationships: { before: [], after: ['Outfitting', 'Shipyard'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  Outfitting: {
    category: 'station',
    label: 'Аутиллерей',
    labelEn: 'Outfitting',
    icon: '🔧',
    description: 'Доступ к аутилерею модулей',
    descriptionEn: 'Accessing outfitting module shop',
    fields: [
      { name: 'MarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 128678535, required: true },
      { name: 'StationName', type: 'string', description: 'Станция', descriptionEn: 'Station', example: 'Black Hide' },
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Wyrd' },
    ],
    example: { timestamp: '2024-05-20T10:11:38Z', event: 'Outfitting', MarketID: 128678535, StationName: 'Black Hide', StarSystem: 'Wyrd' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  Shipyard: {
    category: 'shipyard',
    label: 'Верфь',
    labelEn: 'Shipyard',
    icon: '⚓',
    description: 'Доступ к верфи кораблей',
    descriptionEn: 'Accessing shipyard',
    fields: [
      { name: 'MarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 128122104, required: true },
      { name: 'StationName', type: 'string', description: 'Станция', descriptionEn: 'Station', example: 'Seven Holm' },
      { name: 'StarSystem', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Tamor' },
    ],
    example: { timestamp: '2024-05-20T10:01:38Z', event: 'Shipyard', MarketID: 128122104, StationName: 'Seven Holm', StarSystem: 'Tamor' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  // ==========================================================================
  // HIDDEN & SPECIAL FEATURES - Скрытые и специальные функции
  // ==========================================================================

  ScientificResearch: {
    category: 'other',
    label: 'Научное исследование',
    labelEn: 'Scientific Research',
    icon: '🔬',
    description: 'Внесение материалов в научный проект',
    descriptionEn: 'Contributing materials to research CG',
    fields: [
      { name: 'MarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 1281787693419 },
      { name: 'Name', type: 'string', description: 'Материал', descriptionEn: 'Material', example: 'vanadium' },
      { name: 'Category', type: 'string', description: 'Категория', descriptionEn: 'Category', example: 'Raw' },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Quantity', example: 30 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'ScientificResearch', MarketID: 128151032, Name: 'vanadium', Category: 'Raw', Count: 30 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  SearchAndRescue: {
    category: 'other',
    label: 'SAR',
    labelEn: 'Search And Rescue',
    icon: '🚁',
    description: 'Доставка найденных пилотов',
    descriptionEn: 'Delivering rescued pilots',
    fields: [
      { name: 'MarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 128833431 },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Quantity', example: 1 },
      { name: 'Name', type: 'string', description: 'Кто', descriptionEn: 'Name', example: 'Cmdr John' },
      { name: 'Reward', type: 'number', description: 'Награда', descriptionEn: 'Reward', example: 50000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SearchAndRescue', MarketID: 128833431, Count: 1, Name: 'Cmdr John', Reward: 50000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ShipyardNew: {
    category: 'shipyard',
    label: 'Новый корабль',
    labelEn: 'Shipyard New',
    icon: '🚀',
    description: 'Покуплен новый корабль',
    descriptionEn: 'New ship purchased',
    fields: [
      { name: 'ShipType', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'hauler' },
      { name: 'NewShipID', type: 'number', description: 'ID', descriptionEn: 'New ship ID', example: 4 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'ShipyardNew', ShipType: 'hauler', NewShipID: 4 },
    relationships: { before: ['ShipyardBuy'], after: ['Loadout'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  ShipyardTransfer: {
    category: 'shipyard',
    label: 'Трансфер корабля',
    labelEn: 'Shipyard Transfer',
    icon: '🚛',
    description: 'Запрос на трансфер корабля с другой станции',
    descriptionEn: 'Ship transfer request',
    fields: [
      { name: 'ShipType', type: 'string', description: 'Тип корабля', descriptionEn: 'Ship type', example: 'SideWinder' },
      { name: 'ShipID', type: 'number', description: 'ID корабля', descriptionEn: 'Ship ID', example: 7 },
      { name: 'System', type: 'string', description: 'Где находится', descriptionEn: 'Location', example: 'Eranin' },
      { name: 'ShipMarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 128666762 },
      { name: 'Distance', type: 'number', description: 'Расстояние', descriptionEn: 'Distance', example: 85.639 },
      { name: 'TransferPrice', type: 'number', description: 'Цена', descriptionEn: 'Transfer cost', example: 580 },
      { name: 'TransferTime', type: 'number', description: 'Время', descriptionEn: 'Time (sec)', example: 1590 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'ShipyardTransfer', ShipType: 'SideWinder', ShipID: 7, System: 'Eranin', Distance: 85.639, TransferPrice: 580, TransferTime: 1590 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  ModuleSellRemote: {
    category: 'outfitting',
    label: 'Продажа модуля (remote)',
    labelEn: 'Module Sell Remote',
    icon: '💵',
    description: 'Продажа модуля с удалённой станции',
    descriptionEn: 'Selling module at remote station',
    fields: [
      { name: 'StorageSlot', type: 'number', description: 'Слот хранения', descriptionEn: 'Storage slot', example: 57 },
      { name: 'SellItem', type: 'string', description: 'Модуль', descriptionEn: 'Module', example: 'int_hyperdrive_size3_class5' },
      { name: 'ServerId', type: 'number', description: 'Сервер', descriptionEn: 'Server ID', example: 128666762 },
      { name: 'SellPrice', type: 'number', description: 'Цена', descriptionEn: 'Price', example: 12620035 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'ModuleSellRemote', StorageSlot: 57, SellItem: 'int_hyperdrive_size3_class5', ServerId: 128666762, SellPrice: 12620035 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  FetchRemoteModule: {
    category: 'outfitting',
    label: 'Заказ модуля',
    labelEn: 'Fetch Remote Module',
    icon: '📦',
    description: 'Запрос трансфера модуля с удалённой станции',
    descriptionEn: 'Requesting module transfer from remote station',
    fields: [
      { name: 'StorageSlot', type: 'number', description: 'Слот хранения', descriptionEn: 'Storage slot', example: 57 },
      { name: 'StoredItem', type: 'string', description: 'Объект', descriptionEn: 'Module object' },
      { name: 'ServerId', type: 'number', description: 'Сервер', descriptionEn: 'Server ID', example: 128666762 },
      { name: 'TransferCost', type: 'number', description: 'Цена', descriptionEn: 'Transfer cost', example: 79680 },
      { name: 'Ship', type: 'string', description: 'Корабль', descriptionEn: 'Ship', example: 'cobramkiii' },
      { name: 'ShipId', type: 'number', description: 'ID корабля', descriptionEn: 'Ship ID', example: 1 },
      { name: 'TransferTime', type: 'number', description: 'Время', descriptionEn: 'Time (sec)', example: 1317 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'FetchRemoteModule', StorageSlot: 57, StoredItem: 'Hpt_PlasmaShockCannon_Fixed_Medium', TransferCost: 79680, Ship: 'cobramkiii', ShipId: 1, TransferTime: 1317 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  ModuleInfo: {
    category: 'ship',
    label: 'Информация о модулях',
    labelEn: 'Module Info',
    icon: 'ℹ️',
    description: 'Изменение информации о модулях',
    descriptionEn: 'Write module info to ModulesInfo.json',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'ModuleInfo' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'medium',
  },

  RestockVehicle: {
    category: 'station',
    label: 'Заказ техники',
    labelEn: 'Restock Vehicle',
    icon: '🚁',
    description: 'Покупка SRV или истребителя',
    descriptionEn: 'Purchasing SRV or Fighter',
    fields: [
      { name: 'Type', type: 'string', description: 'Тип', descriptionEn: 'Type', example: 'SRV' },
      { name: 'Loadout', type: 'string', description: 'Конфигурация', descriptionEn: 'Loadout', example: 'starter' },
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 1030 },
      { name: 'Count', type: 'number', description: 'Количество', descriptionEn: 'Quantity', example: 1 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'RestockVehicle', Type: 'SRV', Loadout: 'starter', Cost: 1030, Count: 1 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  StoredModules: {
    category: 'outfitting',
    label: 'Хранилище модулей',
    labelEn: 'Stored Modules',
    icon: '📦',
    description: 'Список модулей на хранении',
    descriptionEn: 'List of stored modules',
    fields: [
      { name: 'MarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 128676487 },
      { name: 'Items', type: 'array', description: 'Список модулей', descriptionEn: 'Items list' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'StoredModules', MarketID: 128676487, Items: [] },
    relationships: { before: [], after: [] },
    difficulty: 'complex',
    frequency: 'common',
  },

  StoredShips: {
    category: 'shipyard',
    label: 'Хранилище кораблей',
    labelEn: 'Stored Ships',
    icon: '⚓',
    description: 'Список кораблей на хранении',
    descriptionEn: 'List of stored ships',
    fields: [
      { name: 'ShipsHere', type: 'array', description: 'Местные корабли', descriptionEn: 'Stored ships' },
      { name: 'ShipsRemote', type: 'array', description: 'Удалённые корабли', descriptionEn: 'Remote ships' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'StoredShips' },
    relationships: { before: [], after: [] },
    difficulty: 'complex',
    frequency: 'common',
  },

  // ==========================================================================
  // NPC CREW - NPC экипаж
  // ==========================================================================

  NpcCrewPaidWage: {
    category: 'crew',
    label: 'NPC зарплата',
    labelEn: 'NPC Crew Paid Wage',
    icon: '💰',
    description: 'Выплата NPC экипажу',
    descriptionEn: 'NPC crew member paid wages',
    fields: [
      { name: 'NpcCrewId', type: 'string', description: 'ID NPC', descriptionEn: 'NPC crew ID', example: '123' },
      { name: 'NpcCrewName', type: 'string', description: 'Имя NPC', descriptionEn: 'NPC name', example: 'John' },
      { name: 'Amount', type: 'number', description: 'Сумма', descriptionEn: 'Amount', example: 5000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'NpcCrewPaidWage', NpcCrewId: '123', NpcCrewName: 'John', Amount: 5000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CrewLaunchFighter: {
    category: 'crew',
    label: 'Запуск истребителя экипажем',
    labelEn: 'Crew Launch Fighter',
    icon: '🚀',
    description: 'NPC-член экипажа запускает истребитель из корабля',
    descriptionEn: 'NPC crew member launches a fighter from the ship',
    fields: [
      { name: 'timestamp', type: 'string', description: 'Время события', descriptionEn: 'Event timestamp', example: '2024-02-21T12:34:56Z', required: true },
      { name: 'event', type: 'string', description: 'Тип события', descriptionEn: 'Event type', example: 'CrewLaunchFighter', required: true },
      { name: 'CrewID', type: 'number', description: 'ID члена экипажа', descriptionEn: 'Crew member ID', example: 123456789, required: true },
      { name: 'CrewRole', type: 'string', description: 'Роль члена экипажа', descriptionEn: 'Crew member role', example: 'FighterCon', required: true },
      { name: 'Name', type: 'string', description: 'Имя члена экипажа', descriptionEn: 'Crew member name', example: 'John Doe', required: true }
    ],
    example: { timestamp: '2024-02-21T12:34:56Z', event: 'CrewLaunchFighter', CrewID: 123456789, CrewRole: 'FighterCon', Name: 'John Doe' },
    relationships: { before: ['CrewMemberJoins', 'CrewMemberRoleChange'], after: ['FighterDestroyed', 'CrewMemberQuits'] },
    difficulty: 'simple',
    frequency: 'medium',
    isDeprecated: false,
    isRare: false
  },

  // ==========================================================================
  // WING & SOCIAL - Крылья и социальное
  // ==========================================================================

  WingInvite: {
    category: 'social',
    label: 'Приглашение в крыло',
    labelEn: 'Wing Invite',
    icon: '📨',
    description: 'Приглашение к крылу игрока',
    descriptionEn: 'Player invited to wing',
    fields: [
      { name: 'Name', type: 'string', description: 'Приглашающий', descriptionEn: 'Name', example: 'Cmdr John' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'WingInvite', Name: 'Cmdr John' },
    relationships: { before: [], after: ['WingJoin'] },
    difficulty: 'simple',
    frequency: 'rare',
    isRare: true,
  },

  // ==========================================================================
  // REPAIR - Ремонт
  // ==========================================================================

  RepairDrone: {
    category: 'ship',
    label: 'Ремонт дроном',
    labelEn: 'Repair Drone',
    icon: '🤖',
    description: 'Корабль был отремонтан дроном',
    descriptionEn: 'Ship repaired by repair drone',
    fields: [
      { name: 'HullRepaired', type: 'number', description: 'Корпус', descriptionEn: 'Hull repaired' },
      { name: 'CockpitRepaired', type: 'number', description: 'Кабина', descriptionEn: 'Cockpit repaired' },
      { name: 'CorrosionRepaired', type: 'number', description: 'Коррозия', descriptionEn: 'Corrosion repaired' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'RepairDrone', HullRepaired: 20, CockpitRepaired: 50, CorrosionRepaired: 10 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // ENGINEERING - Инженерия
  // ==========================================================================

  EngineerContribution: {
    category: 'engineering',
    label: 'Вклад инженеру',
    labelEn: 'Engineer Contribution',
    icon: '🔧',
    description: 'Предложение материалов инженеру для доступа',
    descriptionEn: 'Offering materials to engineer to gain access',
    fields: [
      { name: 'Engineer', type: 'string', description: 'Инженер', descriptionEn: 'Engineer', example: 'Elvira Martuuk', required: true },
      { name: 'EngineerID', type: 'number', description: 'ID инженера', descriptionEn: 'Engineer ID', example: 300160 },
      { name: 'Type', type: 'string', description: 'Тип вклада', descriptionEn: 'Contribution type', example: 'Commodity' },
      { name: 'Commodity', type: 'string', description: 'Ресурс', descriptionEn: 'Commodity', example: 'soontillrelics' },
      { name: 'Material', type: 'string', description: 'Материал', descriptionEn: 'Material' },
      { name: 'Faction', type: 'string', description: 'Фракция', descriptionEn: 'Faction' },
      { name: 'Quantity', type: 'number', description: 'Количество', descriptionEn: 'Quantity', example: 2 },
      { name: 'TotalQuantity', type: 'number', description: 'Всего', descriptionEn: 'Total quantity', example: 3 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'EngineerContribution', Engineer: 'Elvira Martuuk', EngineerID: 300160, Type: 'Commodity', Commodity: 'soontillrelics', Quantity: 2, TotalQuantity: 3 },
    relationships: { before: [], after: ['EngineerProgress'] },
    difficulty: 'simple',
    frequency: 'common',
  },

  EngineerLegacyConvert: {
    category: 'engineering',
    label: 'Конвертация старого модуля',
    labelEn: 'Engineer Legacy Convert',
    icon: '🔄',
    description: 'Конвертация модуля из старой системы',
    descriptionEn: 'Converting legacy module to new system',
    fields: [
      { name: 'Slot', type: 'string', description: 'Слот', descriptionEn: 'Slot', example: 'Slot03_Size3' },
      { name: 'Ship', type: 'string', description: 'Корабль', descriptionEn: 'Ship', example: 'cobramkiii' },
      { name: 'ShipID', type: 'number', description: 'ID корабля', descriptionEn: 'Ship ID', example: 1 },
      { name: 'StoredItem', type: 'string', description: 'Хранимый модуль', descriptionEn: 'Stored item' },
      { name: 'IsPreview', type: 'boolean', description: 'Предпросмотр', descriptionEn: 'Preview' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'EngineerLegacyConvert', Slot: 'Slot03_Size3', Ship: 'cobramkiii', ShipID: 1, StoredItem: 'int_hyperdrive_size3_class5', IsPreview: true },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
    isDeprecated: true,
  },

  // ==========================================================================
  // STATION SERVICES - Улучшенные товары и магазины
  // ==========================================================================

  MaterialTrader: {
    category: 'trade',
    label: 'Торговец материалами',
    labelEn: 'Material Trader',
    icon: '🔄',
    description: 'Обмен материалами с торговцем',
    descriptionEn: 'Material trade at trader',
    fields: [
      { name: 'MarketID', type: 'number', description: 'ID рынка', descriptionEn: 'Market ID', example: 1286764870 },
      { name: 'TraderType', type: 'string', description: 'Тип торговца', descriptionEn: 'Trader type', example: 'encoded' },
      { name: 'Paid', type: 'object', description: 'Отдано', descriptionEn: 'Paid', example: { Material: 'scandatabanks', Category: 'Encoded', Quantity: 6 } },
      { name: 'Received', type: 'object', description: 'Получено', descriptionEn: 'Received', example: { Material: 'encodedscandata', Category: 'Encoded', Quantity: 1 } },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'MaterialTrade', MarketID: 3221397760, TraderType: 'encoded' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // COMMUNITY GOALS - Общественные цели
  // ==========================================================================

  CommunityGoal: {
    category: 'other',
    label: 'Общественная цель',
    labelEn: 'Community Goal',
    icon: '🏆',
    description: 'Обновление статуса общественной цели',
    descriptionEn: 'Community goal status update',
    fields: [
      { name: 'CurrentGoals', type: 'array', description: 'Текущие цели', descriptionEn: 'Current goals' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CommunityGoal', CurrentGoals: [] },
    relationships: { before: [], after: [] },
    difficulty: 'complex',
    frequency: 'rare',
  },

  CommunityGoalJoin: {
    category: 'other',
    label: 'Вступление в цель',
    labelEn: 'Community Goal Join',
    icon: '🏆',
    description: 'Вступить в общественную цель',
    descriptionEn: 'Join community goal',
    fields: [
      { name: 'CGID', type: 'number', description: 'ID цели', descriptionEn: 'CG ID', example: 726 },
      { name: 'Name', type: 'string', description: 'Название', descriptionEn: 'Name', example: 'Alliance Research Initiative – Trade' },
      { name: 'System', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Kaushpoos' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CommunityGoalJoin', CGID: 726, Name: 'Alliance Research - Trade', System: 'Kaushpoos' },
    relationships: { before: [], after: ['CommunityGoalReward', 'CommunityGoalDiscard'] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CommunityGoalDiscard: {
    category: 'other',
    label: 'Выход из цели',
    labelEn: 'Community Goal Discard',
    icon: '🏆',
    description: 'Отказ от участия в цели',
    descriptionEn: 'Opting out of community goal',
    fields: [
      { name: 'CGID', type: 'number', description: 'ID цели', descriptionEn: 'CG ID', example: 726 },
      { name: 'Name', type: 'string', description: 'Название', descriptionEn: 'Name', example: 'Alliance Research Initiative – Trade' },
      { name: 'System', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Kaushpoos' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CommunityGoalDiscard', CGID: 726, Name: 'Alliance Research - Trade', System: 'Kaushpoos' },
    relationships: { before: ['CommunityGoalJoin'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  CommunityGoalReward: {
    category: 'other',
    label: 'Награда цели',
    labelEn: 'Community Goal Reward',
    icon: '🏆',
    description: 'Получена награда за общественную цель',
    descriptionEn: 'Reward received for community goal',
    fields: [
      { name: 'CGID', type: 'number', description: 'ID цели', descriptionEn: 'CG ID', example: 726 },
      { name: 'Name', type: 'string', description: 'Название', descriptionEn: 'Name', example: 'Alliance Research – Trade' },
      { name: 'System', type: 'string', description: 'Система', descriptionEn: 'System', example: 'Kaushpoos' },
      { name: 'Reward', type: 'number', description: 'Награда', descriptionEn: 'Reward', example: 200000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'CommunityGoalReward', CGID: 726, Name: 'Alliance Research – Trade', System: 'Kaushpoos', Reward: 200000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // REPAIR & MAINTENANCE - Ремонт и обслуживание
  // ==========================================================================

  Repair: {
    category: 'ship',
    label: 'Ремонт модуля',
    labelEn: 'Repair',
    icon: '🔧',
    description: 'Ремонт модуля или всего корабля',
    descriptionEn: 'Module or ship repair',
    fields: [
      { name: 'Item', type: 'string', description: 'Модуль или all', descriptionEn: 'Module or all', example: 'int_powerplant_size4_class2' },
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 1100 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'Repair', Item: 'int_powerplant_size4_class2', Cost: 1100 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  RepairAll: {
    category: 'ship',
    label: 'Полный ремонт',
    labelEn: 'Repair All',
    icon: '🏥',
    description: 'Полный ремонт всех модулей',
    descriptionEn: 'Full ship repair',
    fields: [
      { name: 'Cost', type: 'number', description: 'Цена', descriptionEn: 'Cost', example: 5000 },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'RepairAll', Cost: 5000 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'common',
  },

  // ==========================================================================
  // MISSIONS RARE - Редкие миссионные события
  // ==========================================================================

  MissionFailed: {
    category: 'mission',
    label: 'Миссия провалена',
    labelEn: 'Mission Failed',
    icon: '💔',
    description: 'Миссия закончена неудачей',
    descriptionEn: 'Mission failed',
    fields: [
      { name: 'Name', type: 'string', description: 'Миссия', descriptionEn: 'Mission', example: 'Mission_Name_01' },
      { name: 'MissionID', type: 'number', description: 'ID миссии', descriptionEn: 'Mission ID', example: 65394170 },
      { name: 'Fine', type: 'number', description: 'Штраф', descriptionEn: 'Fine' },
    ],
    example: { timestamp: '2024-05-20T16:00:00Z', event: 'MissionFailed', Name: 'Mission_Name_01', MissionID: 65394170 },
    relationships: { before: ['MissionAccepted'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // SQUADRON - Эскадроны
  // ==========================================================================

  squadron: {
    category: 'social',
    label: 'Эскадрон',
    labelEn: 'Squadron',
    icon: '🏰',
    description: 'События эскадрона',
    descriptionEn: 'Squadron event',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'SquadronCreated' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // ADDITIONAL FLEET CARRIER & DOCKING EVENTS
  // ==========================================================================

  ClearImpound: {
    category: 'shipyard',
    label: 'Освободить корабль',
    labelEn: 'Clear Impound',
    icon: '🔓',
    description: 'Убрать корабль из импаунда',
    descriptionEn: 'Clear impound off ship',
    fields: [
      { name: 'ShipType', type: 'string', description: 'Тип корабля', descriptionEn: 'Ship type' },
      { name: 'ShipID', type: 'number', description: 'ID корабля', descriptionEn: 'Ship ID' },
      { name: 'ShipMarketID', type: 'number', description: 'Рынок', descriptionEn: 'Ship market ID' },
      { name: 'MarketID', type: 'number', description: 'Ваш рынок', descriptionEn: 'Your market ID' },
    ],
    example: { timestamp: '2022-11-18T16:19:48Z', event: 'ClearImpound', ShipType: 'asp', ShipID: 10, ShipMarketID: 128833431, MarketID: 128833431 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  SellShipOnRebuy: {
    category: 'shipyard',
    label: 'Продажа на реба',
    labelEn: 'Sell Ship On Rebuy',
    icon: '💰',
    description: 'Продажа корабля через экран ребая',
    descriptionEn: 'Selling stored ship to raise rebuy funds',
    fields: [
      { name: 'ShipType', type: 'string', description: 'Тип корабля', descriptionEn: 'Ship type' },
      { name: 'System', type: 'string', description: 'Система', descriptionEn: 'System' },
      { name: 'SellShipId', type: 'number', description: 'Продаваемый ID', descriptionEn: 'Ship ID to sell' },
      { name: 'ShipPrice', type: 'number', description: 'Цена', descriptionEn: 'Ship price' },
    ],
    example: { timestamp: '2017-07-20T08:56:39Z', event: 'SellShipOnRebuy', ShipType: 'Dolphin', System: 'Shinrarta Dezhra', SellShipId: 4, ShipPrice: 4110183 },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // MATERIAL TRADING - Дополнительно
  // ==========================================================================

  BuyMicroResources: {
    category: 'odyssey',
    label: 'Покупка микроресурсов',
    labelEn: 'Buy Micro Resources',
    icon: '💰',
    description: 'Покупка микроресурсов',
    descriptionEn: 'Buying micro resources',
    fields: [],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'BuyMicroResources' },
    relationships: { before: [], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

  // ==========================================================================
  // MISSION COMPLETION RARE - Редкие события завершения
  // ==========================================================================

  MissionOnlineCompletion: {
    category: 'mission',
    label: 'Онлайн завершение',
    labelEn: 'Mission Online Completion',
    icon: '✅',
    description: 'Миссия выполнена онлайн',
    descriptionEn: 'Mission completed online',
    fields: [
      { name: 'MissionID', type: 'number', description: 'ID миссии', descriptionEn: 'Mission ID' },
      { name: 'Name', type: 'string', description: 'Миссия', descriptionEn: 'Mission name' },
    ],
    example: { timestamp: '2024-05-20T10:00:00Z', event: 'MissionOnlineCompletion', MissionID: 12345, Name: 'Mission_Name_01' },
    relationships: { before: ['MissionAccepted'], after: [] },
    difficulty: 'simple',
    frequency: 'rare',
  },

};

export default EVENTS_CATALOG;
