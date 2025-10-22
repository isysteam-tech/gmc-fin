export interface ApplicantData {
  name: string;
  email: string;
  phone: string;
  salary: number;
  nric: string;
  bank_acc: string;
  bank_code: string;
  designation: string;
  company: {
    company_name: string;
    uen: string;
    reg_address: string;
    business_sector: string;
    employee_count: number;
  };
  project: {
    title: string;
    desc: string;
    timeline: string;
    total_cost: number;
    funding_amount: number;
  };
}

export type SupportedModels = "chatgpt" | "gemini";
