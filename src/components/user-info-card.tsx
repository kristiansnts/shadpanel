import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function UserInfoCard() {
  const appName = import.meta.env.VITE_APP_NAME || "Acme Inc."
  const userEmail = "m@example.com"

  const handleLogout = () => {
    console.log('Logout clicked')
  }

  return (
    <Card>
      <CardContent className="py-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <h3 className="text-lg font-semibold">{appName}</h3>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          <Button 
            variant="outline"
            size="lg" 
            onClick={handleLogout}
            className="ml-4 cursor-pointer"
          >
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}