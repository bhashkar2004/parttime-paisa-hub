import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  contact_email: string;
  contact_phone: string;
  age: number;
  gender: string;
  qualification: string | null;
  resume_url: string | null;
  created_at: string;
}

interface Job {
  id: string;
  job_name: string;
  company: string;
}

const JobApplications = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobAndApplications();
  }, [jobId]);

  const fetchJobAndApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("id, job_name, company")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .single();

      if (jobError) throw jobError;
      
      if (!jobData) {
        toast.error("Job not found or you don't have permission to view it");
        navigate("/my-jobs");
        return;
      }

      setJob(jobData);

      // Fetch applications for this job
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (applicationsError) throw applicationsError;
      setApplications(applicationsData || []);
    } catch (error: any) {
      toast.error("Error fetching applications", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async (resumeUrl: string, applicantName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .download(resumeUrl.replace(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/resumes/`, ''));

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${applicantName}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Resume downloaded successfully");
    } catch (error: any) {
      toast.error("Error downloading resume", {
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/my-jobs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Jobs
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Applications for {job?.job_name}
              </h1>
              <p className="text-xl text-muted-foreground">
                {applications.length} {applications.length === 1 ? 'application' : 'applications'} received
              </p>
            </div>

            {applications.length === 0 ? (
              <Card className="p-12 text-center">
                <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
                <p className="text-muted-foreground">Applications will appear here once candidates apply</p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {applications.map((application) => (
                  <Card key={application.id} className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">
                            {application.first_name} {application.last_name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${application.contact_email}`} className="hover:text-primary">
                              {application.contact_email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${application.contact_phone}`} className="hover:text-primary">
                              {application.contact_phone}
                            </a>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Age:</span>
                            <p className="font-medium">{application.age}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gender:</span>
                            <p className="font-medium capitalize">{application.gender}</p>
                          </div>
                          {application.qualification && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Qualification:</span>
                              <p className="font-medium">{application.qualification}</p>
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        {application.resume_url ? (
                          <Button
                            onClick={() => handleDownloadResume(
                              application.resume_url!, 
                              `${application.first_name}_${application.last_name}`
                            )}
                            className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Resume
                          </Button>
                        ) : (
                          <p className="text-muted-foreground">No resume uploaded</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JobApplications;
