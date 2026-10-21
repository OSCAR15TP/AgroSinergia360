import { supabase } from '@/lib/supabaseClient';
import type { AppData, CoffeeDiagnosis, RicePlot, Cattle, Paddock, FarmEvent, FarmConfig, EconomicRecord, CarbonRecord } from '@/types';

export interface CloudData {
  farm_configs: any[];
  coffee_diagnoses: any[];
  rice_plots: any[];
  cattle: any[];
  paddocks: any[];
  farm_events: any[];
  economic_records: any[];
  carbon_records: any[];
}

function mapFarmConfig(row: any): FarmConfig {
  return {
    farmName: row.farm_name ?? 'Mi Finca',
    location: row.location ?? '',
    size: Number(row.size) ?? 0,
    modules: {
      coffee: row.modules_coffee ?? true,
      rice: row.modules_rice ?? true,
      livestock: row.modules_livestock ?? true,
    },
    lastBackup: row.last_backup ? new Date(row.last_backup).toISOString() : null,
  };
}

function mapCoffeeDiag(row: any): CoffeeDiagnosis {
  return {
    id: row.id,
    date: row.date,
    result: row.result,
    confidence: Number(row.confidence),
    photoDataUrl: row.photo_data_url ?? undefined,
    soilParams: {
      ph: Number(row.soil_ph),
      phosphorus: Number(row.soil_phosphorus),
      potassium: Number(row.soil_potassium),
      organicMatter: Number(row.soil_organic_matter),
    },
    recommendation: row.recommendation,
    recommendationType: row.recommendation_type,
    notes: row.notes ?? '',
  };
}

function mapRicePlot(row: any): RicePlot {
  return {
    id: row.id,
    name: row.name,
    area: Number(row.area),
    status: row.status,
    rotationPhase: row.rotation_phase,
    soilMoisture: Number(row.soil_moisture),
    lastRotationDate: row.last_rotation_date ?? todayISO(),
    notes: row.notes ?? '',
  };
}

function mapCattle(row: any): Cattle {
  return {
    id: row.id,
    tagNumber: row.tag_number,
    breed: row.breed ?? '',
    birthDate: row.birth_date ?? todayISO(),
    weight: Number(row.weight),
    healthStatus: row.health_status,
    reproductiveStatus: row.reproductive_status,
    vaccinations: row.vaccinations ?? [],
    weightHistory: row.weight_history ?? [],
    notes: row.notes ?? '',
  };
}

function mapPaddock(row: any): Paddock {
  return {
    id: row.id,
    name: row.name,
    area: Number(row.area),
    grassHeight: Number(row.grass_height),
    cattleCount: row.cattle_count,
    restDays: row.rest_days,
    status: row.status,
  };
}

function mapEvent(row: any): FarmEvent {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    title: row.title,
    description: row.description ?? '',
    module: row.module,
    done: row.done,
  };
}

function mapEconomic(row: any): EconomicRecord {
  return {
    id: row.id,
    module: row.module,
    date: row.date,
    area: Number(row.area),
    productionKg: Number(row.production_kg),
    pricePerKg: Number(row.price_per_kg),
    costs: {
      seeds: Number(row.cost_seeds),
      fertilizer: Number(row.cost_fertilizer),
      labor: Number(row.cost_labor),
      transport: Number(row.cost_transport),
      other: Number(row.cost_other),
    },
    mermaPct: Number(row.merma_pct),
    notes: row.notes ?? '',
  };
}

function mapCarbon(row: any): CarbonRecord {
  return {
    id: row.id,
    date: row.date,
    area: Number(row.area),
    fertilizerKg: Number(row.fertilizer_kg),
    fuelLiters: Number(row.fuel_liters),
    fuelType: row.fuel_type ?? 'diesel',
    electricityKwh: Number(row.electricity_kwh),
    shadeTrees: row.shade_trees ?? 0,
    notes: row.notes ?? '',
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function loadCloudData(): Promise<AppData | null> {
  try {
    const [configs, coffee, rice, cattle, paddocks, events, economic, carbon] = await Promise.all([
      supabase.from('farm_configs').select('*').maybeSingle(),
      supabase.from('coffee_diagnoses').select('*').order('created_at', { ascending: false }),
      supabase.from('rice_plots').select('*').order('created_at', { ascending: false }),
      supabase.from('cattle').select('*').order('created_at', { ascending: false }),
      supabase.from('paddocks').select('*').order('created_at', { ascending: false }),
      supabase.from('farm_events').select('*').order('date', { ascending: false }),
      supabase.from('economic_records').select('*').order('date', { ascending: false }),
      supabase.from('carbon_records').select('*').order('date', { ascending: false }),
    ]);

    if (configs.error) {
      console.error('Cloud load error (farm_configs):', configs.error);
      return null;
    }

    return {
      farmConfig: configs.data ? mapFarmConfig(configs.data) : {
        farmName: 'Mi Finca', location: '', size: 0,
        modules: { coffee: true, rice: true, livestock: true },
        lastBackup: null,
      },
      coffeeDiagnoses: (coffee.data ?? []).map(mapCoffeeDiag),
      ricePlots: (rice.data ?? []).map(mapRicePlot),
      cattle: (cattle.data ?? []).map(mapCattle),
      paddocks: (paddocks.data ?? []).map(mapPaddock),
      events: (events.data ?? []).map(mapEvent),
      economicRecords: (economic.data ?? []).map(mapEconomic),
      carbonRecords: (carbon.data ?? []).map(mapCarbon),
    };
  } catch (err) {
    console.error('Cloud load exception:', err);
    return null;
  }
}

export async function syncConfig(config: FarmConfig): Promise<void> {
  const { data: existing } = await supabase.from('farm_configs').select('id').maybeSingle();

  const payload = {
    farm_name: config.farmName,
    location: config.location,
    size: config.size,
    modules_coffee: config.modules.coffee,
    modules_rice: config.modules.rice,
    modules_livestock: config.modules.livestock,
    last_backup: config.lastBackup,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from('farm_configs').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('farm_configs').insert(payload);
  }
}

export async function syncCoffeeDiagnoses(items: CoffeeDiagnosis[]): Promise<void> {
  const { data: existing } = await supabase.from('coffee_diagnoses').select('id');
  const existingIds = new Set((existing ?? []).map(r => r.id));
  const newItems = items.filter(i => !existingIds.has(i.id));

  if (newItems.length === 0) return;

  await supabase.from('coffee_diagnoses').insert(
    newItems.map(i => ({
      id: i.id,
      date: i.date,
      result: i.result,
      confidence: i.confidence,
      photo_data_url: i.photoDataUrl ?? null,
      soil_ph: i.soilParams.ph,
      soil_phosphorus: i.soilParams.phosphorus,
      soil_potassium: i.soilParams.potassium,
      soil_organic_matter: i.soilParams.organicMatter,
      recommendation: i.recommendation,
      recommendation_type: i.recommendationType,
      notes: i.notes,
    }))
  );
}

export async function syncRicePlots(items: RicePlot[]): Promise<void> {
  for (const plot of items) {
    const { data: existing } = await supabase.from('rice_plots').select('id').eq('id', plot.id).maybeSingle();
    const payload = {
      id: plot.id,
      name: plot.name,
      area: plot.area,
      status: plot.status,
      rotation_phase: plot.rotationPhase,
      soil_moisture: plot.soilMoisture,
      last_rotation_date: plot.lastRotationDate,
      notes: plot.notes,
    };
    if (existing) {
      await supabase.from('rice_plots').update(payload).eq('id', plot.id);
    } else {
      await supabase.from('rice_plots').insert(payload);
    }
  }
}

export async function syncCattle(items: Cattle[]): Promise<void> {
  for (const c of items) {
    const { data: existing } = await supabase.from('cattle').select('id').eq('id', c.id).maybeSingle();
    const payload = {
      id: c.id,
      tag_number: c.tagNumber,
      breed: c.breed,
      birth_date: c.birthDate,
      weight: c.weight,
      health_status: c.healthStatus,
      reproductive_status: c.reproductiveStatus,
      vaccinations: JSON.stringify(c.vaccinations),
      weight_history: JSON.stringify(c.weightHistory),
      notes: c.notes,
    };
    if (existing) {
      await supabase.from('cattle').update(payload).eq('id', c.id);
    } else {
      await supabase.from('cattle').insert(payload);
    }
  }
}

export async function syncPaddocks(items: Paddock[]): Promise<void> {
  for (const p of items) {
    const { data: existing } = await supabase.from('paddocks').select('id').eq('id', p.id).maybeSingle();
    const payload = {
      id: p.id,
      name: p.name,
      area: p.area,
      grass_height: p.grassHeight,
      cattle_count: p.cattleCount,
      rest_days: p.restDays,
      status: p.status,
    };
    if (existing) {
      await supabase.from('paddocks').update(payload).eq('id', p.id);
    } else {
      await supabase.from('paddocks').insert(payload);
    }
  }
}

export async function syncEvents(items: FarmEvent[]): Promise<void> {
  const { data: existing } = await supabase.from('farm_events').select('id');
  const existingIds = new Set((existing ?? []).map(r => r.id));
  const newItems = items.filter(i => !existingIds.has(i.id));

  if (newItems.length === 0) return;

  await supabase.from('farm_events').insert(
    newItems.map(e => ({
      id: e.id,
      date: e.date,
      type: e.type,
      title: e.title,
      description: e.description,
      module: e.module,
      done: e.done,
    }))
  );
}

export async function syncEconomicRecords(items: EconomicRecord[]): Promise<void> {
  for (const r of items) {
    const { data: existing } = await supabase.from('economic_records').select('id').eq('id', r.id).maybeSingle();
    const payload = {
      id: r.id,
      module: r.module,
      date: r.date,
      area: r.area,
      production_kg: r.productionKg,
      price_per_kg: r.pricePerKg,
      cost_seeds: r.costs.seeds,
      cost_fertilizer: r.costs.fertilizer,
      cost_labor: r.costs.labor,
      cost_transport: r.costs.transport,
      cost_other: r.costs.other,
      merma_pct: r.mermaPct,
      notes: r.notes,
    };
    if (existing) {
      await supabase.from('economic_records').update(payload).eq('id', r.id);
    } else {
      await supabase.from('economic_records').insert(payload);
    }
  }
}

export async function syncCarbonRecords(items: CarbonRecord[]): Promise<void> {
  for (const r of items) {
    const { data: existing } = await supabase.from('carbon_records').select('id').eq('id', r.id).maybeSingle();
    const payload = {
      id: r.id,
      date: r.date,
      area: r.area,
      fertilizer_kg: r.fertilizerKg,
      fuel_liters: r.fuelLiters,
      fuel_type: r.fuelType,
      electricity_kwh: r.electricityKwh,
      shade_trees: r.shadeTrees,
      notes: r.notes,
    };
    if (existing) {
      await supabase.from('carbon_records').update(payload).eq('id', r.id);
    } else {
      await supabase.from('carbon_records').insert(payload);
    }
  }
}

export async function syncAllData(data: AppData): Promise<void> {
  await Promise.all([
    syncConfig(data.farmConfig),
    syncCoffeeDiagnoses(data.coffeeDiagnoses),
    syncRicePlots(data.ricePlots),
    syncCattle(data.cattle),
    syncPaddocks(data.paddocks),
    syncEvents(data.events),
    syncEconomicRecords(data.economicRecords),
    syncCarbonRecords(data.carbonRecords),
  ]);
}

export async function deleteCloudRecord(table: string, id: string): Promise<void> {
  await supabase.from(table).delete().eq('id', id);
}
