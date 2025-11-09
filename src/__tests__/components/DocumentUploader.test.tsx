/**
 * Tests for DocumentUploader component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentUploader from "@/components/property/DocumentUploader";

// Mock Supabase client
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockInsert = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("DocumentUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    mockUpload.mockResolvedValue({
      data: { path: "test-path" },
      error: null,
    });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.com/file.pdf" },
    });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("should render upload form", () => {
    render(<DocumentUploader propertyId="test-property-id" />);
    expect(screen.getByText("Upload Document")).toBeInTheDocument();
    expect(screen.getByLabelText(/Select File/i)).toBeInTheDocument();
  });

  it("should allow file selection", async () => {
    const user = userEvent.setup();
    render(<DocumentUploader propertyId="test-property-id" />);

    const fileInput = screen.getByLabelText(/Select File/i);
    const file = new File(["test content"], "test.pdf", { type: "application/pdf" });

    await user.upload(fileInput, file);

    expect(screen.getByText(/test.pdf/i)).toBeInTheDocument();
  });

  it("should validate file size limit", async () => {
    const user = userEvent.setup();
    render(<DocumentUploader propertyId="test-property-id" />);

    const fileInput = screen.getByLabelText(/Select File/i);
    // Create a file larger than 10MB
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.pdf", {
      type: "application/pdf",
    });

    await user.upload(fileInput, largeFile);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "File too large",
        })
      );
    });
  });

  it("should require document type before upload", async () => {
    const user = userEvent.setup();
    render(<DocumentUploader propertyId="test-property-id" />);

    const fileInput = screen.getByLabelText(/Select File/i);
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    await user.upload(fileInput, file);

    const uploadButton = screen.getByRole("button", { name: /upload/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Missing information",
        })
      );
    });
  });

  it("should upload document when file and type are selected", async () => {
    const user = userEvent.setup();
    const onUploadComplete = vi.fn();
    render(
      <DocumentUploader propertyId="test-property-id" onUploadComplete={onUploadComplete} />
    );

    // Select file
    const fileInput = screen.getByLabelText(/Select File/i);
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    await user.upload(fileInput, file);

    // Select document type
    const typeSelect = screen.getByRole("combobox");
    await user.click(typeSelect);
    const epcOption = screen.getByText("EPC Certificate");
    await user.click(epcOption);

    // Click upload
    const uploadButton = screen.getByRole("button", { name: /upload/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
      expect(onUploadComplete).toHaveBeenCalled();
    });
  });

  it("should show loading state during upload", async () => {
    const user = userEvent.setup();
    // Make upload slow
    mockUpload.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 100))
    );

    render(<DocumentUploader propertyId="test-property-id" />);

    const fileInput = screen.getByLabelText(/Select File/i);
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    await user.upload(fileInput, file);

    const typeSelect = screen.getByRole("combobox");
    await user.click(typeSelect);
    await user.click(screen.getByText("EPC Certificate"));

    const uploadButton = screen.getByRole("button", { name: /upload/i });
    await user.click(uploadButton);

    // Should show loading state
    expect(uploadButton).toBeDisabled();
  });

  it("should handle upload errors gracefully", async () => {
    const user = userEvent.setup();
    mockUpload.mockRejectedValue(new Error("Upload failed"));

    render(<DocumentUploader propertyId="test-property-id" />);

    const fileInput = screen.getByLabelText(/Select File/i);
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    await user.upload(fileInput, file);

    const typeSelect = screen.getByRole("combobox");
    await user.click(typeSelect);
    await user.click(screen.getByText("EPC Certificate"));

    const uploadButton = screen.getByRole("button", { name: /upload/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Upload failed",
        })
      );
    });
  });
});

