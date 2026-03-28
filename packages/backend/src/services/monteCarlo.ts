export interface MonteCarloInput {
  totalAssets: number
  annualPension: number
  currentAge: number
  retirementAge: number
  annualSpend: number
  simulationYears?: number
  numSimulations?: number
}

export interface MonteCarloResult {
  successProbability: number
  projections: Array<{
    year: number
    median: number
    p10: number
    p90: number
  }>
}

// Box-Muller transform for normal distribution
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + stdDev * z
}

export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const {
    totalAssets,
    annualPension,
    currentAge,
    retirementAge,
    annualSpend,
    simulationYears = 40,
    numSimulations = 10000,
  } = input

  const meanReturn = 0.055 // 5.5% real return (60/40 portfolio)
  const stdDev = 0.11 // 11% standard deviation
  const inflationRate = 0.032 // 3.2% inflation

  // Track results per year for percentile calculations
  const yearlyPortfolios: number[][] = Array.from({ length: simulationYears }, () => [])
  let successes = 0

  for (let sim = 0; sim < numSimulations; sim++) {
    let portfolio = totalAssets
    let failed = false

    for (let year = 1; year <= simulationYears; year++) {
      const age = currentAge + year

      // Annual return (log-normal)
      const annualReturn = randomNormal(meanReturn, stdDev)
      portfolio *= (1 + annualReturn)

      // Add pension if retired
      if (age >= retirementAge) {
        portfolio += annualPension
      }

      // Subtract inflation-adjusted spending
      const adjustedSpend = annualSpend * Math.pow(1 + inflationRate, year)
      portfolio -= adjustedSpend

      if (portfolio <= 0) {
        portfolio = 0
        failed = true
      }

      yearlyPortfolios[year - 1].push(portfolio)
    }

    if (!failed) successes++
  }

  // Calculate percentiles for each year
  const projections = yearlyPortfolios.map((values, index) => {
    values.sort((a, b) => a - b)
    const p10Index = Math.floor(values.length * 0.1)
    const medianIndex = Math.floor(values.length * 0.5)
    const p90Index = Math.floor(values.length * 0.9)

    return {
      year: index + 1,
      median: Math.round(values[medianIndex]),
      p10: Math.round(values[p10Index]),
      p90: Math.round(values[p90Index]),
    }
  })

  return {
    successProbability: Math.round((successes / numSimulations) * 100),
    projections,
  }
}
