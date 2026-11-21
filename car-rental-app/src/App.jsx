import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import {
  Car,
  Fuel,
  LayoutDashboard,
  MapPin,
  FileText,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit3,
  Eye,
  X,
  CheckCircle2,
  Calendar,
  Phone,
  ArrowRightLeft,
  ArrowRight,
  Lock,
  Unlock,
  ShieldCheck,
  LogOut,
  KeyRound,
  Database,
  Copy,
  Check,
  AlertCircle,
  Camera
} from 'lucide-react';

// ==========================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDWoSuS-Wzwlj_32-L9GE-xydsecxC4Ltg",
  authDomain: "my-car-rental-2dcd4.firebaseapp.com",
  projectId: "my-car-rental-2dcd4",
  storageBucket: "my-car-rental-2dcd4.firebasestorage.app",
  messagingSenderId: "483269161250",
  appId: "1:483269161250:web:aa67a162afe8fc093fb57b"
};

let db = null;
let isFirebaseReady = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  isFirebaseReady = true;
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// ==========================================
// 2. SEED / DEFAULT DATA & ADMIN ACCOUNTS
// ==========================================
const DEFAULT_DRIVERS = [];
const DEFAULT_STATIONS = [];

const ADMIN_USERS = [
  {
    email: 'ittehadnurain2007@gmail.com',
    phone: '01877695700',
    password: 'Ittehad97',
    name: 'Ittehad Nur'
  },
  {
    email: '',
    phone: '01858050997',
    password: '01858050997',
    name: 'Kamrun Nahar'
  },
  {
    email: '',
    phone: '01911790677',
    password: '01911790677',
    name: 'Mostak Uddidn'
  }
];

const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /drivers/{driverId} {
      allow read, write: if true;
    }
    match /stations/{stationId} {
      allow read, write: if true;
    }
    match /rents/{rentId} {
      allow read, write: if true;
    }
    match /gas_expenses/{expenseId} {
      allow read, write: if true;
    }
    match /audit_logs/{logId} {
      allow read, create: if true;
      allow update, delete: if false;
    }
  }
}`;

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================
const formatBDT = (amount) => {
  const num = Number(amount) || 0;
  return '৳' + num.toLocaleString('en-BD', { maximumFractionDigits: 2 });
};

const todayISO = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const daysAgoISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const getRentNetAfterCommission = (rent) => {
  if (rent && rent.remainingFare !== undefined && rent.remainingFare !== null && rent.remainingFare !== '') {
    return Number(rent.remainingFare) || 0;
  }
  const gross = Number(rent?.totalFare) || 0;
  return +(gross * 0.75).toFixed(2);
};

const compressImageToBase64 = (file, maxWidth = 800, quality = 0.65) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// ==========================================
// 4. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login Form States
  const [loginTab, setLoginTab] = useState('driver');
  const [driverLoginId, setDriverLoginId] = useState('');
  const [driverLoginPin, setDriverLoginPin] = useState('');
  const [adminLoginEmail, setAdminLoginEmail] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('rent');
  const [adminSubTab, setAdminSubTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [receiptModalUrl, setReceiptModalUrl] = useState(null);
  const [editingRent, setEditingRent] = useState(null);
  const [editingDriverPin, setEditingDriverPin] = useState(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [copiedRules, setCopiedRules] = useState(false);
  const [selectedRentIds, setSelectedRentIds] = useState([]);

  // Firestore Data States
  const [drivers, setDrivers] = useState([]);
  const [stations, setStations] = useState([]);
  const [rents, setRents] = useState([]);
  const [gasExpenses, setGasExpenses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Rent Form State
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [totalFare, setTotalFare] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [rentDate, setRentDate] = useState(todayISO());
  const [tripType, setTripType] = useState('one-way');
  const [isSubmittingRent, setIsSubmittingRent] = useState(false);

  // Gas Expense Form State
  const [gasDate, setGasDate] = useState(todayISO());
  const [selectedStationId, setSelectedStationId] = useState('');
  const [gasAmount, setGasAmount] = useState('');
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [isSubmittingGas, setIsSubmittingGas] = useState(false);

  // Summary Filter State
  const [datePreset, setDatePreset] = useState('7');
  const [startDate, setStartDate] = useState(daysAgoISO(7));
  const [endDate, setEndDate] = useState(todayISO());
  const [reportScope, setReportScope] = useState('single');

  // Admin Add Driver State
  const [newDriverId, setNewDriverId] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverCar, setNewDriverCar] = useState('');
  const [newDriverPin, setNewDriverPin] = useState('1234');

  // Admin Add Station State
  const [newStationName, setNewStationName] = useState('');
  const [newStationLocation, setNewStationLocation] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Persist Session User
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('rental_session_user', JSON.stringify(currentUser));
        if (currentUser.role === 'driver') {
          setSelectedDriverId(currentUser.driverId);
          setActiveTab('rent');
          setReportScope('single');
        } else if (currentUser.role === 'admin') {
          setActiveTab('admin');
          setReportScope('all');
        }
      } else {
        localStorage.removeItem('rental_session_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Audit Log Writer
  const writeAuditLog = async (actionText, actorName = 'System') => {
    if (!isFirebaseReady || !db) return;
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action: actionText,
        actor: actorName,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn('Audit log write skipped:', e);
    }
  };

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!isFirebaseReady || !db) {
      setIsLoadingData(false);
      return;
    }

    const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
      setDrivers(list);
      setSelectedDriverId((prev) => prev || list[0]?.id || '');
    });

    const unsubStations = onSnapshot(collection(db, 'stations'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
      setStations(list);
      setSelectedStationId((prev) => {
        if (prev && list.some((s) => s.id === prev)) return prev;
        return list[0]?.id || '';
      });
    });

    const qRents = query(collection(db, 'rents'), orderBy('rentDate', 'desc'));
    const unsubRents = onSnapshot(
      qRents,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRents(list);
        setIsLoadingData(false);
      },
      () => {
        onSnapshot(collection(db, 'rents'), (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setRents(list);
          setIsLoadingData(false);
        });
      }
    );

    const qGas = query(collection(db, 'gas_expenses'), orderBy('expenseDate', 'desc'));
    const unsubGas = onSnapshot(
      qGas,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setGasExpenses(list);
      },
      () => {
        onSnapshot(collection(db, 'gas_expenses'), (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setGasExpenses(list);
        });
      }
    );

    const qLogs = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 30);
      setAuditLogs(list);
    });

    return () => {
      unsubDrivers();
      unsubStations();
      unsubRents();
      unsubGas();
      unsubLogs();
    };
  }, []);

  // Keep driver session synced
  useEffect(() => {
    if (currentUser?.role === 'driver' && drivers.length > 0) {
      const matched = drivers.find((d) => d.id === currentUser.driverId);
      if (matched && matched.active === false) {
        setCurrentUser(null);
        showToast('আপনার ড্রাইভার আইডি সাময়িকভাবে স্থগিত করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।', 'error');
      } else if (matched) {
        setCurrentUser((prev) => ({
          ...prev,
          name: matched.name,
          phone: matched.phone,
          carNumber: matched.carNumber
        }));
      }
    }
  }, [drivers]);

  // Preset Date Handler
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const today = todayISO();
    setEndDate(today);
    if (preset === '7') setStartDate(daysAgoISO(7));
    else if (preset === '10') setStartDate(daysAgoISO(10));
    else if (preset === '15') setStartDate(daysAgoISO(15));
    else if (preset === '30') setStartDate(daysAgoISO(30));
  };

  // Real-time 25% Commission Calculation
  const numericFare = parseFloat(totalFare) || 0;
  const calculatedCommission = +(numericFare * 0.25).toFixed(2);
  const calculatedRemainingFare = +(numericFare - calculatedCommission).toFixed(2);

  // Login Handlers
  const handleDriverLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanId = driverLoginId.trim().toUpperCase();
    const cleanPin = driverLoginPin.trim();

    const foundDriver = drivers.find(
      (d) =>
        (d.id.toUpperCase() === cleanId || d.phone.trim() === driverLoginId.trim()) &&
        String(d.pin || '1234') === cleanPin
    );

    if (!foundDriver) {
      setLoginError('ভুল ড্রাইভার আইডি/মোবাইল নম্বর অথবা পিন। অ্যাডমিন প্যানেল থেকে আইডি যাচাই করুন।');
      return;
    }

    if (foundDriver.active === false) {
      setLoginError('এই ড্রাইভার আইডিটি বর্তমানে নিষ্ক্রিয় (Inactive) রয়েছে।');
      return;
    }

    const sessionData = {
      role: 'driver',
      driverId: foundDriver.id,
      name: foundDriver.name,
      phone: foundDriver.phone,
      carNumber: foundDriver.carNumber
    };
    setCurrentUser(sessionData);
    setDriverLoginId('');
    setDriverLoginPin('');
    writeAuditLog(`ড্রাইভার লগইন: ${foundDriver.name} (${foundDriver.id})`, foundDriver.name);
    showToast(`স্বাগতম, ${foundDriver.name}!`);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanInput = adminLoginEmail.trim().toLowerCase();
    const cleanPass = adminLoginPassword.trim();

    const matchedAdmin = ADMIN_USERS.find(
      (adm) =>
        ((adm.email && adm.email.toLowerCase() === cleanInput) ||
          (adm.phone && adm.phone.trim() === adminLoginEmail.trim())) &&
        adm.password === cleanPass
    );

    if (matchedAdmin) {
      const sessionData = {
        role: 'admin',
        email: matchedAdmin.email,
        phone: matchedAdmin.phone,
        name: matchedAdmin.name
      };
      setCurrentUser(sessionData);
      setAdminLoginEmail('');
      setAdminLoginPassword('');
      writeAuditLog(`অ্যাডমিন লগইন: ${matchedAdmin.name} (${matchedAdmin.phone})`, matchedAdmin.name);
      showToast(`${matchedAdmin.name} প্যানেলে স্বাগতম!`);
    } else {
      setLoginError('ভুল অ্যাডমিন ইমেইল/মোবাইল নম্বর বা পাসওয়ার্ড।');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      writeAuditLog(`লগ আউট: ${currentUser.name || currentUser.role}`, currentUser.name || 'User');
    }
    setCurrentUser(null);
    setLoginError('');
    setSelectedRentIds([]);
    showToast('সফলভাবে লগ আউট করা হয়েছে');
  };

  // Submit Rent Entry
  const handleRentSubmit = async (e) => {
    e.preventDefault();
    const targetDriverId = currentUser?.role === 'driver' ? currentUser.driverId : selectedDriverId;

    if (!pickupLocation.trim() || !dropLocation.trim()) {
      showToast('যাত্রা ও গন্তব্য লোকেশন লিখুন', 'error');
      return;
    }
    if (numericFare <= 0) {
      showToast('সঠিক মোট ভাড়া (০-এর বেশি) লিখুন', 'error');
      return;
    }
    if (!passengerPhone.trim()) {
      showToast('যাত্রীর মোবাইল নম্বর দিন', 'error');
      return;
    }

    setIsSubmittingRent(true);
    const driverObj = drivers.find((d) => d.id === targetDriverId);

    const rentPayload = {
      driverId: targetDriverId,
      driverName: driverObj?.name || targetDriverId,
      pickupLocation: pickupLocation.trim(),
      dropLocation: dropLocation.trim(),
      totalFare: numericFare,
      driverCommission: calculatedCommission,
      remainingFare: calculatedRemainingFare,
      passengerPhone: passengerPhone.trim(),
      rentDate,
      tripType,
      isPaid: false,
      paidAt: null,
      locked: true,
      createdBy: currentUser?.role || 'driver',
      createdAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp()
    };

    try {
      if (isFirebaseReady && db) {
        await addDoc(collection(db, 'rents'), rentPayload);
      } else {
        setRents((prev) => [{ id: 'LOCAL-' + Date.now(), ...rentPayload }, ...prev]);
      }
      await writeAuditLog(
        `নতুন ভাড়া এন্ট্রি (${targetDriverId}): ${pickupLocation.trim()} → ${dropLocation.trim()}, মোট: ${formatBDT(numericFare)}`,
        currentUser?.name || targetDriverId
      );
      showToast('ভাড়ার হিসাব সফলভাবে সংরক্ষিত হয়েছে!');
      setPickupLocation('');
      setDropLocation('');
      setTotalFare('');
      setPassengerPhone('');
      setTripType('one-way');
    } catch (error) {
      console.error(error);
      showToast('ডাটা সংরক্ষণে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmittingRent(false);
    }
  };

  // Selection & Paid Status Handlers
  const toggleSelectRent = (id) => {
    setSelectedRentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllRents = (visibleRents) => {
    const visibleIds = visibleRents.map((r) => r.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedRentIds.includes(id));
    if (allSelected) {
      setSelectedRentIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedRentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleMarkRentsPaid = async (targetIds = selectedRentIds, nextPaidStatus = true) => {
    if (currentUser?.role !== 'admin') {
      showToast('শুধুমাত্র অ্যাডমিন Paid স্ট্যাটাস আপডেট করতে পারবেন', 'error');
      return;
    }
    if (!targetIds || targetIds.length === 0) {
      showToast('আগে অন্তত একটি ভাড়া সিলেক্ট করুন', 'error');
      return;
    }

    const paidTimestamp = nextPaidStatus ? new Date().toISOString() : null;

    try {
      for (const rentId of targetIds) {
        if (isFirebaseReady && db && !String(rentId).startsWith('LOCAL-')) {
          await updateDoc(doc(db, 'rents', rentId), {
            isPaid: nextPaidStatus,
            paidAt: paidTimestamp
          });
        }
      }

      setRents((prev) =>
        prev.map((r) =>
          targetIds.includes(r.id) ? { ...r, isPaid: nextPaidStatus, paidAt: paidTimestamp } : r
        )
      );

      await writeAuditLog(
        `অ্যাডমিন ${targetIds.length}টি ভাড়া ${nextPaidStatus ? 'Paid' : 'Unpaid'} মার্ক করেছেন`,
        currentUser?.name || 'Admin'
      );

      setSelectedRentIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      showToast(
        nextPaidStatus
          ? `${targetIds.length}টি ভাড়ায় Paid ট্যাগ লাগানো হয়েছে`
          : `${targetIds.length}টি ভাড়া Unpaid করা হয়েছে`
      );
    } catch (err) {
      console.error(err);
      showToast('Paid স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Receipt File Change Handler
  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('শুধুমাত্র ছবি (JPG, PNG, WEBP) আপলোড করুন', 'error');
      return;
    }

    try {
      setReceiptFileName(file.name);
      const compressed = await compressImageToBase64(file, 800, 0.65);
      setReceiptBase64(compressed);
      showToast('রিসিপ্টের ছবি প্রস্তুত হয়েছে');
    } catch (err) {
      console.error(err);
      showToast('ছবি প্রসেস করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Submit Gas Expense Entry
  const handleGasSubmit = async (e) => {
    e.preventDefault();
    const targetDriverId = currentUser?.role === 'driver' ? currentUser.driverId : selectedDriverId;
    const amountNum = parseFloat(gasAmount) || 0;

    if (!selectedStationId) {
      showToast('গ্যাস ফিলিং স্টেশন সিলেক্ট করুন', 'error');
      return;
    }
    if (amountNum <= 0) {
      showToast('গ্যাস খরচের টাকার পরিমাণ লিখুন', 'error');
      return;
    }
    if (!receiptBase64) {
      showToast('রিসিপ্টের ছবি সংযুক্ত করুন', 'error');
      return;
    }

    setIsSubmittingGas(true);
    const stationObj = stations.find((s) => s.id === selectedStationId);
    const driverObj = drivers.find((d) => d.id === targetDriverId);

    const gasPayload = {
      driverId: targetDriverId,
      driverName: driverObj?.name || targetDriverId,
      stationId: selectedStationId,
      stationName: stationObj?.name || 'অজানা স্টেশন',
      amount: amountNum,
      receiptImage: receiptBase64,
      receiptFileName: receiptFileName || 'receipt.jpg',
      expenseDate: gasDate,
      locked: true,
      createdBy: currentUser?.role || 'driver',
      createdAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp()
    };

    try {
      if (isFirebaseReady && db) {
        await addDoc(collection(db, 'gas_expenses'), gasPayload);
      } else {
        setGasExpenses((prev) => [{ id: 'GAS-' + Date.now(), ...gasPayload }, ...prev]);
      }
      await writeAuditLog(
        `নতুন গ্যাস খরচ (${targetDriverId}): ${stationObj?.name || ''}, পরিমাণ: ${formatBDT(amountNum)}`,
        currentUser?.name || targetDriverId
      );
      showToast('গ্যাস খরচের হিসাব ও রিসিপ্ট সংরক্ষিত হয়েছে!');
      setGasAmount('');
      setReceiptBase64('');
      setReceiptFileName('');
    } catch (error) {
      console.error(error);
      showToast('গ্যাস খরচ সংরক্ষণে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmittingGas(false);
    }
  };

  // Admin: Update Rent Entry
  const handleSaveEditedRent = async (e) => {
    e.preventDefault();
    if (!editingRent || currentUser?.role !== 'admin') return;
    const fare = parseFloat(editingRent.totalFare) || 0;
    const commission = +(fare * 0.25).toFixed(2);
    const remaining = +(fare - commission).toFixed(2);

    const updatedFields = {
      pickupLocation: editingRent.pickupLocation,
      dropLocation: editingRent.dropLocation,
      totalFare: fare,
      driverCommission: commission,
      remainingFare: remaining,
      passengerPhone: editingRent.passengerPhone,
      rentDate: editingRent.rentDate,
      tripType: editingRent.tripType
    };

    try {
      if (isFirebaseReady && db && !String(editingRent.id).startsWith('LOCAL-')) {
        await updateDoc(doc(db, 'rents', editingRent.id), updatedFields);
      }
      setRents((prev) =>
        prev.map((item) => (item.id === editingRent.id ? { ...item, ...updatedFields } : item))
      );
      await writeAuditLog(`অ্যাডমিন ভাড়া এডিট করেছেন: ID ${editingRent.id}, নতুন ভাড়া ${formatBDT(fare)}`, 'Admin');
      showToast('ভাড়ার তথ্য আপডেট করা হয়েছে');
      setEditingRent(null);
    } catch (err) {
      console.error(err);
      showToast('আপডেট করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Delete Rent Entry
  const handleDeleteRent = async (rentId) => {
    if (currentUser?.role !== 'admin') {
      showToast('শুধুমাত্র অ্যাডমিন ডাটা ডিলিট করতে পারবেন', 'error');
      return;
    }
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই ভাড়ার হিসাবটি মুছে ফেলতে চান?')) return;
    try {
      if (isFirebaseReady && db && !String(rentId).startsWith('LOCAL-')) {
        await deleteDoc(doc(db, 'rents', rentId));
      }
      setRents((prev) => prev.filter((r) => r.id !== rentId));
      setSelectedRentIds((prev) => prev.filter((id) => id !== rentId));
      await writeAuditLog(`অ্যাডমিন ভাড়া ডিলিট করেছেন: ID ${rentId}`, 'Admin');
      showToast('ভাড়ার রেকর্ড মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error(err);
      showToast('মুছতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Delete Gas Expense
  const handleDeleteGas = async (gasId) => {
    if (currentUser?.role !== 'admin') {
      showToast('শুধুমাত্র অ্যাডমিন গ্যাস খরচ ডিলিট করতে পারবেন', 'error');
      return;
    }
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই গ্যাস খরচের রেকর্ডটি মুছে ফেলতে চান?')) return;
    try {
      if (isFirebaseReady && db && !String(gasId).startsWith('GAS-')) {
        await deleteDoc(doc(db, 'gas_expenses', gasId));
      }
      setGasExpenses((prev) => prev.filter((g) => g.id !== gasId));
      await writeAuditLog(`অ্যাডমিন গ্যাস খরচ ডিলিট করেছেন: ID ${gasId}`, 'Admin');
      showToast('গ্যাস খরচের রেকর্ড মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error(err);
      showToast('মুছতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Add Driver
  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') return;
    if (!newDriverId.trim() || !newDriverName.trim() || !newDriverPhone.trim()) {
      showToast('ড্রাইভার আইডি, নাম ও মোবাইল নম্বর দিন', 'error');
      return;
    }
    const cleanPin = (newDriverPin || '1234').trim();
    if (cleanPin.length < 4) {
      showToast('পিন অন্তত ৪ ডিজিটের হতে হবে', 'error');
      return;
    }

    const driverObj = {
      id: newDriverId.trim().toUpperCase(),
      name: newDriverName.trim(),
      phone: newDriverPhone.trim(),
      carNumber: newDriverCar.trim() || 'নির্ধারিত নয়',
      pin: cleanPin,
      active: true
    };

    try {
      if (isFirebaseReady && db) {
        await addDoc(collection(db, 'drivers'), driverObj);
      } else {
        setDrivers((prev) => [...prev, driverObj]);
      }
      await writeAuditLog(`নতুন ড্রাইভার যুক্ত: ${driverObj.name} (${driverObj.id})`, 'Admin');
      showToast('নতুন ড্রাইভার যুক্ত করা হয়েছে');
      setNewDriverId('');
      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverCar('');
      setNewDriverPin('1234');
    } catch (err) {
      console.error(err);
      showToast('ড্রাইভার যুক্ত করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Toggle Driver Active/Inactive Status
  const handleToggleDriverStatus = async (drv) => {
    if (currentUser?.role !== 'admin') return;
    const nextActive = drv.active === false ? true : false;
    try {
      if (isFirebaseReady && db && drv.docId) {
        await updateDoc(doc(db, 'drivers', drv.docId), { active: nextActive });
      }
      setDrivers((prev) =>
        prev.map((item) => (item.id === drv.id ? { ...item, active: nextActive } : item))
      );
      await writeAuditLog(
        `ড্রাইভার স্ট্যাটাস পরিবর্তন (${drv.id}): ${nextActive ? 'Active' : 'Inactive'}`,
        'Admin'
      );
      showToast(`${drv.name}-এর আইডি ${nextActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`);
    } catch (err) {
      console.error(err);
      showToast('স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Update Driver PIN
  const handleSaveDriverPin = async (e) => {
    e.preventDefault();
    if (!editingDriverPin || currentUser?.role !== 'admin') return;
    if (!newPinValue || newPinValue.trim().length < 4) {
      showToast('কমপক্ষে ৪ ডিজিটের নতুন পিন দিন', 'error');
      return;
    }
    const cleanPin = newPinValue.trim();
    try {
      if (isFirebaseReady && db && editingDriverPin.docId) {
        await updateDoc(doc(db, 'drivers', editingDriverPin.docId), { pin: cleanPin });
      }
      setDrivers((prev) =>
        prev.map((item) => (item.id === editingDriverPin.id ? { ...item, pin: cleanPin } : item))
      );
      await writeAuditLog(`ড্রাইভার পিন রিসেট: ${editingDriverPin.name} (${editingDriverPin.id})`, 'Admin');
      showToast(`${editingDriverPin.name}-এর নতুন পিন সেট হয়েছে`);
      setEditingDriverPin(null);
      setNewPinValue('');
    } catch (err) {
      console.error(err);
      showToast('পিন আপডেট করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Add Gas Station
  const handleAddStation = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') return;
    if (!newStationName.trim()) {
      showToast('গ্যাস ফিলিং স্টেশনের নাম দিন', 'error');
      return;
    }
    const stationObj = {
      id: 'STN-' + Date.now(),
      name: newStationName.trim(),
      location: newStationLocation.trim() || 'বাংলাদেশ'
    };
    try {
      if (isFirebaseReady && db) {
        await addDoc(collection(db, 'stations'), stationObj);
      } else {
        setStations((prev) => [...prev, stationObj]);
      }
      setSelectedStationId(stationObj.id);
      await writeAuditLog(`নতুন গ্যাস স্টেশন যুক্ত: ${stationObj.name}`, 'Admin');
      showToast('নতুন গ্যাস ফিলিং স্টেশন যুক্ত হয়েছে');
      setNewStationName('');
      setNewStationLocation('');
    } catch (err) {
      console.error(err);
      showToast('স্টেশন যুক্ত করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Delete Gas Station
  const handleDeleteStation = async (stn) => {
    if (currentUser?.role !== 'admin') return;
    if (!window.confirm(`"${stn.name}" স্টেশনটি মুছে ফেলতে চান?`)) return;
    try {
      if (isFirebaseReady && db && stn.docId) {
        await deleteDoc(doc(db, 'stations', stn.docId));
      }
      setStations((prev) => prev.filter((item) => item.id !== stn.id));
      await writeAuditLog(`গ্যাস স্টেশন মুছে ফেলা হয়েছে: ${stn.name}`, 'Admin');
      showToast('স্টেশন মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error(err);
      showToast('মুছতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Export JSON Backup
  const handleExportBackupJSON = () => {
    if (currentUser?.role !== 'admin') return;
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      projectId: firebaseConfig.projectId,
      counts: {
        drivers: drivers.length,
        stations: stations.length,
        rents: rents.length,
        gasExpenses: gasExpenses.length
      },
      data: {
        drivers: drivers.map(({ docId, ...rest }) => rest),
        stations: stations.map(({ docId, ...rest }) => rest),
        rents,
        gasExpenses
      }
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `car-rental-backup-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    writeAuditLog('সম্পূর্ণ ডাটাবেজ JSON ব্যাকআপ ডাউনলোড করা হয়েছে', 'Admin');
    showToast('JSON ব্যাকআপ ফাইল ডাউনলোড হয়েছে');
  };

  const handleCopyRules = () => {
    navigator.clipboard?.writeText(FIRESTORE_RULES_TEXT);
    setCopiedRules(true);
    showToast('Firestore Security Rules কপি করা হয়েছে');
    setTimeout(() => setCopiedRules(false), 2500);
  };

  // Filtered Rents & Gas Expenses for Summary Report (25% commission deducted for Paid & Unpaid amounts)
  const filteredSummary = useMemo(() => {
    const isAllDrivers = currentUser?.role === 'admin' && reportScope === 'all';
    const targetId = currentUser?.role === 'driver' ? currentUser.driverId : selectedDriverId;

    const matchDate = (dateStr) => {
      if (!dateStr) return false;
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    };

    const matchingRents = rents.filter((r) => {
      const driverMatch = isAllDrivers ? true : r.driverId === targetId;
      return driverMatch && matchDate(r.rentDate);
    });

    const matchingGas = gasExpenses.filter((g) => {
      const driverMatch = isAllDrivers ? true : g.driverId === targetId;
      return driverMatch && matchDate(g.expenseDate);
    });

    const paidRents = matchingRents.filter((r) => Boolean(r.isPaid));
    const unpaidRents = matchingRents.filter((r) => !r.isPaid);

    const paidRentGrossAmount = paidRents.reduce((acc, r) => acc + (Number(r.totalFare) || 0), 0);
    const unpaidRentGrossAmount = unpaidRents.reduce(
      (acc, r) => acc + (Number(r.totalFare) || 0),
      0
    );

    const paidRentAmount = paidRents.reduce((acc, r) => acc + getRentNetAfterCommission(r), 0);
    const unpaidRentAmount = unpaidRents.reduce((acc, r) => acc + getRentNetAfterCommission(r), 0);

    const totalRentAmount = matchingRents.reduce((acc, r) => acc + (Number(r.totalFare) || 0), 0);
    const totalDriverCommission = matchingRents.reduce(
      (acc, r) => acc + (Number(r.driverCommission) || 0),
      0
    );
    const totalRemainingFare = matchingRents.reduce(
      (acc, r) => acc + getRentNetAfterCommission(r),
      0
    );
    const totalGasAmount = matchingGas.reduce((acc, g) => acc + (Number(g.amount) || 0), 0);
    const ownerNetIncome = totalRemainingFare - totalGasAmount;

    return {
      matchingRents,
      matchingGas,
      paidRents,
      unpaidRents,
      paidRentGrossAmount,
      unpaidRentGrossAmount,
      paidRentAmount,
      unpaidRentAmount,
      totalRentAmount,
      totalDriverCommission,
      totalRemainingFare,
      totalGasAmount,
      ownerNetIncome
    };
  }, [rents, gasExpenses, currentUser, reportScope, selectedDriverId, startDate, endDate]);

  // Overall Admin Totals (25% commission deducted for Paid & Unpaid amounts)
  const overallTotals = useMemo(() => {
    const totalRents = rents.reduce((sum, r) => sum + (Number(r.totalFare) || 0), 0);
    const totalCommission = rents.reduce((sum, r) => sum + (Number(r.driverCommission) || 0), 0);
    const totalOwnerShare = rents.reduce((sum, r) => sum + getRentNetAfterCommission(r), 0);
    const totalGas = gasExpenses.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
    const netOwnerProfit = totalOwnerShare - totalGas;

    const paidTotalRents = rents
      .filter((r) => Boolean(r.isPaid))
      .reduce((sum, r) => sum + getRentNetAfterCommission(r), 0);
    const unpaidTotalRents = rents
      .filter((r) => !r.isPaid)
      .reduce((sum, r) => sum + getRentNetAfterCommission(r), 0);

    return {
      totalRents,
      totalCommission,
      totalOwnerShare,
      totalGas,
      netOwnerProfit,
      paidTotalRents,
      unpaidTotalRents
    };
  }, [rents, gasExpenses]);

  const selectedRentsTotalAmount = useMemo(() => {
    return rents
      .filter((r) => selectedRentIds.includes(r.id))
      .reduce((sum, r) => sum + getRentNetAfterCommission(r), 0);
  }, [rents, selectedRentIds]);

  const handlePrintReport = () => {
    try {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.focus();
        window.print();
      } else {
        showToast('ব্রাউজারের Share বা Menu (⋮) থেকে Print / Save as PDF সিলেক্ট করুন', 'error');
      }
    } catch (err) {
      console.error('Print trigger failed:', err);
      showToast('ব্রাউজারের Share বা Menu (⋮) থেকে Print / Save as PDF সিলেক্ট করুন', 'error');
    }
  };

  const activeDriverObj = drivers.find((d) => d.id === selectedDriverId);

  // ==========================================
  // 5. MOBILE-FRIENDLY LOGIN SCREEN
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-3 sm:p-5">
        {toast && (
          <div
            className={`fixed top-3 right-3 left-3 sm:left-auto sm:top-5 sm:right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        )}

        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 text-white p-5 sm:p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 mb-3">
              <Car className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              হাশেম কার রেন্টাল
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Developed by Ittehad Nur
            </p>
          </div>

          <div className="grid grid-cols-2 bg-slate-100 p-1.5 m-3.5 sm:m-4 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginTab('driver');
                setLoginError('');
              }}
              className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                loginTab === 'driver'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-4 h-4 shrink-0" />
              ড্রাইভার লগইন
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginTab('admin');
                setLoginError('');
              }}
              className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                loginTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              অ্যাডমিন লগইন
            </button>
          </div>

          <div className="px-4 sm:px-6 pb-6">
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {loginTab === 'driver' ? (
              <form onSubmit={handleDriverLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ড্রাইভার আইডি বা মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    value={driverLoginId}
                    onChange={(e) => setDriverLoginId(e.target.value)}
                    placeholder="যেমন: DRV-01 বা 017XXXXXXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    পিন (PIN) *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={driverLoginPin}
                    onChange={(e) => setDriverLoginPin(e.target.value)}
                    placeholder="আপনার পিন নম্বর দিন"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  ড্রাইভার প্যানেলে প্রবেশ করুন
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    অ্যাডমিন ইমেইল বা মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    value={adminLoginEmail}
                    onChange={(e) => setAdminLoginEmail(e.target.value)}
                    placeholder="ইমেইল বা 018XXXXXXXX দিন"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    পাসওয়ার্ড *
                  </label>
                  <input
                    type="password"
                    value={adminLoginPassword}
                    onChange={(e) => setAdminLoginPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none text-base"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  অ্যাডমিন প্যানেলে প্রবেশ করুন
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. AUTHENTICATED MOBILE-FRIENDLY SHELL
  // ==========================================
  const isAdmin = currentUser.role === 'admin';
  const isDriver = currentUser.role === 'driver';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-20 sm:pb-8">
      <style>{`
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #ffffff !important; padding-bottom: 0 !important; }
          .print-card { box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`no-print fixed top-16 sm:top-auto sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="no-print bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-400/30 shrink-0">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white truncate">
                হাশেম কার রেন্টাল
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-300 truncate">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold truncate ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isAdmin ? `${currentUser.name} (অ্যাডমিন)` : `${currentUser.name} (${currentUser.driverId})`}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>লগ আউট</span>
          </button>
        </div>

        {/* Desktop / Tablet Top Tabs */}
        <div className="hidden sm:block bg-slate-800/90 border-t border-slate-700/70">
          <div className="max-w-7xl mx-auto px-4 flex gap-1.5 py-1.5">
            {isDriver && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('rent')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'rent'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  রেন্ট ইনপুট
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gas')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'gas'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                  }`}
                >
                  <Fuel className="w-4 h-4" />
                  গ্যাস-খরচ ইনপুট
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportScope('single');
                    setActiveTab('summary');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'summary'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  আমার সামারি রিপোর্ট
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'admin'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  মাস্টার অ্যাডমিন প্যানেল
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'summary'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  সামারি ও PDF রিপোর্ট
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="no-print sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur border-t border-slate-700 px-2 py-1.5">
        <div className={`grid ${isDriver ? 'grid-cols-3' : 'grid-cols-2'} gap-1`}>
          {isDriver && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('rent')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition ${
                  activeTab === 'rent'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 active:bg-slate-800'
                }`}
              >
                <MapPin className="w-4 h-4 mb-0.5" />
                <span>রেন্ট ইনপুট</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gas')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition ${
                  activeTab === 'gas'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 active:bg-slate-800'
                }`}
              >
                <Fuel className="w-4 h-4 mb-0.5" />
                <span>গ্যাস খরচ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportScope('single');
                  setActiveTab('summary');
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition ${
                  activeTab === 'summary'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 active:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 mb-0.5" />
                <span>সামারি</span>
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 active:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mb-0.5" />
                <span>অ্যাডমিন প্যানেল</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition ${
                  activeTab === 'summary'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 active:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 mb-0.5" />
                <span>রিপোর্ট</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {isLoadingData && (
          <div className="no-print mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            ডাটাবেজ থেকে তথ্য লোড হচ্ছে...
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: RENT INPUT SYSTEM (DRIVER ACCOUNT)                    */}
        {/* ============================================================ */}
        {isDriver && activeTab === 'rent' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5 mb-4 sm:mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                    নতুন রেন্ট (ভাড়া) ইনপুট
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    গাড়ি: <strong>{currentUser.carNumber || 'নির্ধারিত'}</strong> • সেভ হলে লক হয়ে যাবে
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                  ২৫% কমিশন অটো হিসাব
                </span>
              </div>

              <form onSubmit={handleRentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      যাত্রা লোকেশন (Pickup) *
                    </label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="যেমন: উত্তরা, ঢাকা"
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      গন্তব্য লোকেশন (Drop-off) *
                    </label>
                    <input
                      type="text"
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      placeholder="যেমন: চট্টগ্রাম শহর"
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-3.5 items-end">
                  <div className="sm:col-span-2 min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      মোট ভাড়া (টাকা) *
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="any"
                      value={totalFare}
                      onChange={(e) => setTotalFare(e.target.value)}
                      placeholder="যেমন: ৫০০০"
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base font-bold"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      যাত্রীর মোবাইল নম্বর *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 left-3.5 top-3.5 absolute" />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={passengerPhone}
                        onChange={(e) => setPassengerPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1 truncate">
                      ভাড়ার তারিখ *
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 left-2.5 top-3.5 absolute pointer-events-none" />
                      <input
                        type="date"
                        value={rentDate}
                        onChange={(e) => setRentDate(e.target.value)}
                        className="w-full min-w-0 pl-8 pr-2 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs sm:text-sm bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ভাড়ার ধরন *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setTripType('one-way')}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold transition ${
                        tripType === 'one-way'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4 shrink-0" />
                      <span>শুধু যাওয়া</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType('round-trip')}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold transition ${
                        tripType === 'round-trip'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
                      }`}
                    >
                      <ArrowRightLeft className="w-4 h-4 shrink-0" />
                      <span>আসা-যাওয়া</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-4">
                  <div className="text-[11px] sm:text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-2.5">
                    স্বয়ংক্রিয় হিসাব (২৫% ড্রাইভার কমিশন)
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-slate-800/80 rounded-xl p-2.5 sm:p-3 border border-slate-700">
                      <div className="text-[11px] text-slate-400">মোট ভাড়া</div>
                      <div className="text-sm sm:text-lg font-bold text-white mt-0.5 truncate">
                        {formatBDT(numericFare)}
                      </div>
                    </div>
                    <div className="bg-emerald-950/70 rounded-xl p-2.5 sm:p-3 border border-emerald-700/50">
                      <div className="text-[11px] text-emerald-300">কমিশন (২৫%)</div>
                      <div className="text-sm sm:text-lg font-bold text-emerald-400 mt-0.5 truncate">
                        {formatBDT(calculatedCommission)}
                      </div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-2.5 sm:p-3 border border-slate-700">
                      <div className="text-[11px] text-slate-300">অবশিষ্ট ভাড়া</div>
                      <div className="text-sm sm:text-lg font-bold text-amber-300 mt-0.5 truncate">
                        {formatBDT(calculatedRemainingFare)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingRent}
                    className="w-full py-3.5 sm:py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmittingRent ? 'সংরক্ষণ হচ্ছে...' : 'ভাড়ার হিসাব সেভ করুন'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center justify-between text-sm sm:text-base">
                <span>আপনার সাম্প্রতিক ভাড়া</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {rents.filter((r) => r.driverId === currentUser.driverId).length}টি
                </span>
              </h3>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-0.5">
                {rents
                  .filter((r) => r.driverId === currentUser.driverId)
                  .slice(0, 8)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="flex items-center gap-1.5">
                          {r.rentDate}
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              r.isPaid
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {r.tripType === 'round-trip' ? 'আসা-যাওয়া' : 'শুধু যাওয়া'}
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-slate-800">
                        {r.pickupLocation} → {r.dropLocation}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">যাত্রী: {r.passengerPhone}</div>
                      <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                        <span>
                          মোট: <strong>{formatBDT(r.totalFare)}</strong>
                        </span>
                        <span className="text-emerald-700 font-bold">
                          কমিশন: {formatBDT(r.driverCommission)}
                        </span>
                      </div>
                    </div>
                  ))}
                {rents.filter((r) => r.driverId === currentUser.driverId).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    আপনার এখনো কোনো ভাড়ার এন্ট্রি নেই।
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: GAS EXPENSE INPUT SYSTEM (DRIVER ACCOUNT)              */}
        {/* ============================================================ */}
        {isDriver && activeTab === 'gas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="border-b border-slate-100 pb-3.5 mb-4 sm:mb-5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-amber-600 shrink-0" />
                  গ্যাস-খরচ ইনপুট
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  তারিখ, গ্যাস স্টেশন, টাকার পরিমাণ ও রিসিপ্টের ছবি দিন
                </p>
              </div>

              <form onSubmit={handleGasSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      তারিখ *
                    </label>
                    <input
                      type="date"
                      value={gasDate}
                      onChange={(e) => setGasDate(e.target.value)}
                      className="w-full min-w-0 px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-base bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      গ্যাস খরচের পরিমাণ (টাকা) *
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="any"
                      value={gasAmount}
                      onChange={(e) => setGasAmount(e.target.value)}
                      placeholder="যেমন: ১২০০"
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-base font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    গ্যাস ফিলিং স্টেশন সিলেক্ট করুন *
                  </label>
                  <select
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-base bg-white"
                    required
                  >
                    <option value="">
                      {stations.length > 0
                        ? '-- ফিলিং স্টেশন নির্বাচন করুন --'
                        : '-- কোনো স্টেশন যোগ করা হয়নি --'}
                    </option>
                    {stations.map((stn) => (
                      <option key={stn.id} value={stn.id}>
                        {stn.name} ({stn.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    রিসিপ্ট এর ছবি এড করুন *
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 sm:p-5 text-center hover:border-amber-500 transition bg-slate-50/70">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleReceiptChange}
                      id="receipt-upload"
                      className="hidden"
                    />
                    <label
                      htmlFor="receipt-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {receiptFileName ? receiptFileName : 'রিসিপ্টের ছবি তুলুন বা গ্যালারি থেকে নিন'}
                      </span>
                      <span className="text-xs text-slate-400">
                        ফোন ক্যামেরা বা গ্যালারি থেকে ছবি সিলেক্ট করুন
                      </span>
                    </label>

                    {receiptBase64 && (
                      <div className="mt-3 flex flex-col items-center">
                        <img
                          src={receiptBase64}
                          alt="রিসিপ্ট প্রিভিউ"
                          className="max-h-48 rounded-xl border border-slate-200 shadow-sm object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptBase64('');
                            setReceiptFileName('');
                          }}
                          className="mt-2 text-xs text-rose-600 hover:underline font-semibold"
                        >
                          ছবি মুছে ফেলুন
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingGas}
                    className="w-full py-3.5 sm:py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmittingGas ? 'আপলোড হচ্ছে...' : 'গ্যাস খরচ সেভ করুন'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">
                আপনার সাম্প্রতিক গ্যাস খরচ
              </h3>
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-0.5">
                {gasExpenses
                  .filter((g) => g.driverId === currentUser.driverId)
                  .slice(0, 8)
                  .map((g) => (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          {g.expenseDate}
                          <Lock className="w-3 h-3 text-slate-400" />
                        </div>
                        <div className="font-semibold text-sm text-slate-800 mt-0.5 truncate">
                          {g.stationName}
                        </div>
                        <div className="text-sm font-bold text-amber-700 mt-1">
                          {formatBDT(g.amount)}
                        </div>
                      </div>
                      {g.receiptImage && (
                        <button
                          type="button"
                          onClick={() => setReceiptModalUrl(g.receiptImage)}
                          className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1 shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          রিসিপ্ট
                        </button>
                      )}
                    </div>
                  ))}
                {gasExpenses.filter((g) => g.driverId === currentUser.driverId).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    আপনার এখনো কোনো গ্যাস খরচের রেকর্ড নেই।
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: DRIVER & ADMIN SUMMARY REPORT (MOBILE CARDS + TABLE)    */}
        {/* ============================================================ */}
        {activeTab === 'summary' && (
          <div className="space-y-5">
            <div className="no-print bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {isDriver ? 'আমার সামারি রিপোর্ট' : 'সামারি রিপোর্ট ও PDF প্রিন্ট'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    ৭, ১০, ১৫, ৩০ দিন বা কাস্টম তারিখে হিসাব দেখুন
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>PDF / প্রিন্ট করুন</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mt-4 items-end">
                {isAdmin && (
                  <div className="md:col-span-3 min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      রিপোর্টের আওতা
                    </label>
                    <select
                      value={reportScope}
                      onChange={(e) => setReportScope(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="all">সকল ড্রাইভার (সম্মিলিত)</option>
                      <option value="single">নির্দিষ্ট ড্রাইভার</option>
                    </select>
                  </div>
                )}

                {isAdmin && reportScope === 'single' && (
                  <div className="md:col-span-3 min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ড্রাইভার নির্বাচন
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={isAdmin && reportScope === 'single' ? 'md:col-span-6 min-w-0' : 'md:col-span-5 min-w-0'}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    সময়কাল
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { key: '7', label: '৭ দিন' },
                      { key: '10', label: '১০ দিন' },
                      { key: '15', label: '১৫ দিন' },
                      { key: '30', label: '৩০ দিন' },
                      { key: 'custom', label: 'কাস্টম' }
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handlePresetChange(p.key)}
                        className={`py-2 px-1 rounded-lg text-xs font-bold border transition text-center ${
                          datePreset === p.key
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      শুরুর তারিখ
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setDatePreset('custom');
                        setStartDate(e.target.value);
                      }}
                      className="w-full min-w-0 px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      শেষ তারিখ
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setDatePreset('custom');
                        setEndDate(e.target.value);
                      }}
                      className="w-full min-w-0 px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="print-card bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 mb-5">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    হিসাব বিবরণী
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                    {isAdmin && reportScope === 'all'
                      ? 'সকল ড্রাইভারের সামারি রিপোর্ট'
                      : `সামারি: ${
                          isDriver ? currentUser.name : activeDriverObj?.name || selectedDriverId
                        }`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    সময়কাল: <strong>{startDate}</strong> থেকে <strong>{endDate}</strong>
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs text-slate-500">
                  <div>তারিখ: {todayISO()}</div>
                  <div className="font-semibold text-slate-700 mt-0.5">
                    ট্রিপ: {filteredSummary.matchingRents.length}টি | গ্যাস:{' '}
                    {filteredSummary.matchingGas.length}টি
                  </div>
                </div>
              </div>

              <div
                className={`grid grid-cols-2 ${
                  isDriver ? 'sm:grid-cols-3' : 'lg:grid-cols-4'
                } gap-3 sm:gap-4 mb-4`}
              >
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">মোট ভাড়া</div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {formatBDT(filteredSummary.totalRentAmount)}
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-semibold text-emerald-700">
                    {isDriver ? 'আমার ২৫% কমিশন' : 'কমিশন (২৫%)'}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">
                    {formatBDT(filteredSummary.totalDriverCommission)}
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-xs font-semibold text-amber-800">মোট গ্যাস খরচ</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-800 mt-1">
                    {formatBDT(filteredSummary.totalGasAmount)}
                  </div>
                </div>

                {isAdmin && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
                    <div className="text-xs font-semibold text-emerald-300">
                      মালিকের নিট আয়
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white mt-1">
                      {formatBDT(filteredSummary.ownerNetIncome)}
                    </div>
                  </div>
                )}
              </div>

              {/* Paid vs Unpaid Summary Cards (25% Driver Commission Deducted) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-emerald-800">
                      আদায়কৃত ভাড়া (Paid • ২৫% কমিশন বাদে)
                    </div>
                    <div className="text-[11px] text-emerald-700/80 mt-0.5">
                      {filteredSummary.paidRents.length}টি ট্রিপ • মোট ভাড়া ছিল:{' '}
                      {formatBDT(filteredSummary.paidRentGrossAmount)}
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-700">
                    {formatBDT(filteredSummary.paidRentAmount)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-rose-800">
                      বাকি ভাড়া (Unpaid • ২৫% কমিশন বাদে)
                    </div>
                    <div className="text-[11px] text-rose-700/80 mt-0.5">
                      {filteredSummary.unpaidRents.length}টি ট্রিপ • মোট ভাড়া:{' '}
                      {formatBDT(filteredSummary.unpaidRentGrossAmount)}
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-rose-700">
                    {formatBDT(filteredSummary.unpaidRentAmount)}
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-slate-800 text-sm mb-2.5">ভাড়ার বিস্তারিত</h4>
              <div className="sm:hidden space-y-2.5 mb-6">
                {filteredSummary.matchingRents.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 text-xs"
                  >
                    <div className="flex justify-between items-center text-slate-500">
                      <span>{r.rentDate}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            r.isPaid
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {r.tripType === 'round-trip' ? 'আসা-যাওয়া' : 'শুধু যাওয়া'}
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-sm text-slate-900">
                      {r.pickupLocation} → {r.dropLocation}
                    </div>
                    {isAdmin && reportScope === 'all' && (
                      <div className="text-slate-600">ড্রাইভার: {r.driverName || r.driverId}</div>
                    )}
                    <div className="text-slate-500">যাত্রী: {r.passengerPhone}</div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold">
                      <span>মোট: {formatBDT(r.totalFare)}</span>
                      <span className="text-emerald-700">
                        কমিশন: {formatBDT(r.driverCommission)}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredSummary.matchingRents.length === 0 && (
                  <div className="py-5 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    এই সময়কালে কোনো ভাড়ার তথ্য নেই।
                  </div>
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl mb-6">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3">তারিখ</th>
                      {isAdmin && reportScope === 'all' && <th className="py-2.5 px-3">ড্রাইভার</th>}
                      <th className="py-2.5 px-3">যাত্রা → গন্তব্য</th>
                      <th className="py-2.5 px-3">ধরন</th>
                      <th className="py-2.5 px-3">স্ট্যাটাস</th>
                      <th className="py-2.5 px-3">যাত্রীর নম্বর</th>
                      <th className="py-2.5 px-3 text-right">মোট ভাড়া</th>
                      <th className="py-2.5 px-3 text-right">কমিশন (২৫%)</th>
                      {isAdmin && <th className="py-2.5 px-3 text-right">অবশিষ্ট ভাড়া</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSummary.matchingRents.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 whitespace-nowrap">{r.rentDate}</td>
                        {isAdmin && reportScope === 'all' && (
                          <td className="py-2.5 px-3 font-medium">{r.driverName || r.driverId}</td>
                        )}
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {r.pickupLocation} → {r.dropLocation}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {r.tripType === 'round-trip' ? 'আসা-যাওয়া' : 'শুধু যাওয়া'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              r.isPaid
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{r.passengerPhone}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {formatBDT(r.totalFare)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                          {formatBDT(r.driverCommission)}
                        </td>
                        {isAdmin && (
                          <td className="py-2.5 px-3 text-right text-slate-700 font-semibold">
                            {formatBDT(getRentNetAfterCommission(r))}
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredSummary.matchingRents.length === 0 && (
                      <tr>
                        <td
                          colSpan={isAdmin && reportScope === 'all' ? 9 : 8}
                          className="py-6 text-center text-slate-400"
                        >
                          এই সময়কালে কোনো ভাড়ার তথ্য পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h4 className="font-bold text-slate-800 text-sm mb-2.5">গ্যাস খরচের বিস্তারিত</h4>
              <div className="sm:hidden space-y-2.5">
                {filteredSummary.matchingGas.map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="text-slate-500">{g.expenseDate}</div>
                      <div className="font-bold text-sm text-slate-900 mt-0.5">{g.stationName}</div>
                      <div className="font-bold text-amber-700 mt-1">{formatBDT(g.amount)}</div>
                    </div>
                    {g.receiptImage && (
                      <button
                        type="button"
                        onClick={() => setReceiptModalUrl(g.receiptImage)}
                        className="px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        রিসিপ্ট
                      </button>
                    )}
                  </div>
                ))}
                {filteredSummary.matchingGas.length === 0 && (
                  <div className="py-5 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    এই সময়কালে কোনো গ্যাস খরচের তথ্য নেই।
                  </div>
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3">তারিখ</th>
                      {isAdmin && reportScope === 'all' && <th className="py-2.5 px-3">ড্রাইভার</th>}
                      <th className="py-2.5 px-3">গ্যাস ফিলিং স্টেশন</th>
                      <th className="py-2.5 px-3 text-right">খরচের পরিমাণ</th>
                      <th className="py-2.5 px-3 text-center no-print">রিসিপ্ট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSummary.matchingGas.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 whitespace-nowrap">{g.expenseDate}</td>
                        {isAdmin && reportScope === 'all' && (
                          <td className="py-2.5 px-3 font-medium">{g.driverName || g.driverId}</td>
                        )}
                        <td className="py-2.5 px-3 font-medium text-slate-800">{g.stationName}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                          {formatBDT(g.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          {g.receiptImage ? (
                            <button
                              type="button"
                              onClick={() => setReceiptModalUrl(g.receiptImage)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              দেখুন
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">নেই</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSummary.matchingGas.length === 0 && (
                      <tr>
                        <td
                          colSpan={isAdmin && reportScope === 'all' ? 5 : 4}
                          className="py-6 text-center text-slate-400"
                        >
                          এই সময়কালে কোনো গ্যাস খরচের তথ্য পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: MASTER ADMIN PANEL                                    */}
        {/* ============================================================ */}
        {isAdmin && activeTab === 'admin' && (
          <div className="space-y-5">
            <div className="flex overflow-x-auto gap-1.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              {[
                { id: 'overview', label: 'ওভারভিউ' },
                { id: 'rents', label: `ভাড়া (${rents.length})` },
                { id: 'gas', label: `গ্যাস (${gasExpenses.length})` },
                { id: 'drivers', label: `ড্রাইভার (${drivers.length})` },
                { id: 'stations', label: `স্টেশন (${stations.length})` },
                { id: 'security', label: 'ব্যাকআপ ও রুলস' }
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setAdminSubTab(sub.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                    adminSubTab === sub.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {adminSubTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">সর্বমোট ভাড়া</div>
                    <div className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">
                      {formatBDT(overallTotals.totalRents)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{rents.length}টি ট্রিপ</div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm">
                    <div className="text-xs font-semibold text-emerald-700">
                      কমিশন (২৫%)
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-emerald-700 mt-1">
                      {formatBDT(overallTotals.totalCommission)}
                    </div>
                    <div className="text-[11px] text-emerald-600/80 mt-1">ড্রাইভারদের অংশ</div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm">
                    <div className="text-xs font-semibold text-amber-800">মোট গ্যাস খরচ</div>
                    <div className="text-lg sm:text-2xl font-bold text-amber-800 mt-1">
                      {formatBDT(overallTotals.totalGas)}
                    </div>
                    <div className="text-[11px] text-amber-700/80 mt-1">
                      {gasExpenses.length}টি রিসিপ্ট
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
                    <div className="text-xs font-semibold text-emerald-300">
                      মালিকের নিট আয়
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-white mt-1">
                      {formatBDT(overallTotals.netOwnerProfit)}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">
                      ২৫% ও গ্যাস বাদে
                    </div>
                  </div>
                </div>

                {/* Overall Paid vs Unpaid Cards (25% Driver Commission Deducted) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-emerald-800">
                        মোট আদায়কৃত ভাড়া (Paid • ২৫% বাদে)
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        ড্রাইভারের ২৫% কমিশন বাদে হাতে পাওয়া টাকা
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-700">
                      {formatBDT(overallTotals.paidTotalRents)}
                    </div>
                  </div>

                  <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-rose-800">
                        মোট বাকি ভাড়া (Unpaid • ২৫% বাদে)
                      </div>
                      <div className="text-[11px] text-rose-700 mt-0.5">
                        ড্রাইভারের ২৫% কমিশন বাদে বাকি থাকা টাকা
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-rose-700">
                      {formatBDT(overallTotals.unpaidTotalRents)}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">
                    ড্রাইভারভিত্তিক হিসাব
                  </h3>

                  {drivers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      কোনো ড্রাইভার যুক্ত নেই। &ldquo;ড্রাইভার&rdquo; ট্যাব থেকে নতুন ড্রাইভার যোগ করুন।
                    </div>
                  ) : (
                    <>
                      <div className="sm:hidden space-y-3">
                        {drivers.map((drv) => {
                          const dRents = rents.filter((r) => r.driverId === drv.id);
                          const dGas = gasExpenses.filter((g) => g.driverId === drv.id);
                          const sumRent = dRents.reduce((a, b) => a + (Number(b.totalFare) || 0), 0);
                          const sumComm = dRents.reduce(
                            (a, b) => a + (Number(b.driverCommission) || 0),
                            0
                          );
                          const sumRem = dRents.reduce(
                            (a, b) => a + getRentNetAfterCommission(b),
                            0
                          );
                          const sumGas = dGas.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                          const net = sumRem - sumGas;

                          return (
                            <div
                              key={drv.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sm text-slate-900">
                                  {drv.name} ({drv.id})
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-semibold ${
                                    drv.active === false
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {drv.active === false ? 'নিষ্ক্রিয়' : 'সক্রিয়'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200">
                                <div>ভাড়া: <strong>{formatBDT(sumRent)}</strong></div>
                                <div className="text-emerald-700">
                                  কমিশন: <strong>{formatBDT(sumComm)}</strong>
                                </div>
                                <div className="text-amber-700">
                                  গ্যাস: <strong>{formatBDT(sumGas)}</strong>
                                </div>
                                <div className="font-bold text-slate-900">
                                  নিট আয়: {formatBDT(net)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
                              <th className="py-2.5 px-3">ড্রাইভার</th>
                              <th className="py-2.5 px-3">গাড়ি</th>
                              <th className="py-2.5 px-3">স্ট্যাটাস</th>
                              <th className="py-2.5 px-3 text-right">মোট ভাড়া</th>
                              <th className="py-2.5 px-3 text-right">কমিশন (২৫%)</th>
                              <th className="py-2.5 px-3 text-right">গ্যাস খরচ</th>
                              <th className="py-2.5 px-3 text-right">মালিকের নিট আয়</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {drivers.map((drv) => {
                              const dRents = rents.filter((r) => r.driverId === drv.id);
                              const dGas = gasExpenses.filter((g) => g.driverId === drv.id);
                              const sumRent = dRents.reduce(
                                (a, b) => a + (Number(b.totalFare) || 0),
                                0
                              );
                              const sumComm = dRents.reduce(
                                (a, b) => a + (Number(b.driverCommission) || 0),
                                0
                              );
                              const sumRem = dRents.reduce(
                                (a, b) => a + getRentNetAfterCommission(b),
                                0
                              );
                              const sumGas = dGas.reduce(
                                (a, b) => a + (Number(b.amount) || 0),
                                0
                              );
                              const net = sumRem - sumGas;

                              return (
                                <tr key={drv.id} className="hover:bg-slate-50">
                                  <td className="py-3 px-3 font-semibold text-slate-900">
                                    {drv.name}{' '}
                                    <span className="text-xs text-slate-400 font-normal">
                                      ({drv.id})
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">{drv.carNumber}</td>
                                  <td className="py-3 px-3">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        drv.active === false
                                          ? 'bg-rose-100 text-rose-700'
                                          : 'bg-emerald-100 text-emerald-700'
                                      }`}
                                    >
                                      {drv.active === false ? 'নিষ্ক্রিয়' : 'সক্রিয়'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right font-semibold">
                                    {formatBDT(sumRent)}
                                  </td>
                                  <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                                    {formatBDT(sumComm)}
                                  </td>
                                  <td className="py-3 px-3 text-right text-amber-700 font-semibold">
                                    {formatBDT(sumGas)}
                                  </td>
                                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                                    {formatBDT(net)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {adminSubTab === 'rents' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    সকল ভাড়ার তালিকা
                  </h3>
                  {rents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleSelectAllRents(rents)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {rents.every((r) => selectedRentIds.includes(r.id))
                        ? 'সব আনসিলেক্ট করুন'
                        : 'সব সিলেক্ট করুন'}
                    </button>
                  )}
                </div>

                {selectedRentIds.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="text-xs sm:text-sm font-bold text-emerald-950">
                      {selectedRentIds.length}টি ভাড়া সিলেক্ট করা হয়েছে • ২৫% বাদে মোট:{' '}
                      {formatBDT(selectedRentsTotalAmount)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkRentsPaid(selectedRentIds, true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        সিলেক্টেডগুলো Paid করুন
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkRentsPaid(selectedRentIds, false)}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold"
                      >
                        Unpaid করুন
                      </button>
                    </div>
                  </div>
                )}

                <div className="sm:hidden space-y-3">
                  {rents.map((r) => {
                    const isChecked = selectedRentIds.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition ${
                          isChecked
                            ? 'border-emerald-400 bg-emerald-50/40'
                            : 'border-slate-200 bg-slate-50/70'
                        }`}
                      >
                        <div className="flex justify-between items-center text-slate-500">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectRent(r.id)}
                              className="w-4 h-4 rounded accent-emerald-600"
                            />
                            <span>{r.rentDate}</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold ${
                                r.isPaid
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {r.driverName || r.driverId}
                            </span>
                          </div>
                        </div>
                        <div className="font-bold text-sm text-slate-900">
                          {r.pickupLocation} → {r.dropLocation}
                        </div>
                        <div className="text-slate-500">যাত্রী: {r.passengerPhone}</div>
                        <div className="flex justify-between pt-1.5 border-t border-slate-200 font-semibold">
                          <span>মোট: {formatBDT(r.totalFare)}</span>
                          <span className="text-emerald-700">
                            ২৫% বাদে: {formatBDT(getRentNetAfterCommission(r))}
                          </span>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleMarkRentsPaid([r.id], !r.isPaid)}
                            className={`px-3 py-1.5 rounded-lg font-semibold ${
                              r.isPaid
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {r.isPaid ? 'Unpaid' : 'Paid'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRent({ ...r })}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> এডিট
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRent(r.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> ডিলিট
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {rents.length === 0 && (
                    <div className="py-8 text-center text-slate-400">কোনো ভাড়া নেই।</div>
                  )}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
                        <th className="py-2.5 px-3 w-10">
                          <input
                            type="checkbox"
                            checked={
                              rents.length > 0 && rents.every((r) => selectedRentIds.includes(r.id))
                            }
                            onChange={() => toggleSelectAllRents(rents)}
                            className="w-4 h-4 rounded accent-emerald-600"
                          />
                        </th>
                        <th className="py-2.5 px-3">তারিখ</th>
                        <th className="py-2.5 px-3">ড্রাইভার</th>
                        <th className="py-2.5 px-3">যাত্রা → গন্তব্য</th>
                        <th className="py-2.5 px-3">স্ট্যাটাস</th>
                        <th className="py-2.5 px-3">যাত্রীর নম্বর</th>
                        <th className="py-2.5 px-3 text-right">মোট ভাড়া</th>
                        <th className="py-2.5 px-3 text-right">২৫% কমিশন</th>
                        <th className="py-2.5 px-3 text-right">অবশিষ্ট ভাড়া</th>
                        <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rents.map((r) => {
                        const isChecked = selectedRentIds.includes(r.id);
                        return (
                          <tr
                            key={r.id}
                            className={isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}
                          >
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectRent(r.id)}
                                className="w-4 h-4 rounded accent-emerald-600"
                              />
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">{r.rentDate}</td>
                            <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                              {r.driverName || r.driverId}
                            </td>
                            <td className="py-2.5 px-3">
                              {r.pickupLocation} → {r.dropLocation}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleMarkRentsPaid([r.id], !r.isPaid)}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  r.isPaid
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                              >
                                {r.isPaid ? 'Paid' : 'Unpaid'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">{r.passengerPhone}</td>
                            <td className="py-2.5 px-3 text-right font-bold">
                              {formatBDT(r.totalFare)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                              {formatBDT(r.driverCommission)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold">
                              {formatBDT(getRentNetAfterCommission(r))}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setEditingRent({ ...r })}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg mr-1"
                                title="এডিট করুন"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRent(r.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="ডিলিট করুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {rents.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400">
                            এখনো কোনো ভাড়া এন্ট্রি করা হয়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminSubTab === 'gas' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <h3 className="font-bold text-slate-900 mb-3.5 text-sm sm:text-base">
                  সকল গ্যাস খরচ ও রিসিপ্ট
                </h3>

                <div className="sm:hidden space-y-3">
                  {gasExpenses.map((g) => (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="text-slate-500">
                          {g.expenseDate} • {g.driverName || g.driverId}
                        </div>
                        <div className="font-bold text-sm text-slate-900 mt-0.5">
                          {g.stationName}
                        </div>
                        <div className="font-bold text-amber-700 mt-1">{formatBDT(g.amount)}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {g.receiptImage && (
                          <button
                            type="button"
                            onClick={() => setReceiptModalUrl(g.receiptImage)}
                            className="px-2.5 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold"
                          >
                            রিসিপ্ট
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteGas(g.id)}
                          className="p-2 rounded-lg bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {gasExpenses.length === 0 && (
                    <div className="py-8 text-center text-slate-400">
                      কোনো গ্যাস খরচের রেকর্ড নেই।
                    </div>
                  )}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
                        <th className="py-2.5 px-3">তারিখ</th>
                        <th className="py-2.5 px-3">ড্রাইভার</th>
                        <th className="py-2.5 px-3">গ্যাস ফিলিং স্টেশন</th>
                        <th className="py-2.5 px-3 text-right">খরচের পরিমাণ</th>
                        <th className="py-2.5 px-3 text-center">রিসিপ্ট</th>
                        <th className="py-2.5 px-3 text-center">ডিলিট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gasExpenses.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 whitespace-nowrap">{g.expenseDate}</td>
                          <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                            {g.driverName || g.driverId}
                          </td>
                          <td className="py-2.5 px-3">{g.stationName}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                            {formatBDT(g.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {g.receiptImage ? (
                              <button
                                type="button"
                                onClick={() => setReceiptModalUrl(g.receiptImage)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-semibold"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                রিসিপ্ট দেখুন
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">ছবি নেই</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteGas(g.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="ডিলিট করুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {gasExpenses.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            এখনো কোনো গ্যাস খরচের রেকর্ড নেই।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminSubTab === 'drivers' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <form
                  onSubmit={handleAddDriver}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3 h-fit"
                >
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    নতুন ড্রাইভার যুক্ত করুন
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ড্রাইভার আইডি *
                    </label>
                    <input
                      type="text"
                      value={newDriverId}
                      onChange={(e) => setNewDriverId(e.target.value)}
                      placeholder="যেমন: DRV-01"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ড্রাইভারের নাম *
                    </label>
                    <input
                      type="text"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      placeholder="ড্রাইভারের নাম"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      মোবাইল নম্বর *
                    </label>
                    <input
                      type="tel"
                      value={newDriverPhone}
                      onChange={(e) => setNewDriverPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      গাড়ির নম্বর
                    </label>
                    <input
                      type="text"
                      value={newDriverCar}
                      onChange={(e) => setNewDriverCar(e.target.value)}
                      placeholder="গাড়ির নম্বর"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      লগইন পিন (কমপক্ষে ৪ ডিজিট) *
                    </label>
                    <input
                      type="text"
                      value={newDriverPin}
                      onChange={(e) => setNewDriverPin(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition"
                  >
                    ড্রাইভার সেভ করুন
                  </button>
                </form>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 mb-3.5 text-sm sm:text-base">
                    নিবন্ধিত ড্রাইভার তালিকা
                  </h3>
                  <div className="space-y-3">
                    {drivers.map((d) => (
                      <div
                        key={d.id}
                        className="p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex flex-wrap items-center gap-2 text-sm">
                            <span>{d.name}</span>
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                              {d.id}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                d.active === false
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {d.active === false ? 'নিষ্ক্রিয়' : 'সক্রিয়'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            মোবাইল: {d.phone} • গাড়ি: {d.carNumber} • পিন:{' '}
                            <span className="font-mono font-bold text-slate-700">
                              {d.pin || '1234'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDriverPin(d);
                              setNewPinValue(d.pin || '1234');
                            }}
                            className="flex-1 sm:flex-initial px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>পিন</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleDriverStatus(d)}
                            className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                              d.active === false
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {d.active === false ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" /> <span>সক্রিয়</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" /> <span>লক</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {drivers.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-sm">
                        এখনো কোনো ড্রাইভার যুক্ত করা হয়নি।
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {adminSubTab === 'stations' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <form
                  onSubmit={handleAddStation}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3 h-fit"
                >
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    নতুন গ্যাস ফিলিং স্টেশন যোগ করুন
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ফিলিং স্টেশনের নাম *
                    </label>
                    <input
                      type="text"
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      placeholder="ফিলিং স্টেশনের নাম"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      এলাকা / ঠিকানা
                    </label>
                    <input
                      type="text"
                      value={newStationLocation}
                      onChange={(e) => setNewStationLocation(e.target.value)}
                      placeholder="এলাকা বা ঠিকানা"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition"
                  >
                    স্টেশন যুক্ত করুন
                  </button>
                </form>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 mb-3.5 text-sm sm:text-base">
                    গ্যাস ফিলিং স্টেশন তালিকা
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stations.map((stn) => (
                      <div
                        key={stn.id}
                        className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                            <Fuel className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>{stn.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{stn.location}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteStation(stn)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {stations.length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                        কোনো গ্যাস স্টেশন নেই। বাম পাশ থেকে নতুন স্টেশন যোগ করুন।
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {adminSubTab === 'security' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      ডাটাবেজ ব্যাকআপ ও সুরক্ষা
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    আপনার সকল ভাড়া, গ্যাস খরচ, রিসিপ্ট ও ড্রাইভারের তথ্য{' '}
                    <strong>{firebaseConfig.projectId}</strong> Firestore ডাটাবেজে সংরক্ষিত আছে।
                    যেকোনো সময় সম্পূর্ণ ডাটার JSON ব্যাকআপ ডাউনলোড করতে পারেন।
                  </p>

                  <button
                    type="button"
                    onClick={handleExportBackupJSON}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>JSON ব্যাকআপ ডাউনলোড</span>
                  </button>

                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      সাম্প্রতিক অডিট লগ
                    </h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                        >
                          <div className="font-medium text-slate-800">{log.action}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {log.actor} • {log.createdAt?.slice(0, 19).replace('T', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-slate-800" />
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Firestore Security Rules
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRules}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      {copiedRules ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-emerald-300 p-3.5 rounded-xl text-xs overflow-x-auto leading-relaxed font-mono">
                    {FIRESTORE_RULES_TEXT}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODALS: RECEIPT VIEWER, EDIT RENT, EDIT DRIVER PIN           */}
      {/* ============================================================ */}
      {receiptModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setReceiptModalUrl(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900">গ্যাস রিসিপ্টের ছবি</h3>
              <button
                type="button"
                onClick={() => setReceiptModalUrl(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center bg-slate-50 rounded-xl p-2">
              <img
                src={receiptModalUrl}
                alt="গ্যাস রিসিপ্ট"
                className="max-h-[70vh] rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {editingRent && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setEditingRent(null)}
        >
          <form
            onSubmit={handleSaveEditedRent}
            className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">ভাড়ার তথ্য এডিট করুন</h3>
              <button
                type="button"
                onClick={() => setEditingRent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                যাত্রা লোকেশন
              </label>
              <input
                type="text"
                value={editingRent.pickupLocation}
                onChange={(e) =>
                  setEditingRent({ ...editingRent, pickupLocation: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                গন্তব্য লোকেশন
              </label>
              <input
                type="text"
                value={editingRent.dropLocation}
                onChange={(e) =>
                  setEditingRent({ ...editingRent, dropLocation: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  মোট ভাড়া (টাকা)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={editingRent.totalFare}
                  onChange={(e) => setEditingRent({ ...editingRent, totalFare: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  required
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  তারিখ
                </label>
                <input
                  type="date"
                  value={editingRent.rentDate}
                  onChange={(e) => setEditingRent({ ...editingRent, rentDate: e.target.value })}
                  className="w-full min-w-0 px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  যাত্রীর নম্বর
                </label>
                <input
                  type="text"
                  value={editingRent.passengerPhone}
                  onChange={(e) =>
                    setEditingRent({ ...editingRent, passengerPhone: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ভাড়ার ধরন
                </label>
                <select
                  value={editingRent.tripType}
                  onChange={(e) => setEditingRent({ ...editingRent, tripType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="one-way">শুধু যাওয়া</option>
                  <option value="round-trip">আসা-যাওয়া</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
              >
                আপডেট সেভ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {editingDriverPin && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setEditingDriverPin(null)}
        >
          <form
            onSubmit={handleSaveDriverPin}
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">ড্রাইভার পিন রিসেট</h3>
              <button
                type="button"
                onClick={() => setEditingDriverPin(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              ড্রাইভার: <strong>{editingDriverPin.name}</strong> ({editingDriverPin.id})
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                নতুন পিন (কমপক্ষে ৪ ডিজিট) *
              </label>
              <input
                type="text"
                value={newPinValue}
                onChange={(e) => setNewPinValue(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDriverPin(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
