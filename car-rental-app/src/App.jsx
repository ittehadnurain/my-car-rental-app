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
  Camera,
  MessageCircle,
  Globe
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

// দেশের কোড (880) সহ আপনার WhatsApp নম্বর লিখুন (কোনো + বা space ছাড়া)
const ADMIN_WHATSAPP_NUMBER = '8801877695700';

// শুধুমাত্র ড্রাইভার আইডির হেডারের নিচে দেখানোর স্ক্রলিং সতর্কতা বার্তা
const DRIVER_SAFETY_SCROLL_TEXT = {
  bn: 'একটি দুর্ঘটনা সারা জীবনের কান্না | ড্রাইভিং এর সময় অতিরিক্ত গতি পরিহার করুন | সাবধানে গাড়ি চালান, জীবন বাঁচান | গাড়ি চালানোর সময় ফোন এড়িয়ে চলুন',
  en: 'One accident means a lifetime of sorrow | Avoid speeding while driving | Drive safely, save lives | Avoid using your phone while driving'
};

// ==========================================
// 2. TRANSLATIONS (BANGLA DEFAULT + ENGLISH)
// ==========================================
const TRANSLATIONS = {
  bn: {
    brandName: 'হাশেম কার রেন্টাল',
    developedBy: 'Developed by Ittehad Nur',
    driverLogin: 'ড্রাইভার লগইন',
    adminLogin: 'অ্যাডমিন লগইন',
    driverIdOrPhoneLabel: 'ড্রাইভার আইডি বা মোবাইল নম্বর *',
    driverIdOrPhonePlaceholder: 'যেমন: DRV-01 বা 017XXXXXXXX',
    pinLabel: 'পিন (PIN) *',
    pinPlaceholder: 'আপনার পিন নম্বর দিন',
    enterDriverPanel: 'ড্রাইভার প্যানেলে প্রবেশ করুন',
    adminEmailOrPhoneLabel: 'অ্যাডমিন ইমেইল বা মোবাইল নম্বর *',
    adminEmailOrPhonePlaceholder: 'ইমেইল বা 018XXXXXXXX দিন',
    passwordLabel: 'পাসওয়ার্ড *',
    passwordPlaceholder: 'পাসওয়ার্ড দিন',
    enterAdminPanel: 'অ্যাডমিন প্যানেলে প্রবেশ করুন',
    adminBadge: 'অ্যাডমিন',
    logout: 'লগ আউট',
    navRentInput: 'রেন্ট ইনপুট',
    navGasInput: 'গ্যাস-খরচ ইনপুট',
    navGasShort: 'গ্যাস খরচ',
    navMySummary: 'আমার সামারি রিপোর্ট',
    navSummaryShort: 'সামারি',
    navMasterAdmin: 'মাস্টার অ্যাডমিন প্যানেল',
    navAdminShort: 'অ্যাডমিন প্যানেল',
    navSummaryPdf: 'সামারি ও PDF রিপোর্ট',
    navReportShort: 'রিপোর্ট',
    loadingData: 'ডাটাবেজ থেকে তথ্য লোড হচ্ছে...',
    newRentTitle: 'নতুন রেন্ট (ভাড়া) ইনপুট',
    carLabel: 'গাড়ি:',
    notAssigned: 'নির্ধারিত নয়',
    lockedAfterSaveNote: 'সেভ হলে লক হয়ে যাবে',
    autoCommissionBadge: '২৫% কমিশন অটো হিসাব',
    pickupLabel: 'যাত্রা লোকেশন (Pickup) *',
    pickupPlaceholder: 'যেমন: উত্তরা, ঢাকা',
    dropLabel: 'গন্তব্য লোকেশন (Drop-off) *',
    dropPlaceholder: 'যেমন: চট্টগ্রাম শহর',
    totalFareLabel: 'মোট ভাড়া (টাকা) *',
    totalFarePlaceholder: 'যেমন: ৫০০০',
    rentDateLabel: 'ভাড়ার তারিখ *',
    tripTypeLabel: 'ভাড়ার ধরন *',
    oneWay: 'শুধু যাওয়া',
    roundTrip: 'আসা-যাওয়া',
    autoCalcTitle: 'স্বয়ংক্রিয় হিসাব (২৫% ড্রাইভার কমিশন)',
    totalFareShort: 'মোট ভাড়া',
    commission25: 'কমিশন (২৫%)',
    remainingFare: 'অবশিষ্ট ভাড়া',
    saving: 'সংরক্ষণ হচ্ছে...',
    saveRentBtn: 'ভাড়ার হিসাব সেভ করুন',
    yourRecentRents: 'আপনার সাম্প্রতিক ভাড়া',
    countSuffix: 'টি',
    totalPrefix: 'মোট:',
    commissionPrefix: 'কমিশন:',
    noRentsYet: 'আপনার এখনো কোনো ভাড়ার এন্ট্রি নেই।',
    gasInputTitle: 'গ্যাস-খরচ ইনপুট',
    gasInputSub: 'সাবমিট করার পর অ্যাডমিন অনুমোদন করলে এটি গ্যাস খরচে যুক্ত হবে',
    dateLabel: 'তারিখ *',
    gasAmountLabel: 'গ্যাস খরচের পরিমাণ (টাকা) *',
    gasAmountPlaceholder: 'যেমন: ১২০০',
    selectStationLabel: 'গ্যাস ফিলিং স্টেশন সিলেক্ট করুন *',
    selectStationDefault: '-- ফিলিং স্টেশন নির্বাচন করুন --',
    noStationAdded: '-- কোনো স্টেশন যোগ করা হয়নি --',
    addReceiptLabel: 'রিসিপ্ট এর ছবি এড করুন *',
    captureOrGallery: 'রিসিপ্টের ছবি তুলুন বা গ্যালারি থেকে নিন',
    selectFromCameraOrGallery: 'ফোন ক্যামেরা বা গ্যালারি থেকে ছবি সিলেক্ট করুন',
    removeImage: 'ছবি মুছে ফেলুন',
    uploading: 'আপলোড হচ্ছে...',
    submitForApproval: 'অনুমোদনের জন্য পাঠান',
    yourGasList: 'আপনার গ্যাস খরচের তালিকা',
    receiptBtn: 'রিসিপ্ট',
    noGasYet: 'আপনার এখনো কোনো গ্যাস খরচের রেকর্ড নেই।',
    summaryReportSub: '৭, ১০, ১৫, ৩০ দিন বা কাস্টম তারিখে হিসাব দেখুন (Unpaid শেষ হলে বাকি গ্যাস Paid ভাড়া থেকে কাটা হয়)',
    printPdfBtn: 'PDF / প্রিন্ট করুন',
    reportScopeLabel: 'রিপোর্টের আওতা',
    allDriversScope: 'সকল ড্রাইভার (সম্মিলিত)',
    singleDriverScope: 'নির্দিষ্ট ড্রাইভার',
    selectDriverLabel: 'ড্রাইভার নির্বাচন',
    durationLabel: 'সময়কাল',
    days7: '৭ দিন',
    days10: '১০ দিন',
    days15: '১৫ দিন',
    days30: '৩০ দিন',
    customRange: 'কাস্টম',
    startDateLabel: 'শুরুর তারিখ',
    endDateLabel: 'শেষ তারিখ',
    statementHeader: 'হিসাব বিবরণী',
    allDriversReportTitle: 'সকল ড্রাইভারের সামারি রিপোর্ট',
    summaryPrefix: 'সামারি:',
    periodPrefix: 'সময়কাল:',
    toText: 'থেকে',
    datePrefix: 'তারিখ:',
    tripsLabel: 'ট্রিপ:',
    approvedGasLabel: 'অনুমোদিত গ্যাস:',
    myCommission25: 'আমার ২৫% কমিশন',
    totalGasCost: 'মোট গ্যাস খরচ',
    ownerNetIncome: 'মালিকের নিট আয়',
    paidRentCardTitle: 'আদায়কৃত ভাড়া (Paid • ২৫% ও অবশিষ্ট গ্যাস বাদে)',
    paidRentLabel: 'Paid ভাড়া:',
    gasDeductedLabel: 'গ্যাস কাটা:',
    unpaidRentCardTitle: 'বাকি ভাড়া (Unpaid • ২৫% ও অনুমোদিত গ্যাস বাদে)',
    after25Label: '২৫% বাদে:',
    rentDetailsTitle: 'ভাড়ার বিস্তারিত',
    noRentInPeriod: 'এই সময়কালে কোনো ভাড়ার তথ্য নেই।',
    driverCol: 'ড্রাইভার',
    routeCol: 'যাত্রা → গন্তব্য',
    typeCol: 'ধরন',
    statusCol: 'স্ট্যাটাস',
    approvedGasDetailsTitle: 'অনুমোদিত গ্যাস খরচের বিস্তারিত',
    noGasInPeriod: 'এই সময়কালে কোনো অনুমোদিত গ্যাস খরচের তথ্য নেই।',
    stationCol: 'গ্যাস ফিলিং স্টেশন',
    amountCol: 'খরচের পরিমাণ',
    viewBtn: 'দেখুন',
    noneText: 'নেই',
    tabOverview: 'ওভারভিউ',
    tabRents: 'ভাড়া',
    tabGas: 'গ্যাস',
    tabDrivers: 'ড্রাইভার',
    tabStations: 'স্টেশন',
    tabSecurity: 'ব্যাকআপ ও রুলস',
    grandTotalRent: 'সর্বমোট ভাড়া',
    driversShare: 'ড্রাইভারদের অংশ',
    approvedCountSuffix: 'টি অনুমোদিত',
    pendingCountSuffix: 'টি পেন্ডিং',
    after25AndGas: '২৫% ও অনুমোদিত গ্যাস বাদে',
    totalPaidRentCard: 'মোট আদায়কৃত ভাড়া (Paid • ২৫% ও অবশিষ্ট গ্যাস বাদে)',
    totalUnpaidRentCard: 'মোট বাকি ভাড়া (Unpaid • ২৫% ও অনুমোদিত গ্যাস বাদে)',
    driverWiseSummary: 'ড্রাইভারভিত্তিক হিসাব',
    noDriversYet: 'কোনো ড্রাইভার যুক্ত নেই। "ড্রাইভার" ট্যাব থেকে নতুন ড্রাইভার যোগ করুন।',
    inactiveStatus: 'নিষ্ক্রিয়',
    activeStatus: 'সক্রিয়',
    carCol: 'গাড়ি',
    allRentsList: 'সকল ভাড়ার তালিকা',
    deselectAll: 'সব আনসিলেক্ট করুন',
    selectAll: 'সব সিলেক্ট করুন',
    markSelectedPaid: 'সিলেক্টেডগুলো Paid করুন',
    markUnpaid: 'Unpaid করুন',
    editBtn: 'এডিট',
    deleteBtn: 'ডিলিট',
    actionCol: 'অ্যাকশন',
    allGasAndApproval: 'সকল গ্যাস খরচ ও অনুমোদন',
    gasApprovalNote: 'অ্যাডমিন Approve করলেই গ্যাস খরচ হিসেবে যুক্ত হবে (সব ভাড়া Paid থাকলে Paid ভাড়া থেকে সমন্বয় হবে)',
    approveBtn: 'Approve করুন',
    rejectBtn: 'Reject করুন',
    paidBtn: 'Paid করুন',
    approvalCol: 'অনুমোদন',
    paymentCol: 'পেমেন্ট',
    viewReceiptBtn: 'রিসিপ্ট দেখুন',
    noPhoto: 'ছবি নেই',
    addNewDriverTitle: 'নতুন ড্রাইভার যুক্ত করুন',
    driverIdLabel: 'ড্রাইভার আইডি *',
    driverNameLabel: 'ড্রাইভারের নাম *',
    mobileLabel: 'মোবাইল নম্বর *',
    carNumberLabel: 'গাড়ির নম্বর',
    loginPinLabel: 'লগইন পিন (কমপক্ষে ৪ ডিজিট) *',
    saveDriverBtn: 'ড্রাইভার সেভ করুন',
    registeredDriversTitle: 'নিবন্ধিত ড্রাইভার তালিকা',
    pinShort: 'পিন',
    unlockBtn: 'সক্রিয়',
    lockBtn: 'লক',
    addNewStationTitle: 'নতুন গ্যাস ফিলিং স্টেশন যোগ করুন',
    stationNameLabel: 'ফিলিং স্টেশনের নাম *',
    stationLocationLabel: 'এলাকা / ঠিকানা',
    addStationBtn: 'স্টেশন যুক্ত করুন',
    stationListTitle: 'গ্যাস ফিলিং স্টেশন তালিকা',
    noStationsYet: 'কোনো গ্যাস স্টেশন নেই। বাম পাশ থেকে নতুন স্টেশন যোগ করুন।',
    dbBackupTitle: 'ডাটাবেজ ব্যাকআপ ও সুরক্ষা',
    downloadJsonBackup: 'JSON ব্যাকআপ ডাউনলোড',
    recentAuditLogs: 'সাম্প্রতিক অডিট লগ',
    copiedBtn: 'কপি হয়েছে',
    copyBtn: 'কপি করুন',
    gasReceiptModalTitle: 'গ্যাস রিসিপ্টের ছবি',
    editRentModalTitle: 'ভাড়ার তথ্য এডিট করুন',
    cancelBtn: 'বাতিল',
    saveChangesBtn: 'আপডেট সেভ করুন',
    resetPinModalTitle: 'ড্রাইভার পিন রিসেট',
    newPinLabel: 'নতুন পিন (কমপক্ষে ৪ ডিজিট) *',
    saveBtn: 'সংরক্ষণ করুন'
  },
  en: {
    brandName: 'Hashem Car Rental',
    developedBy: 'Developed by Ittehad Nur',
    driverLogin: 'Driver Login',
    adminLogin: 'Admin Login',
    driverIdOrPhoneLabel: 'Driver ID or Mobile Number *',
    driverIdOrPhonePlaceholder: 'e.g. DRV-01 or 017XXXXXXXX',
    pinLabel: 'PIN *',
    pinPlaceholder: 'Enter your PIN',
    enterDriverPanel: 'Enter Driver Panel',
    adminEmailOrPhoneLabel: 'Admin Email or Mobile Number *',
    adminEmailOrPhonePlaceholder: 'Enter email or 018XXXXXXXX',
    passwordLabel: 'Password *',
    passwordPlaceholder: 'Enter password',
    enterAdminPanel: 'Enter Admin Panel',
    adminBadge: 'Admin',
    logout: 'Logout',
    navRentInput: 'Rent Input',
    navGasInput: 'Gas Expense Input',
    navGasShort: 'Gas Expense',
    navMySummary: 'My Summary Report',
    navSummaryShort: 'Summary',
    navMasterAdmin: 'Master Admin Panel',
    navAdminShort: 'Admin Panel',
    navSummaryPdf: 'Summary & PDF Report',
    navReportShort: 'Reports',
    loadingData: 'Loading data from database...',
    newRentTitle: 'New Rent (Trip) Input',
    carLabel: 'Car:',
    notAssigned: 'Not Assigned',
    lockedAfterSaveNote: 'Locked after saving',
    autoCommissionBadge: '25% Commission Auto Calc',
    pickupLabel: 'Pickup Location *',
    pickupPlaceholder: 'e.g. Uttara, Dhaka',
    dropLabel: 'Drop-off Location *',
    dropPlaceholder: 'e.g. Chattogram City',
    totalFareLabel: 'Total Fare (BDT) *',
    totalFarePlaceholder: 'e.g. 5000',
    rentDateLabel: 'Rent Date *',
    tripTypeLabel: 'Trip Type *',
    oneWay: 'One-Way',
    roundTrip: 'Round-Trip',
    autoCalcTitle: 'Automatic Calculation (25% Driver Commission)',
    totalFareShort: 'Total Fare',
    commission25: 'Commission (25%)',
    remainingFare: 'Remaining Fare',
    saving: 'Saving...',
    saveRentBtn: 'Save Rent Entry',
    yourRecentRents: 'Your Recent Rents',
    countSuffix: '',
    totalPrefix: 'Total:',
    commissionPrefix: 'Commission:',
    noRentsYet: 'You have no rent entries yet.',
    gasInputTitle: 'Gas Expense Input',
    gasInputSub: 'Added to gas expenses once approved by Admin',
    dateLabel: 'Date *',
    gasAmountLabel: 'Gas Expense Amount (BDT) *',
    gasAmountPlaceholder: 'e.g. 1200',
    selectStationLabel: 'Select Gas Filling Station *',
    selectStationDefault: '-- Select Filling Station --',
    noStationAdded: '-- No stations added yet --',
    addReceiptLabel: 'Attach Receipt Photo *',
    captureOrGallery: 'Take receipt photo or pick from gallery',
    selectFromCameraOrGallery: 'Select image from camera or gallery',
    removeImage: 'Remove image',
    uploading: 'Uploading...',
    submitForApproval: 'Submit for Approval',
    yourGasList: 'Your Gas Expense List',
    receiptBtn: 'Receipt',
    noGasYet: 'You have no gas expense records yet.',
    summaryReportSub: 'View 7, 10, 15, 30 days or custom dates (Remaining gas after Unpaid is deducted from Paid rent)',
    printPdfBtn: 'Print / Save PDF',
    reportScopeLabel: 'Report Scope',
    allDriversScope: 'All Drivers (Combined)',
    singleDriverScope: 'Single Driver',
    selectDriverLabel: 'Select Driver',
    durationLabel: 'Duration',
    days7: '7 Days',
    days10: '10 Days',
    days15: '15 Days',
    days30: '30 Days',
    customRange: 'Custom',
    startDateLabel: 'Start Date',
    endDateLabel: 'End Date',
    statementHeader: 'Account Statement',
    allDriversReportTitle: 'All Drivers Summary Report',
    summaryPrefix: 'Summary:',
    periodPrefix: 'Period:',
    toText: 'to',
    datePrefix: 'Date:',
    tripsLabel: 'Trips:',
    approvedGasLabel: 'Approved Gas:',
    myCommission25: 'My 25% Commission',
    totalGasCost: 'Total Gas Expense',
    ownerNetIncome: 'Owner Net Income',
    paidRentCardTitle: 'Collected Rent (Paid • After 25% & Remaining Gas)',
    paidRentLabel: 'Paid Rent:',
    gasDeductedLabel: 'Gas Deducted:',
    unpaidRentCardTitle: 'Unpaid Rent (Unpaid • After 25% & Approved Gas)',
    after25Label: 'After 25%:',
    rentDetailsTitle: 'Rent Details',
    noRentInPeriod: 'No rent entries found for this period.',
    driverCol: 'Driver',
    routeCol: 'Pickup → Drop-off',
    typeCol: 'Type',
    statusCol: 'Status',
    approvedGasDetailsTitle: 'Approved Gas Expense Details',
    noGasInPeriod: 'No approved gas expenses found for this period.',
    stationCol: 'Gas Filling Station',
    amountCol: 'Amount',
    viewBtn: 'View',
    noneText: 'None',
    tabOverview: 'Overview',
    tabRents: 'Rents',
    tabGas: 'Gas',
    tabDrivers: 'Drivers',
    tabStations: 'Stations',
    tabSecurity: 'Backup & Rules',
    grandTotalRent: 'Grand Total Rent',
    driversShare: 'Drivers Share',
    approvedCountSuffix: ' Approved',
    pendingCountSuffix: ' Pending',
    after25AndGas: 'After 25% & Approved Gas',
    totalPaidRentCard: 'Total Collected Rent (Paid • After 25% & Remaining Gas)',
    totalUnpaidRentCard: 'Total Unpaid Rent (Unpaid • After 25% & Approved Gas)',
    driverWiseSummary: 'Driver-Wise Summary',
    noDriversYet: 'No drivers added yet. Add a new driver from the "Drivers" tab.',
    inactiveStatus: 'Inactive',
    activeStatus: 'Active',
    carCol: 'Car',
    allRentsList: 'All Rent Entries',
    deselectAll: 'Deselect All',
    selectAll: 'Select All',
    markSelectedPaid: 'Mark Selected Paid',
    markUnpaid: 'Mark Unpaid',
    editBtn: 'Edit',
    deleteBtn: 'Delete',
    actionCol: 'Action',
    allGasAndApproval: 'All Gas Expenses & Approval',
    gasApprovalNote: 'Counted in gas expenses once approved by Admin (Remaining gas is adjusted from Paid rent when Unpaid is cleared)',
    approveBtn: 'Approve',
    rejectBtn: 'Reject',
    paidBtn: 'Mark Paid',
    approvalCol: 'Approval',
    paymentCol: 'Payment',
    viewReceiptBtn: 'View Receipt',
    noPhoto: 'No Photo',
    addNewDriverTitle: 'Add New Driver',
    driverIdLabel: 'Driver ID *',
    driverNameLabel: 'Driver Name *',
    mobileLabel: 'Mobile Number *',
    carNumberLabel: 'Car Number',
    loginPinLabel: 'Login PIN (At least 4 digits) *',
    saveDriverBtn: 'Save Driver',
    registeredDriversTitle: 'Registered Drivers',
    pinShort: 'PIN',
    unlockBtn: 'Activate',
    lockBtn: 'Lock',
    addNewStationTitle: 'Add New Gas Filling Station',
    stationNameLabel: 'Filling Station Name *',
    stationLocationLabel: 'Area / Address',
    addStationBtn: 'Add Station',
    stationListTitle: 'Gas Filling Stations',
    noStationsYet: 'No gas stations yet. Add a station from the left panel.',
    dbBackupTitle: 'Database Backup & Security',
    downloadJsonBackup: 'Download JSON Backup',
    recentAuditLogs: 'Recent Audit Logs',
    copiedBtn: 'Copied',
    copyBtn: 'Copy',
    gasReceiptModalTitle: 'Gas Receipt Photo',
    editRentModalTitle: 'Edit Rent Entry',
    cancelBtn: 'Cancel',
    saveChangesBtn: 'Save Changes',
    resetPinModalTitle: 'Reset Driver PIN',
    newPinLabel: 'New PIN (At least 4 digits) *',
    saveBtn: 'Save'
  }
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
// 3. SEED / DEFAULT DATA & ADMIN ACCOUNTS
// ==========================================
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
// 4. HELPER FUNCTIONS
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

// Strictly require explicit approvalStatus === 'approved' to count as approved
const getGasApprovalStatus = (gas) => {
  if (!gas || !gas.approvalStatus) return 'pending';
  return gas.approvalStatus;
};

// Deduct approved gas from unpaid rent first (clamped at 0 so unpaid never goes negative),
// and deduct any remaining approved gas from paid rent
const calculatePaidAndUnpaidAfterGas = (paidRentAfterComm, unpaidRentAfterComm, approvedGasTotal) => {
  const paidBase = Math.max(0, Number(paidRentAfterComm) || 0);
  const unpaidBase = Math.max(0, Number(unpaidRentAfterComm) || 0);
  const gasTotal = Math.max(0, Number(approvedGasTotal) || 0);

  const gasDeductedFromUnpaid = Math.min(unpaidBase, gasTotal);
  const unpaidRentAmount = +(unpaidBase - gasDeductedFromUnpaid).toFixed(2);
  const gasDeductedFromPaid = +(gasTotal - gasDeductedFromUnpaid).toFixed(2);
  const paidNetRentAfterGas = +(paidBase - gasDeductedFromPaid).toFixed(2);

  return {
    paidRentAmount: paidBase,
    unpaidRentAfterCommission: unpaidBase,
    gasDeductedFromUnpaid,
    gasDeductedFromPaid,
    unpaidRentAmount,
    paidNetRentAfterGas
  };
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
// 5. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // Language State: Default Bangla ('bn'), toggleable to English ('en')
  const [lang, setLang] = useState(() => {
    try {
      const savedLang = localStorage.getItem('rental_app_lang');
      return savedLang === 'en' ? 'en' : 'bn';
    } catch {
      return 'bn';
    }
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.bn;

  useEffect(() => {
    try {
      localStorage.setItem('rental_app_lang', lang);
    } catch (e) {
      console.error(e);
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

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
  const [selectedGasIds, setSelectedGasIds] = useState([]);

  // Firestore Data States
  const [drivers, setDrivers] = useState([]);
  const [stations, setStations] = useState([]);
  const [rents, setRents] = useState([]);
  const [gasExpenses, setGasExpenses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Rent Form State (Passenger Phone removed)
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [totalFare, setTotalFare] = useState('');
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

  // Build WhatsApp URL with pre-filled driver context
  const whatsappUrl = useMemo(() => {
    const cleanPhone = String(ADMIN_WHATSAPP_NUMBER || '').replace(/\D/g, '');
    const greetingText =
      currentUser?.role === 'driver'
        ? lang === 'en'
          ? `Assalamu Alaikum, I am ${currentUser.name} (${currentUser.driverId}).`
          : `আসসালামু আলাইকুম, আমি ${currentUser.name} (${currentUser.driverId})।`
        : lang === 'en'
        ? 'Assalamu Alaikum, contacting from Hashem Car Rental.'
        : 'আসসালামু আলাইকুম, হাশেম কার রেন্টাল থেকে যোগাযোগ করছি।';
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greetingText)}`;
  }, [currentUser, lang]);

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
        showToast(
          lang === 'en'
            ? 'Your driver ID has been temporarily suspended. Please contact Admin.'
            : 'আপনার ড্রাইভার আইডি সাময়িকভাবে স্থগিত করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।',
          'error'
        );
      } else if (matched) {
        setCurrentUser((prev) => ({
          ...prev,
          name: matched.name,
          phone: matched.phone,
          carNumber: matched.carNumber
        }));
      }
    }
  }, [drivers, lang]);

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
      setLoginError(
        lang === 'en'
          ? 'Invalid Driver ID/mobile number or PIN. Please verify with Admin.'
          : 'ভুল ড্রাইভার আইডি/মোবাইল নম্বর অথবা পিন। অ্যাডমিন প্যানেল থেকে আইডি যাচাই করুন।'
      );
      return;
    }

    if (foundDriver.active === false) {
      setLoginError(
        lang === 'en'
          ? 'This driver ID is currently inactive.'
          : 'এই ড্রাইভার আইডিটি বর্তমানে নিষ্ক্রিয় (Inactive) রয়েছে।'
      );
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
    showToast(lang === 'en' ? `Welcome, ${foundDriver.name}!` : `স্বাগতম, ${foundDriver.name}!`);
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
      showToast(
        lang === 'en' ? `Welcome to ${matchedAdmin.name}'s panel!` : `${matchedAdmin.name} প্যানেলে স্বাগতম!`
      );
    } else {
      setLoginError(
        lang === 'en'
          ? 'Invalid admin email/mobile number or password.'
          : 'ভুল অ্যাডমিন ইমেইল/মোবাইল নম্বর বা পাসওয়ার্ড।'
      );
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      writeAuditLog(`লগ আউট: ${currentUser.name || currentUser.role}`, currentUser.name || 'User');
    }
    setCurrentUser(null);
    setLoginError('');
    setSelectedRentIds([]);
    setSelectedGasIds([]);
    showToast(lang === 'en' ? 'Logged out successfully' : 'সফলভাবে লগ আউট করা হয়েছে');
  };

  // Submit Rent Entry
  const handleRentSubmit = async (e) => {
    e.preventDefault();
    const targetDriverId = currentUser?.role === 'driver' ? currentUser.driverId : selectedDriverId;

    if (!pickupLocation.trim() || !dropLocation.trim()) {
      showToast(
        lang === 'en' ? 'Enter pickup and drop-off locations' : 'যাত্রা ও গন্তব্য লোকেশন লিখুন',
        'error'
      );
      return;
    }
    if (numericFare <= 0) {
      showToast(
        lang === 'en' ? 'Enter a valid total fare greater than 0' : 'সঠিক মোট ভাড়া (০-এর বেশি) লিখুন',
        'error'
      );
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
      showToast(
        lang === 'en' ? 'Rent entry saved successfully!' : 'ভাড়ার হিসাব সফলভাবে সংরক্ষিত হয়েছে!'
      );
      setPickupLocation('');
      setDropLocation('');
      setTotalFare('');
      setTripType('one-way');
    } catch (error) {
      console.error(error);
      showToast(
        lang === 'en' ? 'Failed to save data' : 'ডাটা সংরক্ষণে সমস্যা হয়েছে',
        'error'
      );
    } finally {
      setIsSubmittingRent(false);
    }
  };

  // Rent Selection & Paid Status Handlers
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
      showToast(
        lang === 'en'
          ? 'Only Admin can update Paid status'
          : 'শুধুমাত্র অ্যাডমিন Paid স্ট্যাটাস আপডেট করতে পারবেন',
        'error'
      );
      return;
    }
    if (!targetIds || targetIds.length === 0) {
      showToast(
        lang === 'en' ? 'Select at least one rent entry first' : 'আগে অন্তত একটি ভাড়া সিলেক্ট করুন',
        'error'
      );
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
        lang === 'en'
          ? nextPaidStatus
            ? `${targetIds.length} rent entry/entries marked as Paid`
            : `${targetIds.length} rent entry/entries marked as Unpaid`
          : nextPaidStatus
          ? `${targetIds.length}টি ভাড়ায় Paid ট্যাগ লাগানো হয়েছে`
          : `${targetIds.length}টি ভাড়া Unpaid করা হয়েছে`
      );
    } catch (err) {
      console.error(err);
      showToast(
        lang === 'en' ? 'Failed to update Paid status' : 'Paid স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে',
        'error'
      );
    }
  };

  // Gas Selection, Approval & Paid Status Handlers
  const toggleSelectGas = (id) => {
    setSelectedGasIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllGas = (visibleGas) => {
    const visibleIds = visibleGas.map((g) => g.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedGasIds.includes(id));
    if (allSelected) {
      setSelectedGasIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedGasIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleGasApprovalChange = async (targetIds, nextStatus) => {
    if (currentUser?.role !== 'admin') {
      showToast(
        lang === 'en'
          ? 'Only Admin can approve gas expenses'
          : 'শুধুমাত্র অ্যাডমিন গ্যাস খরচ অনুমোদন করতে পারবেন',
        'error'
      );
      return;
    }
    const idsArray = Array.isArray(targetIds) ? targetIds : [targetIds];
    if (idsArray.length === 0) {
      showToast(
        lang === 'en' ? 'Select at least one gas expense first' : 'আগে অন্তত একটি গ্যাস খরচ সিলেক্ট করুন',
        'error'
      );
      return;
    }

    const updatedFields = {
      approvalStatus: nextStatus,
      approvedAt: nextStatus === 'approved' ? new Date().toISOString() : null,
      approvedBy: nextStatus === 'approved' ? currentUser?.name || 'Admin' : null
    };

    try {
      for (const gasId of idsArray) {
        if (isFirebaseReady && db && !String(gasId).startsWith('GAS-')) {
          await updateDoc(doc(db, 'gas_expenses', gasId), updatedFields);
        }
      }

      setGasExpenses((prev) =>
        prev.map((g) => (idsArray.includes(g.id) ? { ...g, ...updatedFields } : g))
      );

      const statusLabel =
        nextStatus === 'approved'
          ? 'Approved (গ্যাস খরচ হিসেবে যুক্ত)'
          : nextStatus === 'rejected'
          ? 'Rejected'
          : 'Pending';

      await writeAuditLog(
        `অ্যাডমিন ${idsArray.length}টি গ্যাস খরচ ${statusLabel} করেছেন`,
        currentUser?.name || 'Admin'
      );

      setSelectedGasIds((prev) => prev.filter((id) => !idsArray.includes(id)));
      showToast(
        lang === 'en'
          ? nextStatus === 'approved'
            ? `${idsArray.length} gas expense(s) approved and added to Gas Expenses!`
            : nextStatus === 'rejected'
            ? `${idsArray.length} gas expense(s) rejected`
            : `${idsArray.length} gas expense(s) set to Pending`
          : nextStatus === 'approved'
          ? `${idsArray.length}টি গ্যাস খরচ অনুমোদিত হয়েছে এবং এখন গ্যাস খরচে গণনা হবে!`
          : nextStatus === 'rejected'
          ? `${idsArray.length}টি গ্যাস খরচ বাতিল (Rejected) করা হয়েছে`
          : `${idsArray.length}টি গ্যাস খরচ Pending-এ রাখা হয়েছে`
      );
    } catch (err) {
      console.error(err);
      showToast(
        lang === 'en' ? 'Failed to update approval status' : 'অনুমোদন স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে',
        'error'
      );
    }
  };

  const handleMarkGasPaid = async (targetIds = selectedGasIds, nextPaidStatus = true) => {
    if (currentUser?.role !== 'admin') {
      showToast(
        lang === 'en'
          ? 'Only Admin can update gas Paid status'
          : 'শুধুমাত্র অ্যাডমিন গ্যাস খরচের Paid স্ট্যাটাস আপডেট করতে পারবেন',
        'error'
      );
      return;
    }
    const idsArray = Array.isArray(targetIds) ? targetIds : [targetIds];
    if (idsArray.length === 0) {
      showToast(
        lang === 'en' ? 'Select at least one gas expense first' : 'আগে অন্তত একটি গ্যাস খরচ সিলেক্ট করুন',
        'error'
      );
      return;
    }

    const paidTimestamp = nextPaidStatus ? new Date().toISOString() : null;

    try {
      for (const gasId of idsArray) {
        if (isFirebaseReady && db && !String(gasId).startsWith('GAS-')) {
          await updateDoc(doc(db, 'gas_expenses', gasId), {
            isPaid: nextPaidStatus,
            paidAt: paidTimestamp
          });
        }
      }

      setGasExpenses((prev) =>
        prev.map((g) =>
          idsArray.includes(g.id) ? { ...g, isPaid: nextPaidStatus, paidAt: paidTimestamp } : g
        )
      );

      await writeAuditLog(
        `অ্যাডমিন ${idsArray.length}টি গ্যাস খরচ ${nextPaidStatus ? 'Paid' : 'Unpaid'} মার্ক করেছেন`,
        currentUser?.name || 'Admin'
      );

      setSelectedGasIds((prev) => prev.filter((id) => !idsArray.includes(id)));
      showToast(
        lang === 'en'
          ? nextPaidStatus
            ? `${idsArray.length} gas expense(s) marked as Paid`
            : `${idsArray.length} gas expense(s) marked as Unpaid`
          : nextPaidStatus
          ? `${idsArray.length}টি গ্যাস খরচে Paid ট্যাগ লাগানো হয়েছে`
          : `${idsArray.length}টি গ্যাস খরচ Unpaid করা হয়েছে`
      );
    } catch (err) {
      console.error(err);
      showToast(
        lang === 'en' ? 'Failed to update gas Paid status' : 'গ্যাস খরচের Paid স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে',
        'error'
      );
    }
  };

  // Receipt File Change Handler
  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(
        lang === 'en' ? 'Upload image files only (JPG, PNG, WEBP)' : 'শুধুমাত্র ছবি (JPG, PNG, WEBP) আপলোড করুন',
        'error'
      );
      return;
    }

    try {
      setReceiptFileName(file.name);
      const compressed = await compressImageToBase64(file, 800, 0.65);
      setReceiptBase64(compressed);
      showToast(lang === 'en' ? 'Receipt photo is ready' : 'রিসিপ্টের ছবি প্রস্তুত হয়েছে');
    } catch (err) {
      console.error(err);
      showToast(lang === 'en' ? 'Failed to process image' : 'ছবি প্রসেস করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Submit Gas Expense Entry
  const handleGasSubmit = async (e) => {
    e.preventDefault();
    const targetDriverId = currentUser?.role === 'driver' ? currentUser.driverId : selectedDriverId;
    const amountNum = parseFloat(gasAmount) || 0;

    if (!selectedStationId) {
      showToast(
        lang === 'en' ? 'Select a gas filling station' : 'গ্যাস ফিলিং স্টেশন সিলেক্ট করুন',
        'error'
      );
      return;
    }
    if (amountNum <= 0) {
      showToast(
        lang === 'en' ? 'Enter a valid gas expense amount' : 'গ্যাস খরচের টাকার পরিমাণ লিখুন',
        'error'
      );
      return;
    }
    if (!receiptBase64) {
      showToast(
        lang === 'en' ? 'Attach a receipt photo' : 'রিসিপ্টের ছবি সংযুক্ত করুন',
        'error'
      );
      return;
    }

    setIsSubmittingGas(true);
    const stationObj = stations.find((s) => s.id === selectedStationId);
    const driverObj = drivers.find((d) => d.id === targetDriverId);

    const gasPayload = {
      driverId: targetDriverId,
      driverName: driverObj?.name || targetDriverId,
      stationId: selectedStationId,
      stationName: stationObj?.name || (lang === 'en' ? 'Unknown Station' : 'অজানা স্টেশন'),
      amount: amountNum,
      receiptImage: receiptBase64,
      receiptFileName: receiptFileName || 'receipt.jpg',
      expenseDate: gasDate,
      approvalStatus: 'pending',
      approvedAt: null,
      approvedBy: null,
      isPaid: false,
      paidAt: null,
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
        `নতুন গ্যাস খরচ সাবমিট (${targetDriverId}) [PENDING]: ${
          stationObj?.name || ''
        }, পরিমাণ: ${formatBDT(amountNum)}`,
        currentUser?.name || targetDriverId
      );
      showToast(
        lang === 'en'
          ? 'Gas expense saved as Pending. It will be added once Admin approves.'
          : 'গ্যাস খরচ Pending অবস্থায় সেভ হয়েছে। অ্যাডমিন Approve করলে গ্যাস খরচে যুক্ত হবে।'
      );
      setGasAmount('');
      setReceiptBase64('');
      setReceiptFileName('');
    } catch (error) {
      console.error(error);
      showToast(
        lang === 'en' ? 'Failed to save gas expense' : 'গ্যাস খরচ সংরক্ষণে সমস্যা হয়েছে',
        'error'
      );
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
      await writeAuditLog(
        `অ্যাডমিন ভাড়া এডিট করেছেন: ID ${editingRent.id}, নতুন ভাড়া ${formatBDT(fare)}`,
        'Admin'
      );
      showToast(lang === 'en' ? 'Rent entry updated' : 'ভাড়ার তথ্য আপডেট করা হয়েছে');
      setEditingRent(null);
    } catch (err) {
      console.error(err);
      showToast(lang === 'en' ? 'Failed to update' : 'আপডেট করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Delete Rent Entry
  const handleDeleteRent = async (rentId) => {
    if (currentUser?.role !== 'admin') {
      showToast(
        lang === 'en'
          ? 'Only Admin can delete data'
          : 'শুধুমাত্র অ্যাডমিন ডাটা ডিলিট করতে পারবেন',
        'error'
      );
      return;
    }
    const confirmMsg =
      lang === 'en'
        ? 'Are you sure you want to delete this rent entry?'
        : 'আপনি কি নিশ্চিতভাবে এই ভাড়ার হিসাবটি মুছে ফেলতে চান?';
    if (!window.confirm(confirmMsg)) return;
    try {
      if (isFirebaseReady && db && !String(rentId).startsWith('LOCAL-')) {
        await deleteDoc(doc(db, 'rents', rentId));
      }
      setRents((prev) => prev.filter((r) => r.id !== rentId));
      setSelectedRentIds((prev) => prev.filter((id) => id !== rentId));
      await writeAuditLog(`অ্যাডমিন ভাড়া ডিলিট করেছেন: ID ${rentId}`, 'Admin');
      showToast(lang === 'en' ? 'Rent entry deleted' : 'ভাড়ার রেকর্ড মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error(err);
      showToast(lang === 'en' ? 'Failed to delete' : 'মুছতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Delete Gas Expense
  const handleDeleteGas = async (gasId) => {
    if (currentUser?.role !== 'admin') {
      showToast(
        lang === 'en'
          ? 'Only Admin can delete gas expenses'
          : 'শুধুমাত্র অ্যাডমিন গ্যাস খরচ ডিলিট করতে পারবেন',
        'error'
      );
      return;
    }
    const confirmMsg =
      lang === 'en'
        ? 'Are you sure you want to delete this gas expense record?'
        : 'আপনি কি নিশ্চিতভাবে এই গ্যাস খরচের রেকর্ডটি মুছে ফেলতে চান?';
    if (!window.confirm(confirmMsg)) return;
    try {
      if (isFirebaseReady && db && !String(gasId).startsWith('GAS-')) {
        await deleteDoc(doc(db, 'gas_expenses', gasId));
      }
      setGasExpenses((prev) => prev.filter((g) => g.id !== gasId));
      setSelectedGasIds((prev) => prev.filter((id) => id !== gasId));
      await writeAuditLog(`অ্যাডমিন গ্যাস খরচ ডিলিট করেছেন: ID ${gasId}`, 'Admin');
      showToast(lang === 'en' ? 'Gas expense deleted' : 'গ্যাস খরচের রেকর্ড মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error(err);
      showToast(lang === 'en' ? 'Failed to delete' : 'মুছতে সমস্যা হয়েছে', 'error');
    }
  };

  // Admin: Add Driver
  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') return;
    if (!newDriverId.trim() || !newDriverName.trim() || !newDriverPhone.trim()) {
      showToast(
        lang === 'en'
          ? 'Enter Driver ID, Name and Mobile number'
          : 'ড্রাইভার আইডি, নাম ও মোবাইল নম্বর দিন',
        'error'
      );
      return;
    }
    const cleanPin = (newDriverPin || '1234').trim();
    if (cleanPin.length < 4) {
      showToast(
        lang === 'en' ? 'PIN must be at least 4 digits' : 'পিন অন্তত ৪ ডিজিটের হতে হবে',
        'error'
      );
      return;
    }

    const driverObj = {
      id: newDriverId.trim().toUpperCase(),
      name: newDriverName.trim(),
      phone: newDriverPhone.trim(),
      carNumber: newDriverCar.trim() || (lang === 'en' ? 'Not Assigned' : 'নির্ধারিত নয়'),
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
      showToast(lang === 'en' ? 'New driver added' : 'নতুন ড্রাইভার যুক্ত করা হয়েছে');
      setNewDriverId('');
      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverCar('');
      setNewDriverPin('1234');
    } catch (err) {
      console.error(err);
      showToast(
        lang === 'en' ? 'Failed to add driver' : 'ড্রাইভার যুক্ত করতে সমস্যা হয়েছে',
        'error'
      );
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
      showToast(
        lang === 'en'
          ? `${drv.name}'s ID is now ${nextActive ? 'Active' : 'Inactive'}`
          : `${drv.name}-এর আইডি ${nextActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`
      );
    } catch (err) {
      console.error(err);
      showToast(
        lang === 'en' ? 'Failed to update status' : 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে',
        'error'
      );
    }
  };

  // Admin: Update Driver PIN
  const handleSaveDriverPin = async (e) => {
    e.preventDefault();
    if (!editingDriverPin || currentUser?.role !== 'admin') return;
    if (!newPinValue || newPinValue.trim().length < 4) {
      showToast(
        lang === 'en'
          ? 'Enter a new PIN with at least 4 digits'
          : 'কমপক্ষে ৪ ডিজিটের নতুন পিন দিন',
        'error'
      );
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
      await writeAuditLog(
        `ড্রাইভার পিন রিসেট: ${editingDriverPin.name} (${editingDriverPin.id})`,
        'Admin'
      );
      showToast(
        lang === 'en'
          ? `New PIN set for ${editingDriverPin.name}`
          : `${editingDriverPin.name}-এর নতুন পিন সেট হয়েছে`
      );
      setEditingDriverPin(null);
      setNewPinValue('');
    } catch (err) {
      console.error(err);
      showToast(
        lang === 'en' ? 'Failed to update PIN' : 'পিন আপডেট করতে সমস্যা হয়েছে',
        'error'
      );
    }
  };

  // Admin: Add Gas Station
  const handleAddStation = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') return;
    if (!newStationName.trim()) {
      showToast(
        lang === 'en'
          ? 'Enter gas filling station name'
          : 'গ্যাস ফিলিং স্টেশনের নাম দিন',
        'error'
      );
      return;
    }
    const stationObj = {
      id: 'STN-' + Date.now(),
      name: newStationName.trim(),
      location: newStationLocation.trim() || (lang === 'en' ? 'Bangladesh' : 'বাংলাদেশ')
    };
    try {
      if (isFirebaseReady && db) {
        await addDoc(collection(db, 'stations'), stationObj);
      } else {
        setStations((prev) => [...prev, stationObj]);
      }
      setSelectedStationId(stationObj.id);
      await writeAuditLog(`নতুন গ্যাস স্টেশন যুক্ত: ${stationObj.name}`, 'Admin');
      showToast(
        lang === 'en'
          ? 'New gas filling station added'
          : 'নতুন গ্যাস ফিলিং স্টেশন যুক্ত হয়েছে'
      );
      setNewStationName('');
      setNewStationLocation('');
    } catch (err) {
      console.error(err);
      showToast(
        lang === 'en' ? 'Failed to add station' : 'স্টেশন যুক্ত করতে সমস্যা হয়েছে',
        'error'
      );
    }
  };

  // Admin: Delete Gas Station
  const handleDeleteStation = async (stn) => {
    if (currentUser?.role !== 'admin') return;
    const confirmMsg =
      lang === 'en'
        ? `Delete station "${stn.name}"?`
        : `"${stn.name}" স্টেশনটি মুছে ফেলতে চান?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      if (isFirebaseReady && db && stn.docId) {
        await deleteDoc(doc(db, 'stations', stn.docId));
      }
      setStations((prev) => prev.filter((item) => item.id !== stn.id));
      await writeAuditLog(`গ্যাস স্টেশন মুছে ফেলা হয়েছে: ${stn.name}`, 'Admin');
      showToast(lang === 'en' ? 'Station deleted' : 'স্টেশন মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error(err);
      showToast(lang === 'en' ? 'Failed to delete' : 'মুছতে সমস্যা হয়েছে', 'error');
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
    showToast(
      lang === 'en'
        ? 'JSON backup file downloaded'
        : 'JSON ব্যাকআপ ফাইল ডাউনলোড হয়েছে'
    );
  };

  const handleCopyRules = () => {
    navigator.clipboard?.writeText(FIRESTORE_RULES_TEXT);
    setCopiedRules(true);
    showToast(
      lang === 'en'
        ? 'Firestore Security Rules copied'
        : 'Firestore Security Rules কপি করা হয়েছে'
    );
    setTimeout(() => setCopiedRules(false), 2500);
  };

  // Only Admin-approved gas expenses are added to Gas Expenses
  const approvedGasExpenses = useMemo(
    () => gasExpenses.filter((g) => getGasApprovalStatus(g) === 'approved'),
    [gasExpenses]
  );

  const pendingGasCount = useMemo(
    () => gasExpenses.filter((g) => getGasApprovalStatus(g) === 'pending').length,
    [gasExpenses]
  );

  // Filtered Rents & Approved Gas Expenses for Summary Report
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

    const matchingGas = approvedGasExpenses.filter((g) => {
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

    const paidRentAfterComm = paidRents.reduce((acc, r) => acc + getRentNetAfterCommission(r), 0);
    const unpaidRentAfterComm = unpaidRents.reduce((acc, r) => acc + getRentNetAfterCommission(r), 0);

    const totalGasAmount = matchingGas.reduce((acc, g) => acc + (Number(g.amount) || 0), 0);

    const {
      paidRentAmount,
      unpaidRentAfterCommission,
      gasDeductedFromUnpaid,
      gasDeductedFromPaid,
      unpaidRentAmount,
      paidNetRentAfterGas
    } = calculatePaidAndUnpaidAfterGas(paidRentAfterComm, unpaidRentAfterComm, totalGasAmount);

    const totalRentAmount = matchingRents.reduce((acc, r) => acc + (Number(r.totalFare) || 0), 0);
    const totalDriverCommission = matchingRents.reduce(
      (acc, r) => acc + (Number(r.driverCommission) || 0),
      0
    );
    const totalRemainingFare = matchingRents.reduce(
      (acc, r) => acc + getRentNetAfterCommission(r),
      0
    );
    const ownerNetIncome = totalRemainingFare - totalGasAmount;

    return {
      matchingRents,
      matchingGas,
      paidRents,
      unpaidRents,
      paidRentGrossAmount,
      unpaidRentGrossAmount,
      paidRentAmount,
      unpaidRentAfterCommission,
      gasDeductedFromUnpaid,
      gasDeductedFromPaid,
      unpaidRentAmount,
      paidNetRentAfterGas,
      totalRentAmount,
      totalDriverCommission,
      totalRemainingFare,
      totalGasAmount,
      ownerNetIncome
    };
  }, [rents, approvedGasExpenses, currentUser, reportScope, selectedDriverId, startDate, endDate]);

  // Overall Admin Totals
  const overallTotals = useMemo(() => {
    const totalRents = rents.reduce((sum, r) => sum + (Number(r.totalFare) || 0), 0);
    const totalCommission = rents.reduce((sum, r) => sum + (Number(r.driverCommission) || 0), 0);
    const totalOwnerShare = rents.reduce((sum, r) => sum + getRentNetAfterCommission(r), 0);
    const totalGas = approvedGasExpenses.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
    const netOwnerProfit = totalOwnerShare - totalGas;

    const paidTotalRents = rents
      .filter((r) => Boolean(r.isPaid))
      .reduce((sum, r) => sum + getRentNetAfterCommission(r), 0);
    const unpaidRentsRaw = rents
      .filter((r) => !r.isPaid)
      .reduce((sum, r) => sum + getRentNetAfterCommission(r), 0);

    const {
      unpaidRentAfterCommission,
      gasDeductedFromUnpaid,
      gasDeductedFromPaid,
      unpaidRentAmount: unpaidTotalRents,
      paidNetRentAfterGas
    } = calculatePaidAndUnpaidAfterGas(paidTotalRents, unpaidRentsRaw, totalGas);

    return {
      totalRents,
      totalCommission,
      totalOwnerShare,
      totalGas,
      netOwnerProfit,
      paidTotalRents,
      unpaidRentsAfterCommission: unpaidRentAfterCommission,
      gasDeductedFromUnpaid,
      gasDeductedFromPaid,
      unpaidTotalRents,
      paidNetRentAfterGas
    };
  }, [rents, approvedGasExpenses]);

  const selectedRentsTotalAmount = useMemo(() => {
    return rents
      .filter((r) => selectedRentIds.includes(r.id))
      .reduce((sum, r) => sum + getRentNetAfterCommission(r), 0);
  }, [rents, selectedRentIds]);

  const selectedGasTotalAmount = useMemo(() => {
    return gasExpenses
      .filter((g) => selectedGasIds.includes(g.id))
      .reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  }, [gasExpenses, selectedGasIds]);

  const handlePrintReport = () => {
    try {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.focus();
        window.print();
      } else {
        showToast(
          lang === 'en'
            ? 'Select Print / Save as PDF from your browser menu'
            : 'ব্রাউজারের Share বা Menu (⋮) থেকে Print / Save as PDF সিলেক্ট করুন',
          'error'
        );
      }
    } catch (err) {
      console.error('Print trigger failed:', err);
      showToast(
        lang === 'en'
          ? 'Select Print / Save as PDF from your browser menu'
          : 'ব্রাউজারের Share বা Menu (⋮) থেকে Print / Save as PDF সিলেক্ট করুন',
        'error'
      );
    }
  };

  const activeDriverObj = drivers.find((d) => d.id === selectedDriverId);

  // Reusable Language Switcher Pill
  const renderLanguageToggle = () => (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label="Switch Language between Bangla and English"
      title={lang === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
    >
      <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span className={lang === 'bn' ? 'text-emerald-400' : 'text-slate-400'}>বাংলা</span>
      <span className="text-slate-600">|</span>
      <span className={lang === 'en' ? 'text-emerald-400' : 'text-slate-400'}>EN</span>
    </button>
  );

  // ==========================================
  // 6. MOBILE-FRIENDLY LOGIN SCREEN
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
          <div className="bg-slate-900 text-white p-5 sm:p-6 text-center relative">
            <div className="flex justify-end mb-2">
              {renderLanguageToggle()}
            </div>
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 mb-3">
              <Car className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              {t.brandName}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {t.developedBy}
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
              {t.driverLogin}
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
              {t.adminLogin}
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
                    {t.driverIdOrPhoneLabel}
                  </label>
                  <input
                    type="text"
                    value={driverLoginId}
                    onChange={(e) => setDriverLoginId(e.target.value)}
                    placeholder={t.driverIdOrPhonePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t.pinLabel}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={driverLoginPin}
                    onChange={(e) => setDriverLoginPin(e.target.value)}
                    placeholder={t.pinPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {t.enterDriverPanel}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t.adminEmailOrPhoneLabel}
                  </label>
                  <input
                    type="text"
                    value={adminLoginEmail}
                    onChange={(e) => setAdminLoginEmail(e.target.value)}
                    placeholder={t.adminEmailOrPhonePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t.passwordLabel}
                  </label>
                  <input
                    type="password"
                    value={adminLoginPassword}
                    onChange={(e) => setAdminLoginPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none text-base"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {t.enterAdminPanel}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Floating WhatsApp Corner Button on Login Screen */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          title="WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white font-bold text-sm shadow-xl transition"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          <span>WhatsApp</span>
        </a>
      </div>
    );
  }

  // ==========================================
  // 7. AUTHENTICATED MOBILE-FRIENDLY SHELL
  // ==========================================
  const isAdmin = currentUser.role === 'admin';
  const isDriver = currentUser.role === 'driver';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-24 sm:pb-12">
      <style>{`
        .print-only { display: none; }
        @keyframes driverTickerScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .driver-ticker-track {
          display: flex;
          width: max-content;
          animation: driverTickerScroll 24s linear infinite;
        }
        .driver-ticker-wrap:hover .driver-ticker-track {
          animation-play-state: paused;
        }
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
                {t.brandName}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-300 truncate">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold truncate ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isAdmin
                    ? `${currentUser.name} (${t.adminBadge})`
                    : `${currentUser.name} (${currentUser.driverId})`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {renderLanguageToggle()}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
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
                  {t.navRentInput}
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
                  {t.navGasInput}
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
                  {t.navMySummary}
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
                  {t.navMasterAdmin}
                  {pendingGasCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-rose-600 text-white font-bold">
                      {pendingGasCount}
                    </span>
                  )}
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
                  {t.navSummaryPdf}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Scrolling Safety Text Below Header — Strictly Visible to Driver Accounts Only */}
      {isDriver && (
        <div
          role="region"
          aria-label="Driver Safety Notice"
          className="no-print driver-ticker-wrap bg-amber-50 border-b border-amber-200 text-amber-950 overflow-hidden py-2 select-none"
        >
          <div className="driver-ticker-track text-xs sm:text-sm font-semibold">
            <span className="px-6 whitespace-nowrap">{DRIVER_SAFETY_SCROLL_TEXT[lang]}</span>
            <span className="px-6 whitespace-nowrap" aria-hidden="true">
              {DRIVER_SAFETY_SCROLL_TEXT[lang]}
            </span>
          </div>
        </div>
      )}

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
                <span>{t.navRentInput}</span>
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
                <span>{t.navGasShort}</span>
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
                <span>{t.navSummaryShort}</span>
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 active:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mb-0.5" />
                <span>{t.navAdminShort}</span>
                {pendingGasCount > 0 && (
                  <span className="absolute top-1 right-4 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                    {pendingGasCount}
                  </span>
                )}
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
                <span>{t.navReportShort}</span>
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
            {t.loadingData}
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
                    {t.newRentTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.carLabel} <strong>{currentUser.carNumber || t.notAssigned}</strong> • {t.lockedAfterSaveNote}
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                  {t.autoCommissionBadge}
                </span>
              </div>

              <form onSubmit={handleRentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {t.pickupLabel}
                    </label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder={t.pickupPlaceholder}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {t.dropLabel}
                    </label>
                    <input
                      type="text"
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      placeholder={t.dropPlaceholder}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 items-end">
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {t.totalFareLabel}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="any"
                      value={totalFare}
                      onChange={(e) => setTotalFare(e.target.value)}
                      placeholder={t.totalFarePlaceholder}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base font-bold"
                      required
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {t.rentDateLabel}
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 left-3.5 top-3.5 absolute pointer-events-none" />
                      <input
                        type="date"
                        value={rentDate}
                        onChange={(e) => setRentDate(e.target.value)}
                        className="w-full min-w-0 pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t.tripTypeLabel}
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
                      <span>{t.oneWay}</span>
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
                      <span>{t.roundTrip}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-4">
                  <div className="text-[11px] sm:text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-2.5">
                    {t.autoCalcTitle}
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-slate-800/80 rounded-xl p-2.5 sm:p-3 border border-slate-700">
                      <div className="text-[11px] text-slate-400">{t.totalFareShort}</div>
                      <div className="text-sm sm:text-lg font-bold text-white mt-0.5 truncate">
                        {formatBDT(numericFare)}
                      </div>
                    </div>
                    <div className="bg-emerald-950/70 rounded-xl p-2.5 sm:p-3 border border-emerald-700/50">
                      <div className="text-[11px] text-emerald-300">{t.commission25}</div>
                      <div className="text-sm sm:text-lg font-bold text-emerald-400 mt-0.5 truncate">
                        {formatBDT(calculatedCommission)}
                      </div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-2.5 sm:p-3 border border-slate-700">
                      <div className="text-[11px] text-slate-300">{t.remainingFare}</div>
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
                    <span>{isSubmittingRent ? t.saving : t.saveRentBtn}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center justify-between text-sm sm:text-base">
                <span>{t.yourRecentRents}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {rents.filter((r) => r.driverId === currentUser.driverId).length}
                  {t.countSuffix}
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
                          {r.tripType === 'round-trip' ? t.roundTrip : t.oneWay}
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-slate-800">
                        {r.pickupLocation} → {r.dropLocation}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                        <span>
                          {t.totalPrefix} <strong>{formatBDT(r.totalFare)}</strong>
                        </span>
                        <span className="text-emerald-700 font-bold">
                          {t.commissionPrefix} {formatBDT(r.driverCommission)}
                        </span>
                      </div>
                    </div>
                  ))}
                {rents.filter((r) => r.driverId === currentUser.driverId).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    {t.noRentsYet}
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
                  {t.gasInputTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.gasInputSub}
                </p>
              </div>

              <form onSubmit={handleGasSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {t.dateLabel}
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
                      {t.gasAmountLabel}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="any"
                      value={gasAmount}
                      onChange={(e) => setGasAmount(e.target.value)}
                      placeholder={t.gasAmountPlaceholder}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-base font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {t.selectStationLabel}
                  </label>
                  <select
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-base bg-white"
                    required
                  >
                    <option value="">
                      {stations.length > 0 ? t.selectStationDefault : t.noStationAdded}
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
                    {t.addReceiptLabel}
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
                        {receiptFileName ? receiptFileName : t.captureOrGallery}
                      </span>
                      <span className="text-xs text-slate-400">
                        {t.selectFromCameraOrGallery}
                      </span>
                    </label>

                    {receiptBase64 && (
                      <div className="mt-3 flex flex-col items-center">
                        <img
                          src={receiptBase64}
                          alt="Receipt preview"
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
                          {t.removeImage}
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
                    <span>{isSubmittingGas ? t.uploading : t.submitForApproval}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center justify-between text-sm sm:text-base">
                <span>{t.yourGasList}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {gasExpenses.filter((g) => g.driverId === currentUser.driverId).length}
                  {t.countSuffix}
                </span>
              </h3>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-0.5">
                {gasExpenses
                  .filter((g) => g.driverId === currentUser.driverId)
                  .slice(0, 10)
                  .map((g) => {
                    const approval = getGasApprovalStatus(g);
                    return (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                            <span>{g.expenseDate}</span>
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold ${
                                approval === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : approval === 'rejected'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {approval === 'approved'
                                ? 'Approved'
                                : approval === 'rejected'
                                ? 'Rejected'
                                : 'Pending'}
                            </span>
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
                            {t.receiptBtn}
                          </button>
                        )}
                      </div>
                    );
                  })}
                {gasExpenses.filter((g) => g.driverId === currentUser.driverId).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    {t.noGasYet}
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
                    {isDriver ? t.navMySummary : t.navSummaryPdf}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t.summaryReportSub}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.printPdfBtn}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mt-4 items-end">
                {isAdmin && (
                  <div className="md:col-span-3 min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {t.reportScopeLabel}
                    </label>
                    <select
                      value={reportScope}
                      onChange={(e) => setReportScope(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="all">{t.allDriversScope}</option>
                      <option value="single">{t.singleDriverScope}</option>
                    </select>
                  </div>
                )}

                {isAdmin && reportScope === 'single' && (
                  <div className="md:col-span-3 min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {t.selectDriverLabel}
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
                    {t.durationLabel}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { key: '7', label: t.days7 },
                      { key: '10', label: t.days10 },
                      { key: '15', label: t.days15 },
                      { key: '30', label: t.days30 },
                      { key: 'custom', label: t.customRange }
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
                      {t.startDateLabel}
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
                      {t.endDateLabel}
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
                    {t.statementHeader}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                    {isAdmin && reportScope === 'all'
                      ? t.allDriversReportTitle
                      : `${t.summaryPrefix} ${
                          isDriver ? currentUser.name : activeDriverObj?.name || selectedDriverId
                        }`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.periodPrefix} <strong>{startDate}</strong> {t.toText} <strong>{endDate}</strong>
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs text-slate-500">
                  <div>
                    {t.datePrefix} {todayISO()}
                  </div>
                  <div className="font-semibold text-slate-700 mt-0.5">
                    {t.tripsLabel} {filteredSummary.matchingRents.length}
                    {t.countSuffix} | {t.approvedGasLabel} {filteredSummary.matchingGas.length}
                    {t.countSuffix}
                  </div>
                </div>
              </div>

              <div
                className={`grid grid-cols-2 ${
                  isDriver ? 'sm:grid-cols-3' : 'lg:grid-cols-4'
                } gap-3 sm:gap-4 mb-4`}
              >
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">{t.totalFareShort}</div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {formatBDT(filteredSummary.totalRentAmount)}
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-semibold text-emerald-700">
                    {isDriver ? t.myCommission25 : t.commission25}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">
                    {formatBDT(filteredSummary.totalDriverCommission)}
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-xs font-semibold text-amber-800">{t.totalGasCost}</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-800 mt-1">
                    {formatBDT(filteredSummary.totalGasAmount)}
                  </div>
                </div>

                {isAdmin && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
                    <div className="text-xs font-semibold text-emerald-300">
                      {t.ownerNetIncome}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white mt-1">
                      {formatBDT(filteredSummary.ownerNetIncome)}
                    </div>
                  </div>
                )}
              </div>

              {/* Paid & Unpaid Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-emerald-800">
                      {t.paidRentCardTitle}
                    </div>
                    <div className="text-[11px] text-emerald-700/80 mt-0.5">
                      {filteredSummary.paidRents.length}
                      {t.countSuffix} • {t.paidRentLabel}{' '}
                      {formatBDT(filteredSummary.paidRentAmount)} − {t.gasDeductedLabel}{' '}
                      {formatBDT(filteredSummary.gasDeductedFromPaid)}
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-700">
                    {formatBDT(filteredSummary.paidNetRentAfterGas)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-rose-800">
                      {t.unpaidRentCardTitle}
                    </div>
                    <div className="text-[11px] text-rose-700/80 mt-0.5">
                      {filteredSummary.unpaidRents.length}
                      {t.countSuffix} • {t.after25Label}{' '}
                      {formatBDT(filteredSummary.unpaidRentAfterCommission)} − {t.gasDeductedLabel}{' '}
                      {formatBDT(filteredSummary.gasDeductedFromUnpaid)}
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-rose-700">
                    {formatBDT(filteredSummary.unpaidRentAmount)}
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-slate-800 text-sm mb-2.5">{t.rentDetailsTitle}</h4>
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
                          {r.tripType === 'round-trip' ? t.roundTrip : t.oneWay}
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-sm text-slate-900">
                      {r.pickupLocation} → {r.dropLocation}
                    </div>
                    {isAdmin && reportScope === 'all' && (
                      <div className="text-slate-600">
                        {t.driverCol}: {r.driverName || r.driverId}
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold">
                      <span>
                        {t.totalPrefix} {formatBDT(r.totalFare)}
                      </span>
                      <span className="text-emerald-700">
                        {t.commissionPrefix} {formatBDT(r.driverCommission)}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredSummary.matchingRents.length === 0 && (
                  <div className="py-5 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    {t.noRentInPeriod}
                  </div>
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl mb-6">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3">{t.datePrefix.replace(':', '')}</th>
                      {isAdmin && reportScope === 'all' && <th className="py-2.5 px-3">{t.driverCol}</th>}
                      <th className="py-2.5 px-3">{t.routeCol}</th>
                      <th className="py-2.5 px-3">{t.typeCol}</th>
                      <th className="py-2.5 px-3">{t.statusCol}</th>
                      <th className="py-2.5 px-3 text-right">{t.totalFareShort}</th>
                      <th className="py-2.5 px-3 text-right">{t.commission25}</th>
                      {isAdmin && <th className="py-2.5 px-3 text-right">{t.remainingFare}</th>}
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
                          {r.tripType === 'round-trip' ? t.roundTrip : t.oneWay}
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
                          colSpan={isAdmin && reportScope === 'all' ? 8 : 7}
                          className="py-6 text-center text-slate-400"
                        >
                          {t.noRentInPeriod}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h4 className="font-bold text-slate-800 text-sm mb-2.5">
                {t.approvedGasDetailsTitle}
              </h4>
              <div className="sm:hidden space-y-2.5">
                {filteredSummary.matchingGas.map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="text-slate-500 flex items-center gap-1.5">
                        <span>{g.expenseDate}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            g.isPaid
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {g.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
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
                        {t.receiptBtn}
                      </button>
                    )}
                  </div>
                ))}
                {filteredSummary.matchingGas.length === 0 && (
                  <div className="py-5 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    {t.noGasInPeriod}
                  </div>
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3">{t.datePrefix.replace(':', '')}</th>
                      {isAdmin && reportScope === 'all' && <th className="py-2.5 px-3">{t.driverCol}</th>}
                      <th className="py-2.5 px-3">{t.stationCol}</th>
                      <th className="py-2.5 px-3">{t.statusCol}</th>
                      <th className="py-2.5 px-3 text-right">{t.amountCol}</th>
                      <th className="py-2.5 px-3 text-center no-print">{t.receiptBtn}</th>
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
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              g.isPaid
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {g.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
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
                              {t.viewBtn}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">{t.noneText}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSummary.matchingGas.length === 0 && (
                      <tr>
                        <td
                          colSpan={isAdmin && reportScope === 'all' ? 6 : 5}
                          className="py-6 text-center text-slate-400"
                        >
                          {t.noGasInPeriod}
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
                { id: 'overview', label: t.tabOverview },
                { id: 'rents', label: `${t.tabRents} (${rents.length})` },
                {
                  id: 'gas',
                  label: `${t.tabGas} (${gasExpenses.length})`,
                  badge: pendingGasCount > 0 ? pendingGasCount : null
                },
                { id: 'drivers', label: `${t.tabDrivers} (${drivers.length})` },
                { id: 'stations', label: `${t.tabStations} (${stations.length})` },
                { id: 'security', label: t.tabSecurity }
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setAdminSubTab(sub.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    adminSubTab === sub.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{sub.label}</span>
                  {sub.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                      {sub.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {adminSubTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">{t.grandTotalRent}</div>
                    <div className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">
                      {formatBDT(overallTotals.totalRents)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {rents.length}
                      {t.countSuffix}
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm">
                    <div className="text-xs font-semibold text-emerald-700">
                      {t.commission25}
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-emerald-700 mt-1">
                      {formatBDT(overallTotals.totalCommission)}
                    </div>
                    <div className="text-[11px] text-emerald-600/80 mt-1">{t.driversShare}</div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm">
                    <div className="text-xs font-semibold text-amber-800">{t.totalGasCost}</div>
                    <div className="text-lg sm:text-2xl font-bold text-amber-800 mt-1">
                      {formatBDT(overallTotals.totalGas)}
                    </div>
                    <div className="text-[11px] text-amber-700/80 mt-1">
                      {approvedGasExpenses.length}
                      {t.approvedCountSuffix}
                      {pendingGasCount > 0 ? ` • ${pendingGasCount}${t.pendingCountSuffix}` : ''}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
                    <div className="text-xs font-semibold text-emerald-300">
                      {t.ownerNetIncome}
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-white mt-1">
                      {formatBDT(overallTotals.netOwnerProfit)}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">
                      {t.after25AndGas}
                    </div>
                  </div>
                </div>

                {/* Paid & Unpaid Rent Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-emerald-800">
                        {t.totalPaidRentCard}
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        {t.paidRentLabel} {formatBDT(overallTotals.paidTotalRents)} −{' '}
                        {t.gasDeductedLabel} {formatBDT(overallTotals.gasDeductedFromPaid)}
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-700">
                      {formatBDT(overallTotals.paidNetRentAfterGas)}
                    </div>
                  </div>

                  <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-rose-800">
                        {t.totalUnpaidRentCard}
                      </div>
                      <div className="text-[11px] text-rose-700 mt-0.5">
                        {t.after25Label} {formatBDT(overallTotals.unpaidRentsAfterCommission)} −{' '}
                        {t.gasDeductedLabel} {formatBDT(overallTotals.gasDeductedFromUnpaid)}
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-rose-700">
                      {formatBDT(overallTotals.unpaidTotalRents)}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">
                    {t.driverWiseSummary}
                  </h3>

                  {drivers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      {t.noDriversYet}
                    </div>
                  ) : (
                    <>
                      <div className="sm:hidden space-y-3">
                        {drivers.map((drv) => {
                          const dRents = rents.filter((r) => r.driverId === drv.id);
                          const dGas = approvedGasExpenses.filter((g) => g.driverId === drv.id);
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
                                  {drv.active === false ? t.inactiveStatus : t.activeStatus}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200">
                                <div>
                                  {t.tabRents}: <strong>{formatBDT(sumRent)}</strong>
                                </div>
                                <div className="text-emerald-700">
                                  {t.commissionPrefix} <strong>{formatBDT(sumComm)}</strong>
                                </div>
                                <div className="text-amber-700">
                                  {t.tabGas}: <strong>{formatBDT(sumGas)}</strong>
                                </div>
                                <div className="font-bold text-slate-900">
                                  {t.ownerNetIncome}: {formatBDT(net)}
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
                              <th className="py-2.5 px-3">{t.driverCol}</th>
                              <th className="py-2.5 px-3">{t.carCol}</th>
                              <th className="py-2.5 px-3">{t.statusCol}</th>
                              <th className="py-2.5 px-3 text-right">{t.totalFareShort}</th>
                              <th className="py-2.5 px-3 text-right">{t.commission25}</th>
                              <th className="py-2.5 px-3 text-right">{t.totalGasCost}</th>
                              <th className="py-2.5 px-3 text-right">{t.ownerNetIncome}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {drivers.map((drv) => {
                              const dRents = rents.filter((r) => r.driverId === drv.id);
                              const dGas = approvedGasExpenses.filter(
                                (g) => g.driverId === drv.id
                              );
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
                                      {drv.active === false ? t.inactiveStatus : t.activeStatus}
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
                    {t.allRentsList}
                  </h3>
                  {rents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleSelectAllRents(rents)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {rents.every((r) => selectedRentIds.includes(r.id))
                        ? t.deselectAll
                        : t.selectAll}
                    </button>
                  )}
                </div>

                {selectedRentIds.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="text-xs sm:text-sm font-bold text-emerald-950">
                      {selectedRentIds.length}{' '}
                      {lang === 'en'
                        ? 'selected • Net after 25%:'
                        : 'টি ভাড়া সিলেক্ট করা হয়েছে • ২৫% বাদে মোট:'}{' '}
                      {formatBDT(selectedRentsTotalAmount)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkRentsPaid(selectedRentIds, true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        {t.markSelectedPaid}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkRentsPaid(selectedRentIds, false)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold"
                      >
                        {t.markUnpaid}
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
                        <div className="flex justify-between pt-1.5 border-t border-slate-200 font-semibold">
                          <span>
                            {t.totalPrefix} {formatBDT(r.totalFare)}
                          </span>
                          <span className="text-emerald-700">
                            {t.after25Label} {formatBDT(getRentNetAfterCommission(r))}
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
                            <Edit3 className="w-3.5 h-3.5" /> {t.editBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRent(r.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> {t.deleteBtn}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {rents.length === 0 && (
                    <div className="py-8 text-center text-slate-400">{t.noRentInPeriod}</div>
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
                        <th className="py-2.5 px-3">{t.datePrefix.replace(':', '')}</th>
                        <th className="py-2.5 px-3">{t.driverCol}</th>
                        <th className="py-2.5 px-3">{t.routeCol}</th>
                        <th className="py-2.5 px-3">{t.statusCol}</th>
                        <th className="py-2.5 px-3 text-right">{t.totalFareShort}</th>
                        <th className="py-2.5 px-3 text-right">{t.commission25}</th>
                        <th className="py-2.5 px-3 text-right">{t.remainingFare}</th>
                        <th className="py-2.5 px-3 text-center">{t.actionCol}</th>
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
                                title={t.editBtn}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRent(r.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title={t.deleteBtn}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {rents.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            {t.noRentInPeriod}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminSubTab === 'gas' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {t.allGasAndApproval}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.gasApprovalNote}
                    </p>
                  </div>
                  {gasExpenses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleSelectAllGas(gasExpenses)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {gasExpenses.every((g) => selectedGasIds.includes(g.id))
                        ? t.deselectAll
                        : t.selectAll}
                    </button>
                  )}
                </div>

                {selectedGasIds.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="text-xs sm:text-sm font-bold text-amber-950">
                      {selectedGasIds.length}{' '}
                      {lang === 'en'
                        ? 'selected • Total:'
                        : 'টি গ্যাস খরচ সিলেক্ট করা হয়েছে • মোট:'}{' '}
                      {formatBDT(selectedGasTotalAmount)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGasApprovalChange(selectedGasIds, 'approved')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        {t.approveBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGasApprovalChange(selectedGasIds, 'rejected')}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                      >
                        {t.rejectBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkGasPaid(selectedGasIds, true)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                      >
                        {t.paidBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkGasPaid(selectedGasIds, false)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold"
                      >
                        {t.markUnpaid}
                      </button>
                    </div>
                  </div>
                )}

                <div className="sm:hidden space-y-3">
                  {gasExpenses.map((g) => {
                    const isChecked = selectedGasIds.includes(g.id);
                    const approval = getGasApprovalStatus(g);
                    return (
                      <div
                        key={g.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                          isChecked
                            ? 'border-amber-400 bg-amber-50/40'
                            : approval === 'pending'
                            ? 'border-amber-200 bg-amber-50/20'
                            : 'border-slate-200 bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectGas(g.id)}
                              className="w-4 h-4 rounded accent-amber-600"
                            />
                            <span>
                              {g.expenseDate} • {g.driverName || g.driverId}
                            </span>
                          </label>
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold ${
                                approval === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : approval === 'rejected'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {approval === 'approved'
                                ? 'Approved'
                                : approval === 'rejected'
                                ? 'Rejected'
                                : 'Pending'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold ${
                                g.isPaid
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {g.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm text-slate-900">{g.stationName}</div>
                            <div className="font-bold text-amber-700 mt-0.5">
                              {formatBDT(g.amount)}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {approval !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleGasApprovalChange(g.id, 'approved')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                Approve
                              </button>
                            )}
                            {approval === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleGasApprovalChange(g.id, 'rejected')}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold"
                              >
                                Reject
                              </button>
                            )}
                            {approval === 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleMarkGasPaid([g.id], !g.isPaid)}
                                className={`px-2.5 py-1.5 rounded-lg font-semibold ${
                                  g.isPaid
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {g.isPaid ? 'Unpaid' : 'Paid'}
                              </button>
                            )}
                            {g.receiptImage && (
                              <button
                                type="button"
                                onClick={() => setReceiptModalUrl(g.receiptImage)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold"
                              >
                                {t.receiptBtn}
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
                      </div>
                    );
                  })}
                  {gasExpenses.length === 0 && (
                    <div className="py-8 text-center text-slate-400">{t.noGasInPeriod}</div>
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
                              gasExpenses.length > 0 &&
                              gasExpenses.every((g) => selectedGasIds.includes(g.id))
                            }
                            onChange={() => toggleSelectAllGas(gasExpenses)}
                            className="w-4 h-4 rounded accent-amber-600"
                          />
                        </th>
                        <th className="py-2.5 px-3">{t.datePrefix.replace(':', '')}</th>
                        <th className="py-2.5 px-3">{t.driverCol}</th>
                        <th className="py-2.5 px-3">{t.stationCol}</th>
                        <th className="py-2.5 px-3">{t.approvalCol}</th>
                        <th className="py-2.5 px-3">{t.paymentCol}</th>
                        <th className="py-2.5 px-3 text-right">{t.amountCol}</th>
                        <th className="py-2.5 px-3 text-center">{t.receiptBtn}</th>
                        <th className="py-2.5 px-3 text-center">{t.actionCol}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gasExpenses.map((g) => {
                        const isChecked = selectedGasIds.includes(g.id);
                        const approval = getGasApprovalStatus(g);
                        return (
                          <tr
                            key={g.id}
                            className={
                              isChecked
                                ? 'bg-amber-50/40'
                                : approval === 'pending'
                                ? 'bg-amber-50/20 hover:bg-amber-50/40'
                                : 'hover:bg-slate-50'
                            }
                          >
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectGas(g.id)}
                                className="w-4 h-4 rounded accent-amber-600"
                              />
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">{g.expenseDate}</td>
                            <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                              {g.driverName || g.driverId}
                            </td>
                            <td className="py-2.5 px-3">{g.stationName}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  approval === 'approved'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : approval === 'rejected'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {approval === 'approved'
                                  ? 'Approved'
                                  : approval === 'rejected'
                                  ? 'Rejected'
                                  : 'Pending'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleMarkGasPaid([g.id], !g.isPaid)}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  g.isPaid
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {g.isPaid ? 'Paid' : 'Unpaid'}
                              </button>
                            </td>
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
                                  {t.viewReceiptBtn}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">{t.noPhoto}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                {approval !== 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleGasApprovalChange(g.id, 'approved')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                  >
                                    Approve
                                  </button>
                                )}
                                {approval === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleGasApprovalChange(g.id, 'rejected')}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold"
                                  >
                                    Reject
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGas(g.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title={t.deleteBtn}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {gasExpenses.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            {t.noGasInPeriod}
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
                    {t.addNewDriverTitle}
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {t.driverIdLabel}
                    </label>
                    <input
                      type="text"
                      value={newDriverId}
                      onChange={(e) => setNewDriverId(e.target.value)}
                      placeholder="DRV-01"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {t.driverNameLabel}
                    </label>
                    <input
                      type="text"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      placeholder={lang === 'en' ? 'Driver Name' : 'ড্রাইভারের নাম'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {t.mobileLabel}
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
                      {t.carNumberLabel}
                    </label>
                    <input
                      type="text"
                      value={newDriverCar}
                      onChange={(e) => setNewDriverCar(e.target.value)}
                      placeholder={lang === 'en' ? 'Car Number' : 'গাড়ির নম্বর'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {t.loginPinLabel}
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
                    {t.saveDriverBtn}
                  </button>
                </form>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 mb-3.5 text-sm sm:text-base">
                    {t.registeredDriversTitle}
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
                              {d.active === false ? t.inactiveStatus : t.activeStatus}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {t.mobileLabel.replace(' *', '')}: {d.phone} • {t.carCol}: {d.carNumber} •{' '}
                            {t.pinShort}:{' '}
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
                            <span>{t.pinShort}</span>
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
                                <Unlock className="w-3.5 h-3.5" /> <span>{t.unlockBtn}</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" /> <span>{t.lockBtn}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {drivers.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-sm">
                        {t.noDriversYet}
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
                    {t.addNewStationTitle}
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {t.stationNameLabel}
                    </label>
                    <input
                      type="text"
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      placeholder={lang === 'en' ? 'Station Name' : 'ফিলিং স্টেশনের নাম'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {t.stationLocationLabel}
                    </label>
                    <input
                      type="text"
                      value={newStationLocation}
                      onChange={(e) => setNewStationLocation(e.target.value)}
                      placeholder={lang === 'en' ? 'Area or Address' : 'এলাকা বা ঠিকানা'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition"
                  >
                    {t.addStationBtn}
                  </button>
                </form>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 mb-3.5 text-sm sm:text-base">
                    {t.stationListTitle}
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
                          title={t.deleteBtn}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {stations.length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                        {t.noStationsYet}
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
                      {t.dbBackupTitle}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {lang === 'en' ? (
                      <>
                        All rents, gas expenses, receipts, and driver records are securely stored in{' '}
                        <strong>{firebaseConfig.projectId}</strong> Firestore. You can download a full
                        JSON backup anytime.
                      </>
                    ) : (
                      <>
                        আপনার সকল ভাড়া, গ্যাস খরচ, রিসিপ্ট ও ড্রাইভারের তথ্য{' '}
                        <strong>{firebaseConfig.projectId}</strong> Firestore ডাটাবেজে সংরক্ষিত আছে।
                        যেকোনো সময় সম্পূর্ণ ডাটার JSON ব্যাকআপ ডাউনলোড করতে পারেন।
                      </>
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={handleExportBackupJSON}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadJsonBackup}</span>
                  </button>

                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      {t.recentAuditLogs}
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
                          <span>{t.copiedBtn}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t.copyBtn}</span>
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

      {/* Floating WhatsApp Corner Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        title="WhatsApp"
        className="no-print fixed bottom-20 sm:bottom-5 right-3.5 sm:right-5 z-40 flex items-center gap-2 px-3.5 py-3 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xl transition"
      >
        <MessageCircle className="w-5 h-5 shrink-0" />
        <span>WhatsApp</span>
      </a>

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
              <h3 className="font-bold text-slate-900">{t.gasReceiptModalTitle}</h3>
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
                alt="Gas Receipt"
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
              <h3 className="font-bold text-slate-900">{t.editRentModalTitle}</h3>
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
                {t.pickupLabel.replace(' *', '')}
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
                {t.dropLabel.replace(' *', '')}
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
                  {t.totalFareLabel.replace(' *', '')}
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
                  {t.datePrefix.replace(':', '')}
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t.tripTypeLabel.replace(' *', '')}
              </label>
              <select
                value={editingRent.tripType}
                onChange={(e) => setEditingRent({ ...editingRent, tripType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="one-way">{t.oneWay}</option>
                <option value="round-trip">{t.roundTrip}</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
              >
                {t.saveChangesBtn}
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
              <h3 className="font-bold text-slate-900">{t.resetPinModalTitle}</h3>
              <button
                type="button"
                onClick={() => setEditingDriverPin(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              {t.driverCol}: <strong>{editingDriverPin.name}</strong> ({editingDriverPin.id})
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.newPinLabel}
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
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                {t.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
