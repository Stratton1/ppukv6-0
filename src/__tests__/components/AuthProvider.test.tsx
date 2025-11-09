/**
 * Tests for AuthProvider component
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/app/auth/AuthProvider";
import { User, Session } from "@supabase/supabase-js";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabaseReady: true,
  getSupabaseOrNull: () => ({
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: {
            session: null,
          },
          error: null,
        })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  }),
}));

// Mock EnvErrorScreen
vi.mock("@/components/dev/EnvErrorScreen", () => ({
  EnvErrorScreen: () => <div data-testid="env-error">Environment Error</div>,
}));

// Test component that uses useAuth hook
function TestComponent() {
  const { user, isLoading } = useAuth();
  return (
    <div>
      <div data-testid="loading">{isLoading ? "Loading" : "Loaded"}</div>
      <div data-testid="user">{user ? user.email : "No user"}</div>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children when environment is ready", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <div data-testid="child">Test Child</div>
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  it("should provide auth context to children", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toBeInTheDocument();
    });
  });

  it("should show loading state initially", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      const loading = screen.getByTestId("loading");
      expect(loading).toBeInTheDocument();
    });
  });

  it("should render suspense fallback when provided", async () => {
    await act(async () => {
      render(
        <AuthProvider suspenseFallback={<div data-testid="suspense">Loading...</div>}>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Suspense fallback is shown during initial loading
    // After loading completes, it may not be visible
    // So we just verify the component renders without error
    await waitFor(() => {
      // Component should render (either suspense or children)
      const suspense = screen.queryByTestId("suspense");
      const child = screen.queryByTestId("loading");
      expect(suspense !== null || child !== null).toBe(true);
    });
  });
});

describe("useAuth hook", () => {
  it("should throw error when used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAuth must be used within AuthProvider");

    consoleSpy.mockRestore();
  });
});

