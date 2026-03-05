import { compress, type CompressionStrategy } from './strategies.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { estimateTokens } from '../utils/token-estimator.js';

export interface OptimizeResponseOptions {
  intent?: string;
  maxOutputTokens?: number;
  preferredStrategy?: CompressionStrategy;
  toolName?: string;
  isError?: boolean;
}

export interface OptimizationCandidate {
  label: string;
  strategy: CompressionStrategy;
  output: string;
  outputChars: number;
  outputTokens: number;
  withinBudget: boolean;
  nonEmpty: boolean;
  keepsErrorMarker: boolean;
  valid: boolean;
}

export interface OptimizeResponseResult {
  output: string;
  chosenStrategy: CompressionStrategy;
  inputTokens: number;
  outputTokens: number;
  budgetChars: number;
  budgetForced: boolean;
  changed: boolean;
  candidates: OptimizationCandidate[];
}

const DEFAULT_CHARS_PER_TOKEN = 4;
const ERROR_MARKERS = ['Error', 'STDERR', 'Exit code', 'TIMEOUT'] as const;
const STRATEGY_ORDER: Record<CompressionStrategy, number> = {
  summarize: 0,
  filter: 1,
  truncate: 2,
  auto: 3,
  'as-is': 4,
};

function resolveBudgetChars(maxOutputTokens?: number): number {
  if (
    typeof maxOutputTokens === 'number' &&
    Number.isFinite(maxOutputTokens) &&
    maxOutputTokens > 0
  ) {
    return Math.max(1, Math.floor(maxOutputTokens * DEFAULT_CHARS_PER_TOKEN));
  }

  const configured = DEFAULT_CONFIG.compression.maxOutputBytes;
  if (Number.isFinite(configured) && configured > 0) {
    return Math.max(1, Math.floor(configured));
  }

  return 8_000;
}

function clampToBudget(text: string, budgetChars: number): string {
  return text.length <= budgetChars ? text : text.slice(0, budgetChars);
}

function getPresentErrorMarkers(text: string): string[] {
  return ERROR_MARKERS.filter(marker => text.toLowerCase().includes(marker.toLowerCase()));
}

function keepsAnyMarker(text: string, markers: string[]): boolean {
  if (markers.length === 0) return true;
  const normalized = text.toLowerCase();
  return markers.some(marker => normalized.includes(marker.toLowerCase()));
}

function bestErrorMarker(markers: string[], budgetChars: number): string | null {
  const fitting = markers.filter(marker => marker.length <= budgetChars);
  if (fitting.length === 0) return null;
  return fitting.sort((a, b) => a.length - b.length)[0] ?? null;
}

function asCandidate(
  label: string,
  strategy: CompressionStrategy,
  output: string,
  budgetChars: number,
  requireNonEmpty: boolean,
  enforceErrorMarkers: boolean,
  markers: string[]
): OptimizationCandidate {
  const outputChars = output.length;
  const outputTokens = estimateTokens(output).tokens;
  const withinBudget = outputChars <= budgetChars;
  const nonEmpty = output.length > 0;
  const keepsErrorMarker = keepsAnyMarker(output, markers);
  const valid =
    withinBudget && (!requireNonEmpty || nonEmpty) && (!enforceErrorMarkers || keepsErrorMarker);

  return {
    label,
    strategy,
    output,
    outputChars,
    outputTokens,
    withinBudget,
    nonEmpty,
    keepsErrorMarker,
    valid,
  };
}

function compareCandidates(a: OptimizationCandidate, b: OptimizationCandidate): number {
  if (a.outputTokens !== b.outputTokens) return a.outputTokens - b.outputTokens;
  if (a.outputChars !== b.outputChars) return a.outputChars - b.outputChars;
  const ar = STRATEGY_ORDER[a.strategy] ?? Number.MAX_SAFE_INTEGER;
  const br = STRATEGY_ORDER[b.strategy] ?? Number.MAX_SAFE_INTEGER;
  if (ar !== br) return ar - br;
  return a.label.localeCompare(b.label);
}

function buildFallbackCandidate(
  text: string,
  budgetChars: number,
  markers: string[],
  requireNonEmpty: boolean,
  enforceErrorMarkers: boolean
): OptimizationCandidate {
  let output = clampToBudget(text, budgetChars);

  if (!output && text.length > 0) {
    output = text.slice(0, 1);
  }

  if (enforceErrorMarkers && !keepsAnyMarker(output, markers)) {
    const marker = bestErrorMarker(markers, budgetChars);
    if (marker) {
      output = marker;
    }
  }

  return asCandidate(
    'fallback-clamp',
    'truncate',
    output,
    budgetChars,
    requireNonEmpty,
    false,
    markers
  );
}

export function optimizeResponse(
  text: string,
  options: OptimizeResponseOptions = {}
): OptimizeResponseResult {
  const budgetChars = resolveBudgetChars(options.maxOutputTokens);
  const inputTokens = estimateTokens(text).tokens;
  const presentMarkers = options.isError ? getPresentErrorMarkers(text) : [];
  const minMarkerChars = presentMarkers.reduce(
    (min, marker) => Math.min(min, marker.length),
    Number.MAX_SAFE_INTEGER
  );
  const enforceErrorMarkers =
    Boolean(options.isError) &&
    presentMarkers.length > 0 &&
    budgetChars >= (Number.isFinite(minMarkerChars) ? minMarkerChars : 0);
  const requireNonEmpty = text.length > 0;

  const candidates: OptimizationCandidate[] = [];
  const seen = new Set<string>();

  const pushCandidate = (label: string, strategy: CompressionStrategy, output: string): void => {
    const key = `${label}\u0000${strategy}\u0000${output}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(
      asCandidate(
        label,
        strategy,
        output,
        budgetChars,
        requireNonEmpty,
        enforceErrorMarkers,
        presentMarkers
      )
    );
  };

  pushCandidate('raw', 'as-is', text);

  const summarize = compress(text, {
    intent: options.intent,
    strategy: 'summarize',
    maxOutputChars: budgetChars,
  }).output;
  pushCandidate('summarize', 'summarize', summarize);

  const truncate = compress(text, {
    intent: options.intent,
    strategy: 'truncate',
    maxOutputChars: budgetChars,
  }).output;
  pushCandidate('truncate', 'truncate', truncate);

  if (options.intent) {
    const filter = compress(text, {
      intent: options.intent,
      strategy: 'filter',
      maxOutputChars: budgetChars,
    }).output;
    pushCandidate('filter', 'filter', filter);
  }

  if (options.preferredStrategy) {
    const preferred = compress(text, {
      intent: options.intent,
      strategy: options.preferredStrategy,
      maxOutputChars: budgetChars,
    }).output;
    pushCandidate('preferred', options.preferredStrategy, preferred);
  }

  pushCandidate('hard-clamp', 'truncate', clampToBudget(text, budgetChars));

  const valid = candidates.filter(candidate => candidate.valid);
  const ranked = valid.sort(compareCandidates);
  const chosen =
    ranked[0] ??
    buildFallbackCandidate(text, budgetChars, presentMarkers, requireNonEmpty, enforceErrorMarkers);

  return {
    output: chosen.output,
    chosenStrategy: chosen.strategy,
    inputTokens,
    outputTokens: chosen.outputTokens,
    budgetChars,
    budgetForced: text.length > budgetChars,
    changed: chosen.output !== text,
    candidates,
  };
}
