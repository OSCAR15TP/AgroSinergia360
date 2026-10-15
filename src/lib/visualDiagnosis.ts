import type { VisualDiagnosisResult } from '@/components/ImageDiagnosisModal';

export function analyzeRicePhoto(photoDataUrl: string): Promise<VisualDiagnosisResult> {
  void photoDataUrl;
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const results: VisualDiagnosisResult[] = [
        {
          label: 'Planta de arroz saludable',
          confidence: 0.86,
          severity: 'success',
          summary: 'La imagen no muestra señales claras de daño foliar o estrés severo.',
          recommendations: ['Mantén el monitoreo semanal.', 'Revisa la humedad por zonas antes de decidir el riego.'],
        },
        {
          label: 'Posible estrés hídrico',
          confidence: 0.79,
          severity: 'warning',
          summary: 'Se observan hojas con coloración y postura compatibles con falta de agua.',
          recommendations: ['Comprueba la lectura de humedad en varios puntos del lote.', 'Riega solo las zonas que estén por debajo del objetivo.'],
        },
        {
          label: 'Posible daño por enfermedad o plaga',
          confidence: 0.74,
          severity: 'danger',
          summary: 'Se observan manchas o cambios de color que requieren confirmación en campo.',
          recommendations: ['Aísla la zona afectada y toma fotografías más cercanas.', 'Consulta a un técnico antes de aplicar productos.'],
        },
      ];
      resolve(results[Math.floor(Math.random() * results.length)]);
    }, 650);
  });
}

export function analyzeLivestockPhoto(photoDataUrl: string): Promise<VisualDiagnosisResult> {
  void photoDataUrl;
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const results: VisualDiagnosisResult[] = [
        {
          label: 'Condición corporal adecuada',
          confidence: 0.88,
          severity: 'success',
          summary: 'La imagen sugiere una condición corporal estable, sin signos visibles de alarma.',
          recommendations: ['Mantén agua limpia y sombra disponible.', 'Registra el peso para confirmar la evolución.'],
        },
        {
          label: 'Revisar condición corporal',
          confidence: 0.77,
          severity: 'warning',
          summary: 'La silueta puede indicar pérdida de condición o una necesidad nutricional mayor.',
          recommendations: ['Realiza un pesaje y revisa la dieta.', 'Observa apetito, marcha y comportamiento durante 24 horas.'],
        },
        {
          label: 'Posible signo de salud',
          confidence: 0.72,
          severity: 'danger',
          summary: 'La imagen muestra un signo que debe ser revisado por una persona veterinaria.',
          recommendations: ['Separa el animal si hay secreciones, heridas o decaimiento.', 'No administres medicamentos sin diagnóstico profesional.'],
        },
      ];
      resolve(results[Math.floor(Math.random() * results.length)]);
    }, 650);
  });
}

export function analyzeGeneralPhoto(photoDataUrl: string): Promise<VisualDiagnosisResult> {
  void photoDataUrl;
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const results: VisualDiagnosisResult[] = [
        {
          label: 'Sin signos visibles de problema',
          confidence: 0.85,
          severity: 'success',
          summary: 'La imagen no muestra señales claras de plagas, enfermedades o estrés en el cultivo o animal.',
          recommendations: ['Continúa con el monitoreo regular.', 'Registra tus observaciones para llevar un historial.'],
        },
        {
          label: 'Posible estrés o condición a revisar',
          confidence: 0.78,
          severity: 'warning',
          summary: 'Se observan cambios de color, manchas o postura que podrían indicar estrés hídrico, nutricional o早期的 signos de enfermedad.',
          recommendations: ['Toma una fotografía más cercana del área afectada.', 'Compara con días anteriores si tienes registros.'],
        },
        {
          label: 'Posible plaga o enfermedad',
          confidence: 0.74,
          severity: 'danger',
          summary: 'La imagen muestra manchas, lesiones o daños compatibles con una plaga o enfermedad.',
          recommendations: ['Aísla el área afectada para evitar propagación.', 'Consulta al asistente IA con detalles del cultivo para recomendaciones específicas.'],
        },
      ];
      resolve(results[Math.floor(Math.random() * results.length)]);
    }, 650);
  });
}
