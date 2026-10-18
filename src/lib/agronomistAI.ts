import type { AppData } from '@/types';
import { findRelevantSections, type GuideSection, type LocalGuide } from '@/lib/localGuides';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface KnowledgeRule {
  keywords: string[];
  topic: string;
  generate: (data: AppData) => string;
}

const rules: KnowledgeRule[] = [
  // Coffee - Roya
  {
    topic: 'roya',
    keywords: ['roya', 'hongo amarillo', 'polvo naranja', 'hoja amarilla', 'mancha amarilla', 'defoliacion', 'defoliación'],
    generate: () => `**Roya del Cafeto (Hemileia vastatrix)**

Es la enfermedad más devastadora del café en América Latina. Sus sintomas principales:

- Polvo amarillo-naranja en el envés de las hojas
- Manchas amarillas en el haz que se oscurecen a café
- Defoliación severa que reduce la fotosíntesis y la cosecha

**Que hacer:**
1. Podar y eliminar ramas afectadas (enterrar o quemar material infectado)
2. Aplicar fungicidas cúpricos de contacto cada 30-45 días
3. Mejorar ventilación regulando la sombra
4. Mantener niveles adecuados de potasio (K) en el suelo — el déficit aumenta la susceptibilidad
5. Usar variedades resistentes como Catimor o Colombia cuando sea posible

La prevencion es clave: monitorea tus lotes cada 15 días durante la época lluviosa.`,
  },
  // Coffee - Minador
  {
    topic: 'minador',
    keywords: ['minador', 'galeria', 'galería', 'tunel', 'túnel', 'leucoptera', 'hoja con lineas'],
    generate: () => `**Minador de la Hoja (Leucoptera coffeella)**

Larva que se alimenta del interior de las hojas, creando galerías serpenteantes de color café.

**Que hacer según nivel de infestacion:**
- **Menos del 15% de hojas afectadas:** Control biológico con parasitoides (Cirrospilus, Closterocerus)
- **15-30% de hojas afectadas:** Monitoreo cada 7 días
- **Más del 30%:** Control químico con insecticidas específicos, aplicar solo en horas de la tarde para proteger abejas

Mejorar la materia orgánica del suelo con compost o pulpa de café descompuesta fortalece la planta contra el minador.`,
  },
  // Coffee - Soil pH
  {
    topic: 'ph suelo cafe',
    keywords: ['ph', 'ph del suelo', 'acidez', 'acido', 'alcalino', 'encalar', 'cal'],
    generate: (data) => {
      const lastDiag = data.coffeeDiagnoses[0];
      const ph = lastDiag?.soilParams.ph ?? 5.5;
      let advice = '';
      if (ph < 5.0) {
        advice = `Tu pH actual (${ph}) es demasiado acido. Aplica cal agricola (dolomita o calcita) a razon de 1-2 toneladas por hectarea, distribuida en 2 aplicaciones al año. Espera 3 meses antes de fertilizar para evitar interacciones.`;
      } else if (ph > 6.5) {
        advice = `Tu pH actual (${ph}) es demasiado alcalino para café. Aplica azufre elemental o sulfato de amonio para acidificar gradualmente. Evita encalar.`;
      } else {
        advice = `Tu pH actual (${ph}) esta en el rango optimo para café (5.0-6.5). Continua monitoreando anualmente.`;
      }
      return `**pH del Suelo para Café**

El rango óptimo es **5.0 a 6.5**. Fuera de este rango, la planta no puede absorber nutrientes eficientemente, incluso si están presentes en el suelo.

${advice}

Un pH incorrecto puede causar:
- pH bajo: toxicidad de aluminio y manganeso
- pH alto: deficiencia de hierro, manganeso y zinc (hojas amarillas con nervaduras verdes)`;
    },
  },
  // Coffee - Fertilization
  {
    topic: 'fertilizacion cafe',
    keywords: ['fertilizar', 'fertilizante', 'abono', 'nutriente', 'nitrogeno', 'nitrógeno', 'fosforo', 'fósforo', 'potasio', 'npk'],
    generate: (data) => {
      const lastDiag = data.coffeeDiagnoses[0];
      const soil = lastDiag?.soilParams;
      if (!soil) {
        return `**Fertilización del Café**

Para una recomendacion personalizada, primero registra tus parámetros de suelo en el Módulo Café (pH, fósforo, potasio y materia orgánica).

**Guía general (por planta al año):**
- Nitrógeno (N): 80-120 g — en 3-4 aplicaciones
- Fósforo (P2O5): 30-50 g — 1-2 aplicaciones al inicio de lluvias
- Potasio (K2O): 80-120 g — en 2-3 aplicaciones

Aplica fertilizante en banda o semicirculo bajo la copa, nunca tocando el tronco. Riega después para activar los nutrientes.`;
      }
      const parts: string[] = [`**Fertilización personalizada según tu suelo:**`];
      if (soil.phosphorus < 15) parts.push(`• Fósforo BAJO (${soil.phosphorus} ppm): Aplica 40-60 g de P2O5 por planta al inicio de lluvias.`);
      else parts.push(`• Fósforo ADECUADO (${soil.phosphorus} ppm): Mantén con 20-30 g anuales.`);
      if (soil.potassium < 0.3) parts.push(`• Potasio BAJO (${soil.potassium} cmol/kg): Aplica 100-150 g de K2O por planta. CRÍTICO para resistencia a roya.`);
      else parts.push(`• Potasio ADECUADO (${soil.potassium} cmol/kg): Mantén con 60-80 g anuales.`);
      if (soil.organicMatter < 3) parts.push(`• Materia Orgánica BAJa (${soil.organicMatter}%): Aplica 2-3 kg de compost por planta, o pulpa de café descompuesta.`);
      parts.push(`\nDivide en 3-4 aplicaciones durante la época de lluvia para mejor aprovechamiento.`);
      return parts.join('\n');
    },
  },
  // Coffee - Varieties
  {
    topic: 'variedades cafe',
    keywords: ['variedad', 'variedades', 'catimor', 'borbon', 'bourbon', 'caturra', 'colombia', 'castillo', 'tipica', 'arabica', 'especies'],
    generate: () => `**Variedades de Café Recomendadas**

Para América Latina, las variedades más cultivadas:

| Variedad | Rendimiento | Roya | Calidad | Altura |
|----------|------------|------|---------|--------|
| Catimor | Alto | Resistente | Media | 600-1200m |
| Colombia | Alto | Resistente | Buena | 800-1800m |
| Castillo | Alto | Resistente | Buena | 800-1800m |
| Caturra | Medio | Susceptible | Muy buena | 800-1600m |
| Borbón | Medio | Susceptible | Excelente | 800-1600m |

Si la roya es un problema recurrente en tu finca, considera renovar con Catimor, Colombia o Castillo. Si buscas calidad de taza, Caturra y Borbón son excelentes pero requieren mayor manejo sanitario.`,
  },
  // Rice - SIPAS
  {
    topic: 'sipas',
    keywords: ['sipas', 'rotacion arroz', 'rotación arroz', 'arroz rojo', 'maleza', 'malezas', 'pastura', 'rotacion pastura'],
    generate: (data) => {
      const plots = data.ricePlots;
      const inPastura = plots.filter(p => p.status === 'pastura').length;
      const inProd = plots.filter(p => p.status === 'produccion').length;
      let context = '';
      if (plots.length > 0) {
        context = `\n\n**Tu situación actual:** Tienes ${plots.length} lote(s) registrados — ${inProd} en producción y ${inPastura} en pastura. ${inPastura < 1 && inProd > 0 ? 'Considera pasar al menos un lote a pastura para iniciar el ciclo SIPAS.' : 'Buen balance de rotación.'}`;
      }
      return `**Sistema SIPAS (Arroz + Pasturas)**

La rotación arroz-pastura es la estrategia más efectiva contra el arroz rojo y malezas resistentes a herbicidas:

**Ciclo recomendado (2-3 años):**
1. **Año 1:** Arroz — siembra en el lote
2. **Año 2-3:** Pastura (Brachiaria o gramíneas) — el pastoreo y la competencia eliminan el arroz rojo
3. **Año 4:** Vuelta a arroz — el lote sale limpio y con mejor estructura de suelo

**Beneficios:**
- Reduce hasta 70% el uso de herbicidas
- Rompe el ciclo de malezas resistentes
- Mejora la materia orgánica y estructura del suelo
- Genera ingresos adicionales por pastoreo ganadero${context}`;
    },
  },
  // Rice - Irrigation
  {
    topic: 'riego arroz',
    keywords: ['riego', 'agua', 'humedad', 'evapotranspiracion', 'evapotranspiración', 'laminas', 'láminas', 'inundacion', 'inundación'],
    generate: (data) => {
      const plots = data.ricePlots;
      const low = plots.filter(p => p.soilMoisture < 30);
      let alert = '';
      if (low.length > 0) {
        alert = `\n\n**Alerta:** ${low.length} lote(s) con humedad por debajo del 30%: ${low.map(p => p.name).join(', ')}. Necesitan riego inmediato.`;
      }
      return `**Riego del Arroz**

El arroz requiere un manejo cuidadoso del agua:

**Fases y necesidad de agua:**
1. **Germinación:** Suelo húmedo, sin inundar (0-15 días)
2. **Macollamiento:** Lámina delgada de 5-10 cm (15-45 días)
3. **Embuche:** Lámina de 10-15 cm (45-70 días)
4. **Floración:** Lámina constante de 10 cm (70-90 días)
5. **Maduración:** Drenar 15 días antes de la cosecha

**Calculadora:** Usa la pestaña de Riego en el Módulo Arroz para estimar el volumen de agua diario según la evapotranspiración y la lluvia esperada.

El ahorro de agua puede ser de 30-40% usando riego intermitente en lugar de inundación continua.${alert}`;
    },
  },
  // Rice - Red rice / weeds
  {
    topic: 'arroz rojo',
    keywords: ['arroz rojo', 'arroz maleza', 'arroz silvestre', 'granilla', 'competencia'],
    generate: () => `**Arroz Rojo — Maleza Principal del Arroz**

El arroz rojo es una maleza del mismo género que el arroz comercial, lo que hace imposible controlarla con herbicidas selectivos.

**Estrategias de control:**
1. **Rotación SIPAS** (más efectiva): 2 años de pastura eliminan el banco de semillas
2. **Rotación de cultivos**: Soya, maíz o leguminosas permiten usar herbicidas graminicidas
3. **Semilla certificada**: Evita introducir arroz rojo con semilla contaminada
4. **Limpieza de equipos**: Las cosechadoras transportan semillas entre lotes
5. **Quema controlada**: Solo donde sea legal, reduce viabilidad de semillas

Un solo grano de arroz rojo puede producir 200 semillas, por eso la prevención es esencial.`,
  },
  // Livestock - Rotational grazing
  {
    topic: 'pastoreo rotacional',
    keywords: ['pastoreo', 'rotacional', 'potrero', 'potreros', 'remanente foliar', 'sobrepastoreo', 'altura pasto', 'compactacion', 'compactación'],
    generate: (data) => {
      const low = data.paddocks.filter(p => p.grassHeight < 20 && p.status === 'en_uso');
      let alert = '';
      if (low.length > 0) {
        alert = `\n\n**Alerta en tus potreros:** ${low.map(p => `${p.name} (${p.grassHeight} cm)`).join(', ')} están por debajo del remanente de seguridad (15-20 cm). Retira los animales inmediatamente.`;
      }
      return `**Pastoreo Rotacional de Precision**

El objetivo es mantener un remanente foliar de **15 a 20 cm** para:

- Evitar la compactación del suelo (perjudica el cultivo de arroz posterior)
- Permitir la recuperación rápida del pasto
- Maximizar la calidad nutricional

**Plan de rotación:**
1. Divide la finca en 4-8 potreros
2. Permanencia de 3-7 días por potrero (según carga animal)
3. Periodo de descanso: 25-40 días (estación seca) o 20-30 días (estación lluviosa)
4. Monitorea la altura del pasto antes y después del pastoreo

**Regla clave:** Retirar los animales cuando el pasto llega a 15-20 cm, NO esperar a que lo consuman todo.${alert}`;
    },
  },
  // Livestock - Vaccination
  {
    topic: 'vacunacion ganado',
    keywords: ['vacuna', 'vacunacion', 'vacunación', 'aftosa', 'rabia', 'brucelosis', 'clostridium', 'enfermedad ganado', 'sanidad'],
    generate: (data) => {
      const cattle = data.cattle;
      const overdueVaccines = cattle.flatMap(c => c.vaccinations).filter(v => new Date(v.nextDate) < new Date());
      let context = '';
      if (cattle.length > 0) {
        context = `\n\n**Tu hato:** ${cattle.length} animales registrados. ${overdueVaccines.length > 0 ? `${overdueVaccines.length} vacuna(s) vencida(s). Revisa el detalle de cada animal.` : 'Todas las vacunaciones están al día.'}`;
      }
      return `**Plan de Vacunación Ganadera**

**Calendario básico:**
- **Fiebre Aftosa:** Cada 6 meses (primavera y otoño)
- **Rabia Bovina:** Anual, en zonas endémicas
- **Brucelosis:** Hembras de 4-8 meses de edad (dosis única)
- **Clostridiosis (Mancha/Edema):** 2 dosis con 21 días de diferencia, refuerzo anual
- **Tristeza Bovina:** Según zona y riesgo epidemiológico

**Recomendaciones:**
- Registrar cada vacunación en la bitácora del animal
- Mantener cadena de frío de las vacunas
- Vacunar en horas frescas del día
- Observar reacciones adversas 48 horas post-vacunación${context}`;
    },
  },
  // Livestock - Reproduction
  {
    topic: 'reproduccion ganado',
    keywords: ['reproduccion', 'reproducción', 'prenada', 'preñada', 'parto', 'servicio', 'monta', 'celo', 'inseminacion', 'destete'],
    generate: () => `**Manejo Reproductivo del Hato**

**Ciclo reproductivo:**
- Pubertad: 15-24 meses (según raza y nutrición)
- Celos cada 21 días (duran 18 horas)
- Gestación: ~283 días (9 meses)
- Intervalo entre partos objetivo: 12-14 meses

**Estados reproductivos en la app:**
- **Vacía:** No preñada, lista para servicio
- **Servida:** Monta o inseminación realizada, confirmar preñez a los 45 días
- **Preñada:** Confirmada por palpación o ultrasonido
- **Lactancia:** Amamantando cría (prestar atención a la nutrición)
- **Seca:** En descanso antes del próximo parto

**Diagnóstico de preñez:** Realizar a los 45-60 días post-servicio por palpación rectal o ultrasonido.`,
  },
  // Livestock - Weight / nutrition
  {
    topic: 'peso ganado',
    keywords: ['peso', 'engorde', 'ganancia', 'nutricion', 'nutrición', 'alimentacion', 'alimentación', 'suplemento', 'sal mineral'],
    generate: (data) => {
      const avgWeight = data.cattle.length > 0
        ? Math.round(data.cattle.reduce((s, c) => s + c.weight, 0) / data.cattle.length)
        : null;
      let context = '';
      if (avgWeight) {
        context = `\n\n**Tu hato:** Peso promedio actual ${avgWeight} kg. Registra pesos cada 30-60 días para monitorear la ganancia diaria.`;
      }
      return `**Manejo de Peso y Nutrición**

**Ganancia de peso objetivo:**
- Ganado de carne: 0.5-1.0 kg/día
- Pastoreo con suplementación: 0.7-1.2 kg/día
- Feedlot: 1.2-1.8 kg/día

**Factores clave:**
1. **Calidad del pasto:** Proteína mínima 7-9% en pasto seco
2. **Sal mineral:** Proporcionar siempre, complementa déficits del suelo
3. **Agua limpia:** Disponible en todo momento (40-60 litros/día por animal)
4. **Suplementación estratégica:** En época seca, dar heno, silaje o bloques multinutricionales

**Consejo:** Pesaje cada 30-60 días permite ajustar la dieta y detectar problemas de salud temprano.${context}`;
    },
  },
  // Compost / organic matter
  {
    topic: 'compost',
    keywords: ['compost', 'compostaje', 'estiércol', 'estiercol', 'materia organica', 'materia orgánica', 'abono organico', 'abono orgánico', 'composta'],
    generate: (data) => {
      const cattleCount = data.cattle.length;
      const dailyManure = cattleCount * 25;
      const monthlyCompost = Math.round(dailyManure * 30 * 0.5);
      let context = '';
      if (cattleCount > 0) {
        context = `\n\n**Tu producción estimada:** ${dailyManure} kg de estiércol/día → ${monthlyCompost} kg de compost/mes. Esto puede fertilizar aproximadamente ${Math.floor(monthlyCompost / 2500)} hectáreas al mes.`;
      }
      return `**Compostaje y Economía Circular**

Convertir el estiércol en compost es la base de la economía circular en tu finca:

**Proceso básico:**
1. Recolectar estiércol fresco
2. Mezclar con material seco (paja, hojarasca) en proporción 2:1
3. Formar pilas de 1.5m de altura
4. Voltear cada 7-15 días para airear
5. Mantener humedad (60-70%, como esponja exprimida)
6. Listo en 60-90 días (color oscuro, sin olor desagradable)

**Aplicación:**
- Arroz: 2-3 ton/ha antes de la siembra
- Café: 1-2 kg por planta, 2 veces al año
- Mejora pH, retención de agua y biodiversidad del suelo${context}`;
    },
  },
  // General - Climate
  {
    topic: 'clima',
    keywords: ['clima', 'temperatura', 'lluvia', 'sequia', 'sequía', 'estacion', 'estación', 'seca', 'humedad', 'estacion seca'],
    generate: () => `**Manejo Agroclimático**

Las condiciones climáticas afectan directamente tus tres cultivos:

**Café:**
- Temperatura óptima: 18-24°C
- Precipitación: 1200-2000 mm/año
- Época seca necesaria para floración uniforme
- Exceso de humedad favorece roya y antracnosis

**Arroz:**
- Temperatura óptima: 25-32°C
- Requiere 800-1200 mm durante el ciclo
- Sensible a temperaturas bajas en floración
- Monitorear evapotranspiración para ajustar riego

**Ganadería:**
- Pastos crecen mejor con 25-35°C y humedad adecuada
- Época seca: planificar suplementación y reservas
- Sombras en potreros reducen estrés térmico

La app incluye monitoreo agroclimático en el Módulo Arroz, listo para conectar APIs climáticas reales en el futuro.`,
  },
  // General - Farm planning
  {
    topic: 'planificacion finca',
    keywords: ['planificar', 'planificacion', 'planificación', 'organizar', 'diversificar', 'sistema', 'integracion', 'integración'],
    generate: (data) => {
      const activeModules = Object.entries(data.farmConfig.modules).filter(([, v]) => v).map(([k]) => k);
      return `**Integración de la Finca Diversificada**

AgroSinergia 360 integra tus ${activeModules.length} módulo(s) activo(s): ${activeModules.map(m => m === 'coffee' ? 'Café' : m === 'rice' ? 'Arroz' : 'Ganadería').join(', ')}.

**Principios de la integración:**
1. **Estiércol → Compost → Cultivos:** El ganado produce abono orgánico para café y arroz
2. **Rotación SIPAS:** Pastura del arroz alimenta al ganado
3. **Pastoreo controlado:** Evita compactación que daña el arroz posterior
4. **Residuos de cosecha:** Paja de arroz y pulpa de café como cama o compost

**Plan sugerido:**
- Asigna lotes rotativos entre arroz y pastura
- Usa el compost del ganado en café y arroz
- Monitorea el pasto antes de sembrar arroz en el mismo lote
- Registra todos los eventos en la app para trazabilidad completa

${data.farmConfig.farmName ? `Tu finca "${data.farmConfig.farmName}"` : 'Tu finca'} está en el camino correcto hacia la agricultura sostenible.`;
    },
  },
  // General - MIPE
  {
    topic: 'mipe',
    keywords: ['mipe', 'manejo integrado', 'plaga', 'plagas', 'control biologico', 'control biológico', 'control integrado'],
    generate: () => `**Manejo Integrado de Plagas y Enfermedades (MIPE)**

El MIPE combina múltiples estrategias para controlar plagas minimizando el impacto ambiental:

**Niveles de accion:**
1. **Prevención:** Variedades resistentes, sombra regulada, nutrición balanceada
2. **Monitoreo:** Revisiones periódicas cada 7-15 días
3. **Control biológico:** Parasitoides, depredadores y hongos entomopatógenos (Beauveria, Metarhizium)
4. **Control cultural:** Podas sanitarias, manejo de sombra, eliminación de residuos
5. **Control químico:** Último recurso, usar productos específicos y rotar modos de acción

**Para café:**
- Roya: fungicidas cúpricos preventivos
- Minador: parasitoides (no aplicar insecticida si hay control natural activo)
- Broca: trampas con alcohol y hongo Beauveria bassiana

**Principio clave:** Solo aplicar control químico cuando el nivel de daño supera el umbral económico, no antes.`,
  },
  // Coffee - Antracnosis
  {
    topic: 'antracnosis',
    keywords: ['antracnosis', 'colletotrichum', 'mancha oscura', 'mancha necrotica', 'mancha necrótica', 'fruto dañado', 'fruto danado'],
    generate: () => `**Antracnosis del Cafeto (Colletotrichum gloeosporioides)**

Enfermedad fúngica que afecta hojas, ramas y frutos. Se reconoce por manchas necróticas oscuras, a menudo con un centro de color café-negro y bordes amarillentos.

**Condiciones que la favorecen:**
- Alta humedad relativa (>85%)
- Temperaturas de 25-28°C
- Exceso de sombra y falta de ventilación
- Heridas por insectos o granizo

**Qué hacer:**
1. **Poda sanitaria:** Elimina y quema/entierra ramas y frutos afectados
2. **Regular sombra:** Reduce a 30-40% para mejorar ventilación
3. **Fungicidas cúpricos:** Aplica caldo bordelés u óxicloruro de cobre cada 30 días en época de riesgo
4. **Fertilización balanceada:** El exceso de nitrógeno aumenta la susceptibilidad
5. **Cosecha sanitaria:** Recoge frutos caídos para eliminar inóculo

La antracnosis puede causar pérdida de hasta el 30% de la cosecha si no se controla a tiempo.`,
  },
  // Coffee - Ojo de gallo
  {
    topic: 'ojo de gallo',
    keywords: ['ojo de gallo', 'ojo gallo', 'mycena', 'lesion circular', 'lesión circular', 'punto central oscuro'],
    generate: () => `**Ojo de Gallo (Mycena citricolor)**

Enfermedad común en zonas muy húmedas (neblina frecuente) y con exceso de sombra. Se reconoce por lesiones circulares de 5-10 mm con un punto central oscuro (el "ojo").

**Condiciones que la favorecen:**
- Humedad relativa >90%
- Zonas de neblina o alta nubosidad
- Sombra densa (>60%)
- Temperaturas de 15-22°C

**Qué hacer:**
1. **Regular sombra drásticamente:** Reduce a 25-35%, especialmente en zonas de neblina
2. **Poda sanitaria:** Elimina ramas bajas y hojas afectadas
3. **Caldo bordelés:** Aplicación preventiva cada 21-30 días en época de lluvia
4. **Mejorar drenaje:** Evita encharcamientos
5. **Variedades resistentes:** Considerar Catimor en zonas de alto riesgo

El ojo de gallo es un indicador de que hay demasiado sombra y humedad. Ajustar la sombra es la medida más efectiva a largo plazo.`,
  },
  // Coffee - Broca
  {
    topic: 'broca',
    keywords: ['broca', 'hypothenemus', 'fruto perforado', 'gorgojo del cafe', 'gorgojo del café', 'perforacion fruto'],
    generate: () => `**Broca del Café (Hypothenemus hampei)**

Es la plaga insectil más damaging del café. La hembra perfora el fruto y pone huevos en el interior. Las larvas se alimentan del grano, reduciendo peso y calidad.

**Ciclo de vida:**
- Hembra penetra el fruto en estado pintón a maduro
- Pone 30-50 huevos dentro del fruto
- Ciclo completo: 25-35 días según temperatura

**Control integrado:**
1. **Cosecha sanitaria:** Recolectar TODOS los frutos remanentes después de la cosecha (esto rompe el ciclo)
2. **Trampas con alcohol:** Alcohol metílico o etílico en trampas atrayentes (2-4 por hectárea)
3. **Beauveria bassiana:** Hongo entomopatógeno, aplicar en época de floración y cosecha
4. **Repi-Cosecha:** Recolección de frutos caídos del suelo
5. **Control químico:** Solo en infestaciones severas (>5% frutos brocados), usar productos específicos con cuidado de no afectar abejas

**Umbral de acción:** Tratar cuando >5% de los frutos presentan perforación. Monitorear semanalmente durante la cosecha.`,
  },
  // Coffee - Shade management
  {
    topic: 'sombra cafe',
    keywords: ['sombra', 'guamo', 'chalum', 'eritrina', 'arbol de sombra', 'árbol de sombra', 'leguminosa sombra', 'regulacion sombra'],
    generate: () => `**Manejo de Sombra en Café**

La sombra es una herramienta clave. El nivel ideal es **30-40%** de cobertura.

**Árboles recomendados (leguminosas):**
- **Guamo (Inga spp.):** Sombra regulada, fija nitrógeno, hojas para mulch
- **Chalum (Inga edulis):** Crecimiento rápido, fácil de podar
- **Eritrina (Erythrina spp.):** Sombra ligera, fija N, podar antes de floración
- **Nogal (Cordia alliodora):** Madera valiosa, sombra moderada

**Consecuencias de sombra incorrecta:**
- **Exceso (>50%):** Favorece roya, ojo de gallo, antracnosis; reduce producción
- **Insuficiente (<20%):** Estrés hídrico, quemaduras solares, menor calidad de taza

**Manejo práctico:**
1. Podar árboles de sombra al inicio de la época seca (permiten floración uniforme)
2. Durante la lluvia, dejar crecer para proteger de exceso de agua
3. Renovar árboles viejos o enfermos
4. Mantener 150-250 árboles por hectárea según especie

Una sombra bien regulada puede aumentar la calidad del café hasta un 20%.`,
  },
  // Rice - Nutrition
  {
    topic: 'nutricion arroz',
    keywords: ['nutricion arroz', 'nutrición arroz', 'fertilizar arroz', 'fertilizante arroz', 'nitrogeno arroz', 'nitrógeno arroz', 'zinc arroz', 'deficiencia arroz', 'hojas amarillas arroz'],
    generate: () => `**Nutrición del Arroz**

**Requerimientos por hectárea por ciclo:**
- **Nitrógeno (N):** 80-120 kg/ha — fraccionar en 3-4 aplicaciones
  - 30% al momento de siembra
  - 40% al macollamiento (20-30 días)
  - 30% al embuche (45-55 días)
- **Fósforo (P2O5):** 40-60 kg/ha — todo al momento de siembra
- **Potasio (K2O):** 60-100 kg/ha — 50% siembra + 50% macollamiento
- **Zinc (Zn):** 5-10 kg/ha si hay deficiencia

**Síntomas de deficiencia:**
- **N:** Hojas inferiores amarillas, crecimiento lento
- **P:** Hojas oscuras verde-azulado, crecimiento raquítico
- **K:** Bordes de hojas amarillos/marrones,容易被 lodging
- **Zn:** Bandas amarillas entre nervaduras, hojas jóvenes deformes

**Recomendaciones:**
1. Realizar análisis de suelo antes de cada ciclo
2. Aplicar compost (2-3 ton/ha) para mejorar materia orgánica
3. Usar urea volatilizada al atardecer para reducir pérdidas
4. No aplicar N después del embuche (no hay respuesta, sí hay lodging)

El análisis de suelo puede ahorrar hasta 30% en costos de fertilización.`,
  },
  // Livestock - Heat stress / drought
  {
    topic: 'estres calor',
    keywords: ['estres calor', 'estrés calor', 'sequia', 'sequía', 'calor extremo', 'epoca seca', 'época seca', 'sombras potreros', 'estrés térmico'],
    generate: () => `**Manejo de Estrés Térmico y Época Seca**

El estrés por calor reduce la ganancia de peso hasta 20% y afecta la reproducción.

**Señales de estrés térmico:**
- Jadeo y respiración acelerada
- Búsqueda de sombra activa
- Reducción del consumo de alimento
- Mayor consumo de agua

**Estrategias:**
1. **Sombras en potreros:** Árboles o estructuras de sombra (mínimo 4-6 m² por animal)
2. **Agua siempre disponible:** 40-60 L/animal/día, bebederos limpios
3. **Pastoreo nocturno o matutino:** En épocas de calor extremo
4. **Suplementación en seca:**
   - Heno o silaje (2-4 kg/animal/día)
   - Bloques multinutricionales (reduce déficits de minerales)
   - Sal mineral siempre disponible
5. **Carga animal reducida:** 0.5-1 UA/ha en época seca para evitar sobrepastoreo

**Riego de pastos:** Si tienes acceso a riego, 20-30 mm/semana mantienen el pasto productivo durante la seca.

Planificar las reservas (heno/silaje) 3-4 meses antes de la época seca es clave.`,
  },
  // Economics - Farm profitability
  {
    topic: 'rentabilidad finca',
    keywords: ['rentabilidad', 'ganancia', 'costo', 'costos', 'beneficio', 'margen', 'precio', 'utilidad', 'ingreso'],
    generate: (data) => {
      const activeModules = Object.entries(data.farmConfig.modules).filter(([, v]) => v).map(([k]) => k);
      return `**Rentabilidad de la Finca Diversificada**

Tienes ${activeModules.length} módulo(s) activo(s): ${activeModules.map(m => m === 'coffee' ? 'Café' : m === 'rice' ? 'Arroz' : 'Ganadería').join(', ')}.

**Diversificación = estabilidad:**
La integración de cultivos reduce el riesgo económico. Si el precio del café baja, el arroz o la ganadería compensan.

**Indicadores clave a monitorear:**
1. **Costos de producción por hectárea:** Incluye insumos, mano de obra, maquinaria
2. **Rendimiento por hectárea:** kg/ha o ton/ha según cultivo
3. **Precio de venta:** Registro mensual del precio en el mercado
4. **Margen bruto:** Ingreso bruto - costos directos
5. **Rotación de capital:** Cuánto tarda en recuperarse la inversión

**Rangos típicos de rendimiento:**
- **Café:** 800-1500 kg/ha café pergamino seco (variedad y manejo dependiente)
- **Arroz:** 4-8 ton/ha paddy (con riego y manejo adecuado)
- **Ganadería de carne:** 0.5-1.2 kg/animal/día ganancia

**Consejos:**
- Registra todos los costos en la pestaña Economía para ver márgenes reales
- El compost propio reduce costos de fertilización hasta 40%
- La rotación SIPAS ahorra hasta 70% en herbicidas para arroz

Usa el módulo de **Economía** para registrar tus costos e ingresos y ver el análisis de rentabilidad por cultivo.`;
    },
  },
  // General - Soil conservation
  {
    topic: 'conservacion suelo',
    keywords: ['conservacion suelo', 'conservación suelo', 'erosion', 'erosión', 'cobertura', 'cubierta vegetal', 'terrazas', 'curvas nivel', 'materia organica suelo'],
    generate: () => `**Conservación de Suelos**

El suelo es el activo más valioso de la finca. Su pérdida por erosión puede tardar décadas en recuperarse.

**Principios de conservación:**
1. **Cobertura permanente:** Mantener el suelo cubierto con coberturas vivas o muertas (hojarasca, paja)
2. **Cero labranza o mínima:** Reducir el arado para no romper la estructura
3. **Curvas a nivel:** En pendientes, sembrar y construir terrazas siguiendo curvas de nivel
4. **Barreras vivas:** Filas de pasto vetiver, guinea o leguminosas en contorno
5. **Materia orgánica:** Aplicar compost, pulpa de café, estiércol cada ciclo

**Para café en ladera:**
- Terrazas individuales por planta
- Cobertura con hojarasca y pulpa de café
- Barreras vivas cada 8-10 metros de desnivel
- No quemar residuos

**Para arroz:**
- Nivelar el terreno para riego uniforme
- Rotación con pastura (SIPAS) mejora estructura
- Aplicar compost antes de cada ciclo

**Beneficios:**
- Reduce erosión hasta 90%
- Aumenta retención de agua (menos riego necesario)
- Mejora biodiversidad del suelo (microorganismos, lombrices)
- Aumenta productividad a largo plazo

Un suelo con 3% de materia orgánica retiene 2 veces más agua que uno con 1%.`,
  },
  // General - Carbon footprint
  {
    topic: 'huella carbono',
    keywords: ['carbono', 'co2', 'huella', 'emisiones', 'emision', 'mitigacion', 'mitigación', 'carbono organico', 'secuestro'],
    generate: () => `**Huella de Carbono en la Agricultura**

La agricultura contribuye al cambio climático pero también puede ser parte de la solución.

**Fuentes de emisión en la finca:**
- **Ganadería:** Fermentación entérica (metano) — la fuente principal
- **Fertilizantes nitrogenados:** Óxido nitroso (N2O), gas 300 veces más potente que CO2
- **Combustible:** Tractores, motosierras, transporte
- **Quema de residuos:** Libera CO2 y pierde materia orgánica

**Estrategias de mitigación:**
1. **Compostaje:** Evita quemar residuos, secuestra carbono en el suelo
2. **Árboles y sombra:** Cada árbol de sombra captura 20-50 kg CO2/año
3. **Rotación SIPAS:** Pastura permanente secuestra carbono en raíces
4. **Eficiencia de fertilización:** Aplicar solo lo necesario, reducir N2O
5. **Carga animal óptima:** Evitar sobrepastoreo mejora captura de carbono del pasto
6. **Cero quema:** Incorporar residuos en lugar de quemar

**El suelo como sumidero:**
Un suelo con 3% materia orgánica en 1 hectárea almacena ~60 toneladas de CO2. Cada 1% adicional captura ~30 toneladas.

Usa el módulo de **Huella CO₂** para registrar tus emisiones y ver el balance de tu finca.`,
  },
  {
    topic: 'punto de equilibrio',
    keywords: ['punto de equilibrio', 'equilibrio', 'costo fijo', 'costos fijos', 'costo variable', 'costos variables', 'cuanto debo vender', 'cuánto debo vender'],
    generate: () => `**Costos y Punto de Equilibrio**

**Tipos de costos:**
- **Fijos:** no cambian con la producción (arriendo, depreciación de equipos, salarios permanentes)
- **Variables:** dependen de lo que produces (semilla, fertilizante, jornales de cosecha, transporte)

**Fórmula del punto de equilibrio:**
Unidades = Costos fijos ÷ (Precio de venta − Costo variable por unidad)

**Ejemplo:** Costos fijos de 10.000.000, precio del kg de café 12.000 y costo variable 7.000 por kg → 10.000.000 ÷ 5.000 = **2.000 kg** para no perder.

**Recomendaciones:**
1. Calcula el costo por kilo de cada cultivo, no solo el total de la finca
2. Si el precio de mercado está por debajo de tu costo variable, cada kilo vendido genera pérdida
3. Reduce costos variables con compost propio y control biológico

Registra tus costos en el módulo de **Economía** para calcularlo con tus datos reales.`,
  },
  {
    topic: 'credito financiamiento',
    keywords: ['credito', 'crédito', 'prestamo', 'préstamo', 'financiamiento', 'financiar', 'banco', 'interes', 'interés', 'deuda'],
    generate: () => `**Crédito y Financiamiento Agrícola**

**Cuándo conviene endeudarse:**
- Para inversiones que generan ingresos: riego, renovación de cafetales, mejora genética, maquinaria
- No para cubrir gastos corrientes recurrentes

**Antes de firmar:**
1. Compara la **tasa efectiva anual**, no solo la mensual
2. Pide un **periodo de gracia** que coincida con el tiempo hasta la primera cosecha
3. Ajusta las cuotas al calendario de cosecha (pagos semestrales o al vender)
4. Las cuotas no deberían superar el **30-40% del flujo de caja** esperado

**Fuentes habituales:** bancos agrarios públicos, cooperativas, fondos de garantía y líneas de fomento con tasas subsidiadas para pequeños productores.`,
  },
  {
    topic: 'inflacion tipo de cambio',
    keywords: ['inflacion', 'inflación', 'dolar', 'dólar', 'tipo de cambio', 'devaluacion', 'devaluación', 'precios suben', 'economia del pais', 'economía del país'],
    generate: () => `**Inflación, Tipo de Cambio y tu Finca**

**Cómo te afecta:**
- La **inflación** encarece insumos, combustible y mano de obra
- Una **devaluación** sube el costo de fertilizantes y agroquímicos importados
- Pero también **favorece a quien exporta**: el precio del café se fija en dólares

**Estrategias de protección:**
1. Compra insumos con anticipación cuando los precios estén estables
2. Produce tu propio abono (compost, biol) para depender menos de importados
3. Diversifica: café para exportación + arroz y ganadería para mercado local
4. Revisa tus precios de venta con frecuencia y negocia contratos con ajuste

La economía circular de tu finca es también una **protección contra la inflación**.`,
  },
  {
    topic: 'comercializacion mercado',
    keywords: ['comercializacion', 'comercialización', 'mercado', 'vender', 'venta', 'intermediario', 'cooperativa', 'exportar', 'exportacion', 'exportación', 'certificacion', 'certificación'],
    generate: () => `**Comercialización y Mercados**

**Para obtener mejor precio:**
1. **Vende en grupo:** cooperativas y asociaciones negocian volúmenes mayores y reducen intermediarios
2. **Agrega valor:** café especial, tostado propio, arroz empacado con marca local
3. **Certificaciones:** orgánico, comercio justo o Rainforest pagan primas sobre el precio base
4. **Registra precios mensuales** para identificar la mejor época de venta

**Canales posibles:**
- Venta directa a consumidores y mercados campesinos
- Tiendas y restaurantes locales
- Exportadores de cafés especiales
- Compras públicas (programas de alimentación escolar)

Una buena calidad en la poscosecha es lo que más influye en el precio final.`,
  },
  {
    topic: 'flujo de caja riesgo',
    keywords: ['flujo de caja', 'presupuesto', 'ahorro', 'ahorrar', 'liquidez', 'seguro', 'seguro agricola', 'seguro agrícola', 'riesgo', 'subsidio', 'subsidios', 'economia', 'economía', 'finanzas', 'dinero'],
    generate: () => `**Finanzas de la Finca: Flujo de Caja y Riesgo**

**Flujo de caja:**
La agricultura tiene ingresos estacionales. Un presupuesto mensual con entradas y salidas te permite anticipar los meses sin cosecha.

**Buenas prácticas:**
1. Separa las cuentas de la finca de los gastos del hogar
2. Mantén un **fondo de reserva** equivalente a 3 meses de gastos operativos
3. Registra cada ingreso y gasto en el módulo de **Economía**

**Gestión del riesgo:**
- **Diversificación:** café, arroz y ganadería compensan caídas de precio o clima
- **Seguros agrícolas:** cubren pérdidas por sequía, inundación o heladas
- **Programas de apoyo:** consulta subsidios y líneas de fomento con tu cooperativa o entidad agraria

¿Quieres que profundice en costos, crédito, precios o inflación?`,
  },
];

const fallbackResponses: string[] = [
  `Hola, soy el asistente agronómico de AgroSinergia 360. Puedo ayudarte con temas de **café, arroz, ganadería, suelos, riego, plagas, fertilización, economía circular y manejo integrado**.\n\nPregúntame cosas como:\n- "¿Cómo controlo la roya?"\n- "¿Qué pH necesita el café?"\n- "¿Cómo funciona la rotación SIPAS?"\n- "¿Cuándo vacunar mi ganado?"\n- "¿Cómo hacer compost?"\n- "¿Cómo conservar el suelo?"`,
  `Puedo ayudarte con información agronómica sobre café, arroz y ganadería. Intenta preguntarme sobre plagas, fertilización, riego, pastoreo, compostaje, conservación de suelos o rentabilidad. También puedo darte recomendaciones basadas en los datos que has registrado en la app.`,
  `No tengo información específica sobre eso, pero puedo ayudarte con:\n\n• **Café:** Roya, minador, antracnosis, ojo de gallo, broca, pH, fertilización, variedades, sombra\n• **Arroz:** SIPAS, riego, arroz rojo, humedad, nutrición, zinc\n• **Ganadería:** Pastoreo rotacional, vacunación, reproducción, peso, estrés térmico\n• **General:** Compost, clima, MIPE, planificación, conservación de suelos, huella de carbono\n• **Economía:** Rentabilidad, costos, punto de equilibrio, crédito, inflación, comercialización, flujo de caja y seguros\n\n¿Sobre cuál de estos temas te gustaría saber más?`,
];

function renderGuideSections(guide: LocalGuide, sections: GuideSection[]): string {
  const body = sections.map((s) => `**${s.title}:** ${s.content}`).join('\n\n');
  return `**Según tu guía activa "${guide.title}":**\n\n${body}`;
}

export function generateResponse(query: string, data: AppData, guide?: LocalGuide | null): string {
  const base = generateBaseResponse(query, data);
  if (!guide || !query.trim()) return base.text;

  const sections = findRelevantSections(guide, query);
  if (sections.length > 0) {
    const guidePart = renderGuideSections(guide, sections);
    return base.matched ? `${guidePart}\n\n---\n\n${base.text}` : guidePart;
  }

  const topics = guide.sections.map((s) => s.title).join(', ');
  const note = `*Guía activa: **${guide.title}**. Puedes preguntarme sobre: ${topics}.*`;
  return `${base.text}\n\n${note}`;
}

function generateBaseResponse(query: string, data: AppData): { text: string; matched: boolean } {
  const text = generateRuleResponse(query, data);
  return { text, matched: !fallbackResponses.includes(text) };
}

function generateRuleResponse(query: string, data: AppData): string {
  const lower = query.toLowerCase().trim();

  if (!lower) return fallbackResponses[0];

  let bestMatch: KnowledgeRule | null = null;
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        score += kw.split(' ').length > 1 ? 3 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.generate(data);
  }

  // Check for greetings
  if (lower.match(/^(hola|buenas|saludos|hey|hi|hello)\b/)) {
    return fallbackResponses[0];
  }

  // Check for thanks
  if (lower.match(/(gracias|muchas gracias|genial|excelente|perfecto|muchas gracias)/)) {
    return `¡De nada! Estoy aquí para ayudarte con cualquier consulta sobre tu finca. Puedes preguntarme cuando quieras.`;
  }

  // Check for help
  if (lower.match(/(ayuda|help|que puedes hacer|qué puedes hacer|opciones|temas)/)) {
    return `Puedo ayudarte con estos temas:\n\n☕ **Café:** Roya, minador, antracnosis, pH del suelo, fertilización, variedades\n🌾 **Arroz:** Rotación SIPAS, riego, arroz rojo, humedad del suelo\n🐄 **Ganadería:** Pastoreo rotacional, vacunación, reproducción, peso y nutrición\n🌱 **General:** Compostaje, clima, MIPE, planificación de finca\n\nSolo escribe tu pregunta y te responderé con recomendaciones personalizadas según los datos de tu finca.`;
  }

  return fallbackResponses[2];
}

export const SUGGESTED_QUESTIONS = [
  '¿Cómo controlo la roya del café?',
  '¿Qué pH necesita el café?',
  '¿Cómo funciona la rotación SIPAS?',
  '¿Cuándo debo vacunar mi ganado?',
  '¿Cómo hacer compost con estiércol?',
  '¿Qué es el pastoreo rotacional?',
  '¿Cuánta agua necesita el arroz?',
  '¿Cómo elimino el arroz rojo?',
  '¿Cómo manejo la antracnosis del café?',
  '¿Cómo conservar el suelo de mi finca?',
];

export function getSuggestedQuestions(language: 'es' | 'en' | 'pt'): string[] {
  if (language === 'en') return [
    'How do I control coffee rust?',
    'What pH does coffee need?',
    'How does SIPAS rotation work?',
    'When should I vaccinate my cattle?',
    'How do I make compost with manure?',
    'What is rotational grazing?',
    'How much water does rice need?',
    'How do I remove red rice?',
    'How do I manage coffee anthracnose?',
    'How can I conserve my farm soil?',
  ];
  if (language === 'pt') return [
    'Como controlo a ferrugem do café?',
    'Qual pH o café precisa?',
    'Como funciona a rotação SIPAS?',
    'Quando devo vacinar meu gado?',
    'Como fazer composto com esterco?',
    'O que é pastejo rotacionado?',
    'Quanta água o arroz precisa?',
    'Como eliminar o arroz vermelho?',
    'Como manejo a antracnose do café?',
    'Como conservar o solo da fazenda?',
  ];
  return SUGGESTED_QUESTIONS;
}
