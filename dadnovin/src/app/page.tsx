"use client";

import AuthForms from "@/components/AuthForms";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        <section className="relative h-[80vh] flex items-center justify-center">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-black/50"
              style={{
                backgroundImage: "url('/assets/background3.webp')",
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
              }}
            />
          </div>

          <div className="relative text-center text-white p-5 z-10 space-y-8">
            <h1 className="text-6xl mb-2">سامانه داد</h1>
            {user ? (
              <div className="text-8xl animate-bounce">👍</div>
            ) : (
              <p className="text-2xl font-light">
                برای شروع لطفا وارد حساب کاربری خود شوید یا ثبت نام کنید
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
