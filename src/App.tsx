import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import AdminSignIn from "./pages/AuthPages/AdminSignIn";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import PwezaDashboard from "./pages/Dashboard/PwezaDashboard";
import TipstersList from "./pages/Tipsters/TipstersList";
import TipsterApprovals from "./pages/Tipsters/TipsterApprovals";
import PredictionsList from "./pages/Predictions/PredictionsList";
import SubscriptionsList from "./pages/Subscriptions/SubscriptionsList";
import CustomersList from "./pages/Customers/CustomersList";
import BookersList from "./pages/Bookers/BookersList";
import NotificationsList from "./pages/Notifications/NotificationsList";
import AdminUsersList from "./pages/AdminUsers/AdminUsersList";
import CommissionList from "./pages/Commission/CommissionList";
import WithdrawalsList from "./pages/Withdrawals/WithdrawalsList";
import WithdrawalStats from "./pages/Withdrawals/WithdrawalStats";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Admin Auth - Root Route */}
          <Route index path="/" element={<AdminSignIn />} />

          {/* Protected Admin Dashboard Layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<PwezaDashboard />} />
            
                      {/* Pweza Admin Pages */}
          <Route path="/tipsters" element={<TipstersList />} />
          <Route path="/tipster-approvals" element={<TipsterApprovals />} />
          <Route path="/predictions" element={<PredictionsList />} />
          <Route path="/subscriptions" element={<SubscriptionsList />} />
          <Route path="/customers" element={<CustomersList />} />
          <Route path="/bookers" element={<BookersList />} />
          <Route path="/notifications" element={<NotificationsList />} />
          <Route path="/admin-users" element={<AdminUsersList />} />
          <Route path="/commission" element={<CommissionList />} />
          <Route path="/withdrawals" element={<WithdrawalsList />} />
          <Route path="/withdrawal-stats" element={<WithdrawalStats />} />

            {/* Legacy Pages */}
            <Route path="/legacy-home" element={<Home />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Public Auth Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
