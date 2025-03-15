import { LucideProps } from "lucide-react"

export const Icons = {
  razorpay: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M8.39 10.4l1.54-1.537L3.475 2.4h4.065l4.615 4.617 1.54-1.536L8.391 0H0l8.39 10.4zm-.925 3.2l-1.54 1.537 6.455 6.463H8.315l-4.615-4.617-1.54 1.536 5.304 5.481h8.391l-8.39-10.4z" />
    </svg>
  ),
  upi: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 0L1.75 6v12L12 24l10.25-6V6L12 0zm-1.775 16.283l-2.99-2.99 1.414-1.414 1.576 1.576 4.875-4.875 1.414 1.414-6.289 6.289z" />
    </svg>
  ),
  card: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  bank: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
    </svg>
  ),
} 