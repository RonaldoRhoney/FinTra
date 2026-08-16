import { describe, expect, it } from "vitest";
import type { Account, Budget, Goal, GoalContribution, Transaction, TransactionCategory } from "../types/finance";
import {
  aggregateByCategory,
  aggregateMonthlyHistory,
  analyzeCategoryTrends,
  calculateBalance,
  calculateBudgetProgress,
  calculateGoalProgress,
  calculateSavingsRate,
  calculateVariation,
  detectAnomalies,
  estimateSavingsCapacity,
  generateInsights,
  insightDedupeKey,
  previousPeriodRange,
  projectCashFlow,
  projectGoalCompletion,
  summarizePeriod,
} from "./financialEngine";

const account: Account = {
  id: "acc-1",
  name: "Conta principal",
  institutionName: null,
  accountType: "corrente",
  initialBalance: 1000,
};

const categories: TransactionCategory[] = [
  { id: "cat-income", name: "Salário", categoryType: "income", color: "#16a34a" },
  { id: "cat-food", name: "Alimentação", categoryType: "expense", color: "#eab308" },
  { id: "cat-transport", name: "Transporte", categoryType: "expense", color: "#3b82f6" },
];

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    accountId: account.id,
    categoryId: null,
    transactionType: "expense",
    amount: 0,
    description: null,
    occurredAt: "2026-08-01",
    ...overrides,
  };
}

describe("calculateBalance", () => {
  it("soma saldo inicial com entradas e saídas", () => {
    const transactions = [
      tx({ transactionType: "income", amount: 500 }),
      tx({ transactionType: "expense", amount: 200 }),
    ];
    expect(calculateBalance([account], transactions)).toBe(1300);
  });

  it("retorna o saldo inicial quando não há transações", () => {
    expect(calculateBalance([account], [])).toBe(1000);
  });
});

describe("summarizePeriod", () => {
  it("separa entradas e saídas e calcula o líquido", () => {
    const transactions = [
      tx({ transactionType: "income", amount: 3000 }),
      tx({ transactionType: "expense", amount: 1200 }),
      tx({ transactionType: "expense", amount: 300 }),
    ];
    const summary = summarizePeriod(transactions);
    expect(summary).toEqual({ income: 3000, expenses: 1500, net: 1500 });
  });

  it("filtra por intervalo de data quando informado", () => {
    const transactions = [
      tx({ transactionType: "income", amount: 1000, occurredAt: "2026-07-15" }),
      tx({ transactionType: "income", amount: 2000, occurredAt: "2026-08-15" }),
    ];
    const summary = summarizePeriod(transactions, { from: "2026-08-01", to: "2026-08-31" });
    expect(summary.income).toBe(2000);
  });
});

describe("calculateSavingsRate", () => {
  it("calcula a taxa de economia normalmente", () => {
    expect(calculateSavingsRate(1000, 700)).toBeCloseTo(0.3);
  });

  it("retorna null quando não há renda (evita divisão por zero)", () => {
    expect(calculateSavingsRate(0, 100)).toBeNull();
  });

  it("pode ser negativa quando o gasto supera a renda", () => {
    expect(calculateSavingsRate(1000, 1500)).toBeCloseTo(-0.5);
  });
});

describe("aggregateByCategory", () => {
  it("agrupa por categoria e calcula percentual do total", () => {
    const transactions = [
      tx({ transactionType: "expense", amount: 600, categoryId: "cat-food" }),
      tx({ transactionType: "expense", amount: 400, categoryId: "cat-food" }),
      tx({ transactionType: "expense", amount: 500, categoryId: "cat-transport" }),
      tx({ transactionType: "income", amount: 5000, categoryId: "cat-income" }),
    ];

    const result = aggregateByCategory(transactions, categories, "expense");

    expect(result).toEqual([
      { categoryId: "cat-food", name: "Alimentação", color: "#eab308", total: 1000, percentage: 1000 / 1500 },
      { categoryId: "cat-transport", name: "Transporte", color: "#3b82f6", total: 500, percentage: 500 / 1500 },
    ]);
  });

  it("ignora transações sem categoria", () => {
    const transactions = [tx({ transactionType: "expense", amount: 100, categoryId: null })];
    expect(aggregateByCategory(transactions, categories, "expense")).toEqual([]);
  });
});

describe("calculateBudgetProgress", () => {
  const budget: Budget = { id: "b1", categoryId: "cat-food", referenceMonth: "2026-08", limitAmount: 800 };

  it("calcula gasto, restante e percentual dentro do mês do orçamento", () => {
    const transactions = [
      tx({ transactionType: "expense", amount: 300, categoryId: "cat-food", occurredAt: "2026-08-05" }),
      tx({ transactionType: "expense", amount: 200, categoryId: "cat-food", occurredAt: "2026-08-20" }),
      tx({ transactionType: "expense", amount: 999, categoryId: "cat-food", occurredAt: "2026-07-20" }),
    ];

    const progress = calculateBudgetProgress(budget, transactions);

    expect(progress.spent).toBe(500);
    expect(progress.remaining).toBe(300);
    expect(progress.percentage).toBeCloseTo(0.625);
    expect(progress.isOverBudget).toBe(false);
  });

  it("marca isOverBudget quando o gasto ultrapassa o limite", () => {
    const transactions = [tx({ transactionType: "expense", amount: 900, categoryId: "cat-food", occurredAt: "2026-08-05" })];
    expect(calculateBudgetProgress(budget, transactions).isOverBudget).toBe(true);
  });
});

describe("calculateGoalProgress", () => {
  const goal: Goal = { id: "g1", name: "Viagem", targetAmount: 8000, targetDate: null };

  it("soma as contribuições e calcula o percentual", () => {
    const contributions: GoalContribution[] = [
      { id: "c1", goalId: "g1", amount: 3200, contributedAt: "2026-07-01" },
      { id: "c2", goalId: "g1", amount: 800, contributedAt: "2026-08-01" },
    ];
    const progress = calculateGoalProgress(goal, contributions);
    expect(progress.currentAmount).toBe(4000);
    expect(progress.percentage).toBeCloseTo(0.5);
    expect(progress.isComplete).toBe(false);
  });

  it("não deixa o percentual passar de 1 mesmo com contribuição acima da meta", () => {
    const contributions: GoalContribution[] = [{ id: "c1", goalId: "g1", amount: 9000, contributedAt: "2026-08-01" }];
    const progress = calculateGoalProgress(goal, contributions);
    expect(progress.percentage).toBe(1);
    expect(progress.isComplete).toBe(true);
  });
});

describe("aggregateMonthlyHistory", () => {
  it("gera um ponto por mês, do mais antigo pro mais recente, terminando no mês de referência", () => {
    const transactions = [
      tx({ transactionType: "income", amount: 1000, occurredAt: "2026-06-10" }),
      tx({ transactionType: "expense", amount: 300, occurredAt: "2026-07-10" }),
      tx({ transactionType: "income", amount: 2000, occurredAt: "2026-08-10" }),
    ];
    const history = aggregateMonthlyHistory(transactions, 3, "2026-08");
    expect(history.map((h) => h.month)).toEqual(["2026-06", "2026-07", "2026-08"]);
    expect(history[0].income).toBe(1000);
    expect(history[1].expenses).toBe(300);
    expect(history[2].income).toBe(2000);
  });

  it("atravessa a virada de ano corretamente", () => {
    const history = aggregateMonthlyHistory([], 3, "2026-01");
    expect(history.map((h) => h.month)).toEqual(["2025-11", "2025-12", "2026-01"]);
  });
});

describe("analyzeCategoryTrends", () => {
  it("calcula a variação do mês atual contra a média dos meses anteriores", () => {
    const transactions = [
      tx({ transactionType: "expense", amount: 400, categoryId: "cat-food", occurredAt: "2026-06-10" }),
      tx({ transactionType: "expense", amount: 400, categoryId: "cat-food", occurredAt: "2026-07-10" }),
      tx({ transactionType: "expense", amount: 600, categoryId: "cat-food", occurredAt: "2026-08-10" }),
    ];
    const [trend] = analyzeCategoryTrends(transactions, categories, "expense", "2026-08", 3);
    expect(trend.categoryId).toBe("cat-food");
    expect(trend.averageTotal).toBe(400); // média dos 2 meses anteriores com gasto (junho e julho)
    expect(trend.hasEnoughHistory).toBe(true);
    expect(trend.variation).toBeCloseTo(0.5); // 600 vs média de 400 = +50%
  });

  it("não calcula variação sem histórico suficiente (evita insight enganoso)", () => {
    const transactions = [tx({ transactionType: "expense", amount: 400, categoryId: "cat-food", occurredAt: "2026-08-10" })];
    const [trend] = analyzeCategoryTrends(transactions, categories, "expense", "2026-08", 3);
    expect(trend.hasEnoughHistory).toBe(false);
    expect(trend.variation).toBeNull();
  });
});

describe("detectAnomalies", () => {
  it("sinaliza uma transação muito acima da média da categoria", () => {
    const transactions = [
      tx({ transactionType: "expense", amount: 50, categoryId: "cat-food", occurredAt: "2026-08-01" }),
      tx({ transactionType: "expense", amount: 55, categoryId: "cat-food", occurredAt: "2026-08-05" }),
      tx({ transactionType: "expense", amount: 45, categoryId: "cat-food", occurredAt: "2026-08-10" }),
      tx({ transactionType: "expense", amount: 500, categoryId: "cat-food", occurredAt: "2026-08-15" }),
    ];
    const anomalies = detectAnomalies(transactions, categories, { minSamples: 3, thresholdMultiplier: 2 });
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].amount).toBe(500);
  });

  it("não sinaliza nada com poucas transações na categoria (evita falso positivo)", () => {
    const transactions = [
      tx({ transactionType: "expense", amount: 50, categoryId: "cat-food", occurredAt: "2026-08-01" }),
      tx({ transactionType: "expense", amount: 500, categoryId: "cat-food", occurredAt: "2026-08-15" }),
    ];
    expect(detectAnomalies(transactions, categories, { minSamples: 3 })).toEqual([]);
  });
});

describe("estimateSavingsCapacity", () => {
  it("calcula a média do líquido mensal com histórico suficiente", () => {
    const history = [
      { month: "2026-06", income: 3000, expenses: 2000, net: 1000 },
      { month: "2026-07", income: 3000, expenses: 2500, net: 500 },
    ];
    expect(estimateSavingsCapacity(history, 2)).toEqual({ averageMonthlyNet: 750, hasEnoughHistory: true });
  });

  it("marca hasEnoughHistory=false com poucos meses de movimentação real", () => {
    const history = [
      { month: "2026-06", income: 0, expenses: 0, net: 0 },
      { month: "2026-07", income: 3000, expenses: 2500, net: 500 },
    ];
    expect(estimateSavingsCapacity(history, 2).hasEnoughHistory).toBe(false);
  });
});

describe("projectCashFlow", () => {
  it("projeta o saldo futuro a partir da média histórica", () => {
    const history = [
      { month: "2026-06", income: 3000, expenses: 2500, net: 500 },
      { month: "2026-07", income: 3000, expenses: 2500, net: 500 },
    ];
    const projection = projectCashFlow(1000, history, 3, 2);
    expect(projection.hasEnoughHistory).toBe(true);
    expect(projection.projectedBalances).toEqual([1500, 2000, 2500]);
  });

  it("retorna hasEnoughHistory=false sem dado suficiente, em vez de projetar no vazio", () => {
    const projection = projectCashFlow(1000, [], 3, 2);
    expect(projection.hasEnoughHistory).toBe(false);
    expect(projection.projectedBalances).toEqual([]);
  });
});

describe("projectGoalCompletion", () => {
  it("calcula o aporte mensal necessário pra bater o prazo", () => {
    const goal: Goal = { id: "g1", name: "Viagem", targetAmount: 4800, targetDate: "2026-12-15" };
    const projection = projectGoalCompletion(goal, [], "2026-08-15");
    expect(projection.requiredMonthlyContribution).toBeCloseTo(1200); // 4800 / 4 meses
  });

  it("projeta conclusão a partir do ritmo histórico de contribuição da própria meta", () => {
    const goal: Goal = { id: "g1", name: "Viagem", targetAmount: 3000, targetDate: null };
    const contributions: GoalContribution[] = [
      { id: "c1", goalId: "g1", amount: 500, contributedAt: "2026-06-10" },
      { id: "c2", goalId: "g1", amount: 500, contributedAt: "2026-07-10" },
    ];
    const projection = projectGoalCompletion(goal, contributions, "2026-08-15");
    expect(projection.projectedCompletionMonths).toBe(4); // falta 2000, ritmo de 500/mês (1000 acumulado em 2 meses)
  });

  it("não projeta conclusão com contribuição em um único mês (sem ritmo pra medir)", () => {
    const goal: Goal = { id: "g1", name: "Viagem", targetAmount: 3000, targetDate: null };
    const contributions: GoalContribution[] = [{ id: "c1", goalId: "g1", amount: 500, contributedAt: "2026-08-10" }];
    const projection = projectGoalCompletion(goal, contributions, "2026-08-15");
    expect(projection.projectedCompletionMonths).toBeNull();
  });
});

describe("generateInsights", () => {
  it("gera insight de categoria fora do padrão só quando há histórico suficiente", () => {
    const insights = generateInsights({
      categoryTrends: [
        { categoryId: "cat-food", name: "Alimentação", color: "#eab308", currentTotal: 1000, averageTotal: 500, variation: 1, hasEnoughHistory: true },
      ],
      anomalies: [],
      cashFlow: { monthsAhead: 3, projectedBalances: [], averageMonthlyNet: 0, hasEnoughHistory: false },
      goalProjections: [],
      savingsCapacity: { averageMonthlyNet: 0, hasEnoughHistory: false },
    });
    expect(insights).toEqual([
      { kind: "category_spike", categoryId: "cat-food", categoryName: "Alimentação", variation: 1, amount: 1000 },
    ]);
  });

  it("só sinaliza meta fora do ritmo quando o aporte necessário excede a capacidade de economia real", () => {
    const insights = generateInsights({
      categoryTrends: [],
      anomalies: [],
      cashFlow: { monthsAhead: 3, projectedBalances: [], averageMonthlyNet: 0, hasEnoughHistory: false },
      goalProjections: [
        {
          goalId: "g1",
          goalName: "Viagem",
          targetAmount: 5000,
          currentAmount: 0,
          remaining: 5000,
          percentage: 0,
          isComplete: false,
          requiredMonthlyContribution: 1000,
          projectedCompletionMonths: null,
        },
      ],
      savingsCapacity: { averageMonthlyNet: 600, hasEnoughHistory: true },
    });
    expect(insights).toEqual([
      { kind: "goal_off_track", goalId: "g1", goalName: "Viagem", requiredMonthlyContribution: 1000, availableCapacity: 600 },
    ]);
  });

  it("não sinaliza meta fora do ritmo sem capacidade de economia conhecida (evita alarme falso)", () => {
    const insights = generateInsights({
      categoryTrends: [],
      anomalies: [],
      cashFlow: { monthsAhead: 3, projectedBalances: [], averageMonthlyNet: 0, hasEnoughHistory: false },
      goalProjections: [
        {
          goalId: "g1",
          goalName: "Viagem",
          targetAmount: 5000,
          currentAmount: 0,
          remaining: 5000,
          percentage: 0,
          isComplete: false,
          requiredMonthlyContribution: 1000,
          projectedCompletionMonths: null,
        },
      ],
      savingsCapacity: { averageMonthlyNet: 0, hasEnoughHistory: false },
    });
    expect(insights).toEqual([]);
  });
});

describe("previousPeriodRange", () => {
  it("retorna o período imediatamente anterior, com a mesma duração", () => {
    expect(previousPeriodRange({ from: "2026-08-01", to: "2026-08-30" })).toEqual({
      from: "2026-07-02",
      to: "2026-07-31",
    });
  });

  it("funciona pra um único dia", () => {
    expect(previousPeriodRange({ from: "2026-08-15", to: "2026-08-15" })).toEqual({
      from: "2026-08-14",
      to: "2026-08-14",
    });
  });

  it("atravessa a virada de ano corretamente", () => {
    expect(previousPeriodRange({ from: "2026-01-01", to: "2026-01-07" })).toEqual({
      from: "2025-12-25",
      to: "2025-12-31",
    });
  });
});

describe("calculateVariation", () => {
  it("calcula a variação percentual entre dois valores", () => {
    expect(calculateVariation(150, 100)).toBeCloseTo(0.5);
    expect(calculateVariation(50, 100)).toBeCloseTo(-0.5);
  });

  it("retorna null quando o valor anterior é zero (evita divisão por zero)", () => {
    expect(calculateVariation(100, 0)).toBeNull();
  });
});

describe("insightDedupeKey", () => {
  it("gera a mesma chave pro mesmo tipo de insight sobre a mesma categoria", () => {
    const a = insightDedupeKey({ kind: "category_spike", categoryId: "cat-food" });
    const b = insightDedupeKey({ kind: "category_spike", categoryId: "cat-food", amount: 999 });
    expect(a).toBe(b);
  });

  it("gera chaves diferentes pra categorias diferentes", () => {
    const a = insightDedupeKey({ kind: "category_spike", categoryId: "cat-food" });
    const b = insightDedupeKey({ kind: "category_spike", categoryId: "cat-transport" });
    expect(a).not.toBe(b);
  });

  it("usa goalId quando não há categoryId", () => {
    expect(insightDedupeKey({ kind: "goal_off_track", goalId: "g1" })).toBe("goal_off_track:g1");
  });

  it("cai em 'general' quando não há categoria nem meta associada", () => {
    expect(insightDedupeKey({ kind: "negative_cash_flow" })).toBe("negative_cash_flow:general");
  });
});
