import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./lib/theme-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Users from "@/pages/users";
import Cart from "@/pages/cart";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Payments from "@/pages/payments";
import Notifications from "@/pages/notifications";
import ApiGateway from "@/pages/api-gateway";
import Docker from "@/pages/docker";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/products" component={Products}/>
      <Route path="/users" component={Users}/>
      <Route path="/cart" component={Cart}/>
      <Route path="/orders" component={Orders}/>
      <Route path="/orders/:id" component={OrderDetail}/>
      <Route path="/payments" component={Payments}/>
      <Route path="/notifications" component={Notifications}/>
      <Route path="/api-gateway" component={ApiGateway}/>
      <Route path="/docker" component={Docker}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <Router />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
