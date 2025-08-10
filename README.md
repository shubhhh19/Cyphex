# 🛡️ Cyphex - Advanced Email Security Scanner 🛡️

<div align="center">

<img src="https://img.shields.io/badge/version-1.0-orange" alt="Version" />

```
  ██████╗██╗   ██╗██████╗ ██╗  ██╗███████╗██╗  ██╗
██╔════╝╚██╗ ██╔╝██╔══██╗██║  ██║██╔════╝╚██╗██╔╝
██║      ╚████╔╝ ██████╔╝███████║█████╗   ╚███╔╝ 
██║       ╚██╔╝  ██╔═══╝ ██╔══██║██╔══╝   ██╔██╗ 
╚██████╗   ██║   ██║     ██║  ██║███████╗██╔╝ ██╗
 ╚═════╝   ╚═╝   ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
```

_Advanced email security scanner that checks if your email has been exposed in data breaches_

**🚀 Now deployed on Vercel!**
**📅 Updated: December 2024**

</div>

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#️-technology-stack)
- [Installation](#-installation)
- [API Endpoints](#-api-endpoints)
- [Security Features](#-security-features)
- [Interesting Parts During Build](#-interesting-parts-during-build)
- [Challenges and Solutions](#-challenges-and-solutions)
- [Future Updates](#-future-updates)
- [Author](#-author)


## 🌟 Features

- ✨ **Real-time Breach Detection**: Check your email against thousands of known data breaches
- 🎯 **Risk Assessment**: Get comprehensive risk scores and threat profiles
- 📊 **Detailed Analytics**: View specific breach details and exposure information
- 🔒 **Privacy Protection**: Your email is processed securely with privacy protection
- 🌐 **Modern UI**: Clean, responsive interface with real-time updates
- 📈 **Breach Statistics**: Track breach trends and exposure patterns
- ⚡ **Fast Processing**: Quick results with optimized API integration
- 📱 **Responsive Design**: Works seamlessly on all devices

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Axios** - HTTP client for API calls
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Styling and animations
- **JavaScript (ES6+)** - Client-side functionality
- **Tailwind CSS** - Utility-first CSS framework

### APIs & Services
- **Breach Data Services** - Comprehensive breach database
- **Google Cloud Vision** - Image processing (planned)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/shubhhh19/Cyphex.git
cd Cyphex
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## 🔌 API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status and uptime information

### Breach Check
- **POST** `/api/check-breach`
- Body: `{ "email": "user@example.com" }`
- Returns comprehensive breach analysis and risk assessment

### Response Format
```json
{
  "breachScore": 75,
  "threatProfileSummary": "High risk. Multiple breaches detected.",
  "breachDetails": [
    {
      "name": "LinkedIn Breach 2012",
      "date": "2012-06-06",
      "description": "Email found in LinkedIn breach",
      "dataTypes": ["Email addresses", "Passwords"],
      "affectedAccounts": 165000000,
      "domain": "linkedin.com",
      "industry": "Professional Networking",
      "passwordRisk": "High"
    }
  ],
  "analytics": {
    "BreachMetrics": {
      "risk": [{"risk_label": "High", "risk_score": 75}],
      "passwords_strength": [{"PlainText": 0, "EasyToCrack": 2, "StrongHash": 0}]
    }
  }
}
```

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Input Validation**: Secure email validation and sanitization
- **Security Headers**: Helmet.js for comprehensive protection
- **CORS Protection**: Cross-origin resource sharing configuration
- **Error Handling**: Secure error responses without data leakage
- **No Data Storage**: Emails are not stored or logged
- **Privacy First**: Email hashing for enhanced security

## 🏗️ Interesting Parts During Build

1. **API Integration**
   - Implemented robust breach data service integration
   - Developed custom error handling for various API responses
   - Built comprehensive data parsing and formatting system

2. **Risk Assessment Engine**
   - Created sophisticated risk scoring algorithm
   - Implemented threat profile generation based on breach data
   - Developed breach categorization and severity analysis

3. **User Interface**
   - Designed intuitive and responsive web interface
   - Implemented real-time result display with dynamic updates
   - Added interactive elements for better user experience

4. **Security Implementation**
   - Integrated multiple security middleware layers
   - Implemented comprehensive input validation
   - Added rate limiting and abuse prevention

## 🎯 Challenges and Solutions

1. **Challenge**: API rate limiting and response handling
   - **Solution**: Implemented robust error handling and retry mechanisms
   - Added fallback responses for service failures
   - Created comprehensive logging for debugging

2. **Challenge**: Accurate risk assessment and scoring
   - **Solution**: Developed custom algorithm considering multiple factors
   - Implemented weighted scoring based on breach severity
   - Added support for different data types and exposure levels

3. **Challenge**: Real-time UI updates and user feedback
   - **Solution**: Built asynchronous processing with progress indicators
   - Implemented dynamic result rendering
   - Added comprehensive error messaging

4. **Challenge**: Cross-browser compatibility and responsive design
   - **Solution**: Used modern CSS with progressive enhancement
   - Implemented mobile-first responsive design
   - Added browser-specific optimizations

## 🔮 Future Updates

1. **Coming Soon**
   - Password strength checking
   - Breach notification system
   - Advanced analytics dashboard
   - Mobile application

2. **Planned Improvements**
   - Enhanced breach data visualization
   - Additional security services integration
   - Real-time breach monitoring
   - User account system with history tracking

3. **Advanced Features**
   - Domain-wide breach analysis
   - Custom security recommendations
   - Integration with password managers
   - API for third-party applications

## 👨‍💻 Author

**Shubh Soni**
- GitHub: [@shubhhh19](https://github.com/shubhhh19)
- LinkedIn: [Shubh Soni](https://linkedin.com/in/shubhsoni)
- Website: [shubhsoni.framer.website](https://shubhsoni.framer.website/)
- Email: sonishubh2004@gmail.com



---

<div align="center">

**Cyphex** - Your digital security command center 🛡️

</div> 

<!-- Trigger redeploy --> 