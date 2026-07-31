// Combined list: Indian States/UTs (for GST) + common international regions.
// Used with a native <datalist> so users get first-letter filtering out of the box,
// while still being able to type any custom value (for international clients).

export const INDIAN_STATES: string[] = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const INTERNATIONAL_REGIONS: string[] = [
  // USA (common)
  "California (USA)",
  "New York (USA)",
  "Texas (USA)",
  "New Jersey (USA)",
  "Illinois (USA)",
  "Washington (USA)",
  "Florida (USA)",
  "Massachusetts (USA)",
  // Canada
  "Ontario (Canada)",
  "British Columbia (Canada)",
  "Alberta (Canada)",
  "Quebec (Canada)",
  // UK
  "England (UK)",
  "Scotland (UK)",
  "Wales (UK)",
  "Northern Ireland (UK)",
  // Australia
  "New South Wales (Australia)",
  "Victoria (Australia)",
  "Queensland (Australia)",
  "Western Australia (Australia)",
  // UAE / Singapore
  "Dubai (UAE)",
  "Abu Dhabi (UAE)",
  "Sharjah (UAE)",
  "Singapore",
];

export const ALL_STATE_OPTIONS: string[] = [
  ...INDIAN_STATES,
  ...INTERNATIONAL_REGIONS,
];

// Reusable datalist id
export const STATE_DATALIST_ID = "state-options-list";

