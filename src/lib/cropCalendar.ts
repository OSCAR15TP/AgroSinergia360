import type { LocalGuide, GuideSection } from '@/lib/localGuides';

export type CropKey = 'cafe' | 'arroz' | 'cacao';

export interface PhenologyStage {
  id: string;
  name: string;
  durationDays: [number, number];
  description: string;
  icon: string;
}

export interface CalendarActivity {
  id: string;
  stageId: string;
  title: string;
  description: string;
  guideKeywords: string[];
  timing: string;
  category: 'poda' | 'fertilizacion' | 'riego' | 'sanidad' | 'cosecha' | 'monitoreo';
}

interface CropCalendar {
  crop: CropKey;
  cropName: string;
  cycleDays: [number, number];
  stages: PhenologyStage[];
  activities: CalendarActivity[];
}

const COFFEE_CALENDAR: CropCalendar = {
  crop: 'cafe',
  cropName: 'Café',
  cycleDays: [270, 360],
  stages: [
    { id: 'floracion', name: 'Floración', durationDays: [30, 45], description: 'Apertura de flores tras las primeras lluvias. Etapa crítica para el cuajado del fruto.', icon: 'flower' },
    { id: 'fructificacion', name: 'Fructificación', durationDays: [120, 180], description: 'Desarrollo del fruto desde cuaje hasta cambio de color. Requiere buena nutrición.', icon: 'cherry' },
    { id: 'maduracion', name: 'Maduración', durationDays: [60, 90], description: 'Cambio de color y acumulación de azúcares. Inicio de cosecha selectiva.', icon: 'circle' },
    { id: 'cosecha', name: 'Cosecha', durationDays: [60, 120], description: 'Recolección escalonada de frutos maduros. Punto crítico para la calidad.', icon: 'shopping' },
  ],
  activities: [
    {
      id: 'caf-fert-floracion',
      stageId: 'floracion',
      title: 'Fertilización con potasio',
      description: 'Aplicar la dosis de potasio (K2O 80-120 g/planta) al inicio de floración para reforzar el cuajado y la resistencia a roya.',
      guideKeywords: ['fertilizacion', 'potasio', 'npk'],
      timing: 'Inicio de floración, con humedad del suelo',
      category: 'fertilizacion',
    },
    {
      id: 'caf-poda-sanitaria',
      stageId: 'fructificacion',
      title: 'Poda sanitaria y deshierbe',
      description: 'Podar ramas enfermas o improductivas y deshierbar para mejorar ventilación del tercio inferior, reduce el riesgo de roya.',
      guideKeywords: ['roya', 'poda', 'sombra'],
      timing: 'Mitad de fructificación',
      category: 'poda',
    },
    {
      id: 'caf-roya-monitoreo',
      stageId: 'fructificacion',
      title: 'Monitoreo de roya cada 30 días',
      description: 'Revisar el envés de hojas del tercio inferior. Si más del 5% está afectado, aplicar fungicida cúprico.',
      guideKeywords: ['roya', 'hongo', 'hoja amarilla'],
      timing: 'Toda la fructificación, cada 30-45 días',
      category: 'sanidad',
    },
    {
      id: 'caf-cosecha-selectiva',
      stageId: 'cosecha',
      title: 'Cosecha selectiva de frutos maduros',
      description: 'Recolectar solo frutos maduros, despulpar el mismo día, fermentar 12-18 h y secar hasta 10-12% de humedad.',
      guideKeywords: ['cosecha', 'beneficio', 'secado', 'fermentacion'],
      timing: 'Durante toda la cosecha, cada 15-20 días',
      category: 'cosecha',
    },
    {
      id: 'caf-fert-postcosecha',
      stageId: 'cosecha',
      title: 'Fertilización post-cosecha',
      description: 'Aplicar nitrógeno y fósforo (N 80-120 g, P2O5 30-50 g por planta) tras la cosecha principal para recuperar reservas.',
      guideKeywords: ['fertilizacion', 'nitrogeno', 'fosforo', 'npk'],
      timing: 'Fin de cosecha principal',
      category: 'fertilizacion',
    },
  ],
};

const RICE_CALENDAR: CropCalendar = {
  crop: 'arroz',
  cropName: 'Arroz',
  cycleDays: [100, 150],
  stages: [
    { id: 'siembra', name: 'Siembra y germinación', durationDays: [0, 15], description: 'Germinación de la semilla. Suelo húmedo sin inundar.', icon: 'sprout' },
    { id: 'macollamiento', name: 'Macollamiento', durationDays: [15, 45], description: 'Emisión de hijuelos. Etapa clave para el rendimiento.', icon: 'wheat' },
    { id: 'espigamiento', name: 'Embuche y espigamiento', durationDays: [45, 75], description: 'Formación de la panícula y emergencia de la espiga. Etapa crítica de agua.', icon: 'flower' },
    { id: 'maduracion', name: 'Maduración y cosecha', durationDays: [75, 120], description: 'Llenado del grano y secado en planta. Drenar 15 días antes de cosecha.', icon: 'circle' },
  ],
  activities: [
    {
      id: 'arroz-fert-siembra',
      stageId: 'siembra',
      title: 'Fertilización base y zinc',
      description: 'Aplicar 2-3 t/ha de compost antes de la siembra. Primera dosis de nitrógeno (N 40-50 kg/ha) y zinc (5-10 kg/ha) si hay bandas cloróticas.',
      guideKeywords: ['fertilizacion', 'nitrogeno', 'urea', 'zinc', 'compost'],
      timing: 'Al momento de la siembra',
      category: 'fertilizacion',
    },
    {
      id: 'arroz-riego-germinacion',
      stageId: 'siembra',
      title: 'Riego: suelo húmedo sin inundar',
      description: 'Mantener el suelo húmedo pero sin lámina de agua durante los primeros 15 días para favorecer la germinación.',
      guideKeywords: ['riego', 'agua', 'lamina', 'humedad'],
      timing: 'Días 0-15 después de la siembra',
      category: 'riego',
    },
    {
      id: 'arroz-fert-macollamiento',
      stageId: 'macollamiento',
      title: 'Segunda dosis de nitrógeno',
      description: 'Aplicar N 40-50 kg/ha (urea) al inicio del macollamiento para favorecer el número de hijuelos.',
      guideKeywords: ['fertilizacion', 'nitrogeno', 'urea', 'nutricion'],
      timing: 'Días 20-30 después de la siembra',
      category: 'fertilizacion',
    },
    {
      id: 'arroz-riego-macollamiento',
      stageId: 'macollamiento',
      title: 'Riego: lámina de 5-10 cm',
      description: 'Mantener una lámina de agua de 5-10 cm durante el macollamiento para controlar malezas y favorecer el ahijamiento.',
      guideKeywords: ['riego', 'agua', 'lamina', 'inundacion'],
      timing: 'Días 15-45',
      category: 'riego',
    },
    {
      id: 'arroz-riego-espigamiento',
      stageId: 'espigamiento',
      title: 'Riego crítico: lámina constante de 10 cm',
      description: 'Etapa crítica. Mantener lámina constante de 10-15 cm. Cualquier déficit de agua aquí reduce el rendimiento drásticamente.',
      guideKeywords: ['riego', 'agua', 'lamina', 'floracion'],
      timing: 'Días 45-75',
      category: 'riego',
    },
    {
      id: 'arroz-malezas-monitoreo',
      stageId: 'macollamiento',
      title: 'Control de arroz rojo y malezas',
      description: 'Usar semilla certificada y revisar lotes. La rotación SIPAS con pastura agota el banco de semillas de arroz rojo en 2-3 años.',
      guideKeywords: ['arroz rojo', 'maleza', 'malezas', 'herbicida', 'semilla certificada'],
      timing: 'Macollamiento, antes de cerrar el cultivo',
      category: 'sanidad',
    },
    {
      id: 'arroz-drenaje-cosecha',
      stageId: 'maduracion',
      title: 'Drenar 15 días antes de cosecha',
      description: 'Retirar el agua 15 días antes de la cosecha para facilitar el secado del grano y la entrada de maquinaria.',
      guideKeywords: ['riego', 'drenar', 'cosecha'],
      timing: '15 días antes de la cosecha',
      category: 'riego',
    },
    {
      id: 'arroz-cosecha',
      stageId: 'maduracion',
      title: 'Cosecha con humedad 20-24%',
      description: 'Cosechar con 20-24% de humedad del grano y secar hasta 13-14% para almacenamiento. No quemar la paja.',
      guideKeywords: ['rendimiento', 'cosecha', 'humedad grano', 'paddy'],
      timing: 'Cuando el grano alcanza humedad 20-24%',
      category: 'cosecha',
    },
  ],
};

const CACAO_CALENDAR: CropCalendar = {
  crop: 'cacao',
  cropName: 'Cacao',
  cycleDays: [150, 180],
  stages: [
    { id: 'floracion', name: 'Floración', durationDays: [15, 30], description: 'Emitación de flores en el tronco y ramas principales. Solo 5-10% cuaja.', icon: 'flower' },
    { id: 'llenado', name: 'Llenado de mazorca', durationDays: [120, 150], description: 'Desarrollo de la mazorca desde cuaje hasta madurez. Etapa vulnerable a monilia.', icon: 'cherry' },
    { id: 'cosecha', name: 'Cosecha principal', durationDays: [30, 60], description: 'Recolección de mazorcas maduras cada 15-20 días.', icon: 'shopping' },
    { id: 'poda', name: 'Poda y descanso', durationDays: [30, 45], description: 'Poda de producción tras la cosecha. Eliminación de chupones y ramas improductivas.', icon: 'scissors' },
  ],
  activities: [
    {
      id: 'cac-fert-inicio',
      stageId: 'floracion',
      title: 'Fertilización al inicio de lluvias',
      description: 'Aplicar N 60-80 g, P2O5 30-40 g, K2O 80-100 g por árbol y 2-4 kg de compost al inicio de las lluvias.',
      guideKeywords: ['fertilizacion', 'abono', 'compost', 'npk', 'materia organica'],
      timing: 'Inicio de lluvias, al comenzar la floración',
      category: 'fertilizacion',
    },
    {
      id: 'cac-monilia-monitoreo',
      stageId: 'llenado',
      title: 'Monitoreo y retiro de mazorcas con monilia',
      description: 'Revisar mazorcas jóvenes cada 7-10 días. Retirar las que tengan manchas chocolate o deformaciones. Mejorar drenaje y ventilación.',
      guideKeywords: ['monilia', 'moniliasis', 'mazorca', 'mancha', 'pudricion'],
      timing: 'Durante todo el llenado, cada 7-10 días',
      category: 'sanidad',
    },
    {
      id: 'cac-escoba-monitoreo',
      stageId: 'llenado',
      title: 'Poda de escobas de bruja',
      description: 'Cortar brotes deformes en forma de escoba cada 15 días. Enterrar o quemar el material retirado.',
      guideKeywords: ['escoba', 'bruja', 'brote', 'deforme', 'poda'],
      timing: 'Durante el llenado, cada 15 días',
      category: 'sanidad',
    },
    {
      id: 'cac-cosecha-sanitaria',
      stageId: 'cosecha',
      title: 'Cosecha sanitaria cada 15-20 días',
      description: 'Cosechar mazorcas maduras y retirar las enfermas al mismo tiempo. No dejar mazorcas sobremaduras en el árbol.',
      guideKeywords: ['cosecha', 'cosecha sanitaria', 'monilia'],
      timing: 'Durante toda la cosecha, cada 15-20 días',
      category: 'cosecha',
    },
    {
      id: 'cac-poda-produccion',
      stageId: 'poda',
      title: 'Poda de producción post-cosecha',
      description: 'Eliminar ramas improductivas, chupones y mantener el árbol a 3-4 m. Regular la sombra para 30-50% de cobertura.',
      guideKeywords: ['poda', 'poda produccion', 'ramas', 'chupones', 'sombra'],
      timing: 'Después de la cosecha principal',
      category: 'poda',
    },
    {
      id: 'cac-sombra-regulacion',
      stageId: 'poda',
      title: 'Regulación de sombra',
      description: 'Podar árboles de sombra (guabo, plátano) para mantener 30-50% de cobertura y mejorar la ventilación del cacaotal.',
      guideKeywords: ['sombra', 'guabo', 'regulacion', 'arbol'],
      timing: 'Inicio y fin de lluvias',
      category: 'poda',
    },
  ],
};

const CALENDARS: Record<CropKey, CropCalendar> = {
  cafe: COFFEE_CALENDAR,
  arroz: RICE_CALENDAR,
  cacao: CACAO_CALENDAR,
};

export function getCropCalendar(crop: CropKey): CropCalendar {
  return CALENDARS[crop];
}

export function getActivitiesForStage(crop: CropKey, stageId: string): CalendarActivity[] {
  return CALENDARS[crop].activities.filter((a) => a.stageId === stageId);
}

export function findGuideSectionForActivity(guide: LocalGuide, activity: CalendarActivity): GuideSection | null {
  const query = activity.guideKeywords.join(' ');
  const sections = guide.sections;
  let best: { section: GuideSection; score: number } | null = null;
  for (const section of sections) {
    let score = 0;
    for (const kw of activity.guideKeywords) {
      const nkw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const text = (section.title + ' ' + section.keywords.join(' ') + ' ' + section.content)
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (text.includes(nkw)) score += nkw.includes(' ') ? 3 : 2;
    }
    if (!best || score > best.score) best = { section, score };
  }
  return best && best.score > 0 ? best.section : null;
}

export const CATEGORY_LABELS: Record<CalendarActivity['category'], string> = {
  poda: 'Poda',
  fertilizacion: 'Fertilización',
  riego: 'Riego',
  sanidad: 'Sanidad',
  cosecha: 'Cosecha',
  monitoreo: 'Monitoreo',
};

export const CATEGORY_COLORS: Record<CalendarActivity['category'], string> = {
  poda: 'grove',
  fertilizacion: 'harvest',
  riego: 'sky',
  sanidad: 'clay',
  cosecha: 'earth',
  monitoreo: 'sky',
};
