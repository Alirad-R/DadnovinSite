"use client";

import { useState, useEffect } from "react";

export default function BuyTime({
  onPurchaseComplete,
}: {
  onPurchaseComplete: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<
    { id: number; time: number; price: string }[]
  >([]);

  // Fetch available pricing options from the database via the API
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/prices");
        const json = await res.json();
        if (json.success) {
          setOptions(json.prices);
        } else {
          console.error("Error fetching prices", json.error);
        }
      } catch (error) {
        console.error("Error fetching prices", error);
      }
    }
    fetchPrices();
  }, []);

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
        throw new Error("Payment initiation failed");
      }

      const data = await response.json();
      console.log("Payment initiated:", data);

      if (data.paymentUrl && data.id_get) {
        // Store the id_get for verification
        localStorage.setItem("pending_payment_id", data.id_get);
        localStorage.setItem("pending_payment_time", new Date().toISOString());

        // Redirect to Bitpay payment page
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      alert(error.message || "خطا در شروع پرداخت");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-4 text-right">
      <h2 className="text-2xl font-bold text-center dark:text-white mb-4">
        خرید زمان
      </h2>
      <div className="flex flex-wrap justify-end gap-4 flex-row-reverse">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => buyTime(option.time)}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 w-full sm:w-auto"
          >
            برای {option.time} ساعت - {option.price} تومان{" "}
            {isLoading && " (در حال پردازش...)"}
          </button>
        ))}
      </div>
    </div>
  );
}
