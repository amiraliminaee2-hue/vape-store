"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SavedAddress {
  id: number;
  label: string;
  address: string;
}

interface Profile {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  savedAddresses: SavedAddress[];
}

export default function AccountPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile>({
    firstName: "",
    lastName: "",
    phone: "",
    savedAddresses: [],
  });

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [addressForm, setAddressForm] = useState({
    label: "",
    address: "",
  });

  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // تابع دریافت توکن CSRF
  const getCsrfToken = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/csrf", { cache: "no-store" });
      const data = await res.json();
      return data.token;
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
      return null;
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/sign-in");
        return;
      }
      const data = await res.json();
      setProfile(data);
      setProfileForm({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        phone: data.phone ?? "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        alert("خطا در دریافت توکن امنیتی");
        return;
      }
      
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(profileForm),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "خطا در ذخیره پروفایل");
        return;
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      await loadProfile();
    } catch (error) {
      console.error(error);
      alert("خطا در ذخیره پروفایل");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!addressForm.label.trim() || !addressForm.address.trim()) {
      alert("عنوان و آدرس را وارد کنید");
      return;
    }

    try {
      setSavingAddress(true);
      
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        alert("خطا در دریافت توکن امنیتی");
        return;
      }

      if (editingAddress) {
        const res = await fetch("/api/profile/addresses/" + editingAddress.id, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(addressForm),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "خطا در ویرایش آدرس");
          return;
        }
        setEditingAddress(null);
      } else {
        const res = await fetch("/api/profile/addresses", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(addressForm),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "خطا در ذخیره آدرس");
          return;
        }
      }

      setAddressForm({ label: "", address: "" });
      await loadProfile();
    } catch (error) {
      console.error(error);
      alert("خطا در ذخیره آدرس");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("آدرس حذف شود؟")) return;
    try {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        alert("خطا در دریافت توکن امنیتی");
        return;
      }
      
      await fetch("/api/profile/addresses/" + id, { 
        method: "DELETE",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      });
      await loadProfile();
    } catch (error) {
      console.error(error);
      alert("خطا در حذف آدرس");
    }
  };

  const handleEditAddress = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setAddressForm({ label: addr.label, address: addr.address });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setAddressForm({ label: "", address: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 sm:space-y-8 md:space-y-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">حساب کاربری</h1>
        <p className="mt-2 text-zinc-500 text-sm sm:text-base">مدیریت اطلاعات شخصی و آدرس‌های شما</p>
      </div>

      {/* ویرایش پروفایل */}
      <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 md:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">ویرایش پروفایل</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">نام</label>
              <input
                value={profileForm.firstName}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="نام"
                className="
                  w-full
                  p-3 sm:p-4
                  rounded-xl
                  bg-zinc-900
                  border border-white/10
                  outline-none
                  focus:border-violet-500
                  transition-colors
                  text-sm sm:text-base
                "
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">نام خانوادگی</label>
              <input
                value={profileForm.lastName}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="نام خانوادگی"
                className="
                  w-full
                  p-3 sm:p-4
                  rounded-xl
                  bg-zinc-900
                  border border-white/10
                  outline-none
                  focus:border-violet-500
                  transition-colors
                  text-sm sm:text-base
                "
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">شماره موبایل</label>
            <input
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              className="
                w-full
                p-3 sm:p-4
                rounded-xl
                bg-zinc-900
                border border-white/10
                outline-none
                focus:border-violet-500
                transition-colors
                text-sm sm:text-base
              "
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="
                px-6 sm:px-8 py-2.5 sm:py-3
                rounded-xl
                bg-violet-600
                hover:bg-violet-500
                transition-colors
                disabled:opacity-50
                text-sm sm:text-base
              "
            >
              {savingProfile ? "در حال ذخیره..." : "ذخیره پروفایل"}
            </button>

            {profileSuccess && (
              <span className="text-green-400 text-xs sm:text-sm">
                پروفایل با موفقیت ذخیره شد ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* آدرس‌های ذخیره شده */}
      <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 md:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">آدرس‌های ذخیره شده</h2>

        {profile.savedAddresses.length === 0 ? (
          <p className="text-zinc-500 mb-6">هنوز آدرسی ذخیره نشده است.</p>
        ) : (
          <div className="space-y-3 mb-8">
            {profile.savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className="
                  flex flex-col sm:flex-row sm:items-start justify-between
                  p-4 sm:p-5
                  rounded-xl sm:rounded-2xl
                  border border-white/10
                  bg-zinc-900/50
                  gap-3 sm:gap-0
                "
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                      {addr.label}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm leading-6">{addr.address}</p>
                </div>

                <div className="flex gap-2 flex-shrink-0 sm:mr-4">
                  <button
                    onClick={() => handleEditAddress(addr)}
                    className="
                      px-3 py-1.5
                      rounded-lg
                      bg-zinc-800
                      hover:bg-zinc-700
                      text-sm
                      transition-colors
                    "
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="
                      px-3 py-1.5
                      rounded-lg
                      bg-red-500/10
                      hover:bg-red-500/20
                      text-red-400
                      text-sm
                      transition-colors
                    "
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* فرم افزودن/ویرایش آدرس */}
        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingAddress ? "ویرایش آدرس" : "افزودن آدرس جدید"}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                عنوان (مثال: خانه، شرکت، انبار)
              </label>
              <input
                value={addressForm.label}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="خانه"
                className="
                  w-full
                  p-3 sm:p-4
                  rounded-xl
                  bg-zinc-900
                  border border-white/10
                  outline-none
                  focus:border-violet-500
                  transition-colors
                  text-sm sm:text-base
                "
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">آدرس کامل</label>
              <textarea
                value={addressForm.address}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="تهران، خیابان ..."
                rows={3}
                className="
                  w-full
                  p-3 sm:p-4
                  rounded-xl
                  bg-zinc-900
                  border border-white/10
                  outline-none
                  focus:border-violet-500
                  transition-colors
                  resize-none
                  text-sm sm:text-base
                "
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="
                  px-5 sm:px-6 py-2.5 sm:py-3
                  rounded-xl
                  bg-violet-600
                  hover:bg-violet-500
                  transition-colors
                  disabled:opacity-50
                  text-sm sm:text-base
                "
              >
                {savingAddress
                  ? "در حال ذخیره..."
                  : editingAddress
                  ? "ویرایش آدرس"
                  : "افزودن آدرس"}
              </button>

              {editingAddress && (
                <button
                  onClick={handleCancelEdit}
                  className="
                    px-5 sm:px-6 py-2.5 sm:py-3
                    rounded-xl
                    border border-white/10
                    hover:border-white/20
                    transition-colors
                    text-sm sm:text-base
                  "
                >
                  انصراف
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}