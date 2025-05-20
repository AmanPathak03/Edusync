import Link from "next/link"
import { LogOut, Settings, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ProfilePopupProps {
  name: string;
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

// components/profile-popup.tsx
export function ProfilePopup({ name, email, isOpen, onClose, onLogout }: {
  name: string;
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-4 bg-white shadow-lg rounded-md border p-4 z-50 w-64">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
        </div>
        <hr className="my-2" />
        <Button variant="ghost" className="w-full justify-start" asChild>
          {/* Make sure there is exactly ONE child of Button when using asChild */}
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
        <Button variant="destructive" className="w-full" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}