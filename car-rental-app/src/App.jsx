const handleAdminLogin = (e) => {
  e.preventDefault();
  setLoginError('');
  const cleanEmail = adminLoginEmail.trim().toLowerCase();
  const cleanPass = adminLoginPassword.trim();

  const matchedAdmin = ADMIN_USERS.find(
    (adm) => adm.email.toLowerCase() === cleanEmail && adm.password === cleanPass
  );

  if (matchedAdmin) {
    const sessionData = {
      role: 'admin',
      email: matchedAdmin.email,
      name: matchedAdmin.name
    };
    setCurrentUser(sessionData);
    setAdminLoginEmail('');
    setAdminLoginPassword('');
    writeAuditLog(`অ্যাডমিন লগইন: ${matchedAdmin.email}`, matchedAdmin.name);
    showToast(`${matchedAdmin.name} প্যানেলে স্বাগতম!`);
  } else {
    setLoginError('ভুল অ্যাডমিন ইমেইল বা পাসওয়ার্ড।');
  }
};
