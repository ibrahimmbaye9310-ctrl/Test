/**
 * Types de la base, alignés sur supabase/migrations/. Peut être régénéré automatiquement :
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 */
type UserRole = "candidate" | "recruiter" | "admin";
type ContractType = "cdi" | "cdd" | "interim" | "alternance" | "stage";
type WorkTime = "full_time" | "part_time";
type Schedule = "morning" | "day" | "evening" | "night" | "weekend";
type Sector = "retail" | "hospitality" | "logistics" | "tech" | "health" | "admin" | "education" | "construction" | "finance" | "marketing";
type SalaryPeriod = "hour" | "month" | "year";
type RemoteMode = "none" | "partial" | "full";
type OfferStatus = "draft" | "pending" | "published" | "rejected" | "closed" | "expired";
type ApplicationStatus = "sent" | "reviewing" | "interview" | "accepted" | "rejected";

/** Insert : colonnes avec valeur par défaut ou nullables → optionnelles. */
type Insertable<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>;

type ProfileRow = {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  city: string | null;
  postal_code: string | null;
  headline: string | null;
  bio: string | null;
  avatar_path: string | null;
  cv_path: string | null;
  cv_filename: string | null;
  cv_updated_at: string | null;
  skills: string[];
  availability: Schedule[];
  availability_note: string | null;
  desired_contracts: ContractType[];
  desired_work_time: WorkTime | null;
  desired_sectors: Sector[];
  search_radius_km: number | null;
  open_to_work: boolean;
  created_at: string;
  updated_at: string;
};

type CompanyRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  siret: string | null;
  logo_path: string | null;
  city: string | null;
  postal_code: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

type JobOfferRow = {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  short_description: string;
  missions: string[];
  profile: string[];
  benefits: string[];
  contract_type: ContractType;
  work_time: WorkTime;
  schedules: Schedule[];
  sector: Sector;
  is_student_friendly: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: SalaryPeriod | null;
  hours_per_week: number | null;
  duration_months: number | null;
  remote: RemoteMode;
  city: string;
  postal_code: string;
  commune_code: string | null;
  lat: number | null;
  lng: number | null;
  status: OfferStatus;
  is_featured: boolean;
  published_at: string | null;
  expires_at: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
};

type ApplicationRow = {
  id: string;
  job_offer_id: string;
  candidate_id: string;
  cover_message: string | null;
  status: ApplicationStatus;
  status_updated_at: string;
  created_at: string;
  updated_at: string;
};

type SavedJobRow = { candidate_id: string; job_offer_id: string; created_at: string };

type PublicJobOfferRow = JobOfferRow & { company_name: string; company_description: string | null; company_logo_path: string | null };

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insertable<ProfileRow, "id" | "full_name">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      companies: {
        Row: CompanyRow;
        Insert: Insertable<CompanyRow, "owner_id" | "name" | "slug">;
        Update: Partial<CompanyRow>;
        Relationships: [Rel & { foreignKeyName: "companies_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      job_offers: {
        Row: JobOfferRow;
        Insert: Insertable<JobOfferRow, "company_id" | "title" | "slug" | "short_description" | "contract_type" | "work_time" | "sector" | "city" | "postal_code">;
        Update: Partial<JobOfferRow>;
        Relationships: [Rel & { foreignKeyName: "job_offers_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }];
      };
      applications: {
        Row: ApplicationRow;
        Insert: Insertable<ApplicationRow, "job_offer_id" | "candidate_id">;
        Update: Partial<Pick<ApplicationRow, "status">>;
        Relationships: [
          Rel & { foreignKeyName: "applications_job_offer_id_fkey"; columns: ["job_offer_id"]; isOneToOne: false; referencedRelation: "job_offers"; referencedColumns: ["id"] },
          Rel & { foreignKeyName: "applications_candidate_id_fkey"; columns: ["candidate_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      saved_jobs: {
        Row: SavedJobRow;
        Insert: Insertable<SavedJobRow, "candidate_id" | "job_offer_id">;
        Update: Partial<SavedJobRow>;
        Relationships: [
          Rel & { foreignKeyName: "saved_jobs_job_offer_id_fkey"; columns: ["job_offer_id"]; isOneToOne: false; referencedRelation: "job_offers"; referencedColumns: ["id"] },
          Rel & { foreignKeyName: "saved_jobs_candidate_id_fkey"; columns: ["candidate_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: {
      public_job_offers: { Row: PublicJobOfferRow; Relationships: [] };
    };
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: UserRole };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      contract_type: ContractType;
      work_time: WorkTime;
      schedule: Schedule;
      sector: Sector;
      salary_period: SalaryPeriod;
      remote_mode: RemoteMode;
      offer_status: OfferStatus;
      application_status: ApplicationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Profile = ProfileRow;
export type PublicJobOffer = PublicJobOfferRow;
export type ApplicationStatusValue = ApplicationStatus;
