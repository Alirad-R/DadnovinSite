"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthForms from "@/components/AuthForms";

function BuyTime({ onPurchaseComplete }: { onPurchaseComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const buyTime = async (hours: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hours }),
      });

      if (!response.ok) {
        throw new Error("Payment failed");
      }

      onPurchaseComplete();
    } catch (error) {
      console.error("Error buying time:", error);
      alert("خطا در خرید زمان");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-2xl font-bold text-center dark:text-white mb-4">
        خرید زمان
      </h2>
      <div className="flex flex-wrap justify-center gap-4">
        {[1, 2, 3].map((hours) => (
          <button
            key={hours}
            onClick={() => buyTime(hours)}
            disabled={isLoading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
          >
            {hours} ساعت - {hours * 10}$
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, logout, setUser } = useAuth();
  const router = useRouter();

  const handlePurchaseComplete = () => {
    // Refresh the user data to update the validUntil
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser({
              ...data.user,
              validUntil: data.validUntil,
            });
          }
        })
        .catch(console.error);
    }
  };

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
                    {user.firstName} {user.lastName} validUntil:{" "}
                    {user.validUntil}
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
                <BuyTime onPurchaseComplete={handlePurchaseComplete} />
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
