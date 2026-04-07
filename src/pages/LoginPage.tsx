import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../api/authApi";
import { storage } from "../utils/storage";

function LoginPage() {
  const navigate = useNavigate();

  const [contactNo, setContactNo] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
    const result = await loginAdmin({
      contact_no: contactNo,
      password,
    });

    if (!result.token) {
      throw new Error("No token received from server.");
    }

    storage.setToken(result.token);
    storage.setRole("admin");
    navigate("/", { replace: true });
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || error.message || "Login failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Admin Login</h1>
        <p className="mb-6 text-sm text-gray-500">
          Sign in to access the Sagip Manileno dashboard.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <input
              type="text"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              placeholder="Enter contact number"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-slate-500"
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;