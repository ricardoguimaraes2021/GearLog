import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  QrCode, 
  BarChart3, 
  Shield, 
  Search, 
  FileText, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Zap,
  Lock,
  TrendingUp,
  Download,
  Terminal,
  Code,
  PlayCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const handleDownloadSetupScript = () => {
    // Create a download link for the setup script
    const scriptUrl = 'https://raw.githubusercontent.com/ricardoguimaraes2021/GearLog/main/setup.py';
    const link = document.createElement('a');
    link.href = scriptUrl;
    link.download = 'setup.py';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExe = () => {
    // Create a download link for the Windows executable
    // Note: This will need to be updated with the actual release URL once the .exe is built and uploaded
    const exeUrl = 'https://github.com/ricardoguimaraes2021/GearLog/releases/latest/download/GearLogSetup.exe';
    const link = document.createElement('a');
    link.href = exeUrl;
    link.download = 'GearLogSetup.exe';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const features = [
    {
      icon: Package,
      title: 'Complete Inventory Management',
      description: 'Track all your IT equipment with detailed information including brand, model, serial numbers, and specifications.',
    },
    {
      icon: QrCode,
      title: 'QR Code Generation',
      description: 'Automatically generate QR codes for each product, making it easy to scan and track equipment quickly.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Dashboard',
      description: 'Monitor your inventory with comprehensive KPIs, alerts for low stock, and visual analytics.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access Control',
      description: 'Secure your data with granular permissions. Admin, Manager, and Technician roles with different access levels.',
    },
    {
      icon: Search,
      title: 'Advanced Search & Filters',
      description: 'Find products instantly with powerful search and filtering options by category, status, and more.',
    },
    {
      icon: FileText,
      title: 'Export & Reports',
      description: 'Export your inventory data in multiple formats: CSV, Excel, or PDF for reporting and analysis.',
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Save Time',
      description: 'Automate inventory tracking and reduce manual work with smart features.',
    },
    {
      icon: Lock,
      title: 'Secure & Reliable',
      description: 'Built with security best practices and reliable data storage.',
    },
    {
      icon: TrendingUp,
      title: 'Make Better Decisions',
      description: 'Get insights from your inventory data to optimize your IT asset management.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Multiple users can work together with proper access controls and activity logs.',
    },
  ];

  const stats = [
    { value: '100%', label: 'Open Source' },
    { value: '24/7', label: 'Available' },
    { value: '∞', label: 'Unlimited Items' },
    { value: 'Free', label: 'Forever' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">GearLog</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
            <CheckCircle2 className="h-4 w-4" />
            Open Source IT Inventory Management
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Manage Your IT Equipment
            <span className="text-blue-600"> Like a Pro</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            GearLog is a comprehensive inventory management system designed specifically for IT teams. 
            Track, manage, and optimize your equipment with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
              onClick={handleDownloadSetupScript}
            >
              <Download className="mr-2 h-5 w-5" />
              Download Setup Script
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Setup Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                  <Terminal className="h-4 w-4" />
                  Automated Setup Available
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Get Started in Minutes
                </h2>
                <p className="text-lg text-blue-100 mb-6">
                  Our automated setup script handles everything for you. It installs all dependencies, 
                  configures the project, and sets up the database automatically. No manual configuration needed!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-6 bg-white text-blue-600 hover:bg-gray-100"
                    onClick={handleDownloadExe}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download for Windows (.exe)
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-6 border-white text-white hover:bg-white/10"
                    onClick={handleDownloadSetupScript}
                  >
                    <Code className="mr-2 h-5 w-5" />
                    Download Python Script
                  </Button>
                  <a
                    href="https://github.com/ricardoguimaraes2021/GearLog#-quick-start"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-6 border-white text-white hover:bg-white/10"
                    >
                      View Instructions
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex-1">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5" />
                      Quick Start
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-300">$</span>
                        <span>chmod +x setup.py</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-300">$</span>
                        <span>python3 setup.py</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/20 text-xs text-blue-100">
                        The script will automatically:
                      </div>
                      <ul className="space-y-1 text-xs text-blue-100 ml-4 list-disc">
                        <li>Install PHP, Composer, MySQL, Node.js</li>
                        <li>Clone the repository</li>
                        <li>Configure backend & frontend</li>
                        <li>Set up the database</li>
                        <li>Run migrations</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Manage IT Inventory
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to make inventory management simple and efficient
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose GearLog?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for modern IT teams who need reliable, efficient inventory management
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your IT Inventory Management?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join teams who are already using GearLog to streamline their IT equipment tracking.
              Get started in minutes with our automated setup script, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 border-white text-white hover:bg-white/10"
                onClick={handleDownloadSetupScript}
              >
                <Download className="mr-2 h-5 w-5" />
                Download Setup Script
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">GearLog</span>
              </div>
              <p className="text-gray-600">
                Open source IT equipment inventory management system.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#features" className="hover:text-blue-600">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-600">Pricing</a></li>
                <li><a href="#docs" className="hover:text-blue-600">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="https://github.com/ricardoguimaraes2021/GearLog" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">GitHub</a></li>
                <li><a href="#support" className="hover:text-blue-600">Support</a></li>
                <li><a href="#blog" className="hover:text-blue-600">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#privacy" className="hover:text-blue-600">Privacy</a></li>
                <li><a href="#terms" className="hover:text-blue-600">Terms</a></li>
                <li><a href="#license" className="hover:text-blue-600">License</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} GearLog. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

