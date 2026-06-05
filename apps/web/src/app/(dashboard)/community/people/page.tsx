'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import api from '@/lib/api';
import {
  ProfessionTypeahead,
  type ProfessionOption,
} from '@/components/profession-typeahead';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/SearchableSelect';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommunityPerson {
  id: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  primaryProfession?: ProfessionOption;
  secondaryProfessions?: ProfessionOption[];
  otherProfession?: string;
  shortBio?: string;
}

interface BackendCommunityPerson {
  id: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  professions: {
    id: string;
    nameHe: string;
    isPrimary: boolean;
    category: { id: string; nameHe: string };
  }[];
  otherProfession?: string | null;
  shortBio?: string | null;
}

interface PeopleResponse {
  data: {
    items: BackendCommunityPerson[];
    nextCursor: string | null;
  };
}

interface CatalogCategory {
  id: string;
  nameHe: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) return '972' + digits.slice(1);
  return digits;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('');
}

// ---------------------------------------------------------------------------
// PersonCard
// ---------------------------------------------------------------------------

function PersonCard({ person }: { person: CommunityPerson }) {
  const initials = getInitials(person.fullName);
  const waText = encodeURIComponent('שלום, ראיתי אותך בקהילה');
  const waHref = person.phone
    ? `https://wa.me/${formatPhone(person.phone)}?text=${waText}`
    : null;

  return (
    <div className="card-elevated flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {person.avatarUrl ? (
          <img
            src={person.avatarUrl}
            alt={person.fullName}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-title-sm font-bold text-primary">{initials}</span>
          </div>
        )}

        {/* Name + professions */}
        <div className="flex-1 min-w-0">
          <p className="text-title-sm font-bold truncate">{person.fullName}</p>

          {person.primaryProfession && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm font-medium">
              {person.primaryProfession.nameHe}
            </span>
          )}

          {person.secondaryProfessions && person.secondaryProfessions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {person.secondaryProfessions.map((p) => (
                <span
                  key={p.id}
                  className="inline-block px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-label-xs"
                >
                  {p.nameHe}
                </span>
              ))}
            </div>
          )}

          {person.otherProfession && (
            <p className="text-label-sm text-on-surface-variant italic mt-0.5">
              {person.otherProfession}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {person.shortBio && (
        <p className="text-body-sm text-on-surface-variant line-clamp-2">
          {person.shortBio}
        </p>
      )}

      {/* WhatsApp button */}
      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#128C7E] text-label-sm font-medium hover:bg-[#25D366]/20 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.124 1.529 5.857L.057 23.786a.75.75 0 00.92.92l5.93-1.472A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.9 0-3.7-.503-5.27-1.437l-.376-.219-3.88.963.98-3.783-.238-.393A9.712 9.712 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
          </svg>
          שלח הודעה
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="card-elevated space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-surface-container flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-surface-container" />
          <div className="h-3 w-1/3 rounded-full bg-surface-container" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-surface-container" />
      <div className="h-3 w-2/3 rounded bg-surface-container" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const LIMIT = 12;

export default function CommunityPeoplePage() {
  const [nameQuery, setNameQuery] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<ProfessionOption | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);

  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Debounce name query 300ms
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedName(nameQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nameQuery]);

  // Load categories on mount
  useEffect(() => {
    api
      .get<{ data: Array<{ id: string; nameHe: string; professions: unknown[] }> }>('/professions')
      .then((res) => {
        setCategories((res.data.data ?? []).map((c) => ({ id: c.id, nameHe: c.nameHe })));
      })
      .catch(() => {});
  }, []);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, string> = { limit: String(LIMIT) };
    if (debouncedName) params.q = debouncedName;
    if (selectedCategory) params.categoryId = selectedCategory;
    if (selectedProfession) params.professionId = selectedProfession.id;
    return params;
  }, [debouncedName, selectedCategory, selectedProfession]);

  const fetchPeople = useCallback(
    async (cursor?: string) => {
      const isFirstPage = !cursor;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setFetchError(null);

      try {
        const params = new URLSearchParams(queryParams);
        if (cursor) params.set('cursor', cursor);
        const res = await api.get<PeopleResponse>(`/community/people?${params.toString()}`);
        const payload = res.data?.data ?? { items: [], nextCursor: null };
        const items: CommunityPerson[] = (payload.items ?? []).map((bp) => {
          const primary = bp.professions.find((p) => p.isPrimary);
          const secondary = bp.professions.filter((p) => !p.isPrimary);
          return {
            id: bp.id,
            fullName: bp.fullName,
            phone: bp.phone ?? undefined,
            avatarUrl: bp.avatarUrl ?? undefined,
            primaryProfession: primary
              ? { id: primary.id, nameHe: primary.nameHe, category: primary.category }
              : undefined,
            secondaryProfessions: secondary.map((p) => ({
              id: p.id,
              nameHe: p.nameHe,
              category: p.category,
            })),
            otherProfession: bp.otherProfession ?? undefined,
            shortBio: bp.shortBio ?? undefined,
          };
        });
        const nc = payload.nextCursor ?? null;

        if (isFirstPage) {
          setPeople(items);
        } else {
          setPeople((prev) => [...prev, ...items]);
        }
        setNextCursor(nc);
      } catch {
        setFetchError('שגיאה בטעינת הנתונים, נסה שוב');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [queryParams],
  );

  // Refetch when filters change
  useEffect(() => {
    fetchPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName, selectedCategory, selectedProfession]);

  const hasFilters = !!nameQuery || !!selectedCategory || !!selectedProfession;

  const clearFilters = () => {
    setNameQuery('');
    setSelectedCategory('');
    setSelectedProfession(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6" dir="rtl">
      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {/* Name/text search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-label-sm text-on-surface-variant mb-1">
            חיפוש לפי שם או תיאור
          </label>
          <input
            type="text"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="שם, ביוגרפיה..."
            className="w-full rounded-lg border border-outline bg-surface px-3 py-2.5 text-body-md text-right placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            dir="rtl"
          />
        </div>

        {/* Category dropdown */}
        <div className="min-w-[160px]">
          <label className="block text-label-sm text-on-surface-variant mb-1">
            קטגוריה
          </label>
          <SearchableSelect
            value={selectedCategory}
            onChange={(v) => setSelectedCategory(v)}
            clearable
            placeholder="כל הקטגוריות"
            searchPlaceholder="חפש קטגוריה..."
            options={categories.map<SearchableSelectOption>((cat) => ({
              value: cat.id,
              label: cat.nameHe,
            }))}
          />

        </div>

        {/* Profession typeahead */}
        <div className="min-w-[200px] flex-1">
          <label className="block text-label-sm text-on-surface-variant mb-1">
            מקצוע ספציפי
          </label>
          <ProfessionTypeahead
            mode="single"
            value={selectedProfession}
            onChange={(v) => setSelectedProfession(v as ProfessionOption | null)}
            placeholder="חפש מקצוע..."
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="self-end px-4 py-2.5 rounded-lg border border-outline text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            נקה סינון
          </button>
        )}
      </div>

      {/* Result count */}
      {!loading && !fetchError && people.length > 0 && (
        <p className="text-label-sm text-on-surface-variant">
          {`מציג ${people.length} תוצאות${nextCursor ? '+' : ''}`}
        </p>
      )}

      {/* Error state */}
      {fetchError && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {fetchError}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && people.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && people.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-title-md font-medium mb-1">לא נמצאו אנשים התואמים לחיפוש</p>
          <p className="text-body-sm text-on-surface-variant">
            נסה לשנות את הסינון או לחפש לפי מונח אחר
          </p>
        </div>
      )}

      {/* Load more */}
      {!loading && nextCursor && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => fetchPeople(nextCursor)}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-lg border border-outline text-body-md hover:bg-surface-container disabled:opacity-50 transition-colors"
          >
            {loadingMore ? 'טוען...' : 'טען עוד'}
          </button>
        </div>
      )}
    </div>
  );
}
