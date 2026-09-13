import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, MapPin, Calendar, Building2, ArrowLeft, Mail, Phone, Languages } from "lucide-react";
import { toast } from "sonner";
import { useLanguage, useTranslatedTexts } from "@/hooks/useLanguage";

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
  company_photo: string | null;
}

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [locations, setLocations] = useState<string[]>([]);
  const { lang, setLang, t } = useLanguage();

  const translatable = filteredJobs.flatMap((job) => [
    job.job_name,
    job.description,
    job.location,
    job.job_type,
    job.qualification,
    job.experience || "",
  ]);
  const { tr, busy: translating } = useTranslatedTexts(translatable, lang);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedLocation === "all") {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter(job => job.location === selectedLocation));
    }
  }, [selectedLocation, jobs]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
      setFilteredJobs(data || []);
      
      // Extract unique locations
      const uniqueLocations = Array.from(new Set(data?.map(job => job.location) || []));
      setLocations(uniqueLocations);
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
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backHome")}
          </Button>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex items-center rounded-md border p-0.5">
              <Languages className="mx-1.5 h-4 w-4 text-muted-foreground" />
              <Button
                size="sm"
                variant={lang === "en" ? "default" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setLang("en")}
              >
                English
              </Button>
              <Button
                size="sm"
                variant={lang === "te" ? "default" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setLang("te")}
              >
                తెలుగు
              </Button>
            </div>
            <Button
              onClick={() => navigate("/my-applications")}
              variant="outline"
            >
              {t("myApplications")}
            </Button>
            <Button
              onClick={() => navigate("/my-jobs")}
              variant="outline"
            >
              {t("myJobs")}
            </Button>
            <Button
              onClick={() => navigate("/add-job")}
              className="bg-gradient-to-r from-secondary to-primary hover:opacity-90"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              {t("postJob")}
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t("heading")}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t("subHeading")}
          </p>
          {translating && (
            <p className="mt-2 text-sm text-muted-foreground">{t("translating")}</p>
          )}
        </div>

        {locations.length > 0 && (
          <div className="mb-8 max-w-xs mx-auto">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder={t("filterLocation")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allLocations")}</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {tr(location)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {selectedLocation === "all" ? "No jobs available yet" : `No jobs in ${selectedLocation}`}
            </h3>
            <p className="text-muted-foreground mb-6">
              {selectedLocation === "all" 
                ? "Be the first to post a job opportunity!" 
                : "Try selecting a different location or check back later"}
            </p>
            <Button
              onClick={() => navigate("/add-job")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Post a Job
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="p-6 hover:shadow-[var(--shadow-elevated)] transition-shadow cursor-pointer"
                onClick={() => navigate(`/apply/${job.id}`)}
              >
                {job.company_photo && (
                  <img
                    src={job.company_photo}
                    alt={job.company}
                    className="w-full h-32 object-cover rounded-md mb-4"
                  />
                )}
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

                {(job.contact_phone || job.contact_email) && (
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold mb-2">Contact Recruiter:</p>
                    <div className="flex items-center gap-2">
                      {job.contact_phone && (
                        <a
                          href={`tel:${job.contact_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          Call
                        </a>
                      )}
                      {job.contact_phone && job.contact_email && (
                        <span className="text-muted-foreground">•</span>
                      )}
                      {job.contact_email && (
                        <a
                          href={`mailto:${job.contact_email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                )}

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
