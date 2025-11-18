# Pweza Admin Panel

A comprehensive React-based admin panel for managing the Pweza soccer prediction platform.

## 🚀 Features

### 🔐 Authentication
- **Admin Login**: Phone number and password authentication
- **Token-based Auth**: Secure JWT token storage in localStorage
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Logout Functionality**: Secure logout with token cleanup

### 👤 Tipster Management
- **List All Tipsters**: View all registered tipsters with pagination
- **Search & Filter**: Search by name/phone, filter by status
- **Approve/Reject**: Approve or reject tipster applications
- **Rating Display**: Show tipster ratings, win rates, and subscriber counts
- **Profile View**: View detailed tipster information

### 🧠 Prediction Management
- **Comprehensive Listing**: View all predictions with detailed information
- **Advanced Filtering**: Filter by tipster, status, result, date range
- **Status Management**: Mark predictions as WON, LOST, PENDING, or VOID
- **Edit & Delete**: Modify prediction details or remove predictions
- **Image Preview**: View prediction slip images
- **Booking Codes**: Display betting site booking codes

### 👥 Customer Management
- **Customer List**: View all registered customers
- **Subscription Tracking**: Monitor customer subscription status
- **Filter by Status**: Filter customers by active/expired subscriptions

### 💳 Subscription & Payment Monitoring
- **Subscription Overview**: View all subscriptions (daily, weekly, monthly)
- **Tipster Earnings**: Track tipster revenue from subscriptions
- **Payment Status**: Monitor payment processing status

### 📊 Dashboard Analytics
- **KPI Overview**: Total tipsters, active customers, predictions today, success rate
- **Performance Metrics**: Weekly prediction outcomes and subscription trends
- **Real-time Data**: Live statistics from the backend API

## 🛠️ Technical Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router
- **HTTP Client**: Fetch API with custom service layer
- **Build Tool**: Vite
- **UI Components**: Custom component library

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── AdminSignInForm.tsx      # Admin login form
│   ├── common/
│   │   ├── ProtectedRoute.tsx       # Route protection component
│   │   └── PageMeta.tsx             # Page metadata
│   ├── header/
│   │   └── UserDropdown.tsx         # User menu with logout
│   └── ui/                          # Reusable UI components
├── context/
│   └── AuthContext.tsx              # Authentication state management
├── pages/
│   ├── AuthPages/
│   │   └── AdminSignIn.tsx          # Admin sign-in page
│   ├── Dashboard/
│   │   └── PwezaDashboard.tsx       # Main dashboard
│   ├── Tipsters/
│   │   └── TipstersList.tsx         # Tipster management
│   └── Predictions/
│       └── PredictionsList.tsx      # Prediction management
├── services/
│   └── api.ts                       # API service layer
└── layout/
    ├── AppLayout.tsx                # Main layout wrapper
    ├── AppHeader.tsx                # Header with navigation
    └── AppSidebar.tsx               # Sidebar navigation
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Pweza Laravel API running on `http://localhost:8000`

### Installation Steps

1. **Clone and Install Dependencies**
   ```bash
   cd pweza-admin
   npm install
   ```

2. **Configure API Endpoint**
   - Update `API_BASE_URL` in `src/services/api.ts` if needed
   - Default: `http://localhost:8000/api`

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Admin Panel**
   - Navigate to `http://localhost:5173/`
   - Use admin credentials from Laravel backend

## 🔌 API Integration

The admin panel integrates with the following Laravel API endpoints:

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/logout` - Logout
- `GET /api/me` - Get user profile

### Tipster Management
- `GET /api/admin/tipsters` - List tipsters with filters
- `PATCH /api/admin/tipsters/{id}/approve` - Approve tipster
- `PATCH /api/admin/tipsters/{id}/reject` - Reject tipster

### Prediction Management
- `GET /api/admin/predictions` - List predictions with filters
- `PATCH /api/admin/predictions/{id}` - Update prediction
- `DELETE /api/admin/predictions/{id}` - Delete prediction

### Dashboard
- `GET /api/admin/dashboard` - Get dashboard statistics

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first responsive layout
- Collapsible sidebar for mobile devices
- Touch-friendly interface

### Dark Mode Support
- Automatic dark/light mode switching
- Consistent theming across components
- User preference persistence

### Loading States
- Skeleton loading for data tables
- Spinner indicators for async operations
- Error handling with user-friendly messages

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels and semantic HTML

## 🔒 Security Features

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure token storage
- Session timeout handling

### Route Protection
- Protected route wrapper
- Automatic redirect to login
- Role-based access control (ready for implementation)

### Data Validation
- Input validation on forms
- API error handling
- XSS protection through proper escaping

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Create `.env` file for production:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Deployment Options
- **Vercel**: Connect GitHub repository for automatic deployment
- **Netlify**: Drag and drop build folder
- **AWS S3**: Upload build files to S3 bucket
- **Docker**: Containerize the application

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture

## 📱 Mobile Support

The admin panel is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablet devices (iPad, Android tablets)
- Mobile devices (iPhone, Android phones)

## 🔄 State Management

### Authentication State
- User information
- Authentication token
- Login/logout status
- Loading states

### Data State
- Tipsters list with pagination
- Predictions with filters
- Dashboard statistics
- Error handling

## 🎯 Future Enhancements

### Planned Features
- **Real-time Notifications**: WebSocket integration for live updates
- **Advanced Analytics**: Charts and graphs for better insights
- **Bulk Operations**: Mass approve/reject tipsters
- **Export Functionality**: CSV/Excel export for reports
- **Audit Logs**: Track admin actions and changes
- **Multi-language Support**: Internationalization (i18n)

### Performance Optimizations
- **Lazy Loading**: Code splitting for better performance
- **Caching**: API response caching
- **Virtual Scrolling**: For large data tables
- **Image Optimization**: Compress and optimize images

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Check if Laravel API is running
   - Verify API_BASE_URL in api.ts
   - Check CORS configuration on backend

2. **Authentication Issues**
   - Clear localStorage and try logging in again
   - Check token expiration
   - Verify admin credentials

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript compilation errors
   - Verify all dependencies are installed

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## 📞 Support

For technical support or feature requests:
- Check the Laravel API documentation
- Review the component library documentation
- Contact the development team

---

**Pweza Admin Panel** - Empowering administrators to manage soccer prediction platforms efficiently! ⚽🎯 