import React, { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { formatPrice } from "../catalog.js";

function AuthLayout({ children, title, intro }) {
  return (
    <main className="account-page">
      <section className="account-card">
        <a className="account-brand" href="#/"><img src="img/logo.png" alt="" /><span>maximall</span></a>
        <p className="eyebrow">{intro}</p>
        <h1>{title}</h1>
        {children}
        <p className="account-footer">&copy; 2026 Maximall. All rights reserved.</p>
      </section>
    </main>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.hash = "#/";
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("If an account exists for this address, a password reset email has been sent.");
    } catch (resetError) {
      setError(resetError.message);
    }
  }

  return (
    <AuthLayout title="Welcome back" intro="Sign in to your account">
      <form className="account-form" onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <button type="button" className="text-button forgot-link" onClick={resetPassword}>Forgotten password?</button>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status">{message}</p>}
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <p className="account-switch">Don't have an account? <a href="#/signup">Create one</a></p>
    </AuthLayout>
  );
}

export function SignupPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.get("agree")) {
      setError("You must agree to the terms to continue.");
      return;
    }

    setBusy(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      window.location.hash = "#/dashboard";
    } catch (signupError) {
      setError(signupError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your account" intro="Join the Maximall community">
      <form className="account-form" onSubmit={submit}>
        <label>Full name<input name="name" autoComplete="name" required /></label>
        <label>Username<input name="username" autoComplete="username" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Phone number<input name="phone" type="tel" autoComplete="tel" required pattern="(?:\\+?254|0)7\\d{8}" title="Use a valid Kenya mobile number, for example 2547XXXXXXXX or 07XXXXXXXX" /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" required /></label>
        <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required /></label>
        <label className="checkbox-label"><input type="checkbox" name="agree" required /> I confirm that the information provided is true and correct.</label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
      </form>
      <p className="account-switch">Already have an account? <a href="#/login">Sign in</a></p>
    </AuthLayout>
  );
}

export function DashboardPage({ user, loading }) {
  const [profile, setProfile] = useState({ phone: "", whatsapp: "" });
  const [accountEmail, setAccountEmail] = useState(user?.email || "");
  const [orders, setOrders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.hash = "#/login";
      return;
    }
    setAccountEmail(user.email || "");

    let active = true;
    async function loadDashboard() {
      setPageLoading(true);
      setError("");
      try {
        const profileRef = doc(db, "users", user.uid);
        const profileSnapshot = await getDoc(profileRef);
        if (profileSnapshot.exists()) {
          const data = profileSnapshot.data();
          if (active) setProfile({ phone: data.phone || "", whatsapp: data.whatsapp || "" });
        } else {
          await setDoc(profileRef, {
            name: user.displayName || "",
            email: user.email,
            createdAt: user.metadata.creationTime,
          });
        }

        const orderQuery = query(collection(db, "checkout"), where("userId", "==", user.uid));
        const orderSnapshot = await getDocs(orderQuery);
        if (active) setOrders(orderSnapshot.docs.map(order => ({ id: order.id, ...order.data() })));
      } catch (loadError) {
        console.error("Could not load the account dashboard.", loadError);
        if (active) setError(loadError.message);
      } finally {
        if (active) setPageLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, [loading, user]);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileMessage("");
    try {
      await setDoc(doc(db, "users", user.uid), {
        phone: profile.phone.trim(),
        whatsapp: profile.whatsapp.trim(),
      }, { merge: true });
      setProfileMessage("Contact information saved.");
    } catch (saveError) {
      setProfileMessage(saveError.message);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordMessage("");
    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }
    try {
      await updatePassword(user, newPassword);
      setPasswordMessage("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (updateError) {
      setPasswordMessage(updateError.message);
    }
  }

  async function changeEmail() {
    const email = window.prompt("Enter your new email address", user.email);
    if (!email?.trim()) return;
    setError("");
    try {
      await updateEmail(user, email.trim());
      await setDoc(doc(db, "users", user.uid), { email: email.trim() }, { merge: true });
      setAccountEmail(email.trim());
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  if (loading || pageLoading) return <main className="page-container"><p className="muted">Loading your account...</p></main>;
  if (!user) return null;

  const statusCounts = ["Pending", "Processing", "Delivered", "Cancelled"].map(status => ({
    status,
    count: orders.filter(order => order.status === status).length,
  }));

  return (
    <main className="page-container dashboard-page">
      <div className="dashboard-heading">
        <div><p className="eyebrow">Your Maximall account</p><h1>Welcome, {user.displayName || "shopper"}</h1></div>
        <button type="button" className="button button-light" onClick={() => signOut(auth).then(() => { window.location.hash = "#/"; }).catch(signoutError => setError(signoutError.message))}>Sign out</button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dashboard-grid">
        <section className="checkout-card profile-summary">
          <img src={user.photoURL || "img/image.png"} alt="" />
          <h2>{user.displayName || "My profile"}</h2>
          <p>{user.email}</p>
          <p className="muted">Joined {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "—"}</p>
          <a className="button button-primary" href="#/checkout">Checkout</a>
        </section>
        <div className="dashboard-main">
          <section className="checkout-card">
            <h2>Account details</h2>
            <div className="account-readonly">
              <label>Email<input value={accountEmail} readOnly /></label>
              <label>User ID<input value={user.uid} readOnly /></label>
            </div>
            <button type="button" className="text-button" onClick={changeEmail}>Edit email</button>
            <form className="account-form compact-form" onSubmit={saveProfile}>
              <h3>Contact information</h3>
              <label>Phone<input type="tel" autoComplete="tel" value={profile.phone} onChange={event => setProfile(current => ({ ...current, phone: event.target.value }))} /></label>
              <label>WhatsApp<input type="tel" autoComplete="tel" value={profile.whatsapp} onChange={event => setProfile(current => ({ ...current, whatsapp: event.target.value }))} /></label>
              {profileMessage && <p className="muted" role="status">{profileMessage}</p>}
              <button type="submit" className="button button-primary">Save contact info</button>
            </form>
            <form className="account-form compact-form" onSubmit={changePassword}>
              <h3>Security</h3>
              <label>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
              <label>Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
              {passwordMessage && <p className="muted" role="status">{passwordMessage}</p>}
              <button type="submit" className="button button-primary">Update password</button>
            </form>
          </section>
          <section className="checkout-card">
            <h2>Checkout status</h2>
            <div className="status-grid">
              {statusCounts.map(item => <div className="status-card" key={item.status}><span>{item.status}</span><strong>{item.count}</strong></div>)}
            </div>
            <h3>Recent checkout</h3>
            {orders.length ? orders.slice(0, 3).map(order => (
              <div className="order-row" key={order.id}>
                <div><strong>{order.checkoutId || "Checkout"}</strong><small>{order.status || "Pending"}</small></div>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            )) : <p className="muted">No checkout history.</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
