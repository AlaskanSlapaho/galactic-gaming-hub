
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Search, AlertTriangle, UserPlus, UserMinus } from "lucide-react";

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  
  // Check if user is admin, if not redirect
  useEffect(() => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
      });
      navigate("/");
    }
  }, [isAdmin, navigate, toast]);
  
  const handleVerify = () => {
    // In a real app, this would check against a stored code
    const storedCode = localStorage.getItem("admin_verification_code");
    
    if (verificationCode === storedCode) {
      setIsVerified(true);
      toast({
        title: "Verification Successful",
        description: "You now have access to admin functions",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Invalid verification code",
      });
    }
  };
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin Panel</h1>
      
      {!isVerified ? (
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle>Admin Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4 bg-zinc-800 p-4 rounded-md mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p>
                  For security reasons, you need to verify your admin access using the code sent to the Discord webhook.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            <Button onClick={handleVerify} className="w-full bg-purple-600 hover:bg-purple-700">
              Verify Admin Access
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search users by username"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                />
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              
              <div className="bg-zinc-800 p-4 rounded-md">
                <div className="text-center text-zinc-400 py-6">
                  User data will appear here. In the meantime, you can use chat commands:
                  <div className="mt-4 text-left space-y-2">
                    <div className="bg-zinc-900 p-2 rounded font-mono text-sm">
                      /addcredits username amount
                    </div>
                    <div className="bg-zinc-900 p-2 rounded font-mono text-sm">
                      /removecredits username amount
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle>Transaction Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-zinc-400 py-6">
                Transaction logs will be displayed here once users start playing.
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminPanel;
