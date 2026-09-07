import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Banners from "./pages/Banners";
import Videos from "./pages/Videos";
import NotFound from "./pages/NotFound";
import Certifications from "./pages/Certifications";
import FAQ from "./pages/FAQ";
import Testimonial from "./pages/Testimonial";
import Blogs from "./pages/Blogs";
import PortfolioPage from "./pages/Portfolio";
import Pricing from "./pages/Pricing";
import Test from "./pages/Test";
import LeadsManagement from './pages/LeadsManagement';
import LogoCarousel from "./pages/LogoCarousel";
import LatestUpdates from "./pages/LatestUpdates";
import ChatConfig from "./pages/ChatConfig";
import EmailConfig from "./pages/EmailConfig";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/adminpanel">
        <Routes>
          <Route path="/" element={<Navigate to="/banners" replace />} />
          <Route path="/banners" element={<Banners />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/certifications" element={<Certifications />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/testimonials" element={<Testimonial />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/doctors" element={<NotFound />} />
          <Route path="/equipment" element={<NotFound />} />
          <Route path="/posts" element={<NotFound />} />
          <Route path="/leads" element ={<LeadsManagement />} />
          <Route path="/portfolio" element ={<PortfolioPage />} />
          <Route path="/categories" element={<NotFound />} />
          <Route path="/authors" element={<NotFound />} />
          <Route path="/logocarousel" element={<LogoCarousel />} />
          <Route path="/news" element={<LatestUpdates />} />
          <Route path="/chat-config" element={<ChatConfig />} />
          <Route path="/email-config" element={<EmailConfig />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
