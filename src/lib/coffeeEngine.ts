import type {
  DiagnosisResult,
  RecommendationType,
} from '@/types';

interface DiagnosisInfo {
  label: string;
  description: string;
  severity: 'success' | 'warning' | 'danger';
  color: string;
  bgColor: string;
  symptoms: string;
}

export const DIAGNOSIS_INFO: Record<DiagnosisResult, DiagnosisInfo> = {
  sana: {
    label: 'Planta Sana',
    description: 'No se detectan signos de plagas o enfermedades. La planta presenta un estado saludable general.',
    severity: 'success',
    color: 'text-grove-700',
    bgColor: 'bg-grove-100',
    symptoms: 'Hojas de color verde uniforme, sin manchas, lesiones ni decoloración. Brotes vigorosos.',
  },
  roya: {
    label: 'Roya del Cafeto',
    description: 'Hemileia vastatrix. Enfermedad fúngica que causa defoliación severa y pérdida de cosecha.',
    severity: 'danger',
    color: 'text-clay-700',
    bgColor: 'bg-clay-100',
    symptoms: 'Polvo amarillo-naranja en el envés de las hojas. Manchas amarillas en el haz que se oscurecen.',
  },
  minador: {
    label: 'Minador de la Hoja',
    description: 'Leucoptera coffeella. Larva que mina el interior de las hojas reduciendo la fotosíntesis.',
    severity: 'warning',
    color: 'text-harvest-700',
    bgColor: 'bg-harvest-100',
    symptoms: 'Galerías o túneles serpenteantes de color café en el interior de las hojas. Defoliación en ataques severos.',
  },
  antracnosis: {
    label: 'Antracnosis',
    description: 'Colletotrichum sp. Hongo que ataca frutos, hojas y ramas, causando pudrición y caída.',
    severity: 'danger',
    color: 'text-clay-700',
    bgColor: 'bg-clay-100',
    symptoms: 'Lesiones necróticas oscuras en frutos y hojas. Pudrición suave en frutos verdes que se momifican.',
  },
  ojo_de_gallo: {
    label: 'Ojo de Gallo',
    description: 'Mycena citricolor. Enfermedad fúngica que produce lesiones circulares en las hojas.',
    severity: 'warning',
    color: 'text-harvest-700',
    bgColor: 'bg-harvest-100',
    symptoms: 'Manchas circulares de 1-3 mm con centro gris-blanco y borde oscuro, semejando un ojo.',
  },
};

export const RECOMMENDATION_INFO: Record<RecommendationType, { label: string; icon: string; color: string }> = {
  none: { label: 'Sin acción requerida', icon: 'Check', color: 'grove' },
  podar: { label: 'Podar ramas afectadas', icon: 'Scissors', color: 'earth' },
  fertilizar: { label: 'Aplicar fertilización', icon: 'Sprout', color: 'harvest' },
  mipe: { label: 'Manejo Integrado MIPE', icon: 'Bug', color: 'clay' },
  monitorear: { label: 'Monitorear de cerca', icon: 'Eye', color: 'sky' },
};

export function generateRecommendation(
  result: DiagnosisResult,
  soil: { ph: number; phosphorus: number; potassium: number; organicMatter: number }
): { type: RecommendationType; text: string } {
  if (result === 'sana') {
    if (soil.ph < 5.0 || soil.ph > 6.5) {
      return {
        type: 'fertilizar',
        text: 'La planta está sana, pero el pH del suelo está fuera del rango óptimo (5.0–6.5). Considere aplicar enmiendas calibradas para corregir la acidez o alcalinidad.',
      };
    }
    return {
      type: 'none',
      text: 'La planta está sana y los parámetros del suelo son adecuados. Continúe con las prácticas de manejo regulares y monitoreo periódico.',
    };
  }

  if (result === 'roya') {
    const parts: string[] = [];
    parts.push('Se detecta Roya del cafeto. Acción inmediata requerida:');
    parts.push('• Podar y eliminar ramas afectadas, enterrando o quemando el material infectado.');
    if (soil.potassium < 0.3) {
      parts.push('• Aplicar fertilización potásica (K) — los niveles bajos de potasio aumentan la susceptibilidad a la roya.');
    }
    parts.push('• Aplicar manejo integrado MIPE: uso de fungicidas cúpricos de contacto cada 30–45 días.');
    parts.push('• Espaciar la sombra regulada para mejorar ventilación y reducir humedad foliar.');
    return { type: 'mipe', text: parts.join('\n') };
  }

  if (result === 'minador') {
    const parts: string[] = [];
    parts.push('Se detecta Minador de la hoja. Recomendaciones:');
    parts.push('• Monitorear el porcentaje de hojas afectadas. Si es menor al 15%, aplicar control biológico con parasitoides.');
    parts.push('• Solo aplicar control químico si la infestación supera el 30% de las hojas.');
    if (soil.organicMatter < 3) {
      parts.push('• Mejorar la materia orgánica del suelo con compost o pulpa de café descompuesta.');
    }
    return { type: 'monitorear', text: parts.join('\n') };
  }

  if (result === 'antracnosis') {
    const parts: string[] = [];
    parts.push('Se detecta Antracnosis. Acción inmediata:');
    parts.push('• Eliminar y destruir frutos y ramas infectadas.');
    parts.push('• Aplicar fungicidas a base de cobre o triazoles según etiqueta.');
    if (soil.phosphorus < 10) {
      parts.push('• Aplicar fertilización fosfatada — el fósforo bajo debilita la resistencia natural de la planta.');
    }
    parts.push('• Mejorar drenaje para evitar exceso de humedad.');
    return { type: 'mipe', text: parts.join('\n') };
  }

  // ojo_de_gallo
  const parts: string[] = [];
  parts.push('Se detecta Ojo de Gallo. Recomendaciones:');
  parts.push('• Podar y eliminar hojas afectadas.');
  parts.push('• Aplicar fungicida cúprico preventivo.');
  parts.push('• Reducir el exceso de sombra para mejorar aireación.');
  return { type: 'podar', text: parts.join('\n') };
}

export function analyzePhoto(photoDataUrl: string): Promise<{
  result: DiagnosisResult;
  confidence: number;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results: DiagnosisResult[] = ['sana', 'roya', 'minador', 'antracnosis', 'ojo_de_gallo'];
      const weights = [0.45, 0.2, 0.15, 0.1, 0.1];
      const r = Math.random();
      let acc = 0;
      let picked: DiagnosisResult = 'sana';
      for (let i = 0; i < results.length; i++) {
        acc += weights[i];
        if (r <= acc) {
          picked = results[i];
          break;
        }
      }
      const confidence = 0.82 + Math.random() * 0.16;
      resolve({ result: picked, confidence: Math.round(confidence * 100) / 100 });
    });
    void photoDataUrl;
  });
}
