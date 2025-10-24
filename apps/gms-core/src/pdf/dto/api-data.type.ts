// src/pdf/dto/api-data.type.ts
export type ApiDataType = {
  applicant: {
    name: string | null;
    email: string | null;
    phone: string | null;
    salary: string | null;
    nric: string | null;
    designation: string | null;
    bank: {
      accountNo: string | null;
      branchCode: string | null;
    };
  };
  company: {
    name: string | null;
    uen: string | null;
    regAddress: string | null;
    businessSector: string | null;
    employeeCount: string | null;
  };
  project: {
    title: string | null;
    description: string | null;
    timeline: string | null;
    totalCost: string | null;
    fundingAmount: string | null;
  };
};
