# Fraud Shield Frontend

A modern React-based web application built with Vite for detecting and managing fraud cases. This frontend interfaces with a fraud detection backend system to provide users with real-time analysis, reporting, and case management capabilities.

🌐 **[Click here to view the Live Website](https://vhackfrauddetect.netlify.app/)**

## 🎯 Project Overview

**Fraud Shield Frontend** is part of the vhack fraud detection initiative. This application provides a user-friendly interface for:
- Monitoring and analyzing potential fraud cases
- Generating detailed reports (PDF exports)
- Managing fraud detection workflows
- Real-time data visualization

## 📋 Tech Stack

| Category | Technologies |
|----------|--------------|
| **Framework** | React 19.2.0 |
| **Build Tool** | Vite 7.3.1 |
| **Routing** | React Router DOM 7.13.1 |
| **Backend Integration** | Firebase 12.10.0 |
| **UI Components** | Lucide React (Icons) |
| **PDF Generation** | jsPDF + jsPDF AutoTable |
| **Linting** | ESLint 9.39.1 |
| **Styling** | CSS (14.6% of codebase) |

**Language Composition:**
- JavaScript: 84.5%
- CSS: 14.6%
- HTML: 0.9%

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yys-beep/vhack_fraud_frontend.git
cd vhack_fraud_frontend/fraud-shield-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file in the fraud-shield-frontend directory
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_API_URL=http://localhost:8000  # Backend API URL
```

### Development

Start the development server with hot module replacement (HMR):
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create an optimized production build:
```bash
npm run build
```

### Preview

Preview the production build locally:
```bash
npm run preview
```

### Linting

Run ESLint to check code quality:
```bash
npm run lint
```

## 📁 Project Structure

```
fraud-shield-frontend/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Page components for routes
│   ├── services/        # Firebase and API service functions
│   ├── hooks/           # Custom React hooks
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── package.json         # Dependencies and npm scripts
├── vite.config.js       # Vite configuration
├── eslint.config.js     # ESLint configuration
└── README.md            # This file
```

## 🔑 Key Features

- **Real-time Fraud Detection**: Monitor and analyze fraud cases as they're detected
- **Interactive Dashboards**: Visual representation of fraud analytics and trends
- **PDF Report Generation**: Export detailed fraud analysis reports using jsPDF
- **Case Management**: Organize and track fraud investigations
- **Modern UI**: Responsive interface with Lucide React icons
- **Firebase Integration**: Cloud-based data storage and authentication
- **Fast Development**: Instant hot reload with Vite
- **Code Quality**: ESLint configuration for consistent code standards
- **API Integration**: Seamless connection with the Fraud Shield Backend

## 🔗 Architecture & Related Projects

### Backend API
This frontend connects to the **[vhack_fraud_backend](https://github.com/yys-beep/vhack_fraud_backend)** - a Python-based FastAPI that:
- Runs XGBoost and scikit-learn fraud detection models
- Provides ML predictions via REST API endpoints
- Manages fraud case data and analysis
- Deployed on Render

**Backend Tech Stack:**
- FastAPI with Uvicorn
- XGBoost & scikit-learn (ML models)
- Pandas for data processing
- Pydantic for data validation

**Backend Setup & Deployment:**
- See [vhack_fraud_backend README](https://github.com/yys-beep/vhack_fraud_backend) for setup instructions
- Backend is deployed on [Render](https://render.com)

### System Architecture
```
┌─────────────────────────────┐
│   React Frontend (Vite)      │
│   - Dashboards              │
│   - Reports (PDF)           │
│   - Case Management         │
└──────────────┬──────────────┘
               │ HTTP/REST
               ↓
┌─────────────────────────────┐
│   FastAPI Backend (Render)   │
│   - Fraud Detection API     │
│   - ML Model Integration    │
│   - Data Management         │
└──────────────┬──────────────┘
               │ ML Processing
               ↓
┌─────────────────────────────┐
│  XGBoost + scikit-learn     │
│  - Fraud Models             │
│  - Predictions              │
└─────────────────────────────┘

Firebase (Side Integration)
│
├── User Authentication
├── Data Storage (Firestore)
└── File Storage (Cloud Storage)
```

## 🔧 Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |

## 📦 Dependencies

### Core
- **React 19.2.0**: UI library for building the interface
- **React Router DOM 7.13.1**: Client-side routing for navigation
- **Vite 7.3.1**: Next-generation build tool and dev server

### Features
- **Firebase 12.10.0**: Backend services and authentication
- **jsPDF 4.2.0**: PDF document generation
- **jsPDF AutoTable 5.0.7**: Table formatting for PDF exports
- **Lucide React 0.577.0**: Icon library for UI components

### Development
- **ESLint 9.39.1**: JavaScript linting and code quality
- **Vite Plugins**: React support and optimization
- **@types packages**: TypeScript definitions for development

## 🔐 Environment Configuration

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication, Firestore Database, and Cloud Storage
3. Get your Firebase config and add to `.env`

### Backend API
Ensure the `VITE_API_URL` environment variable points to your backend:
- Development: `http://localhost:8000`
- Production: Your Render backend URL

## 🌐 Deployment

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify
```bash
# Build first
npm run build

# Deploy the dist folder to Netlify
```

### Deploy to GitHub Pages
Update `vite.config.js` with:
```javascript
export default {
  base: '/vhack_fraud_frontend/'
}
```

## 🧪 Testing (Optional)

If tests are added to the project:
```bash
npm run test
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test thoroughly
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 License

This project is currently unlicensed. Please contact the repository owner for licensing information.

## 📞 Support & Issues

For issues, questions, or contributions:
1. Check existing [GitHub Issues](https://github.com/yys-beep/vhack_fraud_frontend/issues)
2. Open a new issue with detailed information
3. Include screenshots or error logs when reporting bugs
4. Submit a pull request with improvements

## 🔗 Useful Resources

### Documentation
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [Lucide React Icons](https://lucide.dev)

### Related Repositories
- **Backend Repository**: [vhack_fraud_backend](https://github.com/yys-beep/vhack_fraud_backend)
- **EDA Notebook**: [Data Analysis & Preprocessing](https://colab.research.google.com/drive/1BP2KAiXkH02Ln1xZw34iODUkB1BPK57g?usp=sharing)

### Deployment Platforms
- [Render](https://render.com) - Backend deployment
- [Vercel](https://vercel.com) - Frontend deployment option
- [Netlify](https://netlify.com) - Frontend deployment option

## 🚀 Getting Help

- **Firebase Issues**: Check [Firebase Support](https://firebase.google.com/support)
- **React Issues**: Visit [React Community](https://react.dev/community/meet-the-team)
- **Backend Issues**: See [Backend README](https://github.com/yys-beep/vhack_fraud_backend)
- **Vite Issues**: Check [Vite GitHub Issues](https://github.com/vitejs/vite/issues)

---

**Repository**: [yys-beep/vhack_fraud_frontend](https://github.com/yys-beep/vhack_fraud_frontend)

**Created**: March 11, 2026

**Last Updated**: June 5, 2026
