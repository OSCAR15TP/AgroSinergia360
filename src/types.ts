export type Page = 'dashboard' | 'coffee' | 'rice' | 'livestock' | 'myfarm' | 'assistant' | 'economics' | 'carbon' | 'settings';

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
  lastRotationDate: string;
  notes: string;
}

export type PlotStatus = 'produccion' | 'rotacion' | 'pastura' | 'preparacion';

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

export interface Cattle {
  id: string;
  tagNumber: string;
  breed: string;
  birthDate: string;
  weight: number;
  healthStatus: HealthStatus;
  reproductiveStatus: ReproductiveStatus;
  vaccinations: VaccinationEvent[];
  weightHistory: { date: string; weight: number }[];
  notes: string;
}

export type HealthStatus = 'sano' | 'en_tratamiento' | 'en_cuarentena' | 'en_observacion';
export type ReproductiveStatus = 'vacia' | 'prenada' | 'lactancia' | 'servida' | 'seca';

export interface VaccinationEvent {
  id: string;
  date: string;
  vaccine: string;
  nextDate: string;
}

export interface Paddock {
  id: string;
  name: string;
  area: number;
  grassHeight: number;
  cattleCount: number;
  restDays: number;
  status: 'en_uso' | 'en_descanso' | 'listo';
}

export interface FarmConfig {
  farmName: string;
  location: string;
  size: number;
  modules: { coffee: boolean; rice: boolean; livestock: boolean };
  lastBackup: string | null;
  groqApiKey?: string;
}

export interface AppData {
  farmConfig: FarmConfig;
  coffeeDiagnoses: CoffeeDiagnosis[];
  ricePlots: RicePlot[];
  cattle: Cattle[];
  paddocks: Paddock[];
  events: FarmEvent[];
  economicRecords: EconomicRecord[];
  carbonRecords: CarbonRecord[];
}

export interface FarmEvent {
  id: string;
  date: string;
  type: 'vacunacion' | 'pesaje' | 'parto' | 'servicio' | 'diagnostico' | 'rotacion' | 'riego' | 'cosecha';
  title: string;
  description: string;
  module: 'coffee' | 'rice' | 'livestock' | 'general';
  done: boolean;
}

export interface EconomicRecord {
  id: string;
  module: 'coffee' | 'rice' | 'livestock';
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
