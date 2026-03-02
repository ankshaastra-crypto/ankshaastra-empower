import { supabase } from "@/integrations/supabase/client";

interface NameCheckOrderData {
  orderId: string;
  packageType: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerCity: string;
  person1FirstName?: string;
  person1MiddleName?: string;
  person1MiddleNameType?: string;
  person1FullName?: string;
  person1Dob?: string;
  person1Gender?: string;
  person2FirstName?: string;
  person2MiddleName?: string;
  person2MiddleNameType?: string;
  person2FullName?: string;
  person2Dob?: string;
  person2Gender?: string;
  person3FirstName?: string;
  person3MiddleName?: string;
  person3MiddleNameType?: string;
  person3FullName?: string;
  person3Dob?: string;
  person3Gender?: string;
}

interface BabyNameOrderData {
  orderId: string;
  packageType: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  fatherFirstName: string;
  fatherMiddleName?: string;
  fatherLastName: string;
  childDob: string;
  childTob: string;
  childPob: string;
  childPincode: string;
  childGender: string;
}

export async function saveNameCheckOrder(data: NameCheckOrderData) {
  const { error } = await supabase.from("orders").insert({
    order_id: data.orderId,
    package_type: data.packageType,
    amount: data.amount,
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_mobile: data.customerMobile,
    customer_city: data.customerCity,
    person1_first_name: data.person1FirstName || null,
    person1_middle_name: data.person1MiddleName || null,
    person1_middle_name_type: data.person1MiddleNameType || null,
    person1_full_name: data.person1FullName || null,
    person1_dob: data.person1Dob || null,
    person1_gender: data.person1Gender || null,
    person2_first_name: data.person2FirstName || null,
    person2_middle_name: data.person2MiddleName || null,
    person2_middle_name_type: data.person2MiddleNameType || null,
    person2_full_name: data.person2FullName || null,
    person2_dob: data.person2Dob || null,
    person2_gender: data.person2Gender || null,
    person3_first_name: data.person3FirstName || null,
    person3_middle_name: data.person3MiddleName || null,
    person3_middle_name_type: data.person3MiddleNameType || null,
    person3_full_name: data.person3FullName || null,
    person3_dob: data.person3Dob || null,
    person3_gender: data.person3Gender || null,
  });
  if (error) console.error("Failed to save order to DB:", error);
  return { error };
}

export async function saveBabyNameOrder(data: BabyNameOrderData) {
  const { error } = await supabase.from("orders").insert({
    order_id: data.orderId,
    package_type: data.packageType,
    amount: data.amount,
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_mobile: data.customerMobile,
    father_first_name: data.fatherFirstName,
    father_middle_name: data.fatherMiddleName || null,
    father_last_name: data.fatherLastName,
    child_dob: data.childDob,
    child_tob: data.childTob,
    child_pob: data.childPob,
    child_pincode: data.childPincode,
    child_gender: data.childGender,
  });
  if (error) console.error("Failed to save order to DB:", error);
  return { error };
}

export async function getOrderByOrderId(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  return { data, error };
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  transactionId?: string,
  amount?: number
) {
  const updates: Record<string, unknown> = { status };
  if (transactionId) updates.transaction_id = transactionId;
  if (amount !== undefined) updates.amount = amount;

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("order_id", orderId);
  if (error) console.error("Failed to update order status:", error);
  return { error };
}
