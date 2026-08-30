import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "./LoginForm";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext");

const mockedUseAuth = vi.mocked(useAuth);

function renderLoginForm() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<p>Dashboard content</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginForm", () => {
  it("shows field errors and never calls login when fields are empty", async () => {
    const login = vi.fn();
    mockedUseAuth.mockReturnValue({
      login,
      register: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    });

    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("logs in and navigates to /dashboard on success", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      login,
      register: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    });

    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(login).toHaveBeenCalledWith({ email: "user@example.com", password: "hunter2" });
    expect(await screen.findByText("Dashboard content")).toBeInTheDocument();
  });

  it("maps a failed login's error_code to a translated message and stays on the form", async () => {
    const login = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { data: { error_code: "AUTH_INVALID_CREDENTIALS" } },
    });
    mockedUseAuth.mockReturnValue({
      login,
      register: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    });

    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });
});
