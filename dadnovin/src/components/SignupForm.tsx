"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function SignupForm() {
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Sign up
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        throw new Error(signupData.error || "Signup failed");
      }

      console.log("Signup successful, attempting login");

      // 2. Login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.error || "Login failed after signup");
      }

      console.log("Login successful, setting token");
      localStorage.setItem("token", loginData.token);

      // 3. Fetch user data
      const userRes = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${loginData.token}`,
        },
      });

      const userData = await userRes.json();

      if (!userRes.ok) {
        throw new Error(userData.error || "Failed to fetch user data");
      }

      console.log("User data fetched successfully:", userData.user);
      setUser(userData.user);
    } catch (err: any) {
      console.error("Signup process error:", err);
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 rounded-lg shadow-lg auth-card">
      <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
      {error && <div className="auth-error mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block auth-label mb-2" htmlFor="firstName">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full p-2 rounded auth-input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block auth-label mb-2" htmlFor="lastName">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-2 rounded auth-input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block auth-label mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 rounded auth-input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block auth-label mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 rounded auth-input"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
