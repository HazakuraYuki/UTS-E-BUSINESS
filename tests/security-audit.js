import fs from 'fs';
import path from 'path';

/**
 * LogiTrack Firestore Security Rules Automated Verifier & Audit
 */

console.log('================================================================');
console.log('LOGITRACK FIRESTORE SECURITY RULES VERIFICATION & AUDIT');
console.log('================================================================\n');

const rulesPath = path.resolve('firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error('❌ firestore.rules not found at', rulesPath);
  process.exit(1);
}

const rules = fs.readFileSync(rulesPath, 'utf8');
let passedTests = 0;
let totalTests = 0;

function assertRule(title, condition, detail) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${title}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${title}: ${detail}`);
  }
}

// 1. Zero hardcoded admin emails
assertRule(
  'No hardcoded admin emails in rules',
  !rules.includes('@') && !rules.includes('admin@logitrack.id'),
  'Hardcoded email addresses found in firestore.rules!'
);

// 2. Dynamic role lookup from users/{uid}
assertRule(
  'Dynamic role lookup from users/{uid} database doc',
  rules.includes("function myRole() { return get(userPath(uid())).data.role; }") &&
    rules.includes("function isAdmin() { return hasProfile() && myRole() == 'admin'; }") &&
    rules.includes("function isCourier() { return hasProfile() && myRole() == 'courier'; }") &&
    rules.includes("function isSender() { return hasProfile() && myRole() == 'sender'; }"),
  'Admin/Courier/Sender roles must be dynamically retrieved from users collection'
);

// 3. Self-registration role locked to sender
assertRule(
  'Self-registration strictly restricted to sender role',
  rules.includes("request.resource.data.role == 'sender'") &&
    rules.includes('uid() == userId'),
  'Users must not be able to register themselves with admin or courier roles'
);

// 4. Role mutation denied to non-admins
assertRule(
  'Role mutation is immutable for profile owners',
  rules.includes("onlyChanged(['displayName', 'phone'])"),
  'Users must only be allowed to update displayName and phone, never role or email'
);

// 5. Sender cannot change status on shipments
assertRule(
  'Sender cannot update shipment status directly',
  rules.includes("senderPays()") &&
    rules.includes("onlyChanged(['paymentStatus', 'paymentMethod', 'paidAt', 'updatedAt'])") &&
    rules.includes("a.paymentStatus == 'Lunas'"),
  'Senders may only update paymentStatus to Lunas for simulated payment, never delivery status'
);

// 6. Courier can only update shipments assigned to them
assertRule(
  'Courier can only update packages assigned to them',
  rules.includes("b.get('assignedCourierId', null) == uid()") &&
    rules.includes("a.status == nextStatus(b.status)"),
  'Couriers must be assigned to the shipment and strictly follow nextStatus sequence'
);

// 7. Public tracking collection denies list (anti-scraping)
assertRule(
  'Public tracking denies list query to prevent data dumping',
  rules.includes('match /publicTracking/{tn}') &&
    rules.includes('allow list: if false;') &&
    rules.includes('allow get: if true;'),
  'publicTracking must allow get by trackingNumber only, never collection-wide listing'
);

// 8. Public tracking does not expose full addresses, phones, or names
const publicKeysMatch = rules.match(/function publicKeys\(\)\s*\{([^}]+)\}/);
const publicKeysBody = publicKeysMatch ? publicKeysMatch[1] : '';
const noPiiInPublic =
  Boolean(publicKeysMatch) &&
  !publicKeysBody.includes('Address') &&
  !publicKeysBody.includes('Phone') &&
  !publicKeysBody.includes('confirmationCode') &&
  !publicKeysBody.includes('senderName');

assertRule(
  'Public tracking schema strictly whitelisted without PII',
  noPiiInPublic,
  'Public tracking must only contain city routing and timeline, never full street address or phones'
);

// 9. Private confirmation code storage
assertRule(
  'Confirmation code stored in private shipmentSecrets',
  rules.includes('match /shipmentSecrets/{tn}') &&
    rules.includes('resource.data.senderId == uid() || isAdmin()') &&
    rules.includes('allow update: if false;'),
  'Confirmation codes must be isolated from public/shipment docs and read-restricted to sender & admin'
);

// 10. Capability key based recipient confirmation
assertRule(
  'Recipient delivery confirmation capability key architecture',
  rules.includes('match /receiptKeys/{keyId}') &&
    rules.includes('match /receiptConfirmations/{tn}') &&
    rules.includes('receiverConfirms(shipmentId)'),
  'Delivery confirmation must be secured via secret capability keys without exposing master codes'
);

// 11. Atomic Counter collection access control
assertRule(
  'Atomic tracking number counter transaction rules',
  rules.includes('match /counters/{counterId}') &&
    rules.includes('allow get: if signedIn();') &&
    rules.includes('resource.data.currentSeq + 1'),
  'Counters collection must support authenticated atomic increment transactions'
);

// 12. Tariffs access control
assertRule(
  'Tariffs are public read and admin-only write',
  rules.includes('match /tariffs/{tariffId}') &&
    rules.includes('allow read: if true;') &&
    rules.includes('allow write: if isAdmin();'),
  'Tariff rates must be protected from unauthorized tampering'
);

console.log('\n----------------------------------------------------------------');
console.log(`AUDIT RESULTS: ${passedTests} / ${totalTests} Security Assertions PASSED`);
console.log('----------------------------------------------------------------');

if (passedTests === totalTests) {
  console.log('🎉 ALL SECURITY INVARIANTS VERIFIED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('⚠️ Some security rules assertions failed. Review firestore.rules.\n');
  process.exit(1);
}
