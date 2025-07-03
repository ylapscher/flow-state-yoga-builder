import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Target, Sparkles } from 'lucide-react';
import heroImage from '@/assets/yoga-hero.jpg';
import AuthForm from './AuthForm';

const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <img 
          src={heroImage} 
          alt="Yoga practice" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sage-dark/90 to-zen-blue/70" />
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
            Personalized Yoga Sequences
          </Badge>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Your Perfect
            <span className="block text-sage-light">Yoga Flow</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
            Create personalized yoga sequences tailored to your time and goals.
            <br />
            From quick 45-minute sessions to deep 75-minute practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setShowAuth(true)}
              variant="zen" 
              size="lg"
              className="text-lg px-8 py-6 bg-white text-sage-dark hover:bg-sage-light hover:text-white shadow-gentle"
            >
              Start Your Journey
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-sage-dark"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Why Choose Yoga Flow?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the perfect blend of ancient wisdom and modern convenience. 
              Our intelligent system creates sequences that fit your life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="shadow-card hover:shadow-lg transition-zen text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-sage-light to-sage rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-sage-dark" />
                </div>
                <CardTitle className="text-xl">Perfect Timing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Choose 45, 60, or 75-minute sequences that fit perfectly into your schedule and energy levels.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-lg transition-zen text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-zen-blue-light to-zen-blue rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-foreground" />
                </div>
                <CardTitle className="text-xl">AI-Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Our intelligent system creates unique sequences every time, ensuring variety and progression.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-lg transition-zen text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-earth-light to-earth rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-8 h-8 text-earth-dark" />
                </div>
                <CardTitle className="text-xl">Goal-Focused</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Whether you want relaxation, strength, or flexibility - your sequences adapt to your intentions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-lg transition-zen text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Personal Library</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Save your favorite sequences and build your personal collection of yoga practices.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 px-4 bg-gradient-to-r from-sage-light/10 to-zen-blue-light/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16">
            Simple. Effective. Personal.
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto">
                1
              </div>
              <h3 className="text-2xl font-semibold text-foreground">Choose Duration</h3>
              <p className="text-muted-foreground">
                Select 45, 60, or 75 minutes based on your available time and energy.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-zen-blue rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto">
                2
              </div>
              <h3 className="text-2xl font-semibold text-foreground">Generate Flow</h3>
              <p className="text-muted-foreground">
                Our AI creates a balanced sequence with warm-up, poses, and cool-down.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-earth rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto">
                3
              </div>
              <h3 className="text-2xl font-semibold text-foreground">Practice & Save</h3>
              <p className="text-muted-foreground">
                Follow along with your sequence and save favorites to your personal library.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands who have discovered their perfect yoga flow. Start creating personalized sequences today.
          </p>
          <Button 
            onClick={() => setShowAuth(true)}
            variant="zen" 
            size="lg"
            className="text-lg px-12 py-6 shadow-gentle"
          >
            Begin Your Journey
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-sage-dark mb-4">Yoga Flow</h3>
          <p className="text-muted-foreground">
            Personalized yoga sequences for every practitioner.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;