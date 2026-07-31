#!/usr/bin/env node
/**
 * Verifies baby name form fields are saved and retrieved from Supabase PostgreSQL.
 * Usage: npm run test:orders
 */

import 'dotenv/config';

const { saveOrderAndCustomer, getCustomerMetadata, getPool, DB_SCHEMA } = await import('../server/_utils/db.js');
const { getPackageDisplayName } = await import('../server/_utils/package-names.js');

const BABY_FORM_FIXTURES = [
  {
    label: 'Perfect Baby Name Report (single)',
    packageType: 'single',
    amount: 3437,
    customerData: {
      email: 'test-single@example.com',
      name: 'Rajesh Kumar Sharma',
      mobile: '9876543210',
      dob: '2026-01-15',
      gender: 'Male',
      pinCode: '201305',
      person1Name: 'Rajesh Kumar Sharma',
      person1Dob: '2026-01-15',
      person1Gender: 'Male',
      fatherFullName: 'Rajesh Kumar Sharma',
      fatherFirstNameAsMiddleName: 'yes',
      lastNameSpellingChangeOk: 'no',
      childMiddleName: 'Aarav',
      childLastName: 'Sharma',
      childDob: '2026-01-15',
      timeOfBirth: '10:30:00 AM',
      placeOfBirth: 'Noida',
      nameOptions: 'Aarav, Arnav',
    },
    expectedPackageName: 'Perfect Baby Name Report',
  },
  {
    label: 'Complete Baby Name Blueprint (premium)',
    packageType: 'premium',
    amount: 5957,
    customerData: {
      email: 'test-premium@example.com',
      name: 'Amit Verma',
      mobile: '9123456789',
      dob: '2026-02-20',
      gender: 'Female',
      pinCode: '110001',
      person1Name: 'Amit Verma',
      person1Dob: '2026-02-20',
      person1Gender: 'Female',
      fatherFullName: 'Amit Verma',
      fatherFirstNameAsMiddleName: 'no',
      lastNameSpellingChangeOk: 'yes',
      childMiddleName: '',
      childLastName: 'Verma',
      childDob: '2026-02-20',
      timeOfBirth: '06:15:00 PM',
      placeOfBirth: 'Delhi',
      nameOptions: 'Anaya, Aanya',
    },
    expectedPackageName: 'Complete Baby Name Blueprint',
  },
];

const REQUIRED_FIELDS = [
  'email', 'name', 'mobile', 'fatherFullName', 'childDob', 'timeOfBirth',
  'placeOfBirth', 'pinCode', 'childLastName', 'fatherFirstNameAsMiddleName',
  'lastNameSpellingChangeOk', 'packageType',
];

function assertField(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}", got "${actual}"`);
  }
}

async function cleanup(orderId) {
  const pool = getPool();
  if (!pool) return;
  await pool.query(`DELETE FROM ${DB_SCHEMA}.orders WHERE order_id = $1`, [orderId]);
}

async function runFixture(fixture) {
  const orderId = `TEST-${fixture.packageType}-${Date.now()}`;
  console.log(`\n▶ Testing ${fixture.label} (${orderId})`);

  await saveOrderAndCustomer(orderId, fixture.amount, fixture.packageType, fixture.customerData);
  const stored = await getCustomerMetadata(orderId, null);

  if (!stored) {
    throw new Error('getCustomerMetadata returned null — order not found in DB');
  }

  for (const field of REQUIRED_FIELDS) {
    const value = stored[field];
    if (value == null || String(value).trim() === '') {
      throw new Error(`Missing stored field: ${field}`);
    }
  }

  assertField('email', stored.email, fixture.customerData.email);
  assertField('lastNameSpellingChangeOk', stored.lastNameSpellingChangeOk, fixture.customerData.lastNameSpellingChangeOk);
  assertField('packageType', stored.packageType, fixture.packageType);
  assertField('package display name', getPackageDisplayName(stored.packageType), fixture.expectedPackageName);

  console.log('  ✅ All fields stored correctly');
  await cleanup(orderId);
  console.log('  🧹 Test order cleaned up');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set — add it to .env to run Supabase storage tests');
    process.exit(1);
  }

  console.log('🔍 Supabase/PostgreSQL baby order storage test');
  let passed = 0;

  for (const fixture of BABY_FORM_FIXTURES) {
    try {
      await runFixture(fixture);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log(`\n${passed}/${BABY_FORM_FIXTURES.length} fixtures passed`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
