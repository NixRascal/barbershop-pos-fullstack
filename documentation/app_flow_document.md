# App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new user visits the Barbershop POS application, they first land on a clean welcome page that briefly describes the app and offers buttons to sign in or sign up. Clicking Sign Up takes the user to a simple registration form where they provide an email address, choose a secure password, and select their role: Cashier, Admin, or Stakeholder. Once they submit this information, they receive a confirmation email with a link to verify their account. After verification, they are redirected to the sign-in page.

To sign in, the user enters their registered email and password on the login page. The system validates these credentials and, if they match, grants access to the dashboard. In case the user forgets their password, they can click a Forgot Password link. This brings up a form where they enter their email. The application sends a password reset link to the provided address. Clicking the link opens a secure page where the user sets a new password. After successful reset, they return to the sign-in page. Users can sign out at any time by clicking the Sign Out option located in the top header, which immediately ends their session and redirects them to the login screen.

## Main Dashboard or Home Page

After signing in, the user arrives on the main dashboard. At the top, a header displays the app logo on the left and their profile avatar on the right, which opens account options. A vertical sidebar on the left lists navigation links that change based on the user role. Cashiers see links for POS and Cash Sessions. Admins see links for Master Data, Reports, Users, and Settings. Stakeholders see links for Dashboard, Reports, and Profile.

The central area of the dashboard shows a welcome message and quick summary cards that update depending on the role. Cashiers might see a prompt to open a new cash session. Admins see counts of services, employees, and pending approvals. Stakeholders see high-level KPIs such as today’s sales and active sessions. From here, users click the sidebar links to move to any module in the app.

## Detailed Feature Flows and Page Transitions

When a Cashier selects the POS link, they arrive at the service selection screen. Here the page displays a grid of service cards labeled with names and photos. Cashiers click cards to add services to the order cart shown on the right side of the screen. Each time an item is added, the cart updates to show service details, assigned employee, quantity, and subtotal. Cashiers can adjust quantities, change the assigned employee from a dropdown, or remove items. When the cart is ready, clicking Checkout opens a payment modal. The modal lets them choose payment methods and enter amounts. Confirming payment triggers a server-side action that creates the Order, OrderItems, Payment, and associated Commission records in a single database transaction. On success, a receipt view appears with print and email options.

If the Cashier clicks Cash Sessions, they go to a page showing the current session status. They can open a new session by entering starting cash and clicking Open Session. At the end of a shift, they enter closing cash and click Close Session. The system calculates variance and logs all entries in a ledger table visible below. Each entry shows the timestamp, total sales, and cash variance.

For Admins, clicking Master Data takes them to a main master data hub. From there they choose Services, Service Categories, Employees, or Commission Rules by clicking sublinks at the top of the page. On each of these pages, a table lists existing records. Admins can click Create New to open a form for adding a record or click an Edit icon next to a row to update it. Forms validate inputs in real time and show clear error messages if fields are invalid. After save, the table refreshes to show the updated list. Admins can also import CSV files to bulk-upload data or export the current table to CSV for backup.

In the Reports section, both Admins and Stakeholders see a list of report types such as Daily Sales, Employee Performance, and Commission Summaries. Clicking a report name transitions to a report page that runs a server query, then displays the results in interactive charts and tables. Users can filter by date range, employee, or service category. Each report page includes an Export to PDF or Excel button that generates a file for download.

Stakeholders who click Dashboard see a read-only view with high-level metrics. This page uses KPI cards, line charts for sales trends, and bar charts for commission distributions. The data is fetched in real time on page load and updated if the user changes filters or refreshes.

## Settings and Account Management

Every user has access to a Profile page via the header menu. On this page they can update their name, email preferences, and avatar. If they click Change Password, they open a secure form requiring their current password and the new password twice. Upon successful change, a confirmation message appears and they remain on the profile page. Notification preferences let users opt in or out of email summaries, password change alerts, or report exports. After saving preferences, a toast notification confirms the update. From Settings, users can click Back to Dashboard, which returns them to the main homepage.

If an organization uses a paid plan, the Settings area also includes a Billing tab. Here users with Admin or Stakeholder roles can view their current subscription, update payment methods, or download invoices. Any changes are sent to the payment provider via a secure server-side API call, and the page refreshes to show the new billing status.

## Error States and Alternate Paths

If a user enters an incorrect email or password on sign-in, the app displays a clear inline error beneath the input fields, prompting the user to try again. During registration or password reset, if the email service is unreachable, an error banner appears at the top of the form advising the user to check their connection. While filling out any form, invalid or missing data triggers real-time form validation with red borders and helper text explaining the issue.

If a user tries to access a page they are not authorized for, for example a Cashier visiting the Admin panel, the system detects the role mismatch in middleware and redirects them to an Access Denied page. This page shows a brief message and a button to return to the dashboard. In case the server goes down or the database connection fails, the app shows a full-screen error page with a Retry button that attempts to reconnect. During network interruptions, a small offline banner appears at the bottom of the screen until connectivity is restored.

If a payment fails during checkout, the payment modal remains open and displays the error message from the payment gateway. The Cashier can correct the payment details or choose another method. For failed report exports, users see an error toast and can retry the export immediately.

## Conclusion and Overall App Journey

A first-time user arrives at the landing page, signs up with a role selection, verifies their email, and logs in. They land on a role-specific dashboard and navigate via the sidebar to the key modules they need. Cashiers use the POS to build orders, handle payments, and manage cash sessions. Admins oversee all master data, user accounts, and run detailed reports. Stakeholders monitor the business with a read-only intelligence dashboard. Along the way, users can manage their profile and notification settings, handle errors gracefully, and always find clear paths back to the main dashboard. This streamlined flow ensures everyone from Barbershop staff to managers can complete their daily tasks efficiently and with confidence.