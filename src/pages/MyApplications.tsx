import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  qualification: string | null;
  gender: string;
  created_at: string;
  job_id: string;
  jobs: {
    job_name: string;
    company: string;
    location: string;
  } | null;
}

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          jobs:job_id (
            job_name,
            company,
            location
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error("Error fetching your applications", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicationId: string) => {
    if (!confirm("Are you sure you want to withdraw this application?")) return;

    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", applicationId);

      if (error) throw error;

      toast.success("Application withdrawn successfully");
      fetchMyApplications();
    } catch (error: any) {
      toast.error("Error withdrawing application", {
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
            My Applications
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your job applications
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-6">Start applying to jobs to see them here!</p>
            <Button
              onClick={() => navigate("/jobs")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Browse Jobs
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <Card key={app.id} className="p-6 hover:shadow-[var(--shadow-elevated)] transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{app.jobs?.job_name || "Unknown Job"}</h3>
                <p className="text-sm text-muted-foreground mb-2">{app.jobs?.company}</p>
                <p className="text-sm text-muted-foreground mb-4">{app.jobs?.location}</p>
                <div className="border-t pt-4 space-y-1 text-sm">
                  <p><strong>Your Name:</strong> {app.first_name} {app.last_name}</p>
                  <p><strong>Age:</strong> {app.age}</p>
                  {app.qualification && <p><strong>Qualification:</strong> {app.qualification}</p>}
                  <p><strong>Gender:</strong> {app.gender}</p>
                  <p className="text-xs text-muted-foreground pt-2">
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleDelete(app.id)}
                  variant="destructive"
                  size="sm"
                  className="w-full mt-4"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Withdraw Application
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
