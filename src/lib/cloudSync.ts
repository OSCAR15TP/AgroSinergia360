import { supabase } from '@/lib/supabaseClient';
import type { AppData, CoffeeDiagnosis, RicePlot, FarmEvent, FarmConfig, EconomicRecord, CarbonRecord } from '@/types';

export interface CloudData {
  farm_configs: any[];
  coffee_diagnoses: any[];
  rice_plots: any[];
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
      cacao: true,
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
    const [configs, coffee, rice, events, economic, carbon] = await Promise.all([
      supabase.from('farm_configs').select('*').maybeSingle(),
      supabase.from('coffee_diagnoses').select('*').order('created_at', { ascending: false }),
      supabase.from('rice_plots').select('*').order('created_at', { ascending: false }),
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
        modules: { coffee: true, rice: true, cacao: true },
        lastBackup: null,
      },
      coffeeDiagnoses: (coffee.data ?? []).map(mapCoffeeDiag),
      coffeeHarvests: [],
      ricePlots: (rice.data ?? []).map(mapRicePlot),
      riceHarvests: [],
      cacaoLots: [],
      cacaoHarvests: [],
      cacaoDiagnoses: [],
      cacaoManagement: [],
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
    syncEvents(data.events),
    syncEconomicRecords(data.economicRecords),
    syncCarbonRecords(data.carbonRecords),
  ]);
}

export async function deleteCloudRecord(table: string, id: string): Promise<void> {
  await supabase.from(table).delete().eq('id', id);
}
