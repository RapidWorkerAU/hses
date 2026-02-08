"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AccessResponse = {
  diagnostic_id: string;
  diagnostic_name: string;
  domain_name: string | null;
  question_set_id: string | null;
};

export default function AccessClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Enter your access code.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/public/diagnostic-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), identifier: identifier.trim() }),
      });

      if (!response.ok) {
        const message = await response.text();
        setError(message || "We could not validate that code.");
        return;
      }

      const payload = (await response.json()) as AccessResponse;
      const params = new URLSearchParams({
        code: code.trim(),
        identifier: identifier.trim(),
      });

      router.push(`/sms-diagnostic/participant/${payload.diagnostic_id}?${params.toString()}`);
    } catch (err) {
      setError("We could not validate that code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="diagnostic-access-card">
      <h1>Enter your access code</h1>
      <p className="diagnostic-access-subtitle">
        Use the email or name that your code was issued to.
      </p>
      <form className="diagnostic-access-form" onSubmit={handleSubmit}>
        <label>
          <span>Access code</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="e.g. 8F3X-29QJ"
            autoComplete="one-time-code"
            required
          />
        </label>
        <label>
          <span>Email or name on the code</span>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="e.g. alex@company.com"
            autoComplete="email"
          />
        </label>
        {error && <div className="diagnostic-access-error">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Checking..." : "Start diagnostic"}
        </button>
      </form>
    </div>
  );
}
