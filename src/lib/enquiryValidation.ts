import { looksLikeEmail } from "@/lib/contactConfig";
import type { BriefContact } from "@/data/catalogue/types";

export type EnquiryContactErrors = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  message?: string;
  form?: string;
};

export function validateEnquiryContact(
  contact: Partial<BriefContact>,
  options?: { requirePhone?: boolean; requireMessage?: boolean; message?: string },
): EnquiryContactErrors {
  const errors: EnquiryContactErrors = {};
  const name = contact.name?.trim() ?? "";
  const company = contact.company?.trim() ?? "";
  const email = contact.email?.trim() ?? "";
  const phone = contact.phone?.trim() ?? "";
  const message = options?.message?.trim() ?? "";

  if (!name) errors.name = "Add your name.";
  if (!company) errors.company = "Add your company.";
  if (email && !looksLikeEmail(email)) {
    errors.email = "Enter a valid work email.";
  }
  if (!email && !phone) {
    errors.phone = "Add an email or phone number so Monkcraft can reply.";
  }
  if (options?.requirePhone && !phone) {
    errors.phone = "Add a phone number.";
  }
  if (options?.requireMessage && !message) {
    errors.message = "Add a short message about what you need.";
  }

  if (Object.keys(errors).length > 0) {
    errors.form = "Please fix the highlighted fields before continuing.";
  }
  return errors;
}

export function firstErrorMessage(errors: EnquiryContactErrors): string {
  return (
    errors.form ||
    errors.name ||
    errors.company ||
    errors.email ||
    errors.phone ||
    errors.message ||
    ""
  );
}
