import { motion } from "framer-motion";
import { Heart } from "lucide-react";

interface EmergencyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  isPulse?: boolean;
  size?: "default" | "large";
  disabled?: boolean;
  id?: string;
  "data-testid"?: string;
}

export default function EmergencyButton({ 
  children, 
  onClick, 
  type = "button", 
  isPulse = false,
  size = "default",
  disabled = false,
  id,
  "data-testid": dataTestId = "emergency-button"
}: EmergencyButtonProps) {
  const sizeClasses = size === "large" 
    ? "py-6 px-8 text-xl" 
    : "py-4 px-8 text-lg";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      id={id}
      className={`emergency-btn w-full text-white font-bold rounded-lg ${sizeClasses} ${
        isPulse ? 'pulse-urgent' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      data-testid={dataTestId}
    >
      <div className="flex items-center justify-center">
        <Heart className="mr-3" />
        {children}
      </div>
    </motion.button>
  );
}
