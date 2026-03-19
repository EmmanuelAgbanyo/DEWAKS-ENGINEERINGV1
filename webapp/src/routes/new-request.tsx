import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  FileText,
  Tag,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Send,
  Calendar as CalendarIcon,
  Building2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/AuthProvider";
import {
  getAllCategories,
  createCashRequest,
  recordToArray,
} from "@/lib/firebase-db";
import { PayoutMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NewRequest() {
  const navigate = useNavigate();
  const { uid, userProfile, firebaseUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ requestNumber: string } | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<{
    amount: string;
    purpose: string;
    categoryId: string;
    client: string;
    site: string;
    payoutMethod: "CASH" | "MOMO" | "BANK_TRANSFER";
    accountName: string;
    accountNumber: string;
    bankName: string;
    description: string;
    urgency: string;
    neededBy: Date | undefined;
  }>({
    amount: "",
    purpose: "",
    categoryId: "",
    client: "",
    site: "",
    payoutMethod: "CASH",
    accountName: "",
    accountNumber: "",
    bankName: "",
    description: "",
    urgency: "NORMAL",
    neededBy: undefined,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getAllCategories();
        setCategories(recordToArray(cats).filter(c => c.active));
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.amount || !formData.purpose || !formData.categoryId) {
      setError("Please fill in all required fields (Amount, Purpose, Category)");
      return;
    }

    if (formData.payoutMethod === "MOMO" && (!formData.accountNumber || !formData.bankName)) {
      setError("Please provide Mobile Number and Provider");
      return;
    }

    if (formData.payoutMethod === "BANK_TRANSFER" && (!formData.accountNumber || !formData.bankName || !formData.accountName)) {
      setError("Please provide all Bank Details");
      return;
    }

    setIsLoading(true);

    try {
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      
      await createCashRequest({
        amount: parseFloat(formData.amount),
        purpose: formData.purpose,
        categoryId: formData.categoryId,
        categoryName: selectedCategory?.name || "Unknown",
        client: formData.client || null,
        site: formData.site || null,
        payoutMethod: formData.payoutMethod,
        accountName: formData.accountName || null,
        accountNumber: formData.accountNumber || null,
        bankName: formData.bankName || null,
        description: formData.description || null,
        urgency: formData.urgency,
        neededBy: formData.neededBy?.toISOString() || null,
        status: "PENDING_ADMIN",
        requesterId: uid!,
        requesterName: userProfile?.name || firebaseUser?.displayName || "Unknown",
        requesterEmail: userProfile?.email || firebaseUser?.email || "",
        requesterDepartment: userProfile?.department || null,
        adminId: null,
        adminName: null,
        adminComment: null,
        adminReviewedAt: null,
        managerId: null,
        managerName: null,
        managerComment: null,
        managerReviewedAt: null,
      });

      setSuccess({ requestNumber: "Submitted" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[^\d.]/g, ""));
    if (isNaN(num)) return "";
    return num.toLocaleString("en-NG");
  };

  const urgencyOptions = [
    { value: "LOW", label: "Low", description: "Can wait a few days" },
    { value: "NORMAL", label: "Normal", description: "Standard processing" },
    { value: "HIGH", label: "High", description: "Needs attention soon" },
    { value: "URGENT", label: "Urgent", description: "Immediate attention required" },
  ];

  if (success) {
    return (
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center py-12"
        >
          <div className="glass-card p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5" />
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Request Submitted!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your cash request has been submitted successfully.
              </p>
              <div className="bg-secondary/30 rounded-xl p-5 mb-6 text-left border border-border/50">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Request #</span>
                    <span className="font-semibold text-foreground">
                      {success.requestNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-gradient-gold">
                      GHS {parseFloat(formData.amount).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                      Pending Admin Review
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                You will receive a notification when your request is reviewed.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="border-border hover:bg-secondary/50"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setSuccess(null);
                    setFormData({
                      amount: "",
                      purpose: "",
                      categoryId: "",
                      client: "",
                      site: "",
                      payoutMethod: "CASH",
                      accountName: "",
                      accountNumber: "",
                      bankName: "",
                      description: "",
                      urgency: "NORMAL",
                      neededBy: undefined,
                    });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  New Request
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">New Cash Request</h1>
              <p className="text-muted-foreground">
                Submit a new cash request for approval
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card p-6 space-y-6">

            {/* Amount & Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Amount (GHS) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    GH₵
                  </span>
                  <Input
                    type="text"
                    placeholder="0.00"
                    value={formData.amount ? formatCurrency(formData.amount) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, "");
                      setFormData({ ...formData, amount: raw });
                    }}
                    className="pl-12 h-12 bg-secondary/30 border-border/50 focus:border-primary/50 text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Category <span className="text-red-400">*</span>
                </label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50">
                    <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Purpose <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., Office supplies for Q1"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50"
              />
            </div>

            {/* Client & Site Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Client <span className="text-muted-foreground">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Client Name"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Site <span className="text-muted-foreground">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Site Location/Name"
                  value={formData.site}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                  className="h-12 bg-secondary/30 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>

            {/* Payout Method */}
            <div className="space-y-4 pt-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Payout Method <span className="text-red-400">*</span>
              </label>
              <RadioGroup
                value={formData.payoutMethod}
                onValueChange={(value: "CASH" | "MOMO" | "BANK_TRANSFER") =>
                  setFormData({ ...formData, payoutMethod: value })
                }
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="CASH" id="cash" className="peer sr-only" />
                  <Label
                    htmlFor="cash"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Banknote className="mb-3 h-6 w-6" />
                    Cash
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="MOMO" id="momo" className="peer sr-only" />
                  <Label
                    htmlFor="momo"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Smartphone className="mb-3 h-6 w-6" />
                    Mobile Money
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" className="peer sr-only" />
                  <Label
                    htmlFor="bank"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Building2 className="mb-3 h-6 w-6" />
                    Bank Transfer
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Conditional Account Details */}
            <AnimatePresence>
              {formData.payoutMethod === "MOMO" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mobile Network (Provider) *</label>
                    <Select
                      value={formData.bankName}
                      onValueChange={(value) => setFormData({ ...formData, bankName: value })}
                    >
                      <SelectTrigger className="h-12 bg-secondary/30 border-border/50">
                        <SelectValue placeholder="Select Network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN">MTN</SelectItem>
                        <SelectItem value="Telecel">Telecel</SelectItem>
                        <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mobile Number *</label>
                    <Input
                      placeholder="e.g. 024xxxxxxx"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="h-12 bg-secondary/30 border-border/50"
                    />
                  </div>
                </motion.div>
              )}

              {formData.payoutMethod === "BANK_TRANSFER" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Bank Name *</label>
                      <Input
                        placeholder="e.g. Ecobank"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="h-12 bg-secondary/30 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Account Number *</label>
                      <Input
                        placeholder="Account Number"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="h-12 bg-secondary/30 border-border/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Account Name *</label>
                    <Input
                      placeholder="Name on Account"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className="h-12 bg-secondary/30 border-border/50"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Needed By Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Date Needed <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal bg-secondary/30 border-border/50 hover:bg-secondary/40",
                      !formData.neededBy && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.neededBy ? (
                      format(formData.neededBy, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.neededBy}
                    onSelect={(date) => {
                      setFormData({ ...formData, neededBy: date });
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Urgency */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                Urgency Level
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {urgencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, urgency: option.value })
                    }
                    className={cn(
                      "p-4 rounded-xl border transition-all text-left group",
                      formData.urgency === option.value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40 hover:border-border"
                    )}
                  >
                    <p
                      className={cn(
                        "font-semibold text-sm",
                        formData.urgency === option.value
                          ? "text-primary"
                          : "text-foreground"
                      )}
                    >
                      {option.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Additional Details <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                placeholder="Provide any additional context or justification for this request..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[120px] bg-secondary/30 border-border/50 focus:border-primary/50 resize-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-border hover:bg-secondary/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-primary-foreground shadow-lg shadow-primary/25 min-w-[160px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}
