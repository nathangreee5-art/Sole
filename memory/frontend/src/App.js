import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/context/AppContext";
import { Layout } from "@/components/layout/Layout";

import Home from "@/pages/Home";
import Services from "@/pages/Services";
import HowItWorks from "@/pages/HowItWorks";
import Delivery from "@/pages/Delivery";
import About from "@/pages/About";
import Faq from "@/pages/Faq";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import BookAClean from "@/pages/BookAClean";
import OrderTracking from "@/pages/OrderTracking";
import TrackLookup from "@/pages/TrackLookup";
import PaymentResult from "@/pages/PaymentResult";
import Conversation from "@/pages/Conversation";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminOrderDetail from "@/pages/admin/AdminOrderDetail";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminTickets from "@/pages/admin/AdminTickets";
import AdminTicketDetail from "@/pages/admin/AdminTicketDetail";

const Public = ({ children }) => <Layout>{children}</Layout>;

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
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
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}

export default App;
