/**
 * Elite Dangerous Events Registry
 * Complete mapping of all Journal Events to human-readable labels with icons and categories
 * Plus game constants for statistics and rich display
 */

export const EVENT_DEFINITIONS: Record<string, { category: string; label: string; icon: string }> = {
  // Navigation & Travel
  FSDJump: { category: 'navigation', label: 'Прыжок в систему', icon: '🌌' },
  FSDCharge: { category: 'navigation', label: 'Зарядка FSD', icon: '⚡' },
  SupercruiseEntry: { category: 'navigation', label: 'Вход в суперкруиз', icon: '🚀' },
  SupercruiseExit: { category: 'navigation', label: 'Выход из суперкруиза', icon: '🛑' },
  ApproachBody: { category: 'navigation', label: 'Приближение к телу', icon: '🛸' },
  LeaveBody: { category: 'navigation', label: 'Уход от тела', icon: '👋' },
  Liftoff: { category: 'navigation', label: 'Взлёт', icon: '🛫' },
  Touchdown: { category: 'navigation', label: 'Посадка', icon: '🦶' },

  // Station & Docking
  DockingRequested: { category: 'station', label: 'Запрос стыковки', icon: '📡' },
  DockingGranted: { category: 'station', label: 'Стыковка разрешена', icon: '✅' },
  DockingDenied: { category: 'station', label: 'Стыковка отклонена', icon: '❌' },
  Docked: { category: 'station', label: 'Пристыкован', icon: '🏠' },
  Undocked: { category: 'station', label: 'Отстыковка', icon: '🚪' },

  // Exploration & Scanning
  Scan: { category: 'exploration', label: 'Сканирование', icon: '🔭' },
  DetailedScan: { category: 'exploration', label: 'Детальное сканирование', icon: '🔍' },
  SellExplorationData: { category: 'exploration', label: 'Продажа данных', icon: '💰' },
  Screenshot: { category: 'exploration', label: 'Скриншот', icon: '📸' },
  DiscoveryScan: { category: 'exploration', label: 'Discovery Scan', icon: '📡' },
  FSSDiscoveryScan: { category: 'exploration', label: 'FSS Scan', icon: '📶' },
  FSSSignalDiscovered: { category: 'exploration', label: 'Сигнал обнаружен', icon: '📳' },
  SAAScanComplete: { category: 'exploration', label: 'DSS Scan завершён', icon: '🎯' },
  SAASignalsFound: { category: 'exploration', label: 'Сигналы найдены', icon: '📊' },

  // Combat
  Bounty: { category: 'combat', label: 'Награда', icon: '💵' },
  CapShipBond: { category: 'combat', label: 'Капитальная награда', icon: '🏆' },
  Interdiction: { category: 'combat', label: 'Перехват', icon: '⚔️' },
  Interdicted: { category: 'combat', label: 'Перехвачен', icon: '🚨' },
  EscapeInterdiction: { category: 'combat', label: 'Уход от перехвата', icon: '🏃' },
  FactionKillBond: { category: 'combat', label: 'Уничтожение фракции', icon: '☠️' },
  CommitCrime: { category: 'combat', label: 'Преступление', icon: '🚔' },
  Died: { category: 'combat', label: 'Смерть', icon: '💀' },
  Resurrect: { category: 'combat', label: 'Воскрешение', icon: '✨' },
  ShieldState: { category: 'combat', label: 'Щиты', icon: '🛡️' },
  HullDamage: { category: 'combat', label: 'Повреждение корпуса', icon: '🔧' },
  ShipTargeted: { category: 'combat', label: 'Цель захвачена', icon: '🎯' },
  UnderAttack: { category: 'combat', label: 'Под атакой', icon: '🔥' },
  PVPKill: { category: 'combat', label: 'PVP Убийство', icon: '⚔️' },
  Promotion: { category: 'combat', label: 'Повышение', icon: '🎖️' },

  // Trading & Economy
  MarketBuy: { category: 'trade', label: 'Покупка', icon: '🛒' },
  MarketSell: { category: 'trade', label: 'Продажа', icon: '💰' },
  BuyTradeData: { category: 'trade', label: 'Данные торговли', icon: '📈' },
  CollectCargo: { category: 'trade', label: 'Сбор груза', icon: '📦' },
  EjectCargo: { category: 'trade', label: 'Выброс груза', icon: '🗑️' },

  // Mining
  MiningRefined: { category: 'mining', label: 'Переработка', icon: '⚙️' },
  ProspectedAsteroid: { category: 'mining', label: 'Астероид исследован', icon: '🌑' },
  AsteroidCracked: { category: 'mining', label: 'Астероид взорван', icon: '💥' },
  LaunchDrone: { category: 'mining', label: 'Дрон запущен', icon: '🚁' },

  // Missions
  MissionAccepted: { category: 'mission', label: 'Миссия принята', icon: '📋' },
  MissionCompleted: { category: 'mission', label: 'Миссия выполнена', icon: '✅' },
  MissionAbandoned: { category: 'mission', label: 'Миссия отменена', icon: '❌' },
  MissionFailed: { category: 'mission', label: 'Миссия провалена', icon: '💔' },

  // Engineering
  EngineerApply: { category: 'engineering', label: 'Модуль улучшен', icon: '🔧' },
  EngineerCraft: { category: 'engineering', label: 'Создание', icon: '⚒️' },

  // Outfitting
  ModuleBuy: { category: 'outfitting', label: 'Покупка модуля', icon: '🔩' },
  ModuleSell: { category: 'outfitting', label: 'Продажа модуля', icon: '💵' },
  ModuleSwap: { category: 'outfitting', label: 'Замена модуля', icon: '🔄' },
  ModuleStore: { category: 'outfitting', label: 'Модуль в хранилище', icon: '📦' },
  ModuleRetrieve: { category: 'outfitting', label: 'Модуль из хранилища', icon: '📤' },

  // Shipyard
  ShipyardBuy: { category: 'shipyard', label: 'Покупка корабля', icon: '🚀' },
  ShipyardSell: { category: 'shipyard', label: 'Продажа корабля', icon: '💸' },
  ShipyardSwap: { category: 'shipyard', label: 'Смена корабля', icon: '🔁' },

  // Crew & Social
  CrewMemberJoins: { category: 'social', label: 'Член экипажа присоединился', icon: '👤' },
  CrewMemberQuits: { category: 'social', label: 'Член экипажа вышел', icon: '👋' },
  JoinACrew: { category: 'social', label: 'Присоединился к экипажу', icon: '👥' },
  QuitACrew: { category: 'social', label: 'Покинул экипаж', icon: '🚪' },
  Friends: { category: 'social', label: 'Друг', icon: '👫' },
  WingAdd: { category: 'social', label: 'В крыло добавлен', icon: '🦅' },
  WingJoin: { category: 'social', label: 'Присоединился к крылу', icon: '🤝' },
  WingLeave: { category: 'social', label: 'Покинул крыло', icon: '👋' },

  // Materials
  MaterialCollected: { category: 'materials', label: 'Материал собран', icon: '🔬' },
  MaterialDiscarded: { category: 'materials', label: 'Материал выброшен', icon: '🗑️' },
  MaterialTrade: { category: 'materials', label: 'Обмен материалов', icon: '🔄' },
  Synthesis: { category: 'materials', label: 'Синтез', icon: '⚗️' },
  TechnologyBroker: { category: 'materials', label: 'Техноброкер', icon: '🤖' },

  // Fleet Carriers
  CarrierJump: { category: 'carrier', label: 'Прыжок носителя', icon: '🚀' },
  CarrierJumpRequest: { category: 'carrier', label: 'Запрос прыжка', icon: '⏳' },

  // Odyssey
  BookDropship: { category: 'odyssey', label: 'Десантный корабль', icon: '🚁' },
  BookTaxi: { category: 'odyssey', label: 'Такси', icon: '🚕' },
  Disembark: { category: 'odyssey', label: 'Высадка', icon: '🦶' },
  Embark: { category: 'odyssey', label: 'Посадка', icon: '🚀' },
  SuitLoadout: { category: 'odyssey', label: 'Снаряжение', icon: '👕' },
  BuySuit: { category: 'odyssey', label: 'Куплен костюм', icon: '🛍️' },
  BuyWeapon: { category: 'odyssey', label: 'Куплено оружие', icon: '🔫' },

  // Game
  LoadGame: { category: 'game', label: 'Игра загружена', icon: '🎮' },
  Shutdown: { category: 'game', label: 'Выход из игры', icon: '🛑' },
  NewCommander: { category: 'game', label: 'Новый командир', icon: '✨' },
  Reputation: { category: 'game', label: 'Репутация', icon: '💎' },

  // Ship Systems
  FuelScoop: { category: 'ship', label: 'Дозаправка', icon: '⛽' },
  RefuelAll: { category: 'ship', label: 'Полная дозаправка', icon: '🛢️' },
  Repair: { category: 'ship', label: 'Ремонт', icon: '🔨' },
  RepairAll: { category: 'ship', label: 'Полный ремонт', icon: '🏥' },
  CockpitBreached: { category: 'ship', label: 'Кабина повреждена', icon: '💨' },
  AFMURepairs: { category: 'ship', label: 'AFMU ремонт', icon: '🔧' },
  RebootRepair: { category: 'ship', label: 'Перезагрузка', icon: '🔄' },
  SelfDestruct: { category: 'ship', label: 'Самоуничтожение', icon: '💣' },
  ShipPowerDown: { category: 'ship', label: 'Корабль выключен', icon: '🔴' },
  ShipPowerUp: { category: 'ship', label: 'Корабль включен', icon: '🟢' },

  // Scanning & Data
  DataScanned: { category: 'scanning', label: 'Данные взломаны', icon: '💻' },
  USSDrop: { category: 'scanning', label: 'USS', icon: '📡' },

  // Comms
  ReceiveText: { category: 'comms', label: 'Сообщение', icon: '💬' },
  SendText: { category: 'comms', label: 'Отправлено сообщение', icon: '📤' },

  // Legal
  PayFines: { category: 'legal', label: 'Штрафы оплачены', icon: '💸' },
  PayBounties: { category: 'legal', label: 'Награды оплачены', icon: '💀' },

  // Powerplay
  PowerplayCollect: { category: 'powerplay', label: 'Powerplay сбор', icon: '⭐' },
  PowerplayDefect: { category: 'powerplay', label: 'Powerplay переход', icon: '🔄' },
  PowerplayJoin: { category: 'powerplay', label: 'Powerplay присоединение', icon: '✅' },
};

export const CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  navigation: { label: 'Навигация', icon: '🧭', color: '#4fc3f7' },
  station: { label: 'Станция', icon: '🏠', color: '#81c784' },
  exploration: { label: 'Исследование', icon: '🔭', color: '#ba68c8' },
  combat: { label: 'Бой', icon: '⚔️', color: '#ef5350' },
  trade: { label: 'Торговля', icon: '💰', color: '#ffd54f' },
  mining: { label: 'Добыча', icon: '⛏️', color: '#90a4ae' },
  mission: { label: 'Миссии', icon: '📋', color: '#4db6ac' },
  engineering: { label: 'Инженерия', icon: '🔧', color: '#ff8a65' },
  outfitting: { label: 'Модули', icon: '🔩', color: '#7986cb' },
  shipyard: { label: 'Верфь', icon: '⚓', color: '#a1887f' },
  social: { label: 'Сообщество', icon: '👥', color: '#f06292' },
  materials: { label: 'Материалы', icon: '🔬', color: '#4dd0e1' },
  carrier: { label: 'Носитель', icon: '🚀', color: '#aed581' },
  odyssey: { label: 'Odyssey', icon: '🚶', color: '#9575cd' },
  game: { label: 'Игра', icon: '🎮', color: '#e0e0e0' },
  powerplay: { label: 'Powerplay', icon: '⭐', color: '#ffb74d' },
  ship: { label: 'Корабль', icon: '🛸', color: '#90caf9' },
  scanning: { label: 'Сканирование', icon: '📡', color: '#b39ddb' },
  comms: { label: 'Связь', icon: '💬', color: '#80deea' },
  legal: { label: 'Право', icon: '⚖️', color: '#ffcc80' },
  unknown: { label: 'Неизвестно', icon: '❓', color: '#9e9e9e' },
};

export function getEventLabel(eventType: string): string {
  return EVENT_DEFINITIONS[eventType]?.label || eventType;
}

export function getEventIcon(eventType: string): string {
  return EVENT_DEFINITIONS[eventType]?.icon || '❓';
}

export function getEventCategory(eventType: string): string {
  return EVENT_DEFINITIONS[eventType]?.category || 'unknown';
}

export function getCategoryInfo(category: string): { label: string; icon: string; color: string } | null {
  return CATEGORIES[category] || null;
}

export const GAME_CONSTANTS = {
  COMBAT_RANKS: ['Harmless', 'Mostly Harmless', 'Novice', 'Competent', 'Expert', 'Master', 'Dangerous', 'Deadly', 'Elite', 'Elite I', 'Elite II', 'Elite III', 'Elite IV', 'Elite V'],
  TRADE_RANKS: ['Penniless', 'Mostly Penniless', 'Peddler', 'Dealer', 'Merchant', 'Broker', 'Entrepreneur', 'Tycoon', 'Elite', 'Elite I', 'Elite II', 'Elite III', 'Elite IV', 'Elite V'],
  EXPLORATION_RANKS: ['Aimless', 'Mostly Aimless', 'Scout', 'Surveyor', 'Trailblazer', 'Pathfinder', 'Ranger', 'Pioneer', 'Elite', 'Elite I', 'Elite II', 'Elite III', 'Elite IV', 'Elite V'],
  FEDERATION_RANKS: ['None', 'Recruit', 'Cadet', 'Midshipman', 'Petty Officer', 'Chief Petty Officer', 'Warrant Officer', 'Ensign', 'Lieutenant', 'Lieutenant Commander', 'Post Commander', 'Post Captain', 'Rear Admiral', 'Vice Admiral', 'Admiral'],
  EMPIRE_RANKS: ['None', 'Outsider', 'Serf', 'Master', 'Squire', 'Knight', 'Lord', 'Baron', 'Viscount', 'Count', 'Earl', 'Marquis', 'Duke', 'Prince', 'King'],
  STAR_TYPES: ['O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y', 'W', 'D', 'N', 'H', 'X', 'SupermassiveBlackHole'],
};

export default EVENT_DEFINITIONS;
