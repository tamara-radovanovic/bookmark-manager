import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext");

const mockedUseAuth = vi.mocked(useAuth);

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>Dashboard content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a spinner and renders nothing else while auth state is loading", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("redirects to /login once loading finishes and the user isn't authenticated", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("renders the protected route's content once authenticated", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});
