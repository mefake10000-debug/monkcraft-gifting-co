export const COMPANY_STORE_DEMO_EMPLOYEE_KEY =
  "monkcraft-company-store-demo-employee-v1";

export type CompanyStoreDemoEmployee = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export function createDemoEmployee(name: string, email: string): CompanyStoreDemoEmployee {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanName || !cleanEmail) {
    throw new Error("Enter an employee name and work email to create a preview profile.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Enter a valid work email address.");
  }
  const uniquePart = globalThis.crypto.randomUUID().replaceAll("-", "").toUpperCase();
  return {
    id: `MC-${uniquePart}`,
    name: cleanName,
    email: cleanEmail,
    createdAt: new Date().toISOString(),
  };
}

export function readDemoEmployee(): CompanyStoreDemoEmployee | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COMPANY_STORE_DEMO_EMPLOYEE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CompanyStoreDemoEmployee>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.email !== "string"
    ) return null;
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      createdAt: String(parsed.createdAt ?? ""),
    };
  } catch {
    return null;
  }
}

export function saveDemoEmployee(employee: CompanyStoreDemoEmployee) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    COMPANY_STORE_DEMO_EMPLOYEE_KEY,
    JSON.stringify(employee),
  );
}
