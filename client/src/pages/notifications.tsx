import React from 'react';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, MessageSquare, AlertCircle } from 'lucide-react';

const Notifications: React.FC = () => {
  const [emailEnabled, setEmailEnabled] = React.useState(true);
  const [smsEnabled, setSmsEnabled] = React.useState(false);
  const [pushEnabled, setPushEnabled] = React.useState(true);

  const notificationHistory = [
    { id: 1, type: 'email', recipient: 'user@example.com', subject: 'Order Confirmation', status: 'delivered', timestamp: new Date(Date.now() - 15 * 60000) },
    { id: 2, type: 'email', recipient: 'user@example.com', subject: 'Shipping Update', status: 'delivered', timestamp: new Date(Date.now() - 120 * 60000) },
    { id: 3, type: 'email', recipient: 'user@example.com', subject: 'Payment Confirmation', status: 'delivered', timestamp: new Date(Date.now() - 240 * 60000) },
    { id: 4, type: 'sms', recipient: '+1234567890', subject: 'Order Shipped', status: 'failed', timestamp: new Date(Date.now() - 480 * 60000) },
  ];

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Notification Service</h1>
        <p className="mt-1 text-sm text-gray-600">Manage email and SMS notifications for your e-commerce platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationHistory.length > 0 ? (
                  notificationHistory.map((notification) => (
                    <div key={notification.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className={`rounded-full p-2 ${notification.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="ml-4">
                          <p className="font-medium">{notification.subject}</p>
                          <p className="text-sm text-gray-500">
                            To: {notification.recipient} • {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${notification.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {notification.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No notification history available</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Notifications</Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive order and shipping updates via email
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive text messages for important updates
                    </p>
                  </div>
                  <Switch 
                    id="sms-notifications" 
                    checked={smsEnabled}
                    onCheckedChange={setSmsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts in your browser or mobile app
                    </p>
                  </div>
                  <Switch 
                    id="push-notifications" 
                    checked={pushEnabled}
                    onCheckedChange={setPushEnabled}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Save Settings</Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Email Service</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">SMS Service</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Push Notifications</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    Operational
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;
