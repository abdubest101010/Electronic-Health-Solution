import LoginForm from "@/components/LoginForm";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoginForm />
      
      {/* create link to redirect to register */}
      <div className="mt-4">
        <Link href="/register" className="text-blue-500 hover:underline">
          Register New User
        </Link>
      </div>
    </div>
  );
}
