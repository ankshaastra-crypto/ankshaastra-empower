export interface FirestoreOrder {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
  customer_city: string | null;
  package_type: string;
  amount: number;
  status: string; // pending | delivered | follow-up
  payment_status: string; // SUCCESS | PENDING | FAILED
  transaction_id: string | null;
  order_date: string | null;
  source: string; // ads | organic | referral
  notes: string;
  tags: string[];
  follow_up_date: string | null;
  synced_at: string | null;
  // Person details
  person1_full_name?: string | null;
  person1_dob?: string | null;
  person1_gender?: string | null;
  person2_full_name?: string | null;
  person2_dob?: string | null;
  person2_gender?: string | null;
  person3_full_name?: string | null;
  person3_dob?: string | null;
  person3_gender?: string | null;
  // Baby name details
  father_first_name?: string | null;
  father_middle_name?: string | null;
  father_last_name?: string | null;
  child_dob?: string | null;
  child_tob?: string | null;
  child_pob?: string | null;
  child_gender?: string | null;
}
