"use client";

import AuthForms from "@/components/AuthForms";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {user ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">
            Welcome, {user.firstName}!
          </h1>
          <div className="mb-8">
            <p className="text-lg mb-2">Email: {user.email}</p>
            <p className="text-lg">
              Name: {user.firstName} {user.lastName}
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-4xl font-bold mb-8">Welcome to Our App</h1>
          <AuthForms />
        </>
      )}
    </main>
  );
}
