import { useState } from 'react';
import type { AppData } from '@/types';
import {
  Recycle, Coffee, Wheat, Beef, Minus, Plus, Sprout, Coins, Hand,
  Thermometer, CalendarDays, ArrowDown, CheckCircle2, AlertTriangle, Bed,
} from 'lucide-react';

interface BiomassPageProps {
  data: AppData;
}

type Region = 'costa' | 'sierra' | 'selva';

const MANURE_KG_PER_COW_PER_MONTH = 300;
const COFFEE_PULP_KG_PER_HA = 2000;
const HUSK_KG_PER_RICE_SACK = 10;
const COMPOST_YIELD = 0.5;
const SACK_KG = 50;
const WHEELBARROW_KG = 60;
const COMPOST_PRICE_PER_SACK = 25;
const RATIO = { manure: 3, pulp: 2, husk: 1 };

const REGION_INFO: Record<Region, { label: string; days: string; turn: string; tip: string }> = {
  costa: {
    label: 'Costa',
    days: '60 a 75 días',
    turn: 'cada 7 días',
    tip: 'El sol seca rápido la pila. Tápala con hojas de plátano o costales y riega cuando la prueba del puño salga seca.',
  },
  sierra: {
    label: 'Sierra',
    days: '90 a 120 días',
    turn: 'cada 15 días',
    tip: 'El frío hace más lento el compost. Arma la pila más alta (1.2 m) y tápala con plástico negro en las noches.',
  },
  selva: {
    label: 'Selva',
    days: '45 a 60 días',
    turn: 'cada 5 a 7 días',
    tip: 'La lluvia puede empapar la pila. Ponle un techo sencillo y agrega más cascarilla si se pone muy mojada.',
  },
};

function calculate(cows: number, coffeeHa: number, riceSacks: number) {
  const manure = cows * MANURE_KG_PER_COW_PER_MONTH;
  const pulp = coffeeHa * COFFEE_PULP_KG_PER_HA;
  const husk = riceSacks * HUSK_KG_PER_RICE_SACK;

  const parts = Math.min(manure / RATIO.manure, pulp / RATIO.pulp, husk / RATIO.husk);
  const usedManure = parts * RATIO.manure;
  const usedPulp = parts * RATIO.pulp;
  const usedHusk = parts * RATIO.husk;
  const totalMix = usedManure + usedPulp + usedHusk;
  const compostKg = totalMix * COMPOST_YIELD;
  const compostSacks = Math.floor(compostKg / SACK_KG);

  const leftovers = [
    { name: 'estiércol', kg: manure - usedManure },
    { name: 'pulpa de café', kg: pulp - usedPulp },
    { name: 'cascarilla de arroz', kg: husk - usedHusk },
  ].filter(l => l.kg > 1);

  const limiting =
    parts === manure / RATIO.manure ? 'estiércol'
    : parts === pulp / RATIO.pulp ? 'pulpa de café'
    : 'cascarilla de arroz';

  return {
    manure, pulp, husk,
    usedManure, usedPulp, usedHusk,
    compostKg, compostSacks,
    savings: compostSacks * COMPOST_PRICE_PER_SACK,
    leftovers, limiting,
  };
}

const kgToSacks = (kg: number) => Math.round(kg / SACK_KG);
const kgToWheelbarrows = (kg: number) => Math.round(kg / WHEELBARROW_KG);

export function BiomassPage({ data }: BiomassPageProps) {
  const initialCows = data.cattle.length;
  const [cows, setCows] = useState(initialCows > 0 ? initialCows : 5);
  const [coffeeHa, setCoffeeHa] = useState(2);
  const [riceSacks, setRiceSacks] = useState(40);
  const [region, setRegion] = useState<Region>('sierra');

  const r = calculate(cows, coffeeHa, riceSacks);
  const info = REGION_INFO[region];
  const hasAll = cows > 0 && coffeeHa > 0 && riceSacks > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grove-600 text-white shadow-md">
          <Recycle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-earth-900">Centro de Biomasa</h1>
          <p className="text-sm text-earth-500">Convierte los residuos de tu finca en abono gratis</p>
        </div>
      </header>

      <CycleCard />

      <section className="card p-5" aria-labelledby="inputs-title">
        <h2 id="inputs-title" className="text-sm font-bold text-earth-800 mb-1">1. Cuéntanos de tu finca</h2>
        <p className="text-xs text-earth-500 mb-4">Usa los botones + y − . No necesitas internet.</p>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stepper icon={<Beef className="h-5 w-5" />} label="Vacas" hint="cabezas de ganado" value={cows} onChange={setCows} step={1} />
          <Stepper icon={<Coffee className="h-5 w-5" />} label="Café" hint="hectáreas" value={coffeeHa} onChange={setCoffeeHa} step={0.5} />
          <Stepper icon={<Wheat className="h-5 w-5" />} label="Arroz cosechado" hint="sacos de 50 kg" value={riceSacks} onChange={setRiceSacks} step={5} />
        </div>

        <fieldset className="mt-4">
          <legend className="text-xs font-semibold text-earth-700 mb-2">¿Dónde está tu finca?</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(REGION_INFO) as Region[]).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setRegion(key)}
                aria-pressed={region === key}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  region === key
                    ? 'border-grove-600 bg-grove-600 text-white'
                    : 'border-earth-200 bg-white text-earth-700 hover:bg-earth-50'
                }`}
              >
                {REGION_INFO[key].label}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card p-5" aria-labelledby="recipe-title">
        <h2 id="recipe-title" className="text-sm font-bold text-earth-800 mb-4">2. Tu receta de abono</h2>

        {!hasAll ? (
          <div className="rounded-xl bg-harvest-50 border border-harvest-200 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-harvest-600 flex-shrink-0" />
            <p className="text-sm text-earth-700">
              Para esta receta necesitas los tres ingredientes: estiércol, pulpa de café y cascarilla de arroz.
              Si te falta uno, puedes conseguirlo con un vecino y hacer el abono juntos.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-grove-600 p-5 text-white mb-4">
              <p className="text-sm opacity-90">Con lo que ya tienes en tu finca puedes hacer</p>
              <p className="text-4xl font-bold mt-1">{r.compostSacks} sacos</p>
              <p className="text-sm opacity-90">de abono orgánico (de 50 kg cada uno)</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2">
                <Coins className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">
                  Te ahorras aprox. <strong className="text-base">S/ {r.savings.toLocaleString('es-PE')}</strong> en abono comprado
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-earth-700 mb-2">Mezcla así (por cada 6 carretillas):</p>
            <ul className="space-y-2">
              <Ingredient icon={<Beef className="h-5 w-5" />} parts={3} name="Estiércol de vaca" role="Da el nitrógeno, la fuerza del abono" kg={r.usedManure} />
              <Ingredient icon={<Coffee className="h-5 w-5" />} parts={2} name="Pulpa de café" role="Da potasio y alimenta a los microbios" kg={r.usedPulp} />
              <Ingredient icon={<Wheat className="h-5 w-5" />} parts={1} name="Cascarilla de arroz" role="Deja pasar el aire y quita el exceso de agua" kg={r.usedHusk} />
            </ul>

            {r.leftovers.length > 0 && (
              <div className="mt-4 rounded-xl bg-earth-50 p-3 flex gap-3">
                <Bed className="h-5 w-5 text-earth-500 flex-shrink-0" />
                <div className="text-xs text-earth-600 leading-relaxed">
                  <p>
                    Lo que limita tu abono es la <strong>{r.limiting}</strong>. Te sobra:{' '}
                    {r.leftovers.map(l => `${kgToSacks(l.kg)} sacos de ${l.name}`).join(', ')}.
                  </p>
                  <p className="mt-1">
                    <strong>Idea:</strong> usa la cascarilla que sobre como cama seca en el corral. Absorbe el orín
                    del ganado y luego va directo a la próxima pila de abono.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="card p-5" aria-labelledby="steps-title">
        <h2 id="steps-title" className="text-sm font-bold text-earth-800 mb-4">3. Cómo prepararlo paso a paso</h2>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <QuickFact icon={<CalendarDays className="h-4 w-4" />} label="Listo en" value={info.days} />
          <QuickFact icon={<Recycle className="h-4 w-4" />} label="Voltear" value={info.turn} />
          <QuickFact icon={<Thermometer className="h-4 w-4" />} label="Calor ideal" value="50 a 65 °C" />
        </div>

        <ol className="space-y-3">
          <Step n={1} title="Escoge el lugar">Bajo sombra, en terreno un poco inclinado para que no se empoce el agua, y lejos de quebradas o pozos.</Step>
          <Step n={2} title="Arma la pila en capas">Pon primero una capa de cascarilla, luego estiércol y después pulpa. Repite hasta llegar a la altura de tu cintura (1 a 1.5 m).</Step>
          <Step n={3} title="Moja cada capa">Riega un poco cada capa mientras la armas. No debe chorrear agua.</Step>
          <Step n={4} title="Revisa el calor">Mete un palo o machete al centro por 5 minutos. Si sale caliente (no aguantas la mano), va bien.</Step>
          <Step n={5} title={`Voltea ${info.turn}`}>Pasa lo de afuera hacia adentro con la pala. Así entra aire y todo se descompone parejo.</Step>
          <Step n={6} title="¿Cuándo está listo?">Cuando ya no está caliente, es oscuro, se desmorona y huele a tierra de monte. Ya no reconoces la pulpa ni el estiércol.</Step>
        </ol>

        <div className="mt-4 rounded-xl border border-grove-200 bg-grove-50 p-4 flex gap-3">
          <Hand className="h-5 w-5 text-grove-700 flex-shrink-0" />
          <div className="text-sm text-earth-700">
            <p className="font-semibold text-grove-800">La prueba del puño</p>
            <p className="text-xs mt-1 leading-relaxed">
              Aprieta un puñado de la mezcla. Si caen gotas: está muy mojada, agrega cascarilla.
              Si se desarma al abrir la mano: está seca, riega. Si queda como bola y no gotea: está perfecta.
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-earth-500 leading-relaxed">
          <strong>Consejo para {info.label}:</strong> {info.tip}
        </p>
      </section>

      <section className="card p-5" aria-labelledby="use-title">
        <h2 id="use-title" className="text-sm font-bold text-earth-800 mb-3">4. Dónde usar tu abono</h2>
        <ul className="space-y-2 text-sm text-earth-700">
          <UseItem>Café: 2 a 3 kg por planta al inicio de lluvias, alrededor del tallo sin tocarlo.</UseItem>
          <UseItem>Arroz: 2 a 3 toneladas por hectárea antes de preparar el terreno.</UseItem>
          <UseItem>Pastos: esparce una capa delgada después de rotar al ganado.</UseItem>
        </ul>
        <p className="mt-4 text-[11px] text-earth-400 leading-relaxed">
          Los cálculos son aproximados: {MANURE_KG_PER_COW_PER_MONTH} kg de estiércol por vaca al mes,
          {' '}{COFFEE_PULP_KG_PER_HA.toLocaleString('es-PE')} kg de pulpa por hectárea de café en cosecha,
          {' '}{HUSK_KG_PER_RICE_SACK} kg de cascarilla por saco de arroz y S/ {COMPOST_PRICE_PER_SACK} por saco de abono comprado.
        </p>
      </section>
    </div>
  );
}

function CycleCard() {
  return (
    <section className="card p-5" aria-label="Cómo funciona el ciclo">
      <p className="text-sm text-earth-700 leading-relaxed mb-4">
        Lo que antes botabas o se pudría en un rincón, juntos se convierten en abono.
        El abono vuelve a tus plantas y pastos, y el ciclo empieza de nuevo.
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <CycleSource icon={<Coffee className="h-5 w-5" />} label="Pulpa de café" />
        <CycleSource icon={<Wheat className="h-5 w-5" />} label="Cascarilla de arroz" />
        <CycleSource icon={<Beef className="h-5 w-5" />} label="Estiércol" />
      </div>
      <div className="flex justify-center py-2 text-earth-400">
        <ArrowDown className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex items-center justify-center gap-2 rounded-xl bg-grove-600 py-3 text-white">
        <Sprout className="h-5 w-5" />
        <span className="text-sm font-bold">Abono gratis para tu finca</span>
      </div>
    </section>
  );
}

function CycleSource({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-earth-50 p-3">
      <span className="text-earth-600">{icon}</span>
      <span className="text-xs font-semibold text-earth-700 leading-tight">{label}</span>
    </div>
  );
}

interface StepperProps {
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}

function Stepper({ icon, label, hint, value, step, onChange }: StepperProps) {
  const change = (delta: number) => onChange(Math.max(0, Math.round((value + delta) * 10) / 10));
  return (
    <div className="rounded-xl border border-earth-200 p-3">
      <div className="flex items-center gap-2 text-earth-700">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={() => change(-step)} aria-label={`Restar ${label}`} className="flex h-10 w-10 items-center justify-center rounded-lg bg-earth-100 text-earth-700 hover:bg-earth-200">
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))}
          aria-label={`${label} (${hint})`}
          className="input-field h-10 flex-1 text-center text-lg font-bold"
        />
        <button type="button" onClick={() => change(step)} aria-label={`Sumar ${label}`} className="flex h-10 w-10 items-center justify-center rounded-lg bg-earth-100 text-earth-700 hover:bg-earth-200">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-xs text-earth-500 text-center">{hint}</p>
    </div>
  );
}

function Ingredient({ icon, parts, name, role, kg }: { icon: React.ReactNode; parts: number; name: string; role: string; kg: number }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-earth-200 p-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-earth-100 text-earth-700">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-earth-800">{parts} carretilla{parts > 1 ? 's' : ''} de {name.toLowerCase()}</p>
        <p className="text-xs text-earth-500">{role}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-earth-800">{kgToSacks(kg)} sacos</p>
        <p className="text-[11px] text-earth-500">~{kgToWheelbarrows(kg)} carretillas</p>
      </div>
    </li>
  );
}

function QuickFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-earth-50 p-3 text-center">
      <div className="flex justify-center text-grove-600 mb-1">{icon}</div>
      <p className="text-[11px] text-earth-500">{label}</p>
      <p className="text-xs font-bold text-earth-800 leading-tight">{value}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-grove-600 text-xs font-bold text-white">{n}</span>
      <div>
        <p className="text-sm font-semibold text-earth-800">{title}</p>
        <p className="text-xs text-earth-600 leading-relaxed mt-0.5">{children}</p>
      </div>
    </li>
  );
}

function UseItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <CheckCircle2 className="h-4 w-4 text-grove-600 flex-shrink-0 mt-0.5" />
      <span className="text-sm">{children}</span>
    </li>
  );
}
