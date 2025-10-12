import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, ArrowLeft } from "lucide-react";

const EditJob = () => {
  const { jobId } = useParams();
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
    salary: "",
    application_deadline: "",
    job_type: "",
    contact_phone: "",
    contact_email: "",
    company_photo: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please login first");
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      fetchJob(session.user.id);
    };

    checkAuth();
  }, [navigate, jobId]);

  const fetchJob = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Job not found or you don't have permission to edit it");
        navigate("/my-jobs");
        return;
      }

      setFormData({
        job_name: data.job_name || "",
        company: data.company || "",
        description: data.description || "",
        age_limit: data.age_limit || "",
        experience: data.experience || "",
        qualification: data.qualification || "",
        location: data.location || "",
        salary: data.salary || "",
        application_deadline: data.application_deadline || "",
        job_type: data.job_type || "",
        contact_phone: data.contact_phone || "",
        contact_email: data.contact_email || "",
        company_photo: data.company_photo || "",
      });
    } catch (error: any) {
      toast.error("Error fetching job", {
        description: error.message,
      });
      navigate("/my-jobs");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error("Please login first");
        navigate("/auth");
        return;
      }

      let company_photo_url = formData.company_photo;

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

      const { error } = await supabase
        .from("jobs")
        .update({ ...formData, company_photo: company_photo_url })
        .eq("id", jobId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Job updated successfully!");
      navigate("/my-jobs");
    } catch (error: any) {
      toast.error("Error updating job", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate("/my-jobs")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Jobs
        </Button>

        <Card className="p-8 shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Edit Job
              </h1>
              <p className="text-muted-foreground">Update your job listing details</p>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Shop/Company Name *</Label>
                <Input
                  id="company"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_photo">Shop/Company Photo (Optional)</Label>
              {formData.company_photo && (
                <img src={formData.company_photo} alt="Current" className="w-32 h-32 object-cover rounded mb-2" />
              )}
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
                    <SelectValue />
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type *</Label>
                <Select
                  value={formData.job_type}
                  onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary (Optional)</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g., ₹15,000 - ₹25,000 per month"
                />
              </div>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email Address</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
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
              {loading ? "Updating..." : "Update Job"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EditJob;
