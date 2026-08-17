import type { Edge } from "@shared/utils/graph"
import type Random from "@shared/utils/random"
import { Automaton, type AutomatonNode } from "./automaton"

/**
 * Generates a (deterministic) Finite Automaton.
 * @param random random seed
 * @param size number of states
 * @param alphabet input alphabet (default: ["0", "1"])
 * @param isDFA bool for deterministic or not
 * @param edgeChance probability of an edge between states (only for NFA)
 * @param selfLoopChance probability of self-loops
 * @param epsilonTransitionChance probability of ε-transitions (only for NFA)
 * @param multiStartChance probability of multiple start states (only for NFA)
 * @param pruneUnreachable bool whether to remove unreachable states
 */
function generateFiniteAutomaton(
  random: Random,
  size: number,
  alphabet: string[] = ["0", "1"],
  isDFA: boolean,
  edgeChance: number = 0.5,
  selfLoopChance: number = 0.2,
  epsilonTransitionChance: number = 0.1,
  multiStartChance: number = 0.3,
  pruneUnreachable: boolean = true,
): Automaton {
  const nodes: AutomatonNode[] = Array.from({ length: size }, (_, i) => ({
    label: `q_${i}`,
    coords: { x: random.float(0, 10), y: random.float(0, 10) },
    isStart: i === 0, // q_0 is always a start state
    isEnd: false,
  }))

  const edges: Edge[][] = Array.from({ length: size }, () => [])

  // allow multiple start states for NFAs
  if (!isDFA) {
    for (let i = 1; i < size; i++) {
      if (random.float(0, 1) < multiStartChance) {
        nodes[i].isStart = true
      }
    }
  }

  // assign end nodes (1-3 randomly chosen)
  random
    .shuffle([...Array(size).keys()])
    .slice(0, random.int(1, 3))
    .forEach((index) => {
      nodes[index].isEnd = true
    })

  // add transitions
  for (let i = 0; i < size; i++) {
    if (isDFA) {
      // ensure exactly one transition per symbol
      const availableTargets = random.shuffle([...Array(size).keys()].filter((j) => j !== i))
      for (const symbol of alphabet) {
        edges[i].push({
          source: i,
          target: availableTargets.pop() ?? i,
          value: parseInt(symbol),
        })
      }
    } else {
      // NFA: add transitions with edgeChance
      for (let j = 0; j < size; j++) {
        if (i !== j && random.float(0, 1) < edgeChance) {
          edges[i].push({
            source: i,
            target: j,
            value: parseInt(random.choice(alphabet)),
          })
        }
      }

      // ε-transitions
      if (random.float(0, 1) < epsilonTransitionChance) {
        edges[i].push({
          source: i,
          target: random.int(0, size - 1),
          value: undefined,
        })
      }
    }

    // add self-loops (replacement transition if DFA)
    if (random.float(0, 1) < selfLoopChance) {
      const loopSymbol = parseInt(random.choice(alphabet))

      if (isDFA) {
        const index = edges[i].findIndex((e) => e.value === loopSymbol)
        if (index !== -1) {
          edges[i][index] = { source: i, target: i, value: loopSymbol }
        }
      } else {
        edges[i].push({ source: i, target: i, value: loopSymbol })
      }
    }
  }

  const automaton = new Automaton(nodes, edges, true, true, isDFA)
  return pruneUnreachable ? pruneUnreachableStates(automaton) : automaton
}

/** Generates Deterministic Finite Automaton (DFA) */
export function generateDFA(
  random: Random,
  size: number,
  alphabet: string[] = ["0", "1"],
  selfLoopChance = 0.2,
  pruneUnreachable = true,
): Automaton {
  return generateFiniteAutomaton(
    random,
    size,
    alphabet,
    true,
    0.5,
    selfLoopChance,
    0,
    0,
    pruneUnreachable,
  )
}

/** Generates Nondeterministic Finite Automaton (NFA) */
export function generateNFA(
  random: Random,
  size: number,
  alphabet: string[] = ["0", "1"],
  edgeChance = 0.5,
  selfLoopChance = 0.2,
  epsilonTransitionChance = 0.1,
  multiStartChance = 0.3,
  pruneUnreachable = true,
): Automaton {
  return generateFiniteAutomaton(
    random,
    size,
    alphabet,
    false,
    edgeChance,
    selfLoopChance,
    epsilonTransitionChance,
    multiStartChance,
    pruneUnreachable,
  )
}

/**
 * Prune states that are not reachable from any start state.
 */
export function pruneUnreachableStates(automaton: Automaton): Automaton {
  const reachable = new Set<string>()
  const stack = automaton
    .getStartNodes()
    .map((n) => n.label)
    .filter((label): label is string => !!label)

  while (stack.length > 0) {
    const current = stack.pop()
    if (current && !reachable.has(current)) {
      reachable.add(current)
      const nodeIndex = automaton.nodes.findIndex((n) => n.label === current)
      if (nodeIndex !== -1) {
        for (const edge of automaton.getOutgoingEdges(automaton.nodes[nodeIndex])) {
          const targetLabel = automaton.nodes[edge.target]?.label
          if (targetLabel) stack.push(targetLabel)
        }
      }
    }
  }

  // filter nodes and map to new indices
  const filteredNodes = automaton.nodes
    .filter((n) => n.label && reachable.has(n.label))
    .map((n, newIndex) => ({ ...n, label: `q_${newIndex}` })) // Reindex labels sequentially

  // build index mapping
  const indexMap = new Map<string, number>()
  filteredNodes.forEach((node, newIndex) => {
    if (node.label) indexMap.set(node.label, newIndex)
  })

  // update edges with new indices
  const filteredEdges = filteredNodes.map((node) => {
    const oldIndex = automaton.nodes.findIndex((n) => n.label === node.label)
    return automaton.edges[oldIndex]
      .filter((edge) => {
        const targetLabel = automaton.nodes[edge.target]?.label
        return targetLabel !== undefined && reachable.has(targetLabel)
      })
      .map((edge) => ({
        source: indexMap.get(automaton.nodes[edge.source]?.label ?? "") ?? 0,
        target: indexMap.get(automaton.nodes[edge.target]?.label ?? "") ?? 0,
        value: edge.value,
      }))
  })

  return new Automaton(
    filteredNodes,
    filteredEdges,
    automaton.directed,
    automaton.weighted,
    automaton.isDFA,
  )
}
