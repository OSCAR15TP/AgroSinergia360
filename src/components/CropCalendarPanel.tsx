import { useState, useEffect, useMemo } from 'react';
import {
  Sprout, Wheat, Flower2, Cherry, ShoppingBasket, Scissors,
  Droplets, FlaskConical, Bug, Eye, CheckCircle2, Circle,
  BookOpen, ChevronDown, ChevronUp, CalendarDays, Info,
} from 'lucide-react';
import type { AppData, FarmEvent } from '@/types';
import type { CropKey, PhenologyStage, CalendarActivity } from '@/lib/cropCalendar';
import {
  getCropCalendar, getActivitiesForStage, findGuideSectionForActivity,
  CATEGORY_LABELS, CATEGORY_COLORS,
} from '@/lib/cropCalendar';
import type { LocalGuide, GuideSection } from '@/lib/localGuides';
import { Badge } from '@/components/UI';

const STAGE_ICONS: Record<string, typeof Sprout> = {
  sprout: Sprout,
  wheat: Wheat,
  flower: Flower2,
  cherry: Cherry,
  circle: ShoppingBasket,
  shopping: ShoppingBasket,
  scissors: Scissors,
};

const CATEGORY_ICONS: Record<CalendarActivity['category'], typeof Droplets> = {
  poda: Scissors,
  fertilizacion: FlaskConical,
  riego: Droplets,
  sanidad: Bug,
  cosecha: ShoppingBasket,
  monitoreo: Eye,
};

interface CropCalendarPanelProps {
  crop: CropKey;
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  guide: LocalGuide | null;
}

export function CropCalendarPanel({ crop, data, update, guide }: CropCalendarPanelProps) {
  const calendar = getCropCalendar(crop);
  const [activeStageId, setActiveStageId] = useState<string>(calendar.stages[0]?.id ?? '');

  const moduleKey = crop === 'cafe' ? 'coffee' : crop === 'arroz' ? 'rice' : 'cacao';

  const cropEvents = useMemo(
    () => data.events.filter((e) => e.module === moduleKey).sort((a, b) => b.date.localeCompare(a.date)),
    [data.events, moduleKey],
  );

  const isActivityDone = (activityId: string): boolean => {
    return cropEvents.some((e) => e.title.includes(activityId) || e.description.includes(activityId));
  };

  const toggleActivity = (activity: CalendarActivity, stage: PhenologyStage) => {
    const existing = cropEvents.find((e) => e.title.includes(activity.id));
    if (existing) {
      update((prev) => ({
        ...prev,
        events: prev.events.map((e) =>
          e.id === existing.id ? { ...e, done: !e.done } : e,
        ),
      }));
    } else {
      const newEvent: FarmEvent = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toISOString().slice(0, 10),
        type: activity.category === 'monitoreo' ? 'sanidad' : activity.category,
        title: `${activity.id} — ${activity.title}`,
        description: activity.description,
        module: moduleKey as FarmEvent['module'],
        done: false,
      };
      update((prev) => ({ ...prev, events: [newEvent, ...prev.events] }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-grove-600" />
          <h3 className="text-sm font-bold text-earth-800 dark:text-earth-100">
            Calendario fenológico — {calendar.cropName}
          </h3>
        </div>
        <p className="text-xs text-earth-500 dark:text-earth-400 mb-3">
          Ciclo aproximado: {calendar.cycleDays[0]}–{calendar.cycleDays[1]} días. Selecciona una etapa para ver las actividades recomendadas.
        </p>

        {/* Stage timeline */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {calendar.stages.map((stage, index) => {
            const Icon = STAGE_ICONS[stage.icon] ?? Sprout;
            const isActive = stage.id === activeStageId;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`flex-shrink-0 rounded-xl border p-3 text-center transition-all min-w-[110px] ${
                  isActive
                    ? 'border-grove-500 bg-grove-50 dark:bg-grove-950/40 shadow-sm'
                    : 'border-earth-100 dark:border-earth-800 bg-white dark:bg-earth-900 hover:border-grove-300'
                }`}
              >
                <div className={`mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full ${
                  isActive ? 'bg-grove-600 text-white' : 'bg-earth-100 dark:bg-earth-800 text-earth-500'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className={`text-[11px] font-bold ${isActive ? 'text-grove-700 dark:text-grove-300' : 'text-earth-700 dark:text-earth-200'}`}>
                  {stage.name}
                </p>
                <p className="text-[9px] text-earth-400 mt-0.5">
                  {stage.durationDays[0]}–{stage.durationDays[1]} días
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active stage detail */}
      {(() => {
        const stage = calendar.stages.find((s) => s.id === activeStageId);
        if (!stage) return null;
        const activities = getActivitiesForStage(crop, stage.id);
        return (
          <div className="card p-4 animate-fade-in">
            <div className="mb-3">
              <h4 className="text-sm font-bold text-earth-900 dark:text-earth-100">{stage.name}</h4>
              <p className="text-xs text-earth-500 dark:text-earth-400 mt-1">{stage.description}</p>
            </div>

            {activities.length === 0 ? (
              <p className="text-sm text-earth-400">Sin actividades específicas para esta etapa.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    done={isActivityDone(activity.id)}
                    onToggle={() => toggleActivity(activity, stage)}
                    guide={guide}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Recent activities log */}
      {cropEvents.length > 0 && (
        <div className="card p-4">
          <h4 className="mb-2 text-xs font-semibold text-earth-500 dark:text-earth-400 uppercase tracking-wide">
            Actividades registradas
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {cropEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="flex items-center gap-2 text-xs">
                {event.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-grove-600" />
                ) : (
                  <Circle className="h-3.5 w-3.5 flex-shrink-0 text-earth-300" />
                )}
                <span className="text-earth-400">{new Date(event.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
                <span className={`flex-1 truncate ${event.done ? 'text-earth-400 line-through' : 'text-earth-700 dark:text-earth-200'}`}>
                  {event.title.split(' — ')[1] ?? event.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityCard({
  activity,
  done,
  onToggle,
  guide,
}: {
  activity: CalendarActivity;
  done: boolean;
  onToggle: () => void;
  guide: LocalGuide | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [guideSection, setGuideSection] = useState<GuideSection | null>(null);

  useEffect(() => {
    if (guide && expanded && !guideSection) {
      setGuideSection(findGuideSectionForActivity(guide, activity));
    }
  }, [guide, expanded, activity, guideSection]);

  const CategoryIcon = CATEGORY_ICONS[activity.category];
  const colorKey = CATEGORY_COLORS[activity.category] as 'grove' | 'harvest' | 'sky' | 'clay' | 'earth';

  return (
    <div className={`rounded-xl border p-3 transition-colors ${
      done ? 'border-grove-200 bg-grove-50/50 dark:bg-grove-950/20 dark:border-grove-800' : 'border-earth-100 dark:border-earth-800 bg-white dark:bg-earth-900'
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-all ${
            done ? 'bg-grove-600 text-white' : 'border-2 border-earth-200 dark:border-earth-700 hover:border-grove-400'
          }`}
          aria-label={done ? 'Marcar como pendiente' : 'Marcar como hecha'}
        >
          {done && <CheckCircle2 className="h-3 w-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${
              colorKey === 'grove' ? 'bg-grove-100 text-grove-700 dark:bg-grove-900 dark:text-grove-300' :
              colorKey === 'harvest' ? 'bg-harvest-100 text-harvest-700 dark:bg-harvest-900 dark:text-harvest-300' :
              colorKey === 'sky' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300' :
              colorKey === 'clay' ? 'bg-clay-100 text-clay-700 dark:bg-clay-900 dark:text-clay-300' :
              'bg-earth-100 text-earth-700 dark:bg-earth-800 dark:text-earth-300'
            }`}>
              <CategoryIcon className="h-3.5 w-3.5" />
            </span>
            <p className={`text-sm font-semibold ${done ? 'text-earth-400 line-through' : 'text-earth-800 dark:text-earth-100'}`}>
              {activity.title}
            </p>
            <Badge color={colorKey}>{CATEGORY_LABELS[activity.category]}</Badge>
          </div>

          <p className="mt-1.5 text-xs text-earth-600 dark:text-earth-300 leading-relaxed">
            {activity.description}
          </p>
          <p className="mt-1 text-[11px] text-earth-400 flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {activity.timing}
          </p>

          {guide && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-grove-600 hover:text-grove-700 dark:text-grove-400 transition-colors"
            >
              <BookOpen className="h-3 w-3" />
              Ver ficha técnica
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}

          {expanded && guideSection && (
            <div className="mt-2 rounded-lg bg-earth-50 dark:bg-earth-800/60 p-3 animate-slide-down">
              <p className="text-[11px] font-bold text-earth-700 dark:text-earth-200">{guideSection.title}</p>
              <p className="mt-1 text-[11px] text-earth-600 dark:text-earth-300 leading-relaxed">
                {guideSection.content}
              </p>
            </div>
          )}

          {expanded && !guideSection && guide && (
            <div className="mt-2 rounded-lg bg-earth-50 dark:bg-earth-800/60 p-3 animate-slide-down">
              <p className="text-[11px] text-earth-500 flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                No hay una sección específica en la ficha técnica para esta actividad.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
