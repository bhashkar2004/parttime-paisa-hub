import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Save, X, UserRound, Camera, Languages } from "lucide-react";
import { LANGUAGES, findLanguage } from "@/lib/languages";
import { storeLang } from "@/hooks/useLanguage";

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  date_of_birth: string | null;
  gender: string | null;
  qualification: string | null;
  experience: string | null;
  skills: string | null;
  bio: string | null;
  avatar_url: string | null;
  preferred_language: string;
}

const emptyForm = {
  full_name: "",
  phone: "",
  location: "",
  date_of_birth: "",
  gender: "",
  qualification: "",
  experience: "",
  skills: "",
  bio: "",
};

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [searchParams] = useSearchParams();
  const completing = searchParams.get("complete") === "1";
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (completing) setEditing(true);
  }, [completing]);

  useEffect(() => {
    const path = profile?.avatar_url;
    if (!path) return setAvatarSrc(null);
    supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => setAvatarSrc(data?.signedUrl ?? null));
  }, [profile?.avatar_url]);

  const handlePhoto = async (file: File | undefined) => {
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Photo must be under 5 MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", profile.id)
        .select("*")
        .single();
      if (error) throw error;
      setProfile(data as ProfileData);
      toast.success("Photo updated");
    } catch (error: any) {
      toast.error("Could not upload photo", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleLanguage = async (code: string) => {
    if (!profile) return;
    storeLang(code);
    const { data, error } = await supabase
      .from("profiles")
      .update({ preferred_language: code })
      .eq("id", profile.id)
      .select("*")
      .single();
    if (error) return toast.error("Could not save language", { description: error.message });
    setProfile(data as ProfileData);
    toast.success(`Language set to ${findLanguage(code).english}`);
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fillForm = (data: ProfileData) => {
    setForm({
      full_name: data.full_name ?? "",
      phone: data.phone ?? "",
      location: data.location ?? "",
      date_of_birth: data.date_of_birth ?? "",
      gender: data.gender ?? "",
      qualification: data.qualification ?? "",
      experience: data.experience ?? "",
      skills: data.skills ?? "",
      bio: data.bio ?? "",
    });
  };

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: created, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: session.user.id, email: session.user.email ?? "" })
          .select("*")
          .single();
        if (insertError) throw insertError;
        setProfile(created as ProfileData);
        fillForm(created as ProfileData);
      } else {
        if (data.preferred_language) storeLang(data.preferred_language);
        setProfile(data as ProfileData);
        fillForm(data as ProfileData);
      }
    } catch (error: any) {
      toast.error("Could not load your profile", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (completing && (!form.phone.trim() || !form.location.trim() || !form.qualification)) {
      toast.error("Please add your phone, location and qualification");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim() || null,
          phone: form.phone.trim() || null,
          location: form.location.trim() || null,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          qualification: form.qualification || null,
          experience: form.experience || null,
          skills: form.skills.trim() || null,
          bio: form.bio.trim() || null,
        })
        .eq("id", profile.id)
        .select("*")
        .single();

      if (error) throw error;

      setProfile(data as ProfileData);
      fillForm(data as ProfileData);
      setEditing(false);
      toast.success("Profile updated successfully");
      if (completing) navigate("/");
    } catch (error: any) {
      toast.error("Could not save your details", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.full_name || profile?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarBlock = (
    <div className="relative h-20 w-20 shrink-0">
      {avatarSrc ? (
        <img src={avatarSrc} alt="Profile photo" className="h-20 w-20 rounded-full object-cover" />
      ) : (
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-xl font-bold">
          {initials || <UserRound className="h-8 w-8" />}
        </div>
      )}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        aria-label="Change profile photo"
        className="absolute -bottom-1 -right-1 rounded-full border bg-background p-1.5 shadow hover:bg-muted"
      >
        <Camera className="h-4 w-4" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePhoto(e.target.files?.[0])}
      />
    </div>
  );

  const languageCard = profile && (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Languages className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Preferred Language</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Job listings, the AI assistant and voice replies will use this language across the app.
      </p>
      <Select value={profile.preferred_language || "en"} onValueChange={handleLanguage}>
        <SelectTrigger className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {LANGUAGES.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.native}{l.native !== l.english ? ` — ${l.english}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Card>
  );

  const details: { label: string; value: string | null }[] = profile
    ? [
        { label: "Full Name", value: profile.full_name },
        { label: "Email", value: profile.email },
        { label: "Phone", value: profile.phone },
        { label: "Location", value: profile.location },
        { label: "Date of Birth", value: profile.date_of_birth },
        { label: "Gender", value: profile.gender },
        { label: "Qualification", value: profile.qualification },
        { label: "Experience", value: profile.experience },
        { label: "Skills", value: profile.skills },
        { label: "Preferred Language", value: findLanguage(profile.preferred_language).english },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          {!loading && profile && !editing && (
            <Button
              onClick={() => setEditing(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Details
            </Button>
          )}
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {completing ? "Complete Your Profile" : "My Profile"}
        </h1>
        {completing && (
          <p className="-mt-6 mb-6 text-muted-foreground">
            Tell us a bit more about you so employers can reach you. Phone, location and qualification are required.
          </p>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading your profile...</p>
        ) : !profile ? (
          <p className="text-muted-foreground">Profile not available.</p>
        ) : editing ? (
          <div className="space-y-6">
          <Card className="p-6 flex items-center gap-4">
            {avatarBlock}
            <p className="text-sm text-muted-foreground">Tap the camera to add or change your photo.</p>
          </Card>
          <Card className="p-6">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="City or area"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => setForm({ ...form, gender: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Select
                    value={form.qualification}
                    onValueChange={(v) => setForm({ ...form, qualification: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select qualification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10th">10th</SelectItem>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Graduation">Graduation</SelectItem>
                      <SelectItem value="Post Graduation">Post Graduation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Select
                    value={form.experience}
                    onValueChange={(v) => setForm({ ...form, experience: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2 years">0-2 years</SelectItem>
                      <SelectItem value="3-5 years">3-5 years</SelectItem>
                      <SelectItem value="6-10 years">6-10 years</SelectItem>
                      <SelectItem value="10+ years">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <Input
                    id="skills"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="e.g. Billing, Cooking, Delivery"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">About Me</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="A few lines about yourself"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    fillForm(profile);
                    setEditing(false);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
          {languageCard}
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 flex items-center gap-4">
              {avatarBlock}
              <div>
                <h2 className="text-2xl font-semibold">
                  {profile.full_name || "Add your name"}
                </h2>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">My Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {details.map((d) => (
                  <div key={d.label}>
                    <p className="text-sm text-muted-foreground">{d.label}</p>
                    <p className="font-medium">{d.value || "Not added yet"}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">About Me</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {profile.bio || "Nothing added yet."}
              </p>
            </Card>

            {languageCard}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
