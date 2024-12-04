"use client";

import { Button } from "@/components/ui/button";
import { Loader, Moon, Sun, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { AccountBalanceTrackerComponent } from "@/components/account-balance-tracker";
import { AccountSheet } from "@/components/user-account-sheet";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";

function CustomUserIcon() {
  const { user, error, isLoading } = useUser();
  if (error) {
    console.error(error);
    return <User className="h-4 w-4" />;
  }
  return (
    <>
      {/* user profile */}
      {isLoading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : user && user.picture && user.name ? (
        <Image
          src={user.picture}
          className="h-4 w-4 rounded-full"
          alt={user.name}
          width={24}
          height={24}
        />
      ) : (
        <User className="h-4 w-4" />
      )}
    </>
  );
}

export default function Page() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap gap-4 justify-between sm:items-center mb-4 p-1">
        <h1 className="text-2xl font-bold">Account Tracker</h1>
        <div className="flex grow justify-end gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grow sm:grow-0"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="grow sm:grow-0">
              <CustomUserIcon />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col gap-4">
            <AccountSheet />
          </SheetContent>
        </Sheet>
      </div>
      <AccountBalanceTrackerComponent />
    </div>
  );
}
