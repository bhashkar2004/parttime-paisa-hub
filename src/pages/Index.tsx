import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Search, TrendingUp, Users, LogOut, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const handleAddJob = () => {
    if (!user) {
      toast.error("Please login first", {
        description: "You need to be logged in to post jobs",
      });
      navigate("/auth");
    } else {
      navigate("/add-job");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/5" />
        
        {/* Auth Button */}
        <div className="absolute top-4 right-4 z-10">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:inline">
                {user.email}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Login / Sign Up
            </Button>
          )}
        </div>

        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-orange-500 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Part Time Paisa
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
              Find Your Perfect Part-Time Opportunity or Hire Talented Professionals
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
              <Card
                className="p-8 cursor-pointer hover:shadow-[var(--shadow-elevated)] transition-all hover:scale-105 group"
                onClick={handleAddJob}
              >
                <div className="p-4 rounded-full bg-gradient-to-br from-primary to-secondary w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-10 w-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Post a Job
                </h2>
                <p className="text-muted-foreground mb-6">
                  Looking for talented individuals? Post your job opportunity now.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  size="lg"
                >
                  Add Job
                </Button>
              </Card>

              <Card
                className="p-8 cursor-pointer hover:shadow-[var(--shadow-elevated)] transition-all hover:scale-105 group"
                onClick={() => navigate("/jobs")}
              >
                <div className="p-4 rounded-full bg-gradient-to-br from-secondary to-primary w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Search className="h-10 w-10 text-secondary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                  Browse Jobs
                </h2>
                <p className="text-muted-foreground mb-6">
                  Explore available part-time positions and apply for your dream job.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-secondary to-primary hover:opacity-90"
                  size="lg"
                >
                  View Jobs
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-accent/20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Why Choose Part Time Paisa?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-6 text-center hover:shadow-[var(--shadow-card)] transition-shadow">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary to-secondary w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-muted-foreground">
                Simple and intuitive interface for both job seekers and employers
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-[var(--shadow-card)] transition-shadow">
              <div className="p-3 rounded-full bg-gradient-to-br from-secondary to-primary w-fit mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Applications</h3>
              <p className="text-muted-foreground">
                Apply to multiple jobs quickly with our streamlined application process
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-[var(--shadow-card)] transition-shadow">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary to-secondary w-fit mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Direct Contact</h3>
              <p className="text-muted-foreground">
                Connect directly with employers via phone or email
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers and employers finding success on Part Time Paisa
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => navigate("/jobs")}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Browse Jobs
            </Button>
            <Button
              onClick={() => navigate("/add-job")}
              size="lg"
              variant="outline"
              className="border-2"
            >
              Post a Job
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
