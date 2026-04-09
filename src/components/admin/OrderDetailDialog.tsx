import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Loader2, FileText } from "lucide-react";
import { generateInvoice, getInvoiceDownloadUrl, getInvoiceForOrder } from "@/lib/invoiceService";
import type { FirestoreOrder } from "@/types/admin";

interface Props {
  order: FirestoreOrder | null;
  onClose: () => void;
  onUpdated: () => void;
}

const DetailRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between py-2 border-b border-muted last:border-0">
      <span className="text-muted-foreground font-medium text-sm">{label}</span>
      <span className="text-right max-w-[60%] break-words text-sm">{String(value)}</span>
    </div>
  );
};

const OrderDetailDialog = ({ order, onClose, onUpdated }: Props) => {
  const { toast } = useToast();
  const [status, setStatus] = useState(order?.status || "pending");
  const [notes, setNotes] = useState(order?.notes || "");
  const [followUpDate, setFollowUpDate] = useState(order?.follow_up_date || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(order?.tags || []);
  const [saving, setSaving] = useState(false);

  if (!order) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "orders", order.order_id);
      await updateDoc(ref, {
        status,
        notes,
        follow_up_date: followUpDate || null,
        tags,
        updated_at: new Date().toISOString(),
      });
      toast({ title: "Order updated" });
      onUpdated();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order {order.order_id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer info */}
          <section>
            <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Customer</h3>
            <DetailRow label="Name" value={order.customer_name} />
            <DetailRow label="Email" value={order.customer_email} />
            <DetailRow label="Mobile" value={order.customer_mobile} />
            <DetailRow label="City" value={order.customer_city} />
          </section>

          {/* Order info */}
          <section>
            <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Order</h3>
            <DetailRow label="Package" value={order.package_type} />
            <DetailRow label="Amount" value={`₹${Number(order.amount).toLocaleString("en-IN")}`} />
            <DetailRow label="Payment" value={order.payment_status} />
            <DetailRow label="Transaction ID" value={order.transaction_id} />
            <DetailRow label="Date" value={order.order_date} />
          </section>

          {/* Editable fields */}
          <section className="space-y-4">
            <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Actions</h3>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this order..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. hot_lead"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
              </div>
              <div className="flex gap-1 flex-wrap mt-1">
                {tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(t)}
                  >
                    {t} ×
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;
