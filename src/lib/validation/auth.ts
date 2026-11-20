import { z } from "zod";
import { email, password } from "./common";

export const signUpSchema = z
  .object({
    role: z.enum(["candidate", "recruiter"]),
    fullName: z.string().trim().min(2, "Indiquez votre nom.").max(120),
    companyName: z.string().trim().max(120).optional(),
    email,
    password,
    terms: z.literal("on", { message: "Vous devez accepter les CGU et la politique de confidentialité." }),
  })
  .refine((d) => d.role !== "recruiter" || (d.companyName && d.companyName.length >= 2), {
    path: ["companyName"],
    message: "Indiquez le nom de l'entreprise.",
  });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Saisissez votre mot de passe.").max(72),
});

export const resetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les deux mots de passe ne correspondent pas." });
