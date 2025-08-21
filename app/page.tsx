import LoginForm from "@/components/LoginForm";
import CheckSession from "@/components/CheckSession";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoginForm />
      <CheckSession />
    </div>
  );
}
