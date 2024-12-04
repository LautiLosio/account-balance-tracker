import { useUser } from "@auth0/nextjs-auth0/client";
import Error from "next/error";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Verified, User, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function AccountSheet() {
  const { user, error, isLoading } = useUser();

  if (error) {
    console.error(error);
    return <Error statusCode={500} />;
  }
  return (
    <>
      {isLoading && <LoadingSpinner />}
      {!user && !isLoading && (
        <SheetHeader>
          <SheetTitle>Sign-in</SheetTitle>
          <SheetDescription className="flex flex-col gap-4">
            <p>Sign-in to access your account details.</p>

            <p>Don&apos;t have an account? Use the button below to sign-up.</p>

            {/* vercel auth0 integration */}
            <div className="flex justify-around gap-4">
              <a href="/api/auth/login" className="flex grow">
                <Button variant="outline" className="grow">
                  <User className="h-4 w-4" />
                  Sign-in
                </Button>
              </a>
            </div>
          </SheetDescription>
        </SheetHeader>
      )}
      {user && user.email_verified && user.name && user.picture && (
        <>
          <SheetHeader>
            <SheetTitle>Account Details</SheetTitle>
          </SheetHeader>
          <Card>
            <CardContent>
              <CardHeader className="px-0">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <Image
                    src={user.picture}
                    className="h-12 w-12 rounded-full"
                    alt={user.name}
                    width={48}
                    height={48}
                  />
                  <h2 className="text-2xl font-bold">{user.nickname}</h2>
                </div>
              </CardHeader>
              <span className="font-semibold">Email:</span>
              <div className="flex items-center">
                {user.email}&nbsp;
                {user.email_verified ? <Verified className="h-4 w-4" /> : null}
              </div>
            </CardContent>
          </Card>
          <SheetFooter className="flex justify-end gap-4">
            <a href="/api/auth/logout" className="flex grow">
              <Button variant="outline" className="grow">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </a>
          </SheetFooter>
        </>
      )}
    </>
  );
}
