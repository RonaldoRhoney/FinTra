import { describe, expect, it } from "vitest";
import type { Account, Budget, Goal, GoalContribution, Transaction, TransactionCategory } from "../types/finance";
import {
  aggregateByCategory,
  calculateBalance,
  calculateBudgetProgress,
  calculateGoalProgress,
  calculateSavingsRate,
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
