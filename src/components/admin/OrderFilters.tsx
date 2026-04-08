import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface Filters {
  search: string;
  status: string;
  paymentStatus: string;
  packageType: string;
  source: string;
  dateFrom: string;
  dateTo: string;
}

interface OrderFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

const OrderFilters = ({ filters, onChange, onClear }: OrderFiltersProps) => {
  const set = (key: keyof Filters, val: string) =>
    onChange({ ...filters, [key]: val === "all" ? "" : val });

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
          />
        </div>

        <Select value={filters.status || "all"} onValueChange={(v) => set("status", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="follow-up">Follow-up</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.paymentStatus || "all"} onValueChange={(v) => set("paymentStatus", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.packageType || "all"} onValueChange={(v) => set("packageType", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Packages</SelectItem>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="couple">Couple</SelectItem>
            <SelectItem value="family">Family</SelectItem>
            <SelectItem value="baby_name">Baby Name</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.source || "all"} onValueChange={(v) => set("source", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="ads">Ads</SelectItem>
            <SelectItem value="organic">Organic</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 items-center">
        <Input
          type="date"
          className="w-[160px]"
          value={filters.dateFrom}
          onChange={(e) => set("dateFrom", e.target.value)}
          placeholder="From"
        />
        <span className="text-muted-foreground text-sm">to</span>
        <Input
          type="date"
          className="w-[160px]"
          value={filters.dateTo}
          onChange={(e) => set("dateTo", e.target.value)}
          placeholder="To"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderFilters;
