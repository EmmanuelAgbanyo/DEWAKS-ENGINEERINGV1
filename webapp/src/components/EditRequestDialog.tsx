import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCashRequest, type DBCashRequest } from "@/lib/firebase-db";
import { toast } from "sonner";

interface EditRequestDialogProps {
  request: (DBCashRequest & { id: string }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedRequest?: any) => void;
}

export function EditRequestDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: EditRequestDialogProps) {
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (request) {
      setAmount(request.amount.toString());
      setPurpose(request.purpose);
    }
  }, [request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!request) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (purpose.trim().length < 3) {
      toast.error("Purpose must be at least 3 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCashRequest(request.id, {
        amount: numAmount,
        purpose: purpose.trim(),
      });
      toast.success("Request updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update request:", error);
      toast.error("Failed to update request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Request</DialogTitle>
          <DialogDescription>
            Update your cash request details. Only pending requests can be edited.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-foreground">
                Amount (GHS)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-secondary/50 border-border"
                disabled={isSubmitting}
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(amount)}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purpose" className="text-foreground">
                Purpose
              </Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe the purpose of this request"
                className="bg-secondary/50 border-border min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
