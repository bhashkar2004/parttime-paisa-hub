import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, MapPin, Calendar, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  job_name: string;
  company: string;
  description: string;
  qualification: string;
  experience: string | null;
  age_limit: string | null;
  job_type: string;
  location: string;
  application_deadline: string;
  contact_phone: string;
  contact_email: string;
  company_photo: string | null;
}

const Apply = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
    qualification: "",
    gender: "male",
    contact_phone: "",
    contact_email: "",
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
    };
    checkAuth();
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    if (!jobId) return;
    try {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      if (error) throw error;
      setJob(data);
    } catch (error: any) {
      toast.error("Error fetching job");
      navigate("/jobs");
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

      let resume_url = null;
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, resumeFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName);
        resume_url = publicUrl;
      }

      const { error } = await supabase.from("applications").insert([{
        ...formData,
        age: parseInt(formData.age),
        job_id: jobId,
        user_id: user.id,
        resume_url,
      }]);

      if (error) throw error;
      toast.success("Application submitted successfully!");
      navigate("/jobs");
    } catch (error: any) {
      toast.error("Error submitting application");
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/jobs")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Jobs
        </Button>

        <Card className="p-8 mb-8">
          {job.company_photo && <img src={job.company_photo} alt={job.company} className="w-full h-48 object-cover rounded-lg mb-6" />}
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{job.job_name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mb-4"><Building2 className="h-5 w-5" /><span className="text-lg">{job.company}</span></div>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /><span>{job.location}</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /><span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span></div>
          </div>
          <div className="mb-6"><h2 className="text-xl font-semibold mb-2">Description</h2><p className="text-muted-foreground">{job.description}</p></div>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Apply Now</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div><Label>First Name *</Label><Input required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} /></div>
              <div><Label>Last Name *</Label><Input required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div><Label>Age *</Label><Input type="number" required value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} /></div>
              <div><Label>Qualification</Label>
                <Select value={formData.qualification} onValueChange={(value) => setFormData({ ...formData, qualification: value })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10th">10th</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Graduation">Graduation</SelectItem>
                    <SelectItem value="Post Graduation">Post Graduation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Gender *</Label>
              <RadioGroup value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })} className="flex gap-6">
                <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male">Male</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="female" /><Label htmlFor="female">Female</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="other" /><Label htmlFor="other">Other</Label></div>
              </RadioGroup>
            </div>
            <div><Label>Resume (Optional)</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} /></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div><Label>Phone *</Label><Input type="tel" required value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} /></div>
              <div><Label>Email *</Label><Input type="email" required value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} /></div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90" size="lg">
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Apply;
