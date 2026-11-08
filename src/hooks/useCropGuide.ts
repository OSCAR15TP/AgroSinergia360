import { useState, useEffect } from 'react';
import type { LocalGuide } from '@/lib/localGuides';
import { fetchGuideIndex, fetchGuide } from '@/lib/localGuides';
import type { CropKey } from '@/lib/cropCalendar';

const GUIDE_CACHE: Record<string, LocalGuide> = {};

export function useCropGuide(crop: CropKey): { guide: LocalGuide | null; loading: boolean } {
  const [guide, setGuide] = useState<LocalGuide | null>(GUIDE_CACHE[crop] ?? null);
  const [loading, setLoading] = useState(!GUIDE_CACHE[crop]);

  useEffect(() => {
    if (GUIDE_CACHE[crop]) {
      setGuide(GUIDE_CACHE[crop]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const index = await fetchGuideIndex();
        const meta = index.find((m) => m.module === crop);
        if (!meta) {
          if (!cancelled) setLoading(false);
          return;
        }
        const loaded = await fetchGuide(meta);
        if (cancelled) return;
        GUIDE_CACHE[crop] = loaded;
        setGuide(loaded);
      } catch {
        // guide not available
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [crop]);

  return { guide, loading };
}
