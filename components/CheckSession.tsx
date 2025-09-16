"use client";

import { useSession, signOut } from "next-auth/react";

export default function CheckSession() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (!session?.user) {
    return <p>You are not logged in.</p>;
  }

  return (
    <div className="max-w-md mx-auto mt-6 p-4 border rounded">
      <h2 className="text-xl font-bold mb-2">User Info</h2>
      <p><strong>Name:</strong> {session.user.name}</p>
      <p><strong>Email:</strong> {session.user.email}</p>
      <p><strong>Role:</strong> {session.user.role}</p>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
