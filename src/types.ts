export type Page = 'dashboard' | 'coffee' | 'rice' | 'cacao' | 'myfarm' | 'assistant' | 'docs' | 'economics' | 'carbon' | 'biomass' | 'store' | 'mystore' | 'settings';

export interface CoffeeDiagnosis {
  id: string;
  date: string;
  result: DiagnosisResult;
  confidence: number;
  photoDataUrl?: string;
  soilParams: SoilParams;
  recommendation: string;
  recommendationType: RecommendationType;
  notes: string;
}

export type DiagnosisResult = 'sana' | 'roya' | 'minador' | 'antracnosis' | 'ojo_de_gallo';
export type RecommendationType = 'none' | 'podar' | 'fertilizar' | 'mipe' | 'monitorear';

export interface SoilParams {
  ph: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
}

export interface RicePlot {
  id: string;
  name: string;
  area: number;
  status: PlotStatus;
  rotationPhase: number;
  soilMoisture: number;
  moistureZones?: { name: string; value: number }[];
  lastRotationDate: string;
  notes: string;
}

export type PlotStatus = 'produccion' | 'rotacion' | 'pastura' | 'preparacion';

export interface CacaoLot {
  id: string;
  name: string;
  area: number;
  trees: number;
  variety: string;
  plantingYear: number | null;
  notes: string;
}

export interface CacaoHarvest {
  id: string;
  lotId: string;
  date: string;
  pods: number;
  wetKg: number;
  dryKg: number;
  notes: string;
}

export interface ClimateData {
  temperature: number;
  humidity: number;
  soilMoistureShallow: number;
  soilMoistureDeep: number;
  evapotranspiration: number;
  rainfall: number;
  windSpeed: number;
  updatedAt: string;
}

export interface FarmConfig {
  farmName: string;
  location: string;
  size: number;
  modules: { coffee: boolean; rice: boolean; cacao: boolean };
  lastBackup: string | null;
}

export interface AppData {
  farmConfig: FarmConfig;
  coffeeDiagnoses: CoffeeDiagnosis[];
  ricePlots: RicePlot[];
  cacaoLots: CacaoLot[];
  cacaoHarvests: CacaoHarvest[];
  events: FarmEvent[];
  economicRecords: EconomicRecord[];
  carbonRecords: CarbonRecord[];
}

export interface FarmEvent {
  id: string;
  date: string;
  type: 'diagnostico' | 'rotacion' | 'riego' | 'cosecha' | 'poda' | 'fertilizacion' | 'sanidad' | 'monitoreo';
  title: string;
  description: string;
  module: 'coffee' | 'rice' | 'cacao' | 'general';
  done: boolean;
}

export interface EconomicRecord {
  id: string;
  module: 'coffee' | 'rice';
  date: string;
  area: number;
  productionKg: number;
  pricePerKg: number;
  costs: {
    seeds: number;
    fertilizer: number;
    labor: number;
    transport: number;
    other: number;
  };
  mermaPct: number;
  notes: string;
}

export interface CarbonRecord {
  id: string;
  date: string;
  area: number;
  fertilizerKg: number;
  fuelLiters: number;
  fuelType: 'diesel' | 'gasolina' | 'electrico';
  electricityKwh: number;
  shadeTrees: number;
  notes: string;
}

export interface LocalGuideMeta {
  id: string;
  module: 'cafe' | 'arroz' | 'circular';
  title: string;
  description: string;
  path: string;
  type: 'json';
}

export interface LocalGuideContext {
  title: string;
  module: string;
  content: string;
}
