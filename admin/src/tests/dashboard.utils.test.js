import {
  formatCurrency,
  normalizeDate,
  computeTotalsFromItems
} from "../Components/Dashboard/Dashboard";

import { describe, test, expect } from "vitest";

describe("Dashboard utils – unit tests", () => {

  // ========================
  // formatCurrency
  // ========================
  describe("formatCurrency", () => {
    test("format đúng số VND", () => {
      const result = formatCurrency(150000);
      expect(result).toMatch(/150\.000/);
      expect(result).toMatch(/₫/);
    });

    test("string number vẫn format được", () => {
      const result = formatCurrency("200000");
      expect(result).toMatch(/200\.000/);
      expect(result).toMatch(/₫/);
    });

    test("giá trị không hợp lệ → 0 ₫", () => {
      const result = formatCurrency("abc");
      expect(result).toMatch(/0/);
      expect(result).toMatch(/₫/);
    });
  });

  // ========================
  // normalizeDate
  // ========================
  describe("normalizeDate", () => {
    test("chuỗi ngày hợp lệ → Date object", () => {
      const date = normalizeDate("2025-01-01");
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2025);
    });

    test("null → null", () => {
      expect(normalizeDate(null)).toBeNull();
    });

    test("chuỗi ngày sai → null", () => {
      expect(normalizeDate("abc")).toBeNull();
    });
  });

  // ========================
  // computeTotalsFromItems
  // ========================
  describe("computeTotalsFromItems", () => {
    test("tính tổng đúng", () => {
      const items = [
        { price: 10000, quantity: 2 },
        { price: 20000, quantity: 1 }
      ];
      expect(computeTotalsFromItems(items)).toBe(40000);
    });

    test("item thiếu price/quantity → bỏ qua", () => {
      const items = [
        { price: 10000 },
        { quantity: 2 },
        {}
      ];
      expect(computeTotalsFromItems(items)).toBe(0);
    });

    test("items rỗng → 0", () => {
      expect(computeTotalsFromItems([])).toBe(0);
    });
  });

});
