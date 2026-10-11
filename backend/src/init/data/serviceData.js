const createServices = (revenueOfficeId, developmentOfficeId) => [
  // =========================
  // REVENUE OFFICE SERVICES
  // =========================

  {
    officeId: revenueOfficeId,
    name: "Income Certificate",
    description: "Application and processing of income certificates.",
    averageServiceTime: 10,
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Income Proof", "Passport-size Photograph"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Caste Certificate",
    description: "Application and processing of caste certificates.",
    averageServiceTime: 15,
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Caste Proof / Family Caste Certificate", "Passport-size Photograph"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Residence Certificate",
    description: "Application and processing of residence certificates.",
    averageServiceTime: 10,
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Passport-size Photograph"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Domicile Certificate",
    description: "Application for domicile and permanent residence certificates.",
    averageServiceTime: 15,
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Birth Certificate or School Records", "Residence Proof", "Passport-size Photograph"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Land Record Request",
    description: "Request for land and revenue records.",
    averageServiceTime: 20,
    requiredDocuments: ["Aadhaar Card", "Land Survey Number / Property Details", "Ownership or Related Land Record (if available)"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Land Ownership Certificate",
    description: "Application for land ownership related documents.",
    averageServiceTime: 20,
    requiredDocuments: ["Aadhaar Card", "Existing Land Record", "Survey Number / Property Details", "Ownership Proof"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Land Mutation",
    description: "Request to update ownership details in land records.",
    averageServiceTime: 25,
    requiredDocuments: ["Aadhaar Card", "Current Land Record", "Registered Sale Deed / Inheritance Proof / Relevant Transfer Document", "Survey Number / Property Details"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Land Survey Request",
    description: "Request for official land measurement and survey.",
    averageServiceTime: 25,
    requiredDocuments: ["Aadhaar Card", "Land Ownership Proof", "Survey Number / Property Details", "Land Map (if available)"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Property Valuation Certificate",
    description: "Application for property valuation related certificates.",
    averageServiceTime: 20,
    requiredDocuments: ["Aadhaar Card", "Ownership Proof", "Property Details / Survey Number", "Existing Property Tax or Land Record (if available)"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Legal Heir Certificate",
    description: "Application for legal heir and succession related certificates.",
    averageServiceTime: 20,
    requiredDocuments: ["Applicant Aadhaar Card", "Deceased Person's Death Certificate", "Proof of Relationship", "Family Member Details", "Address Proof"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Agricultural Land Records",
    description: "Request for agricultural land ownership and record details.",
    averageServiceTime: 20,
    requiredDocuments: ["Aadhaar Card", "Survey Number / Land Details", "Existing Land Record (if available)", "Ownership Proof (if available)"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Encumbrance Related Request",
    description: "Request for land encumbrance and related revenue information.",
    averageServiceTime: 20,
    requiredDocuments: ["Aadhaar Card", "Property Details / Survey Number", "Ownership Proof or Relevant Property Document"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Revenue Grievance",
    description: "Submission and handling of revenue-related grievances.",
    averageServiceTime: 15,
    requiredDocuments: ["Aadhaar Card (if applicable)", "Written Complaint", "Supporting Documents / Previous Application Reference (if available)"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Government Land Request",
    description: "Application and enquiry related to government land.",
    averageServiceTime: 25,
    requiredDocuments: ["Aadhaar Card", "Written Application", "Purpose and Location Details", "Supporting Documents (if applicable)"],
    isActive: true
  },
  {
    officeId: revenueOfficeId,
    name: "Other Revenue Services",
    description: "General enquiries and other revenue-related services.",
    averageServiceTime: 10,
    requiredDocuments: ["Aadhaar Card (if applicable)", "Relevant Application or Supporting Documents"],
    isActive: true
  },

  // =========================
  // DEVELOPMENT OFFICE SERVICES
  // =========================

  {
    officeId: developmentOfficeId,
    name: "Pension Application",
    description: "Application and assistance for government pension schemes.",
    averageServiceTime: 15,
    requiredDocuments: ["Aadhaar Card", "Age Proof", "Address Proof", "Bank Passbook", "Income Proof (if applicable)", "Passport-size Photograph"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Welfare Scheme Application",
    description: "Application for eligible government welfare schemes.",
    averageServiceTime: 15,
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Income Proof (if applicable)", "Bank Passbook (if applicable)", "Scheme Application Form"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Housing Scheme Application",
    description: "Application for government rural housing schemes.",
    averageServiceTime: 20,
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Income Proof (if applicable)", "Bank Passbook", "Land / Residence Details", "Scheme Application Form"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Employment Scheme Application",
    description: "Application and assistance for rural employment schemes.",
    averageServiceTime: 15,
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Bank Passbook", "Job Card (if applicable)", "Scheme Application Form"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Rural Development Request",
    description: "Request related to rural development activities.",
    averageServiceTime: 20,
    requiredDocuments: ["Aadhaar Card (if applicable)", "Written Application", "Village / Location Details", "Supporting Documents (if available)"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Sanitation Scheme Request",
    description: "Request related to rural sanitation programs.",
    averageServiceTime: 15,
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Written Application", "Household / Property Details (if applicable)"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Drinking Water Request",
    description: "Complaints and requests related to rural drinking water facilities.",
    averageServiceTime: 15,
    requiredDocuments: ["Written Complaint / Request", "Village and Address Details", "Aadhaar Card (if applicable)", "Supporting Photos or Documents (if available)"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Road Development Request",
    description: "Request or complaint related to rural roads and infrastructure.",
    averageServiceTime: 20,
    requiredDocuments: ["Written Complaint / Request", "Village and Road Location Details", "Supporting Photos or Documents (if available)"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Street Light Request",
    description: "Request or complaint related to rural street lighting.",
    averageServiceTime: 10,
    requiredDocuments: ["Written Complaint / Request", "Village and Location Details", "Pole Number or Nearby Landmark (if available)"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Public Infrastructure Complaint",
    description: "Complaints regarding public infrastructure and facilities.",
    averageServiceTime: 15,
    requiredDocuments: ["Written Complaint", "Exact Location Details", "Supporting Photos or Documents (if available)"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Self Help Group Assistance",
    description: "Support and assistance related to self-help groups.",
    averageServiceTime: 20,
    requiredDocuments: ["Group Member Details", "Group Registration / Resolution (if available)", "Bank Details (if applicable)", "Written Application"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Rural Development Scheme",
    description: "Enquiry and application related to rural development schemes.",
    averageServiceTime: 20,
    requiredDocuments: ["Aadhaar Card (if applicable)", "Address Proof", "Scheme Application Form", "Eligibility / Supporting Documents (as applicable)"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Beneficiary Status Enquiry",
    description: "Enquiry about government scheme beneficiary status.",
    averageServiceTime: 10,
    requiredDocuments: ["Aadhaar Card or Beneficiary ID", "Scheme Name / Application Reference Number"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Grievance / Complaint",
    description: "Submission and handling of citizen grievances.",
    averageServiceTime: 10,
    requiredDocuments: ["Written Complaint", "Contact Details", "Supporting Documents (if available)"],
    isActive: true
  },
  {
    officeId: developmentOfficeId,
    name: "Other Development Services",
    description: "General enquiries and other development-related services.",
    averageServiceTime: 10,
    requiredDocuments: ["Aadhaar Card (if applicable)", "Relevant Application or Supporting Documents"],
    isActive: true
  }
];

module.exports = createServices;