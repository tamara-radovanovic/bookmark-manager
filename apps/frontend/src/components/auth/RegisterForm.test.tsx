import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { RegisterForm } from "./RegisterForm";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext");

const mockedUseAuth = vi.mocked(useAuth);

function renderRegisterForm() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/dashboard" element={<p>Dashboard content</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RegisterForm", () => {
  it("rejects a short password and a mismatched confirmation without calling register", async () => {
    const register = vi.fn();
    mockedUseAuth.mockReturnValue({
      register,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    });

    const user = userEvent.setup();
    renderRegisterForm();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("registers and navigates to /dashboard on success", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      register,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    });

    const user = userEvent.setup();
    renderRegisterForm();

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(register).toHaveBeenCalledWith({ email: "new@example.com", password: "password123" });
    expect(await screen.findByText("Dashboard content")).toBeInTheDocument();
  });

  it("maps a duplicate-email error_code to its translated message", async () => {
    const register = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { data: { error_code: "AUTH_EMAIL_ALREADY_EXISTS" } },
    });
    mockedUseAuth.mockReturnValue({
      register,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    });

    const user = userEvent.setup();
    renderRegisterForm();

    await user.type(screen.getByLabelText("Email"), "taken@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
  });
});
