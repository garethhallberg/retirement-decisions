import { runMonteCarlo } from './monteCarlo.js'
import type { MonteCarloResult } from './monteCarlo.js'

export interface ScenarioInput {
  totalAssets: number
  annualPension: number
  currentAge: number
  targetRetirementAge: number
  fixedAnnualSpend: number
  discretionaryAnnualSpend: number
}

export interface GeneratedScenario {
  type: 'bold_exit' | 'balanced_path' | 'legacy_chapter'
  retirementAge: number
  annualSpend: number
  successProbability: number
  projectionData: MonteCarloResult['projections']
}

export function generateThreeScenarios(input: ScenarioInput): GeneratedScenario[] {
  const totalSpend = input.fixedAnnualSpend + input.discretionaryAnnualSpend

  const configs = [
    {
      type: 'bold_exit' as const,
      retirementAge: Math.max(input.targetRetirementAge - 10, 50),
      annualSpend: Math.round(totalSpend * 0.75),
    },
    {
      type: 'balanced_path' as const,
      retirementAge: input.targetRetirementAge,
      annualSpend: totalSpend,
    },
    {
      type: 'legacy_chapter' as const,
      retirementAge: input.targetRetirementAge + 5,
      annualSpend: Math.round(totalSpend * 1.5),
    },
  ]

  return configs.map((config) => {
    const result = runMonteCarlo({
      totalAssets: input.totalAssets,
      annualPension: input.annualPension,
      currentAge: input.currentAge,
      retirementAge: config.retirementAge,
      annualSpend: config.annualSpend,
      numSimulations: 10000,
    })

    return {
      type: config.type,
      retirementAge: config.retirementAge,
      annualSpend: config.annualSpend,
      successProbability: result.successProbability,
      projectionData: result.projections,
    }
  })
}

export function recalculateSingleScenario(
  totalAssets: number,
  annualPension: number,
  currentAge: number,
  retirementAge: number,
  annualSpend: number
): { successProbability: number; projectionData: MonteCarloResult['projections'] } {
  const result = runMonteCarlo({
    totalAssets,
    annualPension,
    currentAge,
    retirementAge,
    annualSpend,
    numSimulations: 1000, // Faster for real-time slider updates
  })

  return {
    successProbability: result.successProbability,
    projectionData: result.projections,
  }
}
