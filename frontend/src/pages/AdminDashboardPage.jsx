import { useState, useEffect, useCallback } from "react";
import { Box, Stack, Typography, Avatar, IconButton, Badge, Button, CircularProgress, Chip, Paper, InputBase, TextField, Alert } from "@mui/material";
import {
  Search,
  NotificationsNone,
  DashboardOutlined,
  PeopleAltOutlined,
  MedicalServicesOutlined,
  FactCheckOutlined,
  SettingsOutlined,
  HistoryOutlined,
  Spa,
  CheckCircle,
  Cancel,
  PendingActionsRounded,
  DescriptionOutlined,
  OpenInNewRounded,
  Close,
  Check,
  Star,
  Warning,
  AssessmentOutlined,
  EventNoteOutlined,
  BarChartOutlined,
  ShoppingBagOutlined,
  LocalFloristOutlined
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import {
  getPendingConsultants,
  getPendingDermatologists,
  decideConsultant,
  decideDermatologist,
  getAllUsers,
  suspendUser,
} from "../api/admin";
import { getAdminDashboardStats } from "../api/engagement";
import { listProducts, adminAddProduct, adminUpdateProduct, adminDeleteProduct } from "../api/dashboard";
import { API_BASE_URL } from "../api/auth";

const cPrimary = COLORS.primary || "#8B6FC9";
const cPrimaryDark = COLORS.primaryDark || "#7E57C2";
const cBrandGradient = COLORS.brandGradient || "linear-gradient(135deg, #8B6FC9 0%, #E4749B 100%)";
const cCardBorder = COLORS.cardBorder || "rgba(139, 111, 201, 0.12)";
const cTextDark = COLORS.textDark || "#1E1A2D";
const cTextMuted = COLORS.textMuted || "#6B667A";
const cTextFaint = COLORS.textFaint || "#A5A1B2";
const cSuccess = COLORS.success || "#4CAF7D";
const cDanger = COLORS.danger || "#E4749B";

const NAV_ITEMS = [
  { label: "Dashboard", icon: DashboardOutlined, key: "overview" },
  { label: "Users", icon: PeopleAltOutlined, key: "users" },
  { label: "Consultants", icon: MedicalServicesOutlined, key: "consultants" },
  { label: "Dermatologists", icon: FactCheckOutlined, key: "dermatologists" },
  { label: "Products", icon: ShoppingBagOutlined, key: "products" },
  { label: "Ingredients", icon: LocalFloristOutlined, key: "ingredients" },
  { label: "Skin Assessments", icon: AssessmentOutlined, key: "assessments" },
  { label: "Appointments", icon: EventNoteOutlined, key: "appointments" },
  { label: "Reports", icon: DescriptionOutlined, key: "reports" },
  { label: "Analytics", icon: BarChartOutlined, key: "analytics" },
  { label: "Settings", icon: SettingsOutlined, key: "settings" },
];

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("");
}

function fileUrl(path) {
  if (!path) return null;
  return API_BASE_URL + path;
}

function Card({ children, sx }) {
  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        border: "1px solid " + cCardBorder,
        boxShadow: "0 4px 18px rgba(139,111,201,0.04)",
        p: { xs: 2.25, sm: 2.75 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function DocLink({ label, url }) {
  if (!url) return null;
  return (
    <Chip
      component="a"
      href={fileUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      clickable
      icon={<DescriptionOutlined sx={{ fontSize: 13, "&&": { color: cPrimary } }} />}
      deleteIcon={<OpenInNewRounded sx={{ fontSize: 11, "&&": { color: cPrimary } }} />}
      onDelete={() => {}}
      label={label}
      size="small"
      sx={{
        fontSize: 10, fontWeight: 600, height: 24,
        backgroundColor: "rgba(139,111,201,0.08)", color: cPrimary,
        textDecoration: "none",
      }}
    />
  );
}

export default function AdminDashboardPage({ adminName = "Admin User" }) {
  const [active, setActive] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Loaded data states
  const [pendingConsultants, setPendingConsultants] = useState([]);
  const [pendingDermatologists, setPendingDermatologists] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);

  // Product edit/delete states
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addProductForm, setAddProductForm] = useState({ name: "", brand: "", category: "serum", price: "", rating: "4.5", skin_types: "all", concerns: "", image_url: "", ingredient_names: "" });

  // Search & Filters states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [consultants, dermatologists, users, dashboardStats, productsList] = await Promise.all([
        getPendingConsultants(),
        getPendingDermatologists(),
        getAllUsers(),
        getAdminDashboardStats(),
        listProducts()
      ]);
      setPendingConsultants(consultants);
      setPendingDermatologists(dermatologists);
      setAllUsers(users);
      setStats(dashboardStats);
      setCatalogProducts(productsList);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConsultantDecision = async (person, decision) => {
    setBusyId(person.id);
    setError("");
    setSuccess("");
    try {
      await decideConsultant(person.id, decision);
      setSuccess(`Consultant application successfully ${decision}ed.`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.detail || "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDermatologistDecision = async (person, decision) => {
    setBusyId(person.id);
    setError("");
    setSuccess("");
    try {
      await decideDermatologist(person.id, decision);
      setSuccess(`Dermatologist application successfully ${decision}ed.`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.detail || "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspendUser = async (userId) => {
    setBusyId(userId);
    setError("");
    setSuccess("");
    try {
      await suspendUser(userId);
      setSuccess("User account status updated.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to alter account status.");
    } finally {
      setBusyId(null);
    }
  };

  // Product management handlers
  const handleEditProduct = (product) => {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      rating: product.rating,
      skin_types: product.suitable_for_skin_types || "",
      concerns: product.concerns || "",
      image_url: product.image_url || "",
    });
  };

  const handleSaveProductEdit = async () => {
    if (!editProduct) return;
    setBusyId(editProduct.id);
    try {
      await adminUpdateProduct(editProduct.id, editForm);
      setSuccess(`Product "${editProduct.name}" updated successfully.`);
      setEditProduct(null);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to update product.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Delete "${productName}" from the catalog?`)) return;
    setBusyId(productId);
    try {
      await adminDeleteProduct(productId);
      setSuccess(`Product "${productName}" deleted from catalog.`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to delete product.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAddProduct = async () => {
    try {
      const payload = {
        ...addProductForm,
        price: parseFloat(addProductForm.price) || 0,
        rating: parseFloat(addProductForm.rating) || 4.5,
        ingredient_names: addProductForm.ingredient_names ? addProductForm.ingredient_names.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      await adminAddProduct(payload);
      setSuccess("New product added to catalog.");
      setAddProductOpen(false);
      setAddProductForm({ name: "", brand: "", category: "serum", price: "", rating: "4.5", skin_types: "all", concerns: "", image_url: "", ingredient_names: "" });
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to add product.");
    }
  };

  const totalUsers = stats?.total_users ?? allUsers.filter(u => u.role === "user").length;
  const totalApproved = (stats?.total_consultants_approved ?? 0) + (stats?.total_dermatologists_approved ?? 0);

  const KPI_CARDS = [
    { label: "Total Users", value: totalUsers, color: "#8B6FC9", icon: PeopleAltOutlined, sparkline: "M 0 16 Q 15 5 35 15 T 70 8 T 100 12" },
    { label: "Verified Consultants", value: stats?.total_consultants_approved ?? 0, color: "#E4749B", icon: MedicalServicesOutlined, sparkline: "M 0 12 Q 25 20 50 10 T 100 8" },
    { label: "Verified Dermatologists", value: stats?.total_dermatologists_approved ?? 0, color: "#FFA726", icon: FactCheckOutlined, sparkline: "M 0 18 Q 20 8 40 14 T 80 5 T 100 10" },
    { label: "Total Products", value: stats?.total_products ?? catalogProducts.length, color: "#7E57C2", icon: ShoppingBagOutlined, sparkline: "M 0 15 Q 30 5 60 18 T 100 9" },
    { label: "Total Ingredients", value: stats?.total_ingredients ?? 0, color: "#FF7043", icon: Spa, sparkline: "M 0 10 Q 15 18 45 6 T 100 14" },
    { label: "Skin Assessments", value: stats?.total_assessments ?? 0, color: "#26A69A", icon: AssessmentOutlined, sparkline: "M 0 16 Q 20 4 50 15 T 100 6" },
    { label: "Appointments", value: stats?.total_appointments ?? 0, color: "#42A5F5", icon: EventNoteOutlined, sparkline: "M 0 18 Q 30 18 60 8 T 100 15" },
    { label: "Total Registered", value: stats?.total_all_users ?? allUsers.length, color: "#66BB6A", icon: CheckCircle, sparkline: "M 0 14 Q 25 6 65 16 T 100 8" },
  ];

  return (
    <>
      <Box sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 1400, mx: "auto", width: "100%", overflowY: "auto" }}>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3.5, borderRadius: "12px" }}>{error}</Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3.5, borderRadius: "12px" }}>{success}</Alert>
        )}

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 15 }}>
            <CircularProgress sx={{ color: cPrimary }} />
          </Stack>
        ) : (
          <>
            {/* ============================================================
                DASHBOARD OVERVIEW TAB
                ============================================================ */}
            {active === "overview" && (
              <Stack spacing={3.5}>
                
                {/* Greeting Banner */}
                <Box>
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 900, color: cTextDark }}>Welcome back, Admin 👋</Typography>
                  <Typography sx={{ fontSize: 13, color: cTextMuted, mt: 0.5 }}>Here's what's happening across your skin intelligence platform today.</Typography>
                </Box>

                {/* KPI Metrics Cards Row */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
                  {KPI_CARDS.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <Card key={idx} sx={{ p: 2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box sx={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: card.color + "12", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon sx={{ fontSize: 17, color: card.color }} />
                          </Box>
                          <Typography sx={{ fontSize: 11, fontWeight: 800, color: cSuccess }}>{card.change}</Typography>
                        </Stack>
                        <Box sx={{ mt: 1.5 }}>
                          <Typography sx={{ fontSize: 22, fontWeight: 900, color: cTextDark, lineHeight: 1.1 }}>{card.value}</Typography>
                          <Typography sx={{ fontSize: 11, color: cTextMuted, mt: 0.25 }}>{card.label}</Typography>
                        </Box>
                        {/* Custom sparkline drawing */}
                        <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ marginTop: 8 }}>
                          <path d={card.sparkline} fill="none" stroke={card.color} strokeWidth="1.5" />
                        </svg>
                      </Card>
                    );
                  })}
                </Box>

                {/* Analytics Row */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr 1fr" }, gap: 3.5 }}>
                  {/* Line Chart */}
                  <Card>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: cTextDark, mb: 2 }}>User Registration Growth</Typography>
                    <Box sx={{ height: 220, position: "relative" }}>
                      <svg width="100%" height="200" viewBox="0 0 500 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(139,111,201,0.2)" />
                            <stop offset="100%" stopColor="rgba(139,111,201,0.0)" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#f4f2f6" strokeDasharray="3,3" />
                        <line x1="0" y1="100" x2="500" y2="100" stroke="#f4f2f6" strokeDasharray="3,3" />
                        <line x1="0" y1="150" x2="500" y2="150" stroke="#f4f2f6" strokeDasharray="3,3" />
                        <path d="M 0 160 L 80 120 L 160 140 L 240 90 L 320 110 L 400 70 L 500 50 L 500 200 L 0 200 Z" fill="url(#purpleGrad)" />
                        <path d="M 0 160 L 80 120 L 160 140 L 240 90 L 320 110 L 400 70 L 500 50" fill="none" stroke="#8B6FC9" strokeWidth="2.5" />
                        <circle cx="80" cy="120" r="4" fill="#fff" stroke="#8B6FC9" strokeWidth="2" />
                        <circle cx="240" cy="90" r="4" fill="#fff" stroke="#8B6FC9" strokeWidth="2" />
                        <circle cx="500" cy="50" r="4" fill="#fff" stroke="#8B6FC9" strokeWidth="2" />
                      </svg>
                    </Box>
                  </Card>

                  {/* Donut Chart */}
                  <Card>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: cTextDark, mb: 2 }}>Most Common Skin Concerns</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <svg width="110" height="110" viewBox="0 0 42 42">
                          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#8B6FC9" strokeWidth="5.5" strokeDasharray="40 60" strokeDashoffset="25" />
                          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#E4749B" strokeWidth="5.5" strokeDasharray="24 76" strokeDashoffset="85" />
                          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#FFA726" strokeWidth="5.5" strokeDasharray="15 85" strokeDashoffset="61" />
                          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#26A69A" strokeWidth="5.5" strokeDasharray="21 79" strokeDashoffset="46" />
                        </svg>
                      </Box>
                      <Stack spacing={0.6}>
                        {[
                          { label: "Acne", pct: "40%", col: "#8B6FC9" },
                          { label: "Pigmentation", pct: "24%", col: "#E4749B" },
                          { label: "Sensitivity", pct: "15%", col: "#FFA726" },
                          { label: "Other Concerns", pct: "21%", col: "#26A69A" }
                        ].map((item, i) => (
                          <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: item.col }} />
                              <Typography sx={{ fontSize: 11, color: cTextMuted }}>{item.label}</Typography>
                            </Stack>
                            <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{item.pct}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </Card>

                  {/* Bar Chart */}
                  <Card>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: cTextDark, mb: 2 }}>Skin Assessment Trends</Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 180, pt: 1 }}>
                      {[
                        { label: "W1", val: 80 },
                        { label: "W2", val: 120 },
                        { label: "W3", val: 160 },
                        { label: "W4", val: 210 }
                      ].map((w, idx) => (
                        <Stack key={idx} alignItems="center" spacing={1} sx={{ flex: 1 }}>
                          <Box sx={{ width: 22, height: (w.val / 250) * 130, background: cBrandGradient, borderRadius: "4px 4px 0 0" }} />
                          <Typography sx={{ fontSize: 10, color: cTextMuted }}>{w.label}</Typography>
                        </Stack>
                      ))}
                    </Box>
                  </Card>
                </Box>

                {/* Approvals & Activity Row */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1.2fr 1fr" }, gap: 3.5 }}>
                  
                  {/* Consultant Approvals */}
                  <Card>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>Pending Consultant Approvals</Typography>
                      <Chip label={pendingConsultants.length} size="small" sx={{ fontSize: 11, fontWeight: 700, backgroundColor: "rgba(139,111,201,0.08)", color: cPrimary }} />
                    </Stack>
                    <Stack spacing={1.5}>
                      {pendingConsultants.length === 0 ? (
                        <Typography sx={{ fontSize: 12, color: cTextMuted, textAlign: "center", py: 4 }}>No pending consultants.</Typography>
                      ) : (
                        pendingConsultants.map((c) => (
                          <Box key={c.id} sx={{ p: 1.5, border: "1px solid " + cCardBorder, borderRadius: "12px", backgroundColor: "#FCFBFE" }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Stack direction="row" spacing={1.25} alignItems="center">
                                <Avatar sx={{ width: 32, height: 32, background: cBrandGradient, fontSize: 11 }}>{initials(c.full_name)}</Avatar>
                                <Box>
                                  <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{c.full_name}</Typography>
                                  <Typography sx={{ fontSize: 10, color: cTextMuted }}>{c.specialization || "General Skincare"}</Typography>
                                </Box>
                              </Stack>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton size="small" onClick={() => handleConsultantDecision(c, "approve")} sx={{ color: cSuccess }}><Check sx={{ fontSize: 15 }} /></IconButton>
                                <IconButton size="small" onClick={() => handleConsultantDecision(c, "reject")} sx={{ color: cDanger }}><Close sx={{ fontSize: 15 }} /></IconButton>
                              </Stack>
                            </Stack>
                            {c.certificate_url && (
                              <Box sx={{ mt: 1.25 }}>
                                <DocLink label="Certificate / ID" url={c.certificate_url} />
                              </Box>
                            )}
                          </Box>
                        ))
                      )}
                    </Stack>
                  </Card>

                  {/* Dermatologist Approvals */}
                  <Card>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>Pending Dermatologist Approvals</Typography>
                      <Chip label={pendingDermatologists.length} size="small" sx={{ fontSize: 11, fontWeight: 700, backgroundColor: "rgba(139,111,201,0.08)", color: cPrimary }} />
                    </Stack>
                    <Stack spacing={1.5}>
                      {pendingDermatologists.length === 0 ? (
                        <Typography sx={{ fontSize: 12, color: cTextMuted, textAlign: "center", py: 4 }}>No pending dermatologists.</Typography>
                      ) : (
                        pendingDermatologists.map((d) => (
                          <Box key={d.id} sx={{ p: 1.5, border: "1px solid " + cCardBorder, borderRadius: "12px", backgroundColor: "#FCFBFE" }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Stack direction="row" spacing={1.25} alignItems="center">
                                <Avatar sx={{ width: 32, height: 32, background: cBrandGradient, fontSize: 11 }}>{initials(d.full_name)}</Avatar>
                                <Box>
                                  <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>Dr. {d.full_name}</Typography>
                                  <Typography sx={{ fontSize: 10, color: cTextMuted }}>{d.specialization || "Dermatology"}</Typography>
                                </Box>
                              </Stack>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton size="small" onClick={() => handleDermatologistDecision(d, "approve")} sx={{ color: cSuccess }}><Check sx={{ fontSize: 15 }} /></IconButton>
                                <IconButton size="small" onClick={() => handleDermatologistDecision(d, "reject")} sx={{ color: cDanger }}><Close sx={{ fontSize: 15 }} /></IconButton>
                              </Stack>
                            </Stack>
                            <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: "wrap" }}>
                              {d.medical_degree_certificate_url && <DocLink label="Degree" url={d.medical_degree_certificate_url} />}
                              {d.medical_license_upload_url && <DocLink label="License" url={d.medical_license_upload_url} />}
                            </Stack>
                          </Box>
                        ))
                      )}
                    </Stack>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, mb: 2.5 }}>Recent Activity Logs</Typography>
                    <Stack spacing={2.25}>
                      {[
                        { text: "New User Registered", time: "3 mins ago" },
                        { text: "Consultant Dr. Priya Approved", time: "15 mins ago" },
                        { text: "Dermatologist Verified", time: "30 mins ago" },
                        { text: "Product Added: Hydrating Cleanser", time: "1 hr ago" },
                        { text: "Skin Assessment Completed", time: "2 hrs ago" },
                        { text: "Appointment Created", time: "3 hrs ago" },
                      ].map((item, i) => (
                        <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: cPrimary, mt: 0.5 }} />
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{item.text}</Typography>
                            <Typography sx={{ fontSize: 10, color: cTextMuted, mt: 0.25 }}>{item.time}</Typography>
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  </Card>
                </Box>

                {/* Bottom preview metrics */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr 1fr" }, gap: 3.5 }}>
                  {/* Recent Products */}
                  <Card>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, mb: 2 }}>Recent Skincare Catalog</Typography>
                    <Stack spacing={1.5}>
                      {catalogProducts.slice(0, 4).map((p) => (
                        <Stack key={p.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 1, borderBottom: "1px solid " + cCardBorder }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ width: 34, height: 34, borderRadius: "8px", border: "1px solid " + cCardBorder, p: 0.25, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{p.name}</Typography>
                              <Typography sx={{ fontSize: 10, color: cTextMuted }}>{p.brand} · {p.category}</Typography>
                            </Box>
                          </Stack>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>${p.price}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Card>

                  {/* System Monitoring */}
                  <Card>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, mb: 2.5 }}>System Health Monitor</Typography>
                    <Stack spacing={2}>
                      {[
                        { key: "Database connection", val: "HEALTHY", detail: "Response: 32ms" },
                        { key: "API Gateway Node", val: "HEALTHY", detail: "Response: 120ms" },
                        { key: "AI Diagnostic Engine", val: "HEALTHY", detail: "Response: 350ms" },
                        { key: "Secure Storage Unit", val: "HEALTHY", detail: "Usage: 45%" }
                      ].map((item, idx) => (
                        <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{item.key}</Typography>
                            <Typography sx={{ fontSize: 10, color: cTextMuted, mt: 0.25 }}>{item.detail}</Typography>
                          </Box>
                          <Chip label={item.val} size="small" color="success" sx={{ height: 18, fontSize: 9, fontWeight: 800 }} />
                        </Stack>
                      ))}
                    </Stack>
                  </Card>

                  {/* Reports Overview */}
                  <Card>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, mb: 2 }}>Reports Download Logs</Typography>
                    <Stack spacing={1.5}>
                      {["User Registration Report", "Financial Revenue Logs", "Clinical Audit History", "System Diagnostics Summary"].map((report, idx) => (
                        <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 1, borderBottom: "1px solid " + cCardBorder }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{report}</Typography>
                          <Button size="small" sx={{ textTransform: "none", fontSize: 11 }} variant="text">Download</Button>
                        </Stack>
                      ))}
                    </Stack>
                  </Card>
                </Box>
              </Stack>
            )}

            {/* ============================================================
                USERS DIRECTORY VIEW
                ============================================================ */}
            {active === "users" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 3 }}>Platform Registered Users Directory</Typography>
                
                {/* Table search & filter actions */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  <TextField label="Search by name or email" size="small" sx={{ flexGrow: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <TextField select label="Role Filter" size="small" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} SelectProps={{ native: true }} sx={{ width: 180 }}>
                    <option value="all">All Roles</option>
                    <option value="patient">Patients / Users</option>
                    <option value="consultant">Consultants</option>
                    <option value="dermatologist">Dermatologists</option>
                    <option value="admin">Administrators</option>
                  </TextField>
                </Stack>

                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid " + cCardBorder }}>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Name</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Email</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Role</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Registered On</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted, textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers
                        .filter(u => {
                          const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesRole = filterRole === "all" || u.role === filterRole;
                          return matchesSearch && matchesRole;
                        })
                        .map(u => (
                          <tr key={u.id} style={{ borderBottom: "1px solid " + cCardBorder }}>
                            <td style={{ padding: 12, fontSize: 13, fontWeight: 700 }}>{u.full_name}</td>
                            <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{u.email}</td>
                            <td style={{ padding: 12, fontSize: 13 }}>
                              <Chip label={u.role.toUpperCase()} size="small" color={u.role === "admin" ? "secondary" : "primary"} sx={{ height: 20, fontSize: 10, fontWeight: 800 }} />
                            </td>
                            <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{new Date(u.created_at || Date.now()).toLocaleDateString()}</td>
                            <td style={{ padding: 12, fontSize: 13, textAlign: "right" }}>
                              <Button variant="outlined" color="error" size="small" sx={{ textTransform: "none", borderRadius: "8px", fontSize: 11 }} onClick={() => handleSuspendUser(u.id)} disabled={busyId === u.id}>
                                Suspend Account
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            )}

            {/* ============================================================
                CONSULTANTS DIRECTORY VIEW
                ============================================================ */}
            {active === "consultants" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 3 }}>Consultants Verification Directory</Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  <TextField label="Search by name" size="small" sx={{ flexGrow: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </Stack>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid " + cCardBorder }}>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Name</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Email</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Specialization</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Experience</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted, textAlign: "right" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers
                        .filter(u => u.role === "consultant" && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(u => (
                          <tr key={u.id} style={{ borderBottom: "1px solid " + cCardBorder }}>
                            <td style={{ padding: 12, fontSize: 13, fontWeight: 700 }}>{u.full_name}</td>
                            <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{u.email}</td>
                            <td style={{ padding: 12, fontSize: 13 }}>{u.specialization || "General Cosmetology"}</td>
                            <td style={{ padding: 12, fontSize: 13 }}>{u.years_of_experience || 5} Years</td>
                            <td style={{ padding: 12, fontSize: 13, textAlign: "right" }}>
                              <Chip label="APPROVED" size="small" color="success" sx={{ height: 20, fontSize: 10, fontWeight: 800 }} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            )}

            {/* ============================================================
                DERMATOLOGISTS DIRECTORY VIEW
                ============================================================ */}
            {active === "dermatologists" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 3 }}>Clinical Dermatologists Directory</Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  <TextField label="Search by doctor name" size="small" sx={{ flexGrow: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </Stack>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid " + cCardBorder }}>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Doctor Name</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Email</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Specialization</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Licensing Body</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted, textAlign: "right" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers
                        .filter(u => u.role === "dermatologist" && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(u => (
                          <tr key={u.id} style={{ borderBottom: "1px solid " + cCardBorder }}>
                            <td style={{ padding: 12, fontSize: 13, fontWeight: 700 }}>Dr. {u.full_name}</td>
                            <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{u.email}</td>
                            <td style={{ padding: 12, fontSize: 13 }}>{u.specialization || "Clinical Dermatology"}</td>
                            <td style={{ padding: 12, fontSize: 13 }}>Medical Licensing Board</td>
                            <td style={{ padding: 12, fontSize: 13, textAlign: "right" }}>
                              <Chip label="VERIFIED" size="small" color="success" sx={{ height: 20, fontSize: 10, fontWeight: 800 }} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            )}

            {/* ============================================================
                PRODUCTS VIEW
                ============================================================ */}
            {active === "products" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 800 }}>Skincare Product Catalog ({catalogProducts.length} products)</Typography>
                  <Button variant="contained" sx={{ background: cBrandGradient, textTransform: "none", borderRadius: "12px" }} onClick={() => setAddProductOpen(true)}>+ Add Product</Button>
                </Stack>

                {/* Product Grid with Image Preview */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2.5 }}>
                  {catalogProducts
                    .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(p => (
                      <Paper key={p.id} sx={{ border: "1px solid " + cCardBorder, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        {/* Product Image */}
                        <Box sx={{ height: 140, backgroundColor: "#fdfbfe", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                          <img
                            src={p.image_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80"}
                            alt={p.name}
                            style={{ height: "100%", width: "100%", objectFit: "contain", padding: 8 }}
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80"; }}
                          />
                          <Chip label={p.category} size="small" sx={{ position: "absolute", top: 8, left: 8, height: 18, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", background: "rgba(255,255,255,0.92)", color: cPrimary }} />
                        </Box>
                        {/* Product Info */}
                        <Box sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                          <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: cTextMuted, textTransform: "uppercase" }}>{p.brand}</Typography>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: cTextDark, mt: 0.25, mb: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: cPrimaryDark }}>${p.price}</Typography>
                            <Typography sx={{ fontSize: 10.5, color: cTextMuted }}>·</Typography>
                            <Star sx={{ fontSize: 12, color: "#F5A623" }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: cTextMuted }}>{p.rating}</Typography>
                          </Stack>
                          {/* Action buttons */}
                          <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                            <Button size="small" variant="outlined" fullWidth sx={{ textTransform: "none", borderRadius: "8px", fontSize: 11, borderColor: cCardBorder, color: cPrimary }} onClick={() => handleEditProduct(p)} disabled={busyId === p.id}>Edit</Button>
                            <Button size="small" variant="outlined" fullWidth sx={{ textTransform: "none", borderRadius: "8px", fontSize: 11, borderColor: "rgba(228,116,155,0.4)", color: cDanger }} onClick={() => handleDeleteProduct(p.id, p.name)} disabled={busyId === p.id}>Delete</Button>
                          </Stack>
                        </Box>
                      </Paper>
                    ))}
                </Box>

                {/* Edit Product Dialog */}
                {editProduct && (
                  <Box sx={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setEditProduct(null)}>
                    <Paper sx={{ p: 4, borderRadius: "20px", width: 480, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Edit Product</Typography>
                        <IconButton size="small" onClick={() => setEditProduct(null)}><Close sx={{ fontSize: 18 }} /></IconButton>
                      </Stack>
                      {/* Image Preview */}
                      {editForm.image_url && (
                        <Box sx={{ mb: 2, height: 120, borderRadius: "12px", overflow: "hidden", border: "1px solid " + cCardBorder }}>
                          <img src={editForm.image_url} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }} />
                        </Box>
                      )}
                      <Stack spacing={1.5}>
                        <TextField label="Product Name" size="small" value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} fullWidth />
                        <TextField label="Brand" size="small" value={editForm.brand || ""} onChange={e => setEditForm({ ...editForm, brand: e.target.value })} fullWidth />
                        <TextField label="Image URL" size="small" value={editForm.image_url || ""} onChange={e => setEditForm({ ...editForm, image_url: e.target.value })} fullWidth />
                        <Stack direction="row" spacing={1.5}>
                          <TextField label="Price ($)" size="small" type="number" value={editForm.price || ""} onChange={e => setEditForm({ ...editForm, price: e.target.value })} fullWidth />
                          <TextField label="Rating" size="small" type="number" value={editForm.rating || ""} onChange={e => setEditForm({ ...editForm, rating: e.target.value })} fullWidth inputProps={{ min: 0, max: 5, step: 0.1 }} />
                        </Stack>
                        <TextField label="Skin Types" size="small" value={editForm.skin_types || ""} onChange={e => setEditForm({ ...editForm, skin_types: e.target.value })} fullWidth placeholder="e.g. oily, dry, sensitive" />
                        <TextField label="Concerns" size="small" value={editForm.concerns || ""} onChange={e => setEditForm({ ...editForm, concerns: e.target.value })} fullWidth placeholder="e.g. acne, dryness" />
                      </Stack>
                      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                        <Button variant="outlined" fullWidth sx={{ textTransform: "none", borderRadius: "10px" }} onClick={() => setEditProduct(null)}>Cancel</Button>
                        <Button variant="contained" fullWidth sx={{ background: cBrandGradient, textTransform: "none", borderRadius: "10px" }} onClick={handleSaveProductEdit} disabled={busyId === editProduct.id}>Save Changes</Button>
                      </Stack>
                    </Paper>
                  </Box>
                )}

                {/* Add Product Dialog */}
                {addProductOpen && (
                  <Box sx={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setAddProductOpen(false)}>
                    <Paper sx={{ p: 4, borderRadius: "20px", width: 480, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Add New Product</Typography>
                        <IconButton size="small" onClick={() => setAddProductOpen(false)}><Close sx={{ fontSize: 18 }} /></IconButton>
                      </Stack>
                      {addProductForm.image_url && (
                        <Box sx={{ mb: 2, height: 100, borderRadius: "12px", overflow: "hidden", border: "1px solid " + cCardBorder }}>
                          <img src={addProductForm.image_url} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }} />
                        </Box>
                      )}
                      <Stack spacing={1.5}>
                        <TextField label="Product Name" size="small" value={addProductForm.name} onChange={e => setAddProductForm({ ...addProductForm, name: e.target.value })} fullWidth />
                        <TextField label="Brand" size="small" value={addProductForm.brand} onChange={e => setAddProductForm({ ...addProductForm, brand: e.target.value })} fullWidth />
                        <TextField label="Image URL" size="small" value={addProductForm.image_url} onChange={e => setAddProductForm({ ...addProductForm, image_url: e.target.value })} fullWidth placeholder="https://..." />
                        <Stack direction="row" spacing={1.5}>
                          <TextField label="Price ($)" size="small" type="number" value={addProductForm.price} onChange={e => setAddProductForm({ ...addProductForm, price: e.target.value })} fullWidth />
                          <TextField label="Rating" size="small" type="number" value={addProductForm.rating} onChange={e => setAddProductForm({ ...addProductForm, rating: e.target.value })} fullWidth inputProps={{ min: 0, max: 5, step: 0.1 }} />
                        </Stack>
                        <TextField label="Skin Types" size="small" value={addProductForm.skin_types} onChange={e => setAddProductForm({ ...addProductForm, skin_types: e.target.value })} fullWidth placeholder="e.g. oily, dry, sensitive" />
                        <TextField label="Concerns" size="small" value={addProductForm.concerns} onChange={e => setAddProductForm({ ...addProductForm, concerns: e.target.value })} fullWidth placeholder="e.g. acne, dryness" />
                        <TextField label="Ingredients (comma-separated)" size="small" value={addProductForm.ingredient_names} onChange={e => setAddProductForm({ ...addProductForm, ingredient_names: e.target.value })} fullWidth placeholder="Niacinamide, Ceramides" />
                      </Stack>
                      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                        <Button variant="outlined" fullWidth sx={{ textTransform: "none", borderRadius: "10px" }} onClick={() => setAddProductOpen(false)}>Cancel</Button>
                        <Button variant="contained" fullWidth sx={{ background: cBrandGradient, textTransform: "none", borderRadius: "10px" }} onClick={handleAddProduct}>Add to Catalog</Button>
                      </Stack>
                    </Paper>
                  </Box>
                )}
              </Paper>
            )}

            {/* ============================================================
                INGREDIENTS VIEW
                ============================================================ */}
            {active === "ingredients" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 3 }}>Active Skincare Ingredients Database</Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid " + cCardBorder }}>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Ingredient</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Benefits</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Risk Level</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Suitable Skin Types</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Salicylic Acid", benefits: "Clears pores, exfoliates surface, targets acne breakouts.", risk: "LOW", types: "oily, combination" },
                        { name: "Niacinamide", benefits: "Strengthens skin barrier, regulates sebum, brightens dark spots.", risk: "LOW", types: "all skin types" },
                        { name: "Hyaluronic Acid", benefits: "Locks in deep moisture, plumps dry skin cells.", risk: "LOW", types: "dry, sensitive, normal" },
                        { name: "Ceramides", benefits: "Restores essential skin barrier lipids, prevents moisture loss.", risk: "LOW", types: "dry, sensitive" },
                        { name: "Retinol", benefits: "Accelerates cell turnover, refines wrinkles and texture.", risk: "MEDIUM", types: "normal, dry, combination" },
                        { name: "Centella Asiatica", benefits: "Soothes irritation, calms redness, repairs lesions.", risk: "LOW", types: "sensitive, dry" }
                      ].map((ing, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid " + cCardBorder }}>
                          <td style={{ padding: 12, fontSize: 13, fontWeight: 700, color: cPrimary }}>{ing.name}</td>
                          <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{ing.benefits}</td>
                          <td style={{ padding: 12, fontSize: 13 }}>
                            <Chip label={ing.risk} size="small" color={ing.risk === "LOW" ? "success" : "warning"} sx={{ height: 18, fontSize: 9.5, fontWeight: 800 }} />
                          </td>
                          <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{ing.types}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            )}

            {/* ============================================================
                SKIN ASSESSMENTS VIEW
                ============================================================ */}
            {active === "assessments" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 3 }}>User Skin Diagnostic Assessments Log</Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid " + cCardBorder }}>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>ID</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Date</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Overall Score</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Primary Concern</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Diagnostics Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: "ASSESS-8921", date: "Today", score: 85, concern: "Acne Vulgaris", details: "Acne: 72%, Hydration: 85%, Texture: 80%" },
                        { id: "ASSESS-8802", date: "Yesterday", score: 72, concern: "Extreme Dryness", details: "Hydration: 45%, Sensitivity: 75%" },
                        { id: "ASSESS-8714", date: "2 days ago", score: 91, concern: "No major concerns", details: "Acne: 90%, Hydration: 92%, Texture: 91%" },
                        { id: "ASSESS-8692", date: "3 days ago", score: 68, concern: "Hyperpigmentation", details: "Pigmentation: 58%, Sensitivity: 62%" },
                      ].map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid " + cCardBorder }}>
                          <td style={{ padding: 12, fontSize: 13, fontWeight: 700 }}>{item.id}</td>
                          <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{item.date}</td>
                          <td style={{ padding: 12, fontSize: 13, fontWeight: 700, color: cPrimaryDark }}>{item.score} / 100</td>
                          <td style={{ padding: 12, fontSize: 13 }}>{item.concern}</td>
                          <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{item.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            )}

            {/* ============================================================
                APPOINTMENTS VIEW
                ============================================================ */}
            {active === "appointments" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 3 }}>Appointments & Bookings Schedule</Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid " + cCardBorder }}>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Patient</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Specialist</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Scheduled For</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted }}>Reason</th>
                        <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: cTextMuted, textAlign: "right" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { patient: "Emma Johnson", expert: "Dr. Ananya Sharma (Dermatologist)", date: "July 26, 2:30 PM", reason: "Acne flare up consultation", status: "SCHEDULED" },
                        { patient: "John Doe", expert: "Jane Smith (Consultant)", date: "July 28, 10:00 AM", reason: "Skincare routine adjustment", status: "SCHEDULED" },
                        { patient: "Sarah Lee", expert: "Dr. Ananya Sharma (Dermatologist)", date: "July 29, 4:00 PM", reason: "Severe skin dryness diagnostics", status: "SCHEDULED" }
                      ].map((booking, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid " + cCardBorder }}>
                          <td style={{ padding: 12, fontSize: 13, fontWeight: 700 }}>{booking.patient}</td>
                          <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{booking.expert}</td>
                          <td style={{ padding: 12, fontSize: 13 }}>{booking.date}</td>
                          <td style={{ padding: 12, fontSize: 13, color: cTextMuted }}>{booking.reason}</td>
                          <td style={{ padding: 12, fontSize: 13, textAlign: "right" }}>
                            <Chip label={booking.status} size="small" color="primary" sx={{ height: 20, fontSize: 9.5, fontWeight: 800 }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            )}

            {/* ============================================================
                REPORTS VIEW
                ============================================================ */}
            {active === "reports" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 3 }}>Skincare Health & Activity Reports</Typography>
                <Stack spacing={2}>
                  {["System Activity Report", "Consultants Verification Audit", "Platform Active User Summary", "Catalog Analytics & Prices"].map((report, idx) => (
                    <Paper key={idx} sx={{ p: 2.5, border: "1px solid " + cCardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{report}</Typography>
                      <Button size="small" variant="outlined" sx={{ textTransform: "none" }}>Download Log PDF</Button>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* ============================================================
                ANALYTICS VIEW
                ============================================================ */}
            {active === "analytics" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 3 }}>Detailed Platform Analytics</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3.5 }}>
                  <Card>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 2 }}>Monthly Diagnostics Load</Typography>
                    <Box sx={{ height: 200, display: "flex", alignItems: "flex-end", justifyContent: "space-between", px: 2 }}>
                      {[120, 180, 240, 310, 390, 480].map((val, i) => (
                        <Stack key={i} alignItems="center" spacing={1} sx={{ flex: 1 }}>
                          <Box sx={{ width: 32, height: (val / 500) * 150, background: cBrandGradient, borderRadius: "6px" }} />
                          <Typography sx={{ fontSize: 10 }}>Month {i+1}</Typography>
                        </Stack>
                      ))}
                    </Box>
                  </Card>
                  <Card>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 2 }}>Platform Growth Trend</Typography>
                    <svg width="100%" height="200" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <path d="M 0 35 L 20 28 L 40 22 L 60 15 L 80 8 L 100 4" fill="none" stroke={cPrimary} strokeWidth="2" />
                    </svg>
                  </Card>
                </Box>
              </Paper>
            )}

            {/* ============================================================
                SETTINGS & SYSTEM SETTINGS VIEW
                ============================================================ */}
            {active === "settings" && (
              <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid " + cCardBorder }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 3 }}>Super Administrator Profile Settings</Typography>
                <Stack spacing={3} sx={{ maxWidth: 500 }}>
                  <TextField label="Super Admin Name" value={adminName} disabled />
                  <TextField label="Super Admin Email ID" value="admin@skinintelligence.ai" disabled />
                  <TextField label="Access Role Level" value="Level 1 Enterprise Administrator" disabled />
                  <TextField label="Assigned Region Node" value="Global Load Balanced AWS Node" disabled />
                </Stack>
              </Paper>
            )}
          </>
        )}
      </Box>
    </>
  );
}