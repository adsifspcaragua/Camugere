import React from "react"
import { render, screen } from "@testing-library/react"
import StatCard from "../components/StatCard"
import { TrendingUp } from "lucide-react"

test("renders StatCard with title and value", () => {
  render(<StatCard title="Total Books" value={150} icon={TrendingUp} />)
  expect(screen.getByText("Total Books")).toBeInTheDocument()
  expect(screen.getByText("150")).toBeInTheDocument()
})