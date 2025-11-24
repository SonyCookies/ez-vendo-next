"use client";

import AdminNavbar from "../components/AdminNavbar";
import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import {
  ArchiveX,
  BanknoteArrowUp,
  ChevronRight,
  Plus,
  UserRound,
  UserX,
  Wifi,
  WifiHigh,
  Users,
  ReceiptText,
  Clock,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("summary");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [hasLoadedSummary, setHasLoadedSummary] = useState(false);
  
  // Recent activity state
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentTopUpRequests, setRecentTopUpRequests] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivityLoading, setRecentActivityLoading] = useState(false);
  
  // Insights state
  const [averageSessionDuration, setAverageSessionDuration] = useState(0);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);
  const [peakUsageHours, setPeakUsageHours] = useState(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Summary metrics state
  const [totalRegisteredUsers, setTotalRegisteredUsers] = useState(0);
  const [totalRevenueToday, setTotalRevenueToday] = useState(0);
  const [pendingTopUpRequests, setPendingTopUpRequests] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [totalTransactionsToday, setTotalTransactionsToday] = useState(0);
  const [totalManualTopUpsToday, setTotalManualTopUpsToday] = useState(0);

  // Charts state
  const [revenueTrendPeriod, setRevenueTrendPeriod] = useState(7); // 7 or 30 days
  const [userRegistrationsPeriod, setUserRegistrationsPeriod] = useState(7); // 7 or 30 days
  const [revenueTrendData, setRevenueTrendData] = useState(null);
  const [userRegistrationsData, setUserRegistrationsData] = useState(null);
  const [topUpRequestsStatusData, setTopUpRequestsStatusData] = useState(null);
  const [transactionTypesData, setTransactionTypesData] = useState(null);
  const [sessionActivityData, setSessionActivityData] = useState(null);
  const [revenueByPaymentMethodData, setRevenueByPaymentMethodData] = useState(null);

  // Fetch all summary metrics
  useEffect(() => {
    const fetchSummaryMetrics = async () => {
      const startTime = Date.now();
      try {
        // Only show loading on initial load, not when switching tabs
        if (!hasLoadedSummary) {
          setSummaryLoading(true);
        }

        // Get today's date range (start and end of today)
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        // 1. Total Registered Users
        try {
          const usersRef = collection(db, "users");
          const registeredUsersQuery = query(usersRef, where("isRegistered", "==", true));
          const registeredUsersSnapshot = await getDocs(registeredUsersQuery);
          setTotalRegisteredUsers(registeredUsersSnapshot.size);
        } catch (error) {
          console.error("Error fetching registered users:", error);
          // Fallback: get all users and filter client-side
          const usersRef = collection(db, "users");
          const allUsersSnapshot = await getDocs(usersRef);
          const registeredCount = allUsersSnapshot.docs.filter(
            (doc) => doc.data().isRegistered === true
          ).length;
          setTotalRegisteredUsers(registeredCount);
        }

        // 2. Total Revenue Today (from transactions where type is "Top-up" or "Deducted")
        try {
          const transactionsRef = collection(db, "transactions");
          const transactionsSnapshot = await getDocs(transactionsRef);
          
          let revenue = 0;
          transactionsSnapshot.forEach((doc) => {
            const data = doc.data();
            const transactionDate = data.timestamp?.toDate ? data.timestamp.toDate() : 
                                  data.createdAt?.toDate ? data.createdAt.toDate() : 
                                  data.date ? new Date(data.date) : null;
            
            if (transactionDate && transactionDate >= todayStart && transactionDate < todayEnd) {
              const type = data.type || "";
              if (type === "Top-up" || type === "Deducted") {
                revenue += Number(data.amount) || 0;
              }
            }
          });
          setTotalRevenueToday(revenue);
        } catch (error) {
          console.error("Error fetching revenue:", error);
        }

        // 3. Pending Top-up Requests
        try {
          const topUpRequestsRef = collection(db, "topup_requests");
          const pendingQuery = query(topUpRequestsRef, where("status", "==", "pending"));
          const pendingSnapshot = await getDocs(pendingQuery);
          setPendingTopUpRequests(pendingSnapshot.size);
        } catch (error) {
          console.error("Error fetching pending requests:", error);
          // Fallback: get all and filter client-side
          const topUpRequestsRef = collection(db, "topup_requests");
          const allSnapshot = await getDocs(topUpRequestsRef);
          const pendingCount = allSnapshot.docs.filter(
            (doc) => doc.data().status === "pending"
          ).length;
          setPendingTopUpRequests(pendingCount);
        }

        // 4. Active Sessions (users where sessionEndTime > now)
        try {
          const usersRef = collection(db, "users");
          const usersSnapshot = await getDocs(usersRef);
          
          let activeCount = 0;
          const now = Date.now();
          usersSnapshot.forEach((doc) => {
            const data = doc.data();
            const sessionEndTime = data.sessionEndTime;
            if (sessionEndTime) {
              const endTime = sessionEndTime instanceof Date ? sessionEndTime.getTime() :
                             typeof sessionEndTime === 'number' ? sessionEndTime :
                             sessionEndTime.toMillis ? sessionEndTime.toMillis() : null;
              if (endTime && endTime > now) {
                activeCount++;
              }
            }
          });
          setActiveSessions(activeCount);
        } catch (error) {
          console.error("Error fetching active sessions:", error);
        }

        // 5. Total Transactions Today
        try {
          const transactionsRef = collection(db, "transactions");
          const transactionsSnapshot = await getDocs(transactionsRef);
          
          let todayCount = 0;
          transactionsSnapshot.forEach((doc) => {
            const data = doc.data();
            const transactionDate = data.timestamp?.toDate ? data.timestamp.toDate() : 
                                  data.createdAt?.toDate ? data.createdAt.toDate() : 
                                  data.date ? new Date(data.date) : null;
            
            if (transactionDate && transactionDate >= todayStart && transactionDate < todayEnd) {
              todayCount++;
            }
          });
          setTotalTransactionsToday(todayCount);
        } catch (error) {
          console.error("Error fetching transactions today:", error);
        }

        // 6. Total Manual Top-ups Today
        try {
          const manualTopUpRef = collection(db, "manual_topup");
          const manualTopUpSnapshot = await getDocs(manualTopUpRef);
          
          let todayCount = 0;
          manualTopUpSnapshot.forEach((doc) => {
            const data = doc.data();
            const topUpDate = data.requestedAt?.toDate ? data.requestedAt.toDate() : 
                            data.createdAt?.toDate ? data.createdAt.toDate() : 
                            data.timestamp?.toDate ? data.timestamp.toDate() : 
                            data.date ? new Date(data.date) : null;
            
            if (topUpDate && topUpDate >= todayStart && topUpDate < todayEnd) {
              todayCount++;
            }
          });
          setTotalManualTopUpsToday(todayCount);
        } catch (error) {
          console.error("Error fetching manual top-ups today:", error);
        }

        // Ensure minimum 0.65 second loading time
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 650;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } catch (error) {
        console.error("Error fetching summary metrics:", error);
        
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 650;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } finally {
        setSummaryLoading(false);
        setHasLoadedSummary(true);
      }
    };

    fetchSummaryMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Helper functions
  const formatDateLabel = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // Fetch static charts data (pie charts, revenue by payment method)
  useEffect(() => {
    const fetchStaticCharts = async () => {
      if (activeTab !== "charts") return;
      
      try {
        // 3. Top-up Requests Status (Pie Chart)
        try {
          const topUpRequestsRef = collection(db, "topup_requests");
          const topUpRequestsSnapshot = await getDocs(topUpRequestsRef);
          
          let pending = 0;
          let approved = 0;
          let rejected = 0;
          
          topUpRequestsSnapshot.forEach((doc) => {
            const status = (doc.data().status || "").toLowerCase();
            if (status === "pending") pending++;
            else if (status === "approved") approved++;
            else if (status === "rejected") rejected++;
          });
          
          setTopUpRequestsStatusData({
            labels: ["Pending", "Approved", "Rejected"],
            datasets: [{
              data: [pending, approved, rejected],
              borderWidth: 1,
              backgroundColor: [
                "#F59E0B", // Yellow for pending
                "#10B981", // Green for approved
                "#EF4444", // Red for rejected
              ],
              borderColor: "#ffffff",
            }],
          });
        } catch (error) {
          console.error("Error fetching top-up requests status:", error);
        }

        // 4. Transaction Types (Pie Chart) - REMOVED
        // try {
        //   const transactionsRef = collection(db, "transactions");
        //   const transactionsSnapshot = await getDocs(transactionsRef);
        //   
        //   let topUp = 0;
        //   let deducted = 0;
        //   let refund = 0;
        //   
        //   transactionsSnapshot.forEach((doc) => {
        //     const type = (doc.data().type || "").trim();
        //     if (type === "Top-up") topUp++;
        //     else if (type === "Deducted") deducted++;
        //     else if (type === "Refund" || type === "Refunded Minutes") refund++;
        //   });
        //   
        //   setTransactionTypesData({
        //     labels: ["Top-up", "Deducted", "Refund"],
        //     datasets: [{
        //       data: [topUp, deducted, refund],
        //       borderWidth: 1,
        //       backgroundColor: [
        //         "#3B82F6", // Blue for top-up
        //         "#EF4444", // Red for deducted
        //         "#10B981", // Green for refund
        //       ],
        //       borderColor: "#ffffff",
        //     }],
        //   });
        // } catch (error) {
        //   console.error("Error fetching transaction types:", error);
        // }

        // 6. Revenue by Payment Method (Bar Chart)
        try {
          const topUpRequestsRef = collection(db, "topup_requests");
          const transactionsRef = collection(db, "transactions");
          const manualTopUpRef = collection(db, "manual_topup");
          
          const [topUpRequestsSnapshot, transactionsSnapshot, manualTopUpSnapshot] = await Promise.all([
            getDocs(topUpRequestsRef),
            getDocs(transactionsRef),
            getDocs(manualTopUpRef),
          ]);
          
          const revenueByMethod = {
            "Cash": 0,
            "GCash": 0,
            "Maya": 0,
            "Maribank": 0,
            "GoTyme": 0,
          };
          
          // Helper function to normalize payment method
          const normalizePaymentMethod = (method) => {
            if (!method) return "Cash";
            const normalized = method.trim();
            // Handle case variations
            if (normalized.toLowerCase() === "gcash" || normalized === "Gcash") return "GCash";
            if (normalized.toLowerCase() === "cash") return "Cash";
            if (normalized.toLowerCase() === "maya") return "Maya";
            if (normalized.toLowerCase() === "maribank") return "Maribank";
            if (normalized.toLowerCase() === "gotyme") return "GoTyme";
            // If it doesn't match any known method, default to Cash
            return "Cash";
          };
          
          // From topup_requests (approved)
          topUpRequestsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === "approved") {
              const method = normalizePaymentMethod(data.paymentMethod);
              revenueByMethod[method] += Number(data.amount) || 0;
            }
          });
          
          // From transactions (Top-up type)
          transactionsSnapshot.forEach((doc) => {
            const data = doc.data();
            const type = (data.type || "").trim();
            if (type === "Top-up") {
              const method = normalizePaymentMethod(data.paymentMethod);
              revenueByMethod[method] += Number(data.amount) || 0;
            }
          });
          
          // From manual_topup
          manualTopUpSnapshot.forEach((doc) => {
            const data = doc.data();
            const method = normalizePaymentMethod(data.paymentMethod);
            revenueByMethod[method] += Number(data.amount) || 0;
          });
          
          setRevenueByPaymentMethodData({
            labels: Object.keys(revenueByMethod),
            datasets: [{
              label: "Revenue",
              data: Object.values(revenueByMethod),
              borderWidth: 1,
              backgroundColor: [
                "#3B82F6", // Blue
                "#10B981", // Green
                "#F59E0B", // Yellow/Orange
                "#8B5CF6", // Purple
                "#EF4444", // Red
              ],
              borderColor: "#ffffff",
            }],
          });
        } catch (error) {
          console.error("Error fetching revenue by payment method:", error);
        }
      } catch (error) {
        console.error("Error fetching static charts:", error);
      }
    };

    fetchStaticCharts();
  }, [activeTab]);

  // Fetch revenue trend chart (depends on revenueTrendPeriod)
  useEffect(() => {
    const fetchRevenueTrend = async () => {
      if (activeTab !== "charts") return;
      
      try {
        const now = new Date();
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        
        const start = new Date(now);
        start.setDate(start.getDate() - (revenueTrendPeriod - 1)); // Subtract (period - 1) to include today
        start.setHours(0, 0, 0, 0);
        
        const transactionsRef = collection(db, "transactions");
        const transactionsSnapshot = await getDocs(transactionsRef);
        
        const revenueByDate = {};
        
        // Initialize all dates in range with 0 (including today)
        for (let i = 0; i < revenueTrendPeriod; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          revenueByDate[getDateKey(date)] = 0;
        }
        
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          const transactionDate = data.timestamp?.toDate ? data.timestamp.toDate() : 
                                data.createdAt?.toDate ? data.createdAt.toDate() : 
                                data.date ? new Date(data.date) : null;
          
          if (transactionDate) {
            const normalizedDate = normalizeDate(transactionDate);
            const normalizedStart = normalizeDate(start);
            const normalizedEnd = normalizeDate(todayEnd);
            
            if (normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd) {
              const type = (data.type || "").trim();
              if (type === "Top-up" || type === "Deducted") {
                const dateKey = getDateKey(transactionDate);
                if (revenueByDate[dateKey] !== undefined) {
                  revenueByDate[dateKey] += Number(data.amount) || 0;
                }
              }
            }
          }
        });
        
        const labels = [];
        const data = [];
        for (let i = 0; i < revenueTrendPeriod; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          labels.push(formatDateLabel(date));
          data.push(revenueByDate[getDateKey(date)] || 0);
        }
        
        setRevenueTrendData({
          labels,
          datasets: [{
            label: "Revenue",
            data,
            borderWidth: 2,
            tension: 0.3,
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          }],
        });
      } catch (error) {
        console.error("Error fetching revenue trend:", error);
      }
    };

    fetchRevenueTrend();
  }, [activeTab, revenueTrendPeriod]);

  // Fetch user registrations chart (depends on userRegistrationsPeriod)
  useEffect(() => {
    const fetchUserRegistrations = async () => {
      if (activeTab !== "charts") return;
      
      try {
        const now = new Date();
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        
        const start = new Date(now);
        start.setDate(start.getDate() - (userRegistrationsPeriod - 1)); // Subtract (period - 1) to include today
        start.setHours(0, 0, 0, 0);
        
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const registrationsByDate = {};
        
        // Initialize all dates in range with 0 (including today)
        for (let i = 0; i < userRegistrationsPeriod; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          registrationsByDate[getDateKey(date)] = 0;
        }
        
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          const registrationDate = data.createdAt?.toDate ? data.createdAt.toDate() : 
                                  data.registeredAt?.toDate ? data.registeredAt.toDate() : 
                                  data.timestamp?.toDate ? data.timestamp.toDate() : 
                                  data.date ? new Date(data.date) : null;
          
          if (registrationDate) {
            const normalizedDate = normalizeDate(registrationDate);
            const normalizedStart = normalizeDate(start);
            const normalizedEnd = normalizeDate(todayEnd);
            
            if (normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd) {
              const dateKey = getDateKey(registrationDate);
              if (registrationsByDate[dateKey] !== undefined) {
                registrationsByDate[dateKey]++;
              }
            }
          }
        });
        
        const labels = [];
        const data = [];
        for (let i = 0; i < userRegistrationsPeriod; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          labels.push(formatDateLabel(date));
          data.push(registrationsByDate[getDateKey(date)] || 0);
        }
        
        setUserRegistrationsData({
          labels,
          datasets: [{
            label: "New Users",
            data,
            borderWidth: 1,
            backgroundColor: "#10B981",
            borderColor: "#059669",
          }],
        });
      } catch (error) {
        console.error("Error fetching user registrations:", error);
      }
    };

    fetchUserRegistrations();
  }, [activeTab, userRegistrationsPeriod]);

  // Fetch session activity chart (static, no period toggle)
  useEffect(() => {
    const fetchSessionActivity = async () => {
      if (activeTab !== "charts") return;
      
      try {
        const now = new Date();
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        
        const start = new Date(now);
        start.setDate(start.getDate() - 6); // Subtract 6 to include today (7 days total: today + 6 previous days)
        start.setHours(0, 0, 0, 0);
        
        const sessionHistoryRef = collection(db, "session_history");
        const sessionHistorySnapshot = await getDocs(sessionHistoryRef);
        
        const sessionsByDate = {};
        
        // Initialize all dates in range with 0 (including today)
        for (let i = 0; i < 7; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          sessionsByDate[getDateKey(date)] = 0;
        }
        
        sessionHistorySnapshot.forEach((doc) => {
          const data = doc.data();
          // Check for sessionStartTime first (the actual field name in Firestore)
          const sessionDate = data.sessionStartTime?.toDate ? data.sessionStartTime.toDate() : 
                            data.startTime?.toDate ? data.startTime.toDate() : 
                            data.createdAt?.toDate ? data.createdAt.toDate() : 
                            data.timestamp?.toDate ? data.timestamp.toDate() : 
                            data.date ? new Date(data.date) : null;
          
          if (sessionDate) {
            const normalizedDate = normalizeDate(sessionDate);
            const normalizedStart = normalizeDate(start);
            const normalizedEnd = normalizeDate(todayEnd);
            
            if (normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd) {
              const dateKey = getDateKey(sessionDate);
              if (sessionsByDate[dateKey] !== undefined) {
                sessionsByDate[dateKey]++;
              }
            }
          }
        });
        
        const labels = [];
        const data = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          labels.push(formatDateLabel(date));
          data.push(sessionsByDate[getDateKey(date)] || 0);
        }
        
        setSessionActivityData({
          labels,
          datasets: [{
            label: "Active Sessions",
            data,
            borderWidth: 2,
            tension: 0.3,
            borderColor: "#8B5CF6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
          }],
        });
      } catch (error) {
        console.error("Error fetching session activity:", error);
        // If session_history doesn't exist, create empty data
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 6); // Subtract 6 to include today (7 days total)
        start.setHours(0, 0, 0, 0);
        
        const labels = [];
        const data = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          labels.push(formatDateLabel(date));
          data.push(0);
        }
        setSessionActivityData({
          labels,
          datasets: [{
            label: "Active Sessions",
            data,
            borderWidth: 2,
            tension: 0.3,
            borderColor: "#8B5CF6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
          }],
        });
      }
    };

    fetchSessionActivity();
  }, [activeTab]);

  // Fetch recent activity data
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (activeTab !== "recent") return;
      
      try {
        setRecentActivityLoading(true);
        
        // 1. Recent Transactions (last 10)
        try {
          const transactionsRef = collection(db, "transactions");
          const transactionsSnapshot = await getDocs(transactionsRef);
          
          const transactions = [];
          const userCache = {};
          
          for (const docSnap of transactionsSnapshot.docs) {
            const data = docSnap.data();
            const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : 
                            data.createdAt?.toDate ? data.createdAt.toDate() : 
                            data.date ? new Date(data.date) : new Date();
            
            let userName = "Unknown User";
            const userId = data.userId || "";
            
            if (userId) {
              if (userCache[userId]) {
                userName = userCache[userId];
              } else {
                try {
                  const userDocRef = doc(db, "users", userId);
                  const userDocSnap = await getDoc(userDocRef);
                  if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    userName = userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown User";
                    userCache[userId] = userName;
                  }
                } catch (error) {
                  console.error("Error fetching user:", error);
                }
              }
            }
            
            transactions.push({
              id: docSnap.id,
              transactionId: docSnap.id,
              userName,
              amount: data.amount || 0,
              type: (data.type || "").trim(),
              date: timestamp,
            });
          }
          
          // Sort by date (newest first) and take last 10
          transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
          setRecentTransactions(transactions.slice(0, 10));
        } catch (error) {
          console.error("Error fetching recent transactions:", error);
        }
        
        // 2. Recent Top-up Requests (last 10 pending)
        try {
          const topUpRequestsRef = collection(db, "topup_requests");
          const pendingQuery = query(topUpRequestsRef, where("status", "==", "pending"));
          const pendingSnapshot = await getDocs(pendingQuery);
          
          const requests = [];
          pendingSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const date = data.requestedAt?.toDate ? data.requestedAt.toDate() : 
                        data.createdAt?.toDate ? data.createdAt.toDate() : 
                        data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
            
            requests.push({
              id: docSnap.id,
              name: data.userName || data.name || "Unknown User",
              amount: data.amount || 0,
              paymentMethod: data.paymentMethod || "Cash",
              date,
            });
          });
          
          // Sort by date (newest first) and take last 10
          requests.sort((a, b) => b.date.getTime() - a.date.getTime());
          setRecentTopUpRequests(requests.slice(0, 10));
        } catch (error) {
          console.error("Error fetching recent top-up requests:", error);
          // Fallback: get all and filter client-side
          const topUpRequestsRef = collection(db, "topup_requests");
          const allSnapshot = await getDocs(topUpRequestsRef);
          const requests = [];
          allSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.status === "pending") {
              const date = data.requestedAt?.toDate ? data.requestedAt.toDate() : 
                          data.createdAt?.toDate ? data.createdAt.toDate() : 
                          data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
              
              requests.push({
                id: docSnap.id,
                name: data.userName || data.name || "Unknown User",
                amount: data.amount || 0,
                paymentMethod: data.paymentMethod || "Cash",
                date,
              });
            }
          });
          requests.sort((a, b) => b.date.getTime() - a.date.getTime());
          setRecentTopUpRequests(requests.slice(0, 10));
        }
        
        // 3. Recent Sessions (last 10)
        try {
          const sessionHistoryRef = collection(db, "session_history");
          const sessionHistorySnapshot = await getDocs(sessionHistoryRef);
          
          const sessions = [];
          const userCache = {};
          
          for (const docSnap of sessionHistorySnapshot.docs) {
            const data = docSnap.data();
            const startTime = data.sessionStartTime?.toDate ? data.sessionStartTime.toDate() : 
                            data.startTime?.toDate ? data.startTime.toDate() : 
                            data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            const endTime = data.sessionEndTime?.toDate ? data.sessionEndTime.toDate() : 
                          data.endTime?.toDate ? data.endTime.toDate() : null;
            
            const durationSeconds = data.durationSeconds || 
                                  (endTime ? Math.floor((endTime - startTime) / 1000) : 0);
            
            let userName = "Unknown User";
            const userId = data.userId;
            
            if (userId) {
              if (userCache[userId]) {
                userName = userCache[userId];
              } else {
                try {
                  const userDocRef = doc(db, "users", userId);
                  const userDocSnap = await getDoc(userDocRef);
                  if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    userName = userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || data.userName || "Unknown User";
                    userCache[userId] = userName;
                  } else if (data.userName) {
                    userName = data.userName;
                    userCache[userId] = userName;
                  }
                } catch (error) {
                  console.error("Error fetching user:", error);
                  if (data.userName) {
                    userName = data.userName;
                  }
                }
              }
            } else if (data.userName) {
              userName = data.userName;
            }
            
            sessions.push({
              id: docSnap.id,
              userName,
              durationSeconds,
              startTime,
              endTime: endTime || null,
            });
          }
          
          // Sort by start time (newest first) and take last 10
          sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
          setRecentSessions(sessions.slice(0, 10));
        } catch (error) {
          console.error("Error fetching recent sessions:", error);
        }
        
        // 4. Recent Users (last 10 registered)
        try {
          const usersRef = collection(db, "users");
          const usersSnapshot = await getDocs(usersRef);
          
          const users = [];
          usersSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.isRegistered) {
              const registrationDate = data.createdAt?.toDate ? data.createdAt.toDate() : 
                                     data.registeredAt?.toDate ? data.registeredAt.toDate() : 
                                     data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
              
              users.push({
                id: docSnap.id,
                name: data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown User",
                rfid: docSnap.id,
                registrationDate,
              });
            }
          });
          
          // Sort by registration date (newest first) and take last 10
          users.sort((a, b) => b.registrationDate.getTime() - a.registrationDate.getTime());
          setRecentUsers(users.slice(0, 10));
        } catch (error) {
          console.error("Error fetching recent users:", error);
        }
        
        setRecentActivityLoading(false);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        setRecentActivityLoading(false);
      }
    };
    
    fetchRecentActivity();
  }, [activeTab]);

  // Fetch insights data
  useEffect(() => {
    const fetchInsights = async () => {
      if (activeTab !== "insights") return;
      
      try {
        setInsightsLoading(true);
        
        // 1. Average Session Duration
        try {
          const sessionHistoryRef = collection(db, "session_history");
          const sessionHistorySnapshot = await getDocs(sessionHistoryRef);
          
          let totalDuration = 0;
          let sessionCount = 0;
          
          sessionHistorySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const duration = data.durationSeconds || 0;
            if (duration > 0) {
              totalDuration += duration;
              sessionCount++;
            }
          });
          
          const average = sessionCount > 0 ? Math.round(totalDuration / sessionCount) : 0;
          setAverageSessionDuration(average);
        } catch (error) {
          console.error("Error fetching average session duration:", error);
        }
        
        // 2. Most Active Users (Top 5 by total session time)
        try {
          const sessionHistoryRef = collection(db, "session_history");
          const sessionHistorySnapshot = await getDocs(sessionHistoryRef);
          
          const userSessionTime = {};
          const userCache = {};
          
          sessionHistorySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const userId = data.userId || "";
            const duration = data.durationSeconds || 0;
            
            if (userId && duration > 0) {
              if (!userSessionTime[userId]) {
                userSessionTime[userId] = 0;
              }
              userSessionTime[userId] += duration;
              
              // Cache user name
              if (!userCache[userId] && data.userName) {
                userCache[userId] = data.userName;
              }
            }
          });
          
          // Fetch user names for users not in cache
          for (const userId of Object.keys(userSessionTime)) {
            if (!userCache[userId]) {
              try {
                const userDocRef = doc(db, "users", userId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  const userData = userDocSnap.data();
                  userCache[userId] = userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown User";
                } else {
                  userCache[userId] = "Unknown User";
                }
              } catch (error) {
                console.error("Error fetching user:", error);
                userCache[userId] = "Unknown User";
              }
            }
          }
          
          // Convert to array and sort
          const activeUsers = Object.keys(userSessionTime).map(userId => ({
            userId,
            userName: userCache[userId] || "Unknown User",
            totalDuration: userSessionTime[userId],
          }));
          
          activeUsers.sort((a, b) => b.totalDuration - a.totalDuration);
          setMostActiveUsers(activeUsers.slice(0, 5));
        } catch (error) {
          console.error("Error fetching most active users:", error);
        }
        
        // 3. Peak Usage Hours (Hourly breakdown)
        try {
          const sessionHistoryRef = collection(db, "session_history");
          const sessionHistorySnapshot = await getDocs(sessionHistoryRef);
          
          const hourlyCount = {};
          
          // Initialize all 24 hours with 0
          for (let i = 0; i < 24; i++) {
            hourlyCount[i] = 0;
          }
          
          sessionHistorySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const startTime = data.sessionStartTime?.toDate ? data.sessionStartTime.toDate() : 
                            data.startTime?.toDate ? data.startTime.toDate() : 
                            data.createdAt?.toDate ? data.createdAt.toDate() : null;
            
            if (startTime) {
              const hour = startTime.getHours();
              hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
            }
          });
          
          // Format labels and data
          const labels = [];
          const data = [];
          for (let i = 0; i < 24; i++) {
            const hour12 = i % 12 || 12;
            const ampm = i >= 12 ? 'PM' : 'AM';
            labels.push(`${hour12}${ampm}`);
            data.push(hourlyCount[i] || 0);
          }
          
          setPeakUsageHours({
            labels,
            datasets: [{
              label: "Sessions",
              data,
              borderWidth: 2,
              tension: 0.3,
              borderColor: "#8B5CF6",
              backgroundColor: "rgba(139, 92, 246, 0.1)",
            }],
          });
        } catch (error) {
          console.error("Error fetching peak usage hours:", error);
        }
        
        // 4. Revenue Breakdown (Manual vs App top-ups)
        try {
          const manualTopUpRef = collection(db, "manual_topup");
          const topUpRequestsRef = collection(db, "topup_requests");
          
          const [manualTopUpSnapshot, topUpRequestsSnapshot] = await Promise.all([
            getDocs(manualTopUpRef),
            getDocs(topUpRequestsRef),
          ]);
          
          let manualRevenue = 0;
          let appRevenue = 0;
          
          // Manual top-ups
          manualTopUpSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            manualRevenue += Number(data.amount) || 0;
          });
          
          // App top-ups (approved requests)
          topUpRequestsSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.status === "approved") {
              appRevenue += Number(data.amount) || 0;
            }
          });
          
          setRevenueBreakdown({
            labels: ["Manual Top-ups", "App Top-ups"],
            datasets: [{
              data: [manualRevenue, appRevenue],
              borderWidth: 1,
              backgroundColor: [
                "#3B82F6", // Blue for manual
                "#10B981", // Green for app
              ],
              borderColor: "#ffffff",
            }],
          });
        } catch (error) {
          console.error("Error fetching revenue breakdown:", error);
        }
        
        setInsightsLoading(false);
      } catch (error) {
        console.error("Error fetching insights:", error);
        setInsightsLoading(false);
      }
    };
    
    fetchInsights();
  }, [activeTab]);
  
  // Helper function to format date time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${month}/${day}/${year} ${String(displayHours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };
  
  // Helper function to format duration
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "0s";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };


  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Header Card Skeleton */}
      <div className="flex relative rounded-2xl overflow-hidden text-white animate-pulse bg-gradient-to-r from-green-500 via-green-400 to-green-500">
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="h-9 sm:h-10 w-32 rounded bg-green-600/50"></div>
          <div className="h-4 sm:h-5 w-40 rounded bg-green-600/50"></div>
        </div>
        <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-3 bg-green-600/40">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-700/50"></div>
        </div>
      </div>

      {activeTab === "summary" && (
        /* Summary Cards Skeleton */
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-span-2 xl:col-span-1 flex relative rounded-2xl p-5 animate-pulse bg-gray-200">
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-8 w-16 bg-gray-300 rounded"></div>
                <div className="h-4 w-32 bg-gray-300 rounded"></div>
                <div className="h-3 w-24 bg-gray-300 rounded"></div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-3 bg-gray-300">
                <div className="w-6 h-6 rounded-full bg-gray-400"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "charts" && (
        /* Charts Skeleton */
        <div className="flex flex-col gap-4">
          {/* Chart skeletons */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-4 sm:p-5 rounded-2xl border border-gray-300 animate-pulse">
              <div className="h-5 w-40 bg-gray-200 rounded"></div>
              <div className="w-full h-64 xl:h-72 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-dvh flex flex-col lg:flex-row text-sm sm:text-base relative overflow-hidden">
      <AdminNavbar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <AdminDesktopNavbar />

        <div className="flex flex-col xl:flex-row px-3 py-3 sm:py-4 sm:p-4 md:p-5 gap-3 sm:gap-4 xl:gap-5">
          {/* Tabs Container - Horizontal scroll on mobile, vertical on desktop */}
          <div className="flex xl:flex-col xl:w-72 gap-2 overflow-x-auto xl:overflow-x-visible scrollbar-hide xl:scrollbar-default scroll-smooth pb-1 xl:pb-0">
            <div className="flex xl:flex-col items-center gap-2 min-w-max xl:min-w-0">
              <button
                onClick={() => setActiveTab("summary")}
                className={`rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150 flex-shrink-0 xl:w-full ${
                  activeTab === "summary"
                    ? "border border-green-500 bg-green-500 text-white"
                    : "border border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab("charts")}
                className={`rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150 flex-shrink-0 xl:w-full ${
                  activeTab === "charts"
                    ? "border border-green-500 bg-green-500 text-white"
                    : "border border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
              >
                Charts
              </button>
              <button
                onClick={() => setActiveTab("recent")}
                className={`rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150 flex-shrink-0 xl:w-full ${
                  activeTab === "recent"
                    ? "border border-green-500 bg-green-500 text-white"
                    : "border border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
              >
                Recent Activity
              </button>
              <button
                onClick={() => setActiveTab("insights")}
                className={`rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150 flex-shrink-0 xl:w-full ${
                  activeTab === "insights"
                    ? "border border-green-500 bg-green-500 text-white"
                    : "border border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
              >
                Insights
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col xl:flex-1 gap-4 relative">
            {/* Skeleton Loader with fade transition - Only for summary tab on initial load */}
            {activeTab === "summary" && (
              <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${
                summaryLoading ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}>
                <SkeletonLoader />
              </div>
            )}
            
            {/* Content with fade transition */}
            <div className={`transition-opacity duration-500 ${
              (activeTab === "summary" && summaryLoading) ? "opacity-0" : "opacity-100"
            }`}>
              {/* Dashboard Header Card */}
              <div className="flex relative rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 via-green-400 to-green-500 p-4 sm:p-5 text-white shadow-lg">
                <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
                    Dashboard
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm xl:text-base font-semibold text-white/90">
                      System Overview
                    </span>
                  </div>
                </div>
                <div className="absolute top-1/2 right-3 sm:right-4 -translate-y-1/2 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-lg">
                  <WifiHigh className="size-5 sm:size-6 xl:size-7" />
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "summary" && (
                <>
                  {/* Summary Cards Section */}
                  <div className="flex flex-col gap-3 sm:gap-4 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">
                        Summary Cards
                      </span>
                    </div>

                    {/* Summary Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {/* Total Registered Users */}
                      <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex relative rounded-2xl bg-gradient-to-r from-green-500 via-green-400 to-green-500 p-4 sm:p-5 text-white shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
                          <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
                            {totalRegisteredUsers}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm xl:text-base font-semibold text-white">
                              Registered Users
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-100/90">
                              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 rounded-full p-2 sm:p-2.5 bg-green-600/40 shadow-lg">
                          <Users className="size-5 sm:size-6 xl:size-7" />
                        </div>
                      </div>

                      {/* Total Revenue Today */}
                      <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex relative rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 p-4 sm:p-5 text-white shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
                          <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
                            ₱{totalRevenueToday.toFixed(2)}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm xl:text-base font-semibold text-white">
                              Revenue Today
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-100/90">
                              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 rounded-full p-2 sm:p-2.5 bg-blue-600/40 shadow-lg">
                          <DollarSign className="size-5 sm:size-6 xl:size-7" />
                        </div>
                      </div>

                      {/* Pending Top-up Requests */}
                      <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex relative rounded-2xl bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 p-4 sm:p-5 text-white shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
                          <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
                            {pendingTopUpRequests}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm xl:text-base font-semibold text-white">
                              Pending Requests
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-100/90">
                              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 rounded-full p-2 sm:p-2.5 bg-yellow-600/40 shadow-lg">
                          <BanknoteArrowUp className="size-5 sm:size-6 xl:size-7" />
                        </div>
                      </div>

                      {/* Active Sessions */}
                      <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex relative rounded-2xl bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 p-4 sm:p-5 text-white shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
                          <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
                            {activeSessions}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm xl:text-base font-semibold text-white">
                              Active Sessions
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-100/90">
                              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 rounded-full p-2 sm:p-2.5 bg-purple-600/40 shadow-lg">
                          <Wifi className="size-5 sm:size-6 xl:size-7" />
                        </div>
                      </div>

                      {/* Total Transactions Today */}
                      <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex relative rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-500 p-4 sm:p-5 text-white shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
                          <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
                            {totalTransactionsToday}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm xl:text-base font-semibold text-white">
                              Transactions Today
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-100/90">
                              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 rounded-full p-2 sm:p-2.5 bg-indigo-600/40 shadow-lg">
                          <ReceiptText className="size-5 sm:size-6 xl:size-7" />
                        </div>
                      </div>

                      {/* Total Manual Top-ups Today */}
                      <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex relative rounded-2xl bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 p-4 sm:p-5 text-white shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
                          <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
                            {totalManualTopUpsToday}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm xl:text-base font-semibold text-white">
                              Manual Top-ups Today
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-100/90">
                              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 rounded-full p-2 sm:p-2.5 bg-teal-600/40 shadow-lg">
                          <Clock className="size-5 sm:size-6 xl:size-7" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "charts" && (
                <>
                  {/* Charts Section */}
                  <div className="flex flex-col gap-3 sm:gap-4 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">
                        Charts & Visualizations
                      </span>
                    </div>

                    {/* Revenue Trend Chart */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <span className="text-sm sm:text-base font-semibold text-gray-700">Revenue Trend</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRevenueTrendPeriod(7)}
                            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                              revenueTrendPeriod === 7
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                            }`}
                          >
                            7 Days
                          </button>
                          <button
                            onClick={() => setRevenueTrendPeriod(30)}
                            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                              revenueTrendPeriod === 30
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                            }`}
                          >
                            30 Days
                          </button>
                        </div>
                      </div>
                      {revenueTrendData ? (
                        <div className="w-full h-56 sm:h-64 xl:h-72">
                          <Line
                            data={revenueTrendData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                x: { ticks: { color: "#555" } },
                                y: { ticks: { color: "#555" } },
                              },
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-56 sm:h-64 xl:h-72 flex flex-col items-center justify-center text-gray-400 gap-2">
                          <ArchiveX className="size-8 sm:size-10 text-gray-300" />
                          <span className="text-xs sm:text-sm">No data available</span>
                        </div>
                      )}
                    </div>

                    {/* User Registrations Chart */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <span className="text-sm sm:text-base font-semibold text-gray-700">User Registrations</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setUserRegistrationsPeriod(7)}
                            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                              userRegistrationsPeriod === 7
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                            }`}
                          >
                            7 Days
                          </button>
                          <button
                            onClick={() => setUserRegistrationsPeriod(30)}
                            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                              userRegistrationsPeriod === 30
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                            }`}
                          >
                            30 Days
                          </button>
                        </div>
                      </div>
                      {userRegistrationsData ? (
                        <div className="w-full h-56 sm:h-64 xl:h-72">
                          <Bar
                            data={userRegistrationsData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                x: { ticks: { color: "#555" } },
                                y: { ticks: { color: "#555" } },
                              },
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-56 sm:h-64 xl:h-72 flex flex-col items-center justify-center text-gray-400 gap-2">
                          <ArchiveX className="size-8 sm:size-10 text-gray-300" />
                          <span className="text-xs sm:text-sm">No data available</span>
                        </div>
                      )}
                    </div>

                    {/* Two Column Layout for Pie Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      {/* Top-up Requests Status */}
                      <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                        <span className="text-sm sm:text-base font-semibold text-gray-700">Top-up Requests Status</span>
                        {topUpRequestsStatusData ? (
                          <div className="w-full h-56 sm:h-64 xl:h-72">
                            <Pie
                              data={topUpRequestsStatusData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: "bottom",
                                    labels: { color: "#555" },
                                  },
                                },
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-56 sm:h-64 xl:h-72 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <ArchiveX className="size-8 sm:size-10 text-gray-300" />
                            <span className="text-xs sm:text-sm">No data available</span>
                          </div>
                        )}
                      </div>

                      {/* Transaction Types - REMOVED */}
                      {/* <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                        <span className="text-sm sm:text-base font-semibold text-gray-700">Transaction Types</span>
                        {transactionTypesData ? (
                          <div className="w-full h-56 sm:h-64 xl:h-72">
                            <Pie
                              data={transactionTypesData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: "bottom",
                                    labels: { color: "#555" },
                                  },
                                },
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-56 sm:h-64 xl:h-72 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <ArchiveX className="size-8 sm:size-10 text-gray-300" />
                            <span className="text-xs sm:text-sm">No data available</span>
                          </div>
                        )}
                      </div> */}
                    </div>

                    {/* Session Activity Chart */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Session Activity (Last 7 Days)</span>
                      {sessionActivityData ? (
                        <div className="w-full h-56 sm:h-64 xl:h-72">
                          <Line
                            data={sessionActivityData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                x: { ticks: { color: "#555" } },
                                y: { ticks: { color: "#555" } },
                              },
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-56 sm:h-64 xl:h-72 flex flex-col items-center justify-center text-gray-400 gap-2">
                          <ArchiveX className="size-8 sm:size-10 text-gray-300" />
                          <span className="text-xs sm:text-sm">No data available</span>
                        </div>
                      )}
                    </div>

                    {/* Revenue by Payment Method */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Revenue by Payment Method</span>
                      {revenueByPaymentMethodData ? (
                        <div className="w-full h-56 sm:h-64 xl:h-72">
                          <Bar
                            data={revenueByPaymentMethodData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                x: { ticks: { color: "#555" } },
                                y: { ticks: { color: "#555" } },
                              },
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-64 xl:h-72 flex items-center justify-center text-gray-400">
                          No data available
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "recent" && (
                <>
                  {/* Recent Activity Section */}
                  <div className="flex flex-col gap-3 sm:gap-4 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">
                        Recent Activity
                      </span>
                    </div>

                    {/* Recent Transactions */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Recent Transactions</span>
                      {recentActivityLoading ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : recentTransactions.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <ArchiveX className="size-10 sm:size-12 text-gray-300" />
                          <span className="text-xs sm:text-sm text-gray-500">No transactions available</span>
                        </div>
                      ) : (
                        <>
                          {/* Mobile View */}
                          <div className="flex xl:hidden flex-col gap-2 sm:gap-3">
                            {recentTransactions.map((tx) => (
                              <div key={tx.id} className="p-3 sm:p-4 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors duration-150 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs sm:text-sm text-gray-800">{tx.transactionId.substring(0, 12)}...</span>
                                  <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full font-medium ${
                                    tx.type === "Refund" ? "bg-green-100 text-green-700" :
                                    tx.type === "Deducted" ? "bg-red-100 text-red-700" :
                                    "bg-blue-100 text-blue-700"
                                  }`}>
                                    {tx.type}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-gray-600">
                                  <span><span className="font-medium">User:</span> {tx.userName}</span>
                                  <span><span className="font-medium">Amount:</span> ₱{tx.amount.toFixed(2)}</span>
                                  <span><span className="font-medium">Date:</span> {formatDateTime(tx.date)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop View */}
                          <div className="hidden xl:flex rounded-xl overflow-hidden border border-gray-300 w-full bg-white">
                            <div className="overflow-x-auto w-full">
                              <table className="w-full text-sm text-left min-w-full">
                                <thead className="border-b border-gray-300 bg-gray-50">
                                  <tr>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Transaction ID</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">User</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Amount</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Type</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800">{tx.transactionId}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800">{tx.userName}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800 font-medium">₱{tx.amount.toFixed(2)}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${
                                          tx.type === "Refund" ? "bg-green-100 text-green-700" :
                                          tx.type === "Deducted" ? "bg-red-100 text-red-700" :
                                          "bg-blue-100 text-blue-700"
                                        }`}>
                                          {tx.type}
                                        </span>
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-600">{formatDateTime(tx.date)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Recent Top-up Requests */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Recent Top-up Requests (Pending)</span>
                      {recentActivityLoading ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : recentTopUpRequests.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <ArchiveX className="size-10 sm:size-12 text-gray-300" />
                          <span className="text-xs sm:text-sm text-gray-500">No pending requests available</span>
                        </div>
                      ) : (
                        <>
                          {/* Mobile View */}
                          <div className="flex xl:hidden flex-col gap-2 sm:gap-3">
                            {recentTopUpRequests.map((req) => (
                              <div key={req.id} className="p-3 sm:p-4 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors duration-150 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs sm:text-sm text-gray-800">{req.name}</span>
                                  <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                                    {req.paymentMethod}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-gray-600">
                                  <span><span className="font-medium">Amount:</span> ₱{req.amount.toFixed(2)}</span>
                                  <span><span className="font-medium">Date:</span> {formatDateTime(req.date)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop View */}
                          <div className="hidden xl:flex rounded-xl overflow-hidden border border-gray-300 w-full bg-white">
                            <div className="overflow-x-auto w-full">
                              <table className="w-full text-sm text-left min-w-full">
                                <thead className="border-b border-gray-300 bg-gray-50">
                                  <tr>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Name</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Amount</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Payment Method</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recentTopUpRequests.map((req) => (
                                    <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800">{req.name}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800 font-medium">₱{req.amount.toFixed(2)}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800">{req.paymentMethod}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-600">{formatDateTime(req.date)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Recent Sessions */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Recent Sessions</span>
                      {recentActivityLoading ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : recentSessions.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <ArchiveX className="size-10 sm:size-12 text-gray-300" />
                          <span className="text-xs sm:text-sm text-gray-500">No sessions available</span>
                        </div>
                      ) : (
                        <>
                          {/* Mobile View */}
                          <div className="flex xl:hidden flex-col gap-2 sm:gap-3">
                            {recentSessions.map((session) => (
                              <div key={session.id} className="p-3 sm:p-4 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors duration-150 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs sm:text-sm text-gray-800">{session.userName}</span>
                                  <span className="text-[10px] sm:text-xs text-gray-600 font-medium">{formatDuration(session.durationSeconds)}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-gray-600">
                                  <span><span className="font-medium">Start:</span> {formatDateTime(session.startTime)}</span>
                                  {session.endTime && <span><span className="font-medium">End:</span> {formatDateTime(session.endTime)}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop View */}
                          <div className="hidden xl:flex rounded-xl overflow-hidden border border-gray-300 w-full bg-white">
                            <div className="overflow-x-auto w-full">
                              <table className="w-full text-sm text-left min-w-full">
                                <thead className="border-b border-gray-300 bg-gray-50">
                                  <tr>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">User</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Duration</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Start Time</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">End Time</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recentSessions.map((session) => (
                                    <tr key={session.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800">{session.userName}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800 font-medium">{formatDuration(session.durationSeconds)}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-600">{formatDateTime(session.startTime)}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-600">{session.endTime ? formatDateTime(session.endTime) : "N/A"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Recent Users */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Recent Users</span>
                      {recentActivityLoading ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : recentUsers.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <ArchiveX className="size-10 sm:size-12 text-gray-300" />
                          <span className="text-xs sm:text-sm text-gray-500">No users available</span>
                        </div>
                      ) : (
                        <>
                          {/* Mobile View */}
                          <div className="flex xl:hidden flex-col gap-2 sm:gap-3">
                            {recentUsers.map((user) => (
                              <div key={user.id} className="p-3 sm:p-4 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors duration-150 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs sm:text-sm text-gray-800">{user.name}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-gray-600">
                                  <span><span className="font-medium">RFID:</span> {user.rfid}</span>
                                  <span><span className="font-medium">Registered:</span> {formatDateTime(user.registrationDate)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop View */}
                          <div className="hidden xl:flex rounded-xl overflow-hidden border border-gray-300 w-full bg-white">
                            <div className="overflow-x-auto w-full">
                              <table className="w-full text-sm text-left min-w-full">
                                <thead className="border-b border-gray-300 bg-gray-50">
                                  <tr>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Name</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">RFID</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Registration Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recentUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800">{user.name}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800 font-mono text-xs">{user.rfid}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-600">{formatDateTime(user.registrationDate)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "insights" && (
                <>
                  {/* Insights Section */}
                  <div className="flex flex-col gap-3 sm:gap-4 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">
                        Additional Insights
                      </span>
                    </div>

                    {/* Average Session Duration */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Average Session Duration</span>
                      {insightsLoading ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4">
                          <div className="flex items-center justify-center p-3 sm:p-4 rounded-full bg-purple-100 shadow-sm">
                            <Clock className="size-5 sm:size-6 xl:size-7 text-purple-600" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xl sm:text-2xl xl:text-3xl font-bold text-gray-800">
                              {formatDuration(averageSessionDuration)}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500">
                              Average time per session
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Most Active Users */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Most Active Users (Top 5)</span>
                      {insightsLoading ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : mostActiveUsers.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <ArchiveX className="size-10 sm:size-12 text-gray-300" />
                          <span className="text-xs sm:text-sm text-gray-500">No active users available</span>
                        </div>
                      ) : (
                        <>
                          {/* Mobile View */}
                          <div className="flex xl:hidden flex-col gap-2 sm:gap-3">
                            {mostActiveUsers.map((user, index) => (
                              <div key={user.userId} className="p-3 sm:p-4 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors duration-150 flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 text-green-700 font-bold text-xs sm:text-sm shadow-sm">
                                    {index + 1}
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-xs sm:text-sm text-gray-800">{user.userName}</span>
                                    <span className="text-[10px] sm:text-xs text-gray-600">{formatDuration(user.totalDuration)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop View */}
                          <div className="hidden xl:flex rounded-xl overflow-hidden border border-gray-300 w-full bg-white">
                            <div className="overflow-x-auto w-full">
                              <table className="w-full text-sm text-left min-w-full">
                                <thead className="border-b border-gray-300 bg-gray-50">
                                  <tr>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Rank</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">User</th>
                                    <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Total Session Time</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {mostActiveUsers.map((user, index) => (
                                    <tr key={user.userId} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                                      <td className="px-4 xl:px-6 py-3 sm:py-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm shadow-sm">
                                          {index + 1}
                                        </div>
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800">{user.userName}</td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800 font-medium">{formatDuration(user.totalDuration)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Peak Usage Hours */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Peak Usage Hours</span>
                      {insightsLoading ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : peakUsageHours ? (
                        <div className="w-full h-56 sm:h-64 xl:h-72">
                          <Line
                            data={peakUsageHours}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                x: { ticks: { color: "#555" } },
                                y: { ticks: { color: "#555" } },
                              },
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-56 sm:h-64 xl:h-72 flex flex-col items-center justify-center text-gray-400 gap-2">
                          <ArchiveX className="size-8 sm:size-10 text-gray-300" />
                          <span className="text-xs sm:text-sm">No data available</span>
                        </div>
                      )}
                    </div>

                    {/* Revenue Breakdown */}
                    <div className="flex flex-col gap-2 p-3 sm:p-4 xl:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">Revenue Breakdown</span>
                      {insightsLoading ? (
                        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : revenueBreakdown ? (
                        <div className="w-full h-56 sm:h-64 xl:h-72">
                          <Pie
                            data={revenueBreakdown}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: "bottom",
                                  labels: { color: "#555", font: { size: 12 } },
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const label = context.label || '';
                                      const value = context.parsed || 0;
                                      return `${label}: ₱${value.toFixed(2)}`;
                                    }
                                  }
                                }
                              },
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-56 sm:h-64 xl:h-72 flex flex-col items-center justify-center text-gray-400 gap-2">
                          <ArchiveX className="size-8 sm:size-10 text-gray-300" />
                          <span className="text-xs sm:text-sm">No data available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
