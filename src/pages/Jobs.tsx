import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, MapPin, Calendar, Building2, ArrowLeft, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  job_name: string;
  company: string;
  description: string;
  age_limit: string | null;
  experience: string | null;
  qualification: string;
  location: string;
  application_deadline: string;
  job_type: string;
  contact_phone: string;
  contact_email: string;
  created_at: string;
}

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast.error("Error fetching jobs", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button
            onClick={() => navigate("/add-job")}
            className="bg-gradient-to-r from-secondary to-primary hover:opacity-90"
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Post a Job
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Available Opportunities
          </h1>
          <p className="text-xl text-muted-foreground">
            Browse and apply for part-time positions
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No jobs available yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to post a job opportunity!</p>
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
              <Card
                key={job.id}
                className="p-6 hover:shadow-[var(--shadow-elevated)] transition-shadow cursor-pointer"
                onClick={() => navigate(`/apply/${job.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1 line-clamp-1">{job.job_name}</h3>
                    <div className="flex items-center text-muted-foreground mb-2">
                      <Building2 className="h-4 w-4 mr-1" />
                      <span className="text-sm">{job.company}</span>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                    {job.job_type}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {job.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span>Apply by: {formatDate(job.application_deadline)}</span>
                  </div>
                </div>

                {job.experience && (
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Experience:</strong> {job.experience}
                  </p>
                )}

                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Qualification:</strong> {job.qualification}
                </p>

                <div className="border-t pt-4 mt-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold mb-2">Contact Recruiter:</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${job.contact_phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a
                      href={`mailto:${job.contact_email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </a>
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/apply/${job.id}`);
                  }}
                  className="w-full mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  Apply Now
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
