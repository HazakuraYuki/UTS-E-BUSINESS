import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  setLogLevel,
} from 'firebase/firestore';

setLogLevel('silent');

const PROJECT_ID = 'demo-logitrack-security-test';
const RULES = fs.readFileSync('firestore.rules', 'utf8');

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: RULES,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('1. Tamu / Unauthenticated Access Control', () => {
  test('Tamu tidak bisa membaca atau menulis shipments (get, list, create, update, delete)', async () => {
    const unauthed = testEnv.unauthenticatedContext().firestore();

    // Seed shipment via security-disabled context
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'shipments', 'shp-guest-test'), {
        id: 'shp-guest-test',
        trackingNumber: 'LGT-20261019-0001',
        senderId: 'sender-1',
        senderName: 'Pengirim 1',
        senderPhone: '08123456789',
        senderAddress: 'Jl. Merdeka 1',
        senderCity: 'Jakarta',
        receiverName: 'Penerima 1',
        receiverPhone: '08987654321',
        receiverAddress: 'Jl. Pahlawan 2',
        receiverCity: 'Surabaya',
        packageDescription: 'Dokumen',
        weightKg: 1,
        chargeableWeightKg: 1,
        serviceType: 'REGULER',
        shippingCost: 15000,
        status: 'Paket Terdaftar',
        paymentMethod: 'TRANSFER',
        paymentStatus: 'Belum Bayar',
        originCoords: { lat: -6.2, lng: 106.8 },
        destinationCoords: { lat: -7.25, lng: 112.75 },
        createdAt: '2026-10-19T10:00:00.000Z',
        updatedAt: '2026-10-19T10:00:00.000Z',
      });
    });

    const shpRef = doc(unauthed, 'shipments', 'shp-guest-test');

    // Get
    await assertFails(getDoc(shpRef));
    // List
    await assertFails(getDocs(collection(unauthed, 'shipments')));
    // Create
    await assertFails(setDoc(doc(unauthed, 'shipments', 'shp-hacker'), { hacker: true }));
    // Update
    await assertFails(updateDoc(shpRef, { status: 'Terkirim' }));
    // Delete
    await assertFails(deleteDoc(shpRef));
  });

  test('Tamu tidak bisa membaca atau menulis shipmentSecrets', async () => {
    const unauthed = testEnv.unauthenticatedContext().firestore();

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'shipmentSecrets', 'LGT-20261019-0001'), {
        trackingNumber: 'LGT-20261019-0001',
        code: 'SECRET1234',
        shipmentId: 'shp-guest-test',
        senderId: 'sender-1',
        createdAt: '2026-10-19T10:00:00.000Z',
      });
    });

    const secretRef = doc(unauthed, 'shipmentSecrets', 'LGT-20261019-0001');

    await assertFails(getDoc(secretRef));
    await assertFails(getDocs(collection(unauthed, 'shipmentSecrets')));
    await assertFails(setDoc(doc(unauthed, 'shipmentSecrets', 'LGT-20261019-HACK'), { code: 'HACKED' }));
    await assertFails(deleteDoc(secretRef));
  });
});

describe('2. Public Tracking Access Control', () => {
  test('Tamu bisa get satu dokumen publicTracking tetapi tidak bisa list', async () => {
    const unauthed = testEnv.unauthenticatedContext().firestore();

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'publicTracking', 'LGT-20261019-SAFE'), {
        trackingNumber: 'LGT-20261019-SAFE',
        status: 'Paket Terdaftar',
        senderCity: 'Jakarta',
        receiverCity: 'Surabaya',
        serviceType: 'REGULER',
        timeline: [
          {
            status: 'Paket Terdaftar',
            title: 'Pesanan Dibuat',
            description: 'Paket terdaftar di sistem LogiTrack',
            location: 'Jakarta',
            timestamp: '2026-10-19T10:00:00.000Z',
          },
        ],
      });
    });

    // Single document get -> ALLOWED
    const pubRef = doc(unauthed, 'publicTracking', 'LGT-20261019-SAFE');
    const snap = await assertSucceeds(getDoc(pubRef));
    assert.equal(snap.exists(), true);
    assert.equal(snap.data().trackingNumber, 'LGT-20261019-SAFE');

    // Collection list -> DENIED (Zero PII leakage)
    await assertFails(getDocs(collection(unauthed, 'publicTracking')));
  });
});

describe('3. Sender Role Security', () => {
  test('Sender tidak bisa mengubah field role miliknya menjadi admin', async () => {
    const senderUid = 'sender-alice-uid';
    const senderDb = testEnv
      .authenticatedContext(senderUid, { email: 'alice@sender.com' })
      .firestore();

    // Initial sender profile
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', senderUid), {
        uid: senderUid,
        email: 'alice@sender.com',
        displayName: 'Alice Sender',
        role: 'sender',
        phone: '0811111111',
        createdAt: '2026-10-19T10:00:00.000Z',
      });
    });

    const userRef = doc(senderDb, 'users', senderUid);

    // Editing allowed fields (displayName, phone) -> ALLOWED
    await assertSucceeds(
      updateDoc(userRef, {
        displayName: 'Alice Updated',
        phone: '0822222222',
      })
    );

    // Attempting privilege escalation: role -> 'admin' -> DENIED
    await assertFails(
      updateDoc(userRef, {
        role: 'admin',
      })
    );

    // Attempting privilege escalation: role -> 'courier' -> DENIED
    await assertFails(
      updateDoc(userRef, {
        role: 'courier',
      })
    );
  });
});

describe('4. Cross-Sender Data Isolation', () => {
  test('Sender tidak bisa membaca shipment milik sender lain', async () => {
    const sender1Uid = 'sender-bob-uid';
    const sender2Uid = 'sender-charlie-uid';

    const sender1Db = testEnv
      .authenticatedContext(sender1Uid, { email: 'bob@sender.com' })
      .firestore();
    const sender2Db = testEnv
      .authenticatedContext(sender2Uid, { email: 'charlie@sender.com' })
      .firestore();

    // Register profiles
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const admin = ctx.firestore();
      await setDoc(doc(admin, 'users', sender1Uid), {
        uid: sender1Uid,
        email: 'bob@sender.com',
        displayName: 'Bob',
        role: 'sender',
        createdAt: '2026-10-19T10:00:00.000Z',
      });
      await setDoc(doc(admin, 'users', sender2Uid), {
        uid: sender2Uid,
        email: 'charlie@sender.com',
        displayName: 'Charlie',
        role: 'sender',
        createdAt: '2026-10-19T10:00:00.000Z',
      });
      // Charlie's private shipment
      await setDoc(doc(admin, 'shipments', 'shp-charlie-pkg'), {
        id: 'shp-charlie-pkg',
        trackingNumber: 'LGT-20261019-CHAR',
        senderId: sender2Uid,
        senderName: 'Charlie',
        senderPhone: '0833333333',
        senderAddress: 'Jl. Rahasia No. 9',
        senderCity: 'Bandung',
        receiverName: 'Danang',
        receiverPhone: '0844444444',
        receiverAddress: 'Jl. Mawar 4',
        receiverCity: 'Semarang',
        packageDescription: 'Elektronik Sensitif',
        weightKg: 2,
        chargeableWeightKg: 2,
        serviceType: 'EXPRESS',
        shippingCost: 35000,
        status: 'Paket Terdaftar',
        paymentMethod: 'QRIS',
        paymentStatus: 'Belum Bayar',
        originCoords: { lat: -6.9, lng: 107.6 },
        destinationCoords: { lat: -7.0, lng: 110.4 },
        createdAt: '2026-10-19T10:00:00.000Z',
        updatedAt: '2026-10-19T10:00:00.000Z',
      });
    });

    const targetRefSender1 = doc(sender1Db, 'shipments', 'shp-charlie-pkg');
    const targetRefSender2 = doc(sender2Db, 'shipments', 'shp-charlie-pkg');

    // Bob cannot read Charlie's shipment
    await assertFails(getDoc(targetRefSender1));

    // Charlie can read his own shipment
    const ownDoc = await assertSucceeds(getDoc(targetRefSender2));
    assert.equal(ownDoc.data().id, 'shp-charlie-pkg');
  });
});

describe('5. Courier Assignment & Sequential Status Progression', () => {
  test('Kurir hanya bisa mengubah shipment miliknya dengan urutan status valid', async () => {
    const courier1Uid = 'courier-dani-uid';
    const courier2Uid = 'courier-eko-uid';

    const courier1Db = testEnv
      .authenticatedContext(courier1Uid, { email: 'dani@courier.com' })
      .firestore();
    const courier2Db = testEnv
      .authenticatedContext(courier2Uid, { email: 'eko@courier.com' })
      .firestore();

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const admin = ctx.firestore();
      await setDoc(doc(admin, 'users', courier1Uid), {
        uid: courier1Uid,
        email: 'dani@courier.com',
        displayName: 'Dani Kurir',
        role: 'courier',
        createdAt: '2026-10-19T10:00:00.000Z',
      });
      await setDoc(doc(admin, 'users', courier2Uid), {
        uid: courier2Uid,
        email: 'eko@courier.com',
        displayName: 'Eko Kurir',
        role: 'courier',
        createdAt: '2026-10-19T10:00:00.000Z',
      });

      // Shipment assigned to courier 1, status 'Dijemput', paid
      await setDoc(doc(admin, 'shipments', 'shp-courier-test'), {
        id: 'shp-courier-test',
        trackingNumber: 'LGT-20261019-CR01',
        senderId: 'some-sender',
        assignedCourierId: courier1Uid,
        assignedCourierName: 'Dani Kurir',
        status: 'Dijemput',
        paymentMethod: 'TRANSFER',
        paymentStatus: 'Lunas',
        createdAt: '2026-10-19T10:00:00.000Z',
        updatedAt: '2026-10-19T10:00:00.000Z',
      });
    });

    const shpRefC1 = doc(courier1Db, 'shipments', 'shp-courier-test');
    const shpRefC2 = doc(courier2Db, 'shipments', 'shp-courier-test');

    // 1. Courier 2 (unassigned) CANNOT modify this shipment
    await assertFails(
      updateDoc(shpRefC2, {
        status: 'Di Gudang',
        updatedAt: '2026-10-19T11:00:00.000Z',
      })
    );

    // 2. Courier 1 CANNOT jump status from 'Dijemput' directly to 'Terkirim'
    await assertFails(
      updateDoc(shpRefC1, {
        status: 'Terkirim',
        updatedAt: '2026-10-19T11:00:00.000Z',
      })
    );

    // 3. Courier 1 CAN advance status sequentially: 'Dijemput' -> 'Di Gudang'
    await assertSucceeds(
      updateDoc(shpRefC1, {
        status: 'Di Gudang',
        updatedAt: '2026-10-19T11:00:00.000Z',
      })
    );

    // 4. Sequential next: 'Di Gudang' -> 'Dalam Perjalanan'
    await assertSucceeds(
      updateDoc(shpRefC1, {
        status: 'Dalam Perjalanan',
        updatedAt: '2026-10-19T12:00:00.000Z',
      })
    );

    // 5. Sequential next: 'Dalam Perjalanan' -> 'Sedang Diantar'
    await assertSucceeds(
      updateDoc(shpRefC1, {
        status: 'Sedang Diantar',
        updatedAt: '2026-10-19T13:00:00.000Z',
      })
    );
  });
});

describe('6. Secure Delivery Confirmation via Code', () => {
  test('Konfirmasi penerimaan gagal jika kode rahasia salah, berhasil jika kode benar', async () => {
    const unauthed = testEnv.unauthenticatedContext().firestore();
    const trackingNo = 'LGT-20261019-RECI';
    const shipmentId = 'shp-receiver-confirm';
    const correctCode = 'ABCDEF1234';
    const wrongCode = 'WRONGCODE99';

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const admin = ctx.firestore();
      // Shipment is 'Sedang Diantar'
      await setDoc(doc(admin, 'shipments', shipmentId), {
        id: shipmentId,
        trackingNumber: trackingNo,
        senderId: 'sender-owner',
        status: 'Sedang Diantar',
        paymentMethod: 'TRANSFER',
        paymentStatus: 'Lunas',
        receiverNotes: '',
        createdAt: '2026-10-19T10:00:00.000Z',
        updatedAt: '2026-10-19T10:00:00.000Z',
      });
      // Secret doc
      await setDoc(doc(admin, 'shipmentSecrets', trackingNo), {
        trackingNumber: trackingNo,
        code: correctCode,
        shipmentId: shipmentId,
        senderId: 'sender-owner',
        createdAt: '2026-10-19T10:00:00.000Z',
      });
      // Capability key document (trackingNumber_code)
      await setDoc(doc(admin, 'receiptKeys', `${trackingNo}_${correctCode}`), {
        trackingNumber: trackingNo,
        shipmentId: shipmentId,
        senderId: 'sender-owner',
        isCOD: false,
      });
    });

    const confirmedAt = '2026-10-19T15:00:00.000Z';

    // ATTEMPT 1: Wrong code in batch -> FAILS
    const wrongBatch = writeBatch(unauthed);
    wrongBatch.set(doc(unauthed, 'receiptConfirmations', trackingNo), {
      trackingNumber: trackingNo,
      code: wrongCode,
      receiverName: 'Budi Penerima',
      confirmedAt: confirmedAt,
    });
    wrongBatch.update(doc(unauthed, 'shipments', shipmentId), {
      status: 'Terkirim',
      deliveredAt: confirmedAt,
      updatedAt: confirmedAt,
      receiverNotes: 'Diterima aman',
    });
    await assertFails(wrongBatch.commit());

    // ATTEMPT 2: Correct code in atomic batch -> SUCCEEDS
    const correctBatch = writeBatch(unauthed);
    correctBatch.set(doc(unauthed, 'receiptConfirmations', trackingNo), {
      trackingNumber: trackingNo,
      code: correctCode,
      receiverName: 'Budi Penerima',
      confirmedAt: confirmedAt,
    });
    correctBatch.update(doc(unauthed, 'shipments', shipmentId), {
      status: 'Terkirim',
      deliveredAt: confirmedAt,
      updatedAt: confirmedAt,
      receiverNotes: 'Diterima dengan baik oleh Budi',
    });
    await assertSucceeds(correctBatch.commit());

    // Verify shipment is now Terkirim
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const snap = await getDoc(doc(ctx.firestore(), 'shipments', shipmentId));
      assert.equal(snap.data().status, 'Terkirim');
      assert.equal(snap.data().receiverNotes, 'Diterima dengan baik oleh Budi');
    });
  });
});
