
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view?: "login" | "register";
  onSwitchView?: (view: "login" | "register") => void;
}

export function AuthModal({ open, onOpenChange, view = "login", onSwitchView }: AuthModalProps) {
  const [activeTab, setActiveTab] = React.useState<"login" | "register">(view);

  React.useEffect(() => {
    setActiveTab(view);
  }, [view]);

  const handleTabChange = (value: string) => {
    const newView = value as "login" | "register";
    setActiveTab(newView);
    if (onSwitchView) {
      onSwitchView(newView);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white border border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {activeTab === "login" ? "Login to Your Account" : "Create an Account"}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-zinc-800">
            <TabsTrigger value="login" className="data-[state=active]:bg-purple-600">Login</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-purple-600">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
