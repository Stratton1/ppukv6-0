import { Search, Shield, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { useState } from "react";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Verified Data",
      description: "Access trusted property information from official sources",
    },
    {
      icon: FileText,
      title: "Complete Records",
      description: "EPC, title deeds, planning history, and more in one place",
    },
    {
      icon: TrendingUp,
      title: "Smart Insights",
      description: "AI-powered analysis of property documents and trends",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            The Universal Property Record
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Property Passport UK is the gold standard for property information access, 
            management, and verification. Find, claim, and manage your property data.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter postcode, address, or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-12 text-lg"
              />
              <Button type="submit" size="lg" className="px-8">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </form>

          <div className="flex justify-center gap-4 pt-4">
            <Link to="/claim">
              <Button variant="outline" size="lg">
                Claim Your Property
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-lg p-8 md:p-12 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to explore property data?
          </h2>
          <p className="text-lg opacity-90">
            Join thousands of homeowners and buyers using Property Passport UK
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;