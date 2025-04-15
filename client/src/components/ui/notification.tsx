import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, X } from "lucide-react";

const notificationVariants = cva(
  "fixed bottom-4 right-4 max-w-xs bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-gray-700",
        success: "border-green-600",
        error: "border-red-600",
        pending: "border-yellow-600",
      },
      visibility: {
        shown: "translate-y-0 opacity-100",
        hidden: "translate-y-2 opacity-0 pointer-events-none",
      },
    },
    defaultVariants: {
      variant: "default",
      visibility: "hidden",
    },
  }
);

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant, visibility, title, message, onClose, autoClose = true, autoCloseTime = 5000, ...props }, ref) => {
    React.useEffect(() => {
      if (visibility === "shown" && autoClose) {
        const timer = setTimeout(() => {
          onClose && onClose();
        }, autoCloseTime);
        return () => clearTimeout(timer);
      }
    }, [visibility, autoClose, autoCloseTime, onClose]);

    const Icon = React.useMemo(() => {
      switch (variant) {
        case "success":
          return <CheckCircle className="text-green-500 h-5 w-5" />;
        case "error":
          return <XCircle className="text-red-500 h-5 w-5" />;
        case "pending":
          return <Clock className="text-yellow-500 h-5 w-5" />;
        default:
          return <CheckCircle className="text-primary h-5 w-5" />;
      }
    }, [variant]);

    return (
      <div
        className={cn(notificationVariants({ variant, visibility, className }))}
        ref={ref}
        {...props}
      >
        <div className="p-4 flex items-start">
          <div className="flex-shrink-0 mr-3">{Icon}</div>
          <div className="flex-1">
            <h3 className="font-medium mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{message}</p>
          </div>
          <button
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-white"
            onClick={onClose}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
);

Notification.displayName = "Notification";

export { Notification };
