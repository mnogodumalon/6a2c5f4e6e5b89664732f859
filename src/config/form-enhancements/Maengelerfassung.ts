// Auto-generated. Per-entity form-enhancements config for "Mängelerfassung".
// The sandbox sub-agent (Step 0) may overwrite this file with a richer config.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["baustelle", "mangeltyp", "prioritaet", "mangel_status", "meldedatum", "mangel_beschreibung", "firma_name", {"row": ["firma_ansprechpartner_vorname", "firma_ansprechpartner_nachname"]}, "firma_telefon", "mangel_bemerkungen"],
  defaults: {
    'meldedatum': { kind: 'today', withTime: true },
    'mangel_status': { kind: 'lookup', key: 'offen', label: 'Offen' },
    'prioritaet': { kind: 'lookup', key: 'mittel', label: 'Mittel' },
  },
  computed: {},
};

// Build-time-populated field dependencies for MODUS-2 arrow functions in
// `computed`. The sub-agent leaves this empty; scripts/parse-formulas.mjs
// fills it after Step 0 by regex-extracting ctx.* calls from each function
// body. The dialog feeds these into classifyComputed so MODUS-2 entries get
// inline anchors instead of always landing in the aggregate section.
export const computedDeps: Record<string, string[]> = {};

// Build-time-populated applookup (ownKey → lookupKey) pairs found in MODUS-2
// arrow functions. Filled by scripts/parse-formulas.mjs from regex matches
// on `ctx.applookup('x','y')` and `ctx.applookupAny('x','y')`. The dialog
// merges this with MODUS-1 refs extracted at render time, so every numeric
// field the formula pulls from a selected lookup is surfaced as an inline
// hint next to the lookup combobox.
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
