import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  job_name: string;
  company: string;
  description: string;
  location: string;
  job_type: string;
  created_at: string;
  company_photo: string | null;
}

const MyJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast.error("Error fetching your jobs", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (error) throw error;

      toast.success("Job deleted successfully");
      fetchMyJobs();
    } catch (error: any) {
      toast.error("Error deleting job", {
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Posted Jobs
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your job postings
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No jobs posted yet</h3>
            <p className="text-muted-foreground mb-6">Start posting jobs to find the right candidates!</p>
            <Button
              onClick={() => navigate("/add-job")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Post a Job
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id} className="p-6 hover:shadow-[var(--shadow-elevated)] transition-shadow">
                {job.company_photo && (
                  <img
                    src={job.company_photo}
                    alt={job.company}
                    className="w-full h-32 object-cover rounded-md mb-4"
                  />
                )}
                <h3 className="text-xl font-semibold mb-2 line-clamp-1">{job.job_name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{job.company}</p>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/edit-job/${job.id}`)}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(job.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJobs;
