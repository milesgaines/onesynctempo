import LoginForm from "@/components/auth/LoginForm";
import AuthWrapper from "../auth-provider-wrapper";

export default function LoginFormStoryboard() {
  return (
    <AuthWrapper>
      {() => (
        <div className="bg-background min-h-screen">
          <LoginForm />
        </div>
      )}
    </AuthWrapper>
  );
}
