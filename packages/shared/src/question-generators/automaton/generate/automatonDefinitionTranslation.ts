import type { Translations } from "@shared/utils/translations.ts"

export const adt: Translations = {
  en: {
    introDFA: `Let $\\mathcal{A}=(Q,\\Sigma,{{0}},F,\\delta)$ be a DFA where $\\\\$`,
    introNFA: `Let $\\mathcal{A}=(Q,\\Sigma,S,F,\\delta)$ be a NFA where $\\\\$`,
    startsNFA: `$S = \\{{{0}}\\}$ is the set of start states`,
    states: `$Q = \\{{{0}}\\}$ is the set of states`,
    sigma: `$\\Sigma = \\{{{0}}\\}$ is the input alphabet`,
    final: `$F = \\{{{0}}\\}$ is the set of accepting states`,
    deltaTable: "and $\\delta$ is defined by the following transition table:",
    deltaDefinition: "and $\\delta$ is given as: $\\\\$",
    deltaEmpty: "and we have no transitions, i.e., $\\delta$ is an empty function.",
  },
  de: {
    introDFA: `Sei $\\mathcal{A}=(Q,\\Sigma,{{0}},F,\\delta)$ ein DFA wobei $\\\\$`,
    introNFA: `Sei $\\mathcal{A}=(Q,\\Sigma,S,F,\\delta)$ ein NFA wobei $\\\\$`,
    startsNFA: `$S = \\{{{0}}\\}$ ist die Menge der Startzustände`,
    states: `$Q = \\{{{0}}\\}$ ist die Zustandsmenge`,
    sigma: `$\\Sigma = \\{{{0}}\\}$ ist das Eingabealphabet`,
    final: `$F = \\{{{0}}\\}$ ist die Menge der akzeptierenden Zustände`,
    deltaTable: "and $\\delta$ ist über die folgende Übergangstabelle definiert:",
    deltaDefinition: "und $\\delta$ ist gegeben durch: $\\\\$",
    deltaEmpty: "und es gibt keine Übergänge, d.h. $\\delta$ ist eine leere Funktion.",
  },
}
