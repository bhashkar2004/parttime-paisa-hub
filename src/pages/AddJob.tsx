import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, ArrowLeft } from "lucide-react";

const AddJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [companyPhoto, setCompanyPhoto] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    job_name: "",
    company: "",
    description: "",
    age_limit: "",
    experience: "",
    qualification: "",
    location: "",
    application_deadline: "",
    job_type: "",
    contact_phone: "",
    contact_email: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please login first", {
          description: "You need to be logged in to post jobs",
        });
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error("Please login first");
        navigate("/auth");
        return;
      }

      let company_photo_url = null;

      if (companyPhoto) {
        const fileExt = companyPhoto.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('company-photos')
          .upload(fileName, companyPhoto);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('company-photos')
          .getPublicUrl(fileName);
        
        company_photo_url = publicUrl;
      }

      const { error } = await supabase.from("jobs").insert([
        { ...formData, user_id: user.id, company_photo: company_photo_url }
      ]);

      if (error) throw error;

      toast.success("Job Added Successfully", {
        description: "Your job posting is now live!",
      });

      setFormData({
        job_name: "",
        company: "",
        description: "",
        age_limit: "",
        experience: "",
        qualification: "",
        location: "",
        application_deadline: "",
        job_type: "",
        contact_phone: "",
        contact_email: "",
      });
      setCompanyPhoto(null);

      setTimeout(() => navigate("/jobs"), 1500);
    } catch (error: any) {
      toast.error("Error adding job", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="p-8 shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Post a Job
              </h1>
              <p className="text-muted-foreground">Fill in the details to create a new job listing</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="job_name">Job Title *</Label>
                <Input
                  id="job_name"
                  required
                  value={formData.job_name}
                  onChange={(e) => setFormData({ ...formData, job_name: e.target.value })}
                  placeholder="e.g., Shop Assistant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Shop/Company Name *</Label>
                <Input
                  id="company"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g., Local Store"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_photo">Shop/Company Photo (Optional)</Label>
              <Input
                id="company_photo"
                type="file"
                accept="image/*"
                onChange={(e) => setCompanyPhoto(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role and responsibilities..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification *</Label>
                <Select
                  value={formData.qualification}
                  onValueChange={(value) => setFormData({ ...formData, qualification: value })}
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
                <Label htmlFor="experience">Experience (Optional)</Label>
                <Select
                  value={formData.experience}
                  onValueChange={(value) => setFormData({ ...formData, experience: value })}
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
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age_limit">Age Limit (Optional)</Label>
                <Input
                  id="age_limit"
                  value={formData.age_limit}
                  onChange={(e) => setFormData({ ...formData, age_limit: e.target.value })}
                  placeholder="e.g., 18-35"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type *</Label>
                <Select
                  value={formData.job_type}
                  onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Part Time">Part Time</SelectItem>
                    <SelectItem value="Full Time">Full Time</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Hyderabad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="application_deadline">Application Deadline *</Label>
                <Input
                  id="application_deadline"
                  type="date"
                  required
                  value={formData.application_deadline}
                  onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Details (Optional)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone Number</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email Address</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@shop.com"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              size="lg"
            >
              {loading ? "Posting Job..." : "Post Job"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddJob;
