import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useThemeStore } from '@/stores/themeStore';
import { useEffect } from 'react';
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
  Ticket,
  Clock,
  AlertTriangle,
  Image,
  History,
  Eye,
  MessageSquare,
  Paperclip,
  Target,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    // Inicializar tema ao carregar a página
    initializeTheme();
  }, [initializeTheme]);

  const features = [
    {
      icon: Package,
      title: 'Complete Inventory Management',
      description: 'Track all your IT equipment with detailed information including brand, model, serial numbers, specifications, and purchase dates. Full CRUD operations with status management.',
    },
    {
      icon: QrCode,
      title: 'QR Code Generation & Scanning',
      description: 'Automatically generate QR codes for each product. Scan codes to access public product pages without login. Perfect for quick asset identification in the field.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Dashboard & Analytics',
      description: 'Monitor your inventory with comprehensive KPIs, visual analytics, and smart alerts. Track products by category, view recent activity, and get insights at a glance.',
    },
    {
      icon: Ticket,
      title: 'Ticket System with SLA',
      description: 'Complete support ticket management with automated SLA tracking. Monitor compliance rates, track violations, and view historical trends. Support for multiple ticket types and priorities.',
    },
    {
      icon: Clock,
      title: 'SLA Compliance Tracking',
      description: 'Automated Service Level Agreement tracking with configurable response and resolution times. Real-time violation detection, at-risk warnings, and compliance trend charts.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access Control',
      description: 'Secure your data with granular permissions. Admin, Manager, Technician, and Read-only roles with different access levels. Built on Spatie Permissions.',
    },
    {
      icon: Search,
      title: 'Advanced Search & Filters',
      description: 'Find products instantly with powerful search and filtering options. Filter by category, status, and custom criteria. Real-time search results as you type.',
    },
    {
      icon: FileText,
      title: 'Export & Reports',
      description: 'Export your inventory and employee data in multiple formats: CSV, Excel (XLSX), or PDF. Export products and employees with filtered results for targeted reporting and analysis.',
    },
    {
      icon: History,
      title: 'Asset Assignment & Movement Tracking',
      description: 'Assign assets to employees with checkout/check-in system. Track all product movements (entry, exit, allocation, return) with assigned users and notes. Prevent negative stock with real-time validation. Complete assignment and movement history.',
    },
    {
      icon: Image,
      title: 'Image Upload & Optimization',
      description: 'Upload product images with automatic optimization. Support for multiple image formats. Images are automatically resized and optimized for web delivery.',
    },
    {
      icon: Paperclip,
      title: 'File Attachments',
      description: 'Attach files to tickets and comments. Support for images, PDFs, and documents. Track attachments with download links and file management.',
    },
    {
      icon: MessageSquare,
      title: 'Comments & Collaboration',
      description: 'Add comments to tickets with file attachments. Complete activity logs for all ticket actions. Team collaboration with real-time updates.',
    },
    {
      icon: AlertTriangle,
      title: 'Smart Alerts',
      description: 'Receive alerts for low stock, damaged products, and inactive items. Expandable alerts showing specific products that need attention.',
    },
    {
      icon: Eye,
      title: 'Public Product View',
      description: 'Shareable public product pages accessible via QR code scanning. View product details without authentication. Perfect for field technicians.',
    },
    {
      icon: Target,
      title: 'Ticket Assignment',
      description: 'Assign tickets to technicians. Track assignment history. Filter tickets by assigned user. Monitor workload distribution.',
    },
    {
      icon: Activity,
      title: 'Activity Logs',
      description: 'Complete audit trail of all actions. Track ticket status changes, assignments, comments, and product movements. Full history for compliance.',
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Save Time',
      description: 'Automate inventory tracking and reduce manual work with smart features like QR codes, automated alerts, and bulk operations.',
    },
    {
      icon: Lock,
      title: 'Secure & Reliable',
      description: 'Built with security best practices, role-based access control, and reliable data storage. Your data is protected and backed up.',
    },
    {
      icon: TrendingUp,
      title: 'Make Better Decisions',
      description: 'Get insights from your inventory data and ticket metrics to optimize your IT asset management and support operations.',
    },
    {
      icon: Users,
      title: 'Employee & Department Management',
      description: 'Complete employee directory with department management. Track employee assignments, view department analytics, and manage organizational structure. Export employee data in multiple formats.',
    },
  ];

  const techStack = [
    {
      category: 'Backend',
      items: ['Laravel 11', 'PHP 8.3+', 'MySQL 8', 'Laravel Sanctum', 'Spatie Permissions', 'Laravel Excel', 'DomPDF', 'Intervention Image', 'Simple QR Code'],
    },
    {
      category: 'Frontend',
      items: ['React 18', 'TypeScript', 'Vite', 'TailwindCSS', 'shadcn/ui', 'Zustand', 'Axios', 'React Router', 'Recharts', 'Zod'],
    },
  ];

  const stats = [
    { value: '100%', label: 'Open Source' },
    { value: '24/7', label: 'Available' },
    { value: '∞', label: 'Unlimited Items' },
    { value: 'Free', label: 'Forever' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-accent-primary" />
              <span className="text-2xl font-bold text-text-primary">GearLog</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/10 text-accent-primary rounded-full text-sm font-medium mb-6">
            <CheckCircle2 className="h-4 w-4" />
            Open Source IT Inventory Management
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
            Manage Your IT Equipment
            <span className="text-accent-primary"> Like a Pro</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            GearLog is a comprehensive inventory management system designed specifically for IT teams. 
            Track equipment, manage support tickets with SLA tracking, and optimize your operations with powerful analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8">
                Start for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href="https://github.com/ricardoguimaraes2021/GearLog"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="text-lg px-8">
                View on GitHub
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-surface">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-accent-primary mb-2">{stat.value}</div>
                <div className="text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 scroll-mt-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Everything You Need to Manage IT Inventory
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Powerful features designed to make inventory management and support ticket handling simple and efficient
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-2 border-border hover:border-accent-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-accent-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-accent-primary" />
                  </div>
                  <CardTitle className="text-xl text-text-primary">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-text-secondary">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="bg-surface-alt py-20 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Leveraging the best tools and frameworks for performance, security, and developer experience
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {techStack.map((stack, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-2xl text-text-primary">{stack.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stack.items.map((item, itemIndex) => (
                      <span
                        key={itemIndex}
                        className="px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-sm font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Why Choose GearLog?
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Built for modern IT teams who need reliable, efficient inventory management
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="text-center">
                <div className="h-16 w-16 bg-blue-600 dark:bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{benefit.title}</h3>
                <p className="text-text-secondary">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 dark:from-accent-primary dark:via-accent-primary dark:to-accent-secondary border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4 text-white">
              Ready to Transform Your IT Inventory Management?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-white/95">
              Join teams who are already using GearLog to streamline their IT equipment tracking and support operations.
              Get started today with our easy setup process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-50 dark:bg-white dark:text-accent-primary dark:hover:bg-gray-100">
                  Start for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a
                href="https://github.com/ricardoguimaraes2021/GearLog"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 border-2 border-white text-white hover:bg-white/20 bg-transparent"
                >
                  View Source Code
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-accent-primary" />
                <span className="text-xl font-bold text-text-primary">GearLog</span>
              </div>
              <p className="text-text-secondary">
                Open source IT equipment inventory management system with ticket support and SLA tracking.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Product</h4>
              <ul className="space-y-2 text-text-secondary">
                <li>
                  <a 
                    href="#features" 
                    className="hover:text-accent-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a 
                    href="#tech-stack" 
                    className="hover:text-accent-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('tech-stack')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Technology
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/ricardoguimaraes2021/GearLog#readme" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-accent-primary transition-colors"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Resources</h4>
              <ul className="space-y-2 text-text-secondary">
                <li>
                  <a 
                    href="https://github.com/ricardoguimaraes2021/GearLog" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-accent-primary transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/ricardoguimaraes2021/GearLog/issues" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-accent-primary transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/ricardoguimaraes2021/GearLog/blob/main/README.md" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-accent-primary transition-colors"
                  >
                    Quick Start
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Legal</h4>
              <ul className="space-y-2 text-text-secondary">
                <li>
                  <a 
                    href="https://github.com/ricardoguimaraes2021/GearLog/blob/main/LICENSE" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-accent-primary transition-colors"
                  >
                    License
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/ricardoguimaraes2021/GearLog/blob/main/CONTRIBUTING.md" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-accent-primary transition-colors"
                  >
                    Contributing
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-text-secondary">
            <p>&copy; {new Date().getFullYear()} GearLog. All rights reserved.</p>
            <p className="mt-2">
              Developed by{' '}
              <a
                href="https://github.com/ricardoguimaraes2021"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-secondary hover:underline transition-colors font-medium"
              >
                @ricardoguimaraes2021
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
