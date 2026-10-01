import "@/App.css";
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/context/AppContext";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";

const Services = lazy(() => import("@/pages/Services"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const Delivery = lazy(() => import("@/pages/Delivery"));
const About = lazy(() => import("@/pages/About"));
const Faq = lazy(() => import("@/pages/Faq"));
const Contact = lazy(() => import("@/pages/Contact"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const BookAClean = lazy(() => import("@/pages/BookAClean"));
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));
const TrackLookup = lazy(() => import("@/pages/TrackLookup"));
const PaymentResult = lazy(() => import("@/pages/PaymentResult"));
const Conversation = lazy(() => import("@/pages/Conversation"));

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/AdminOrderDetail"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));

const Public = ({ children }) => <Layout>{children}</Layout>;
const RouteFallback = () => <div className="ss-route-fallback" aria-busy="true" />;

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Public><Home /></Public>} />
              <Route path="/services" element={<Public><Services /></Public>} />
              <Route path="/how-it-works" element={<Public><HowItWorks /></Public>} />
              <Route path="/delivery" element={<Public><Delivery /></Public>} />
              <Route path="/about" element={<Public><About /></Public>} />
              <Route path="/faq" element={<Public><Faq /></Public>} />
              <Route path="/contact" element={<Public><Contact /></Public>} />
              <Route path="/terms" element={<Public><Terms /></Public>} />
              <Route path="/privacy" element={<Public><Privacy /></Public>} />
              <Route path="/book" element={<Public><BookAClean /></Public>} />
              <Route path="/track" element={<Public><TrackLookup /></Public>} />
              <Route path="/order/:orderNumber" element={<Public><OrderTracking /></Public>} />
              <Route path="/payment/success" element={<Public><PaymentResult /></Public>} />
              <Route path="/payment/cancel" element={<Public><PaymentResult /></Public>} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:orderNumber" element={<AdminOrderDetail />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </Suspense>
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}

export default App;
