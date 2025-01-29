"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthForms from "@/components/AuthForms";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {user ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <h1 className="text-4xl font-bold mb-8 text-center dark:text-white">
                حساب کاربری
              </h1>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-lg text-right dark:text-white">
                    <span className="font-bold ml-2">:نام</span>
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-lg text-right dark:text-white">
                    <span className="font-bold ml-2">:ایمیل</span>
                    {user.email}
                  </p>
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={logout}
                    className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors"
                  >
                    خروج از حساب
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <h1 className="text-4xl font-bold mb-8 text-center dark:text-white">
                ورود به حساب
              </h1>
              <AuthForms />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
