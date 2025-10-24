'use client';
import { usePathname } from 'next/navigation';

export default function LogoutButton() {
  const pathname = usePathname();
  const isLoggedIn = !!sessionStorage.getItem("accessToken");
  if (!isLoggedIn || pathname === "/") return null;
  return (
    <a href="/" className="btn btn-secondary">Logout</a>
  );
}
