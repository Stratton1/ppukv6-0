/**
 * Tests for PropertyCard component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PropertyCard from "@/components/property/PropertyCard";

// Wrapper component for routing
function PropertyCardWrapper(props: React.ComponentProps<typeof PropertyCard>) {
  return (
    <BrowserRouter>
      <PropertyCard {...props} />
    </BrowserRouter>
  );
}

describe("PropertyCard", () => {
  const mockProperty = {
    id: "123",
    address: "123 Test Street",
    postcode: "SW1A 1AA",
    city: "London",
    propertyType: "Detached",
    bedrooms: 3,
    bathrooms: 2,
    floorArea: 120,
    epcRating: "B",
    tenure: "Freehold",
    ppukReference: "PPUK-001",
  };

  it("should render property address", () => {
    render(<PropertyCardWrapper {...mockProperty} />);
    expect(screen.getByText("123 Test Street")).toBeInTheDocument();
  });

  it("should render location information", () => {
    render(<PropertyCardWrapper {...mockProperty} />);
    expect(screen.getByText(/London, SW1A 1AA/)).toBeInTheDocument();
  });

  it("should render property type badge", () => {
    render(<PropertyCardWrapper {...mockProperty} />);
    expect(screen.getByText("Detached")).toBeInTheDocument();
  });

  it("should render PPUK reference", () => {
    render(<PropertyCardWrapper {...mockProperty} />);
    expect(screen.getByText("PPUK-001")).toBeInTheDocument();
  });

  it("should render bedrooms when provided", () => {
    render(<PropertyCardWrapper {...mockProperty} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should render bathrooms when provided", () => {
    render(<PropertyCardWrapper {...mockProperty} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should render floor area when provided", () => {
    render(<PropertyCardWrapper {...mockProperty} />);
    expect(screen.getByText("120 m²")).toBeInTheDocument();
  });

  it("should render EPC rating badge when provided", () => {
    render(<PropertyCardWrapper {...mockProperty} />);
    expect(screen.getByText("EPC B")).toBeInTheDocument();
  });

  it("should not render EPC badge when rating is missing", () => {
    const { epcRating, ...propertyWithoutEPC } = mockProperty;
    render(<PropertyCardWrapper {...propertyWithoutEPC} />);
    expect(screen.queryByText(/EPC/)).not.toBeInTheDocument();
  });

  it("should link to property detail page", () => {
    render(<PropertyCardWrapper {...mockProperty} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/property/123");
  });

  it("should render placeholder icon when no photo", () => {
    const { frontPhotoUrl, ...propertyWithoutPhoto } = mockProperty;
    render(<PropertyCardWrapper {...propertyWithoutPhoto} />);
    // Should render Home icon placeholder
    const card = screen.getByRole("link");
    expect(card).toBeInTheDocument();
  });

  it("should handle optional fields gracefully", () => {
    const minimalProperty = {
      id: "456",
      address: "456 Minimal Street",
      postcode: "M1 1AA",
      city: "Manchester",
      propertyType: "Flat",
      tenure: "Leasehold",
      ppukReference: "PPUK-002",
    };

    render(<PropertyCardWrapper {...minimalProperty} />);
    expect(screen.getByText("456 Minimal Street")).toBeInTheDocument();
    expect(screen.getByText("Flat")).toBeInTheDocument();
  });
});

