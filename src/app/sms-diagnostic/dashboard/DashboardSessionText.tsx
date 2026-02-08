"use client";

import { useEffect, useState } from "react";

export default function DashboardSessionText() {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("hses_user_email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  if (!email) {
    return <span>Logged in</span>;
  }

  return <span>Logged in as {email}</span>;
}

