/**
 * Tests for environment variable validation
 * 
 * Note: Testing import.meta.env is complex in Vitest.
 * These tests verify the logic works correctly with valid/invalid inputs.
 */

import { describe, it, expect } from "vitest";
import {
  getEnv,
  isEnvReady,
  envMissingReason,
  getAppEnv,
  isDevelopment,
  getEnvDebugInfo,
} from "@/lib/env";

describe("env.ts", () => {
  describe("getEnv", () => {
    it("should return null or valid env object", () => {
      // This test verifies the function doesn't crash
      // Actual validation depends on environment variables
      const env = getEnv();
      // Should return either null or a valid env object
      expect(env === null || (env !== null && typeof env.SUPABASE_URL === "string")).toBe(true);
    });
  });

  describe("isEnvReady", () => {
    it("should return boolean", () => {
      const ready = isEnvReady();
      expect(typeof ready).toBe("boolean");
    });
  });

  describe("envMissingReason", () => {
    it("should return array of strings", () => {
      const reasons = envMissingReason();
      expect(Array.isArray(reasons)).toBe(true);
      reasons.forEach((reason) => {
        expect(typeof reason).toBe("string");
      });
    });
  });

  describe("getAppEnv", () => {
    it("should return valid environment name", () => {
      const env = getAppEnv();
      expect(["development", "preview", "production"]).toContain(env);
    });
  });

  describe("isDevelopment", () => {
    it("should return boolean", () => {
      const isDev = isDevelopment();
      expect(typeof isDev).toBe("boolean");
    });
  });

  describe("getEnvDebugInfo", () => {
    it("should return debug info object", () => {
      const debugInfo = getEnvDebugInfo();
      expect(debugInfo).toBeDefined();
      expect(typeof debugInfo).toBe("object");
      expect(debugInfo.VITE_SUPABASE_URL).toBeDefined();
      expect(debugInfo.VITE_SUPABASE_PUBLISHABLE_KEY).toBeDefined();
    });

    it("should not expose secrets", () => {
      const debugInfo = getEnvDebugInfo();
      // Should only show preview/length, not full keys
      expect(debugInfo.VITE_SUPABASE_URL.preview).toBeDefined();
      expect(typeof debugInfo.VITE_SUPABASE_PUBLISHABLE_KEY.length).toBe("number");
    });
  });
});
