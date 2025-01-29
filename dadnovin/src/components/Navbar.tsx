import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  const isAccountPage = pathname === "/account";
  const accountLinkProps = {
    href: isAccountPage ? "/" : "/account",
    className:
      "text-xl bg-white dark:bg-gray-200 text-black dark:text-gray-900 px-4 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-300 transition-colors",
  };

  return (
    <header className="flex justify-between items-center px-5 py-3 bg-black text-white">
      <div>
        <Link href="/" className="text-2xl font-bold text-right">
          مجموعه سامانه داد
        </Link>
      </div>
      <div className="flex gap-4 flex-wrap items-center">
        
        <Link href="/dadafarin_assistant" className="text-xl">
          سامانه دادآفرین
        </Link>
        
        <Link {...accountLinkProps}>
          {user
            ? isAccountPage
              ? "بازگشت به خانه"
              : user.firstName
            : isAccountPage
            ? "بازگشت به خانه"
            : "حساب کاربری"}
            
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
