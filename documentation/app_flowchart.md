flowchart TD
  Start[Start]
  Auth[Sign In]
  Start --> Auth
  Auth --> RoleCheck{Valid Credentials}
  RoleCheck -->|Yes| RoleDetect{Determine Role}
  RoleCheck -->|No| AuthFailed[Authentication Failed]
  RoleDetect -->|Cashier| CashierDashboard[Cashier Dashboard]
  RoleDetect -->|Admin| AdminDashboard[Admin Dashboard]
  RoleDetect -->|Stakeholder| StakeholderDashboard[Stakeholder Dashboard]
  CashierDashboard --> OpenSession[Open Cash Session]
  OpenSession --> POSInterface[POS Interface]
  POSInterface --> SelectServices[Select Services]
  SelectServices --> AddToCart[Add to Cart]
  AddToCart --> Checkout[Checkout]
  Checkout --> RecordTransaction[Record Transaction]
  RecordTransaction --> CloseSession[Close Cash Session]
  CloseSession --> CashierDashboard
  AdminDashboard --> ManageMasterData[Manage Master Data]
  ManageMasterData --> Services[Manage Services]
  ManageMasterData --> Employees[Manage Employees]
  ManageMasterData --> CommissionRules[Manage Commission Rules]
  StakeholderDashboard --> ViewKPI[View KPI Cards]
  StakeholderDashboard --> ViewReports[View Reports]