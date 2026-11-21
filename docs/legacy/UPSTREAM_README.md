# Drain Adoption Program

A full-stack web application that allows citizens to adopt and maintain storm drains in their community. Built with React and Spring Boot, deployed on AWS.

---

## 🌟 Features

### For Citizens (Adopters)
- 📍 View available drains on an interactive map
- 🤝 Adopt drains in your neighborhood
- 📝 Add comments with photos to report drain status
- 🗺️ Search drains by location using Google Maps
- 👤 User authentication and profile management

### For Administrators
- ➕ Add new drains to the system with location picker
- 📊 View all adoptions and drain statuses
- 🔔 Receive notifications when drains are adopted or updated
- 🗑️ Moderate comments and manage drains
- 📧 Manage user accounts and roles

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│  React Frontend │─────▶│  Spring Boot API │─────▶│ Prisma Postgres │
│  (AWS Amplify)  │      │ (Elastic Beanst.)│      │   (Database)    │
│                 │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│   Cloudinary    │      │  Google Maps API │
│ (Image Storage) │      │   (Mapping)      │
└─────────────────┘      └──────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Java 17+ and Maven
- AWS Account (Free Tier)
- GitHub Account

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/emilypekarski-netizen/Project-Uni.git
cd Project-Uni
```

**2. Start the backend**
```bash
cd drain-adoption
mvn spring-boot:run
# Backend runs on http://localhost:8080
```

**3. Start the frontend**
```bash
cd drain-adoption-frontend
npm install
npm start
# Frontend runs on http://localhost:3000
```

**4. Create first admin**
```bash
# POST to http://localhost:8080/api/admin/create-first-admin
# Body: {"email": "admin@example.com", "password": "password", "name": "Admin"}
```

---

## ☁️ AWS Deployment

### Quick Deployment (30 minutes)

Follow the [AWS Quick Start Guide](./AWS_QUICK_START.md) for complete deployment instructions.

**What you'll deploy:**
- ✅ Frontend on AWS Amplify (Free Tier)
- ✅ Backend on Elastic Beanstalk (Free Tier)
- ✅ Automated CI/CD with GitHub Actions
- ✅ Total cost: $0/month for 12 months

### Deployment Documentation

| Guide | Description |
|-------|-------------|
| [📘 AWS Quick Start](./AWS_QUICK_START.md) | 30-minute complete deployment guide |
| [📗 Frontend Deployment](./AWS_AMPLIFY_DEPLOYMENT.md) | Detailed AWS Amplify setup |
| [📕 Backend Deployment](./AWS_ELASTIC_BEANSTALK_DEPLOYMENT.md) | Detailed Elastic Beanstalk setup |
| [📙 Security Setup](./BACKEND_SECURITY_SETUP.md) | Security best practices |
| [✅ Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) | Frontend deployment checklist |
| [✅ Backend Checklist](./BACKEND_DEPLOYMENT_CHECKLIST.md) | Backend deployment checklist |

---

## 📁 Project Structure

```
Project-Uni/
├── drain-adoption/                 # Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/example/drainadoption/
│   │       ├── controller/         # REST API endpoints
│   │       ├── model/              # JPA entities
│   │       ├── repository/         # Data access layer
│   │       ├── security/           # JWT authentication
│   │       └── dto/                # Data transfer objects
│   ├── .ebextensions/              # AWS Elastic Beanstalk config
│   ├── Procfile                    # EB startup command
│   └── pom.xml                     # Maven dependencies
│
├── drain-adoption-frontend/        # React Frontend
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── context/                # Auth context
│   │   └── config/                 # API configuration
│   ├── amplify.yml                 # AWS Amplify build spec
│   └── package.json                # npm dependencies
│
├── .github/workflows/              # CI/CD pipelines
│   ├── frontend-ci.yml             # Frontend build & deploy
│   └── backend-ci.yml              # Backend build & deploy
│
└── Documentation/                  # Deployment guides
    ├── AWS_QUICK_START.md
    ├── AWS_AMPLIFY_DEPLOYMENT.md
    ├── AWS_ELASTIC_BEANSTALK_DEPLOYMENT.md
    └── ...
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18
- **Routing:** React Router 6
- **Maps:** Google Maps JavaScript API
- **Styling:** CSS3
- **Image Upload:** Cloudinary
- **Notifications:** React Toastify
- **Hosting:** AWS Amplify

### Backend
- **Framework:** Spring Boot 3.1.5
- **Language:** Java 17
- **Security:** Spring Security + JWT
- **Database:** PostgreSQL (Prisma Postgres)
- **ORM:** Hibernate/JPA
- **Build:** Maven
- **Hosting:** AWS Elastic Beanstalk

### DevOps
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Cloud Provider:** AWS (Free Tier)
- **Monitoring:** CloudWatch

---

## 🔐 Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### Backend (application.properties or AWS Environment Variables)
```properties
DATABASE_URL=jdbc:postgresql://...
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
JWT_SECRET=your_secure_secret_min_32_chars
JWT_EXPIRATION=86400000
CORS_ALLOWED_ORIGINS=http://localhost:3000
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=dev
```

---

## 📖 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register          Register new adopter
POST   /api/auth/login             Login (returns JWT token)
```

### Drain Endpoints
```
GET    /api/drains                 List all drains
POST   /api/drains                 Create drain (admin)
GET    /api/drains/{id}            Get drain details
PUT    /api/drains/{id}            Update drain (admin)
DELETE /api/drains/{id}            Delete drain (admin)
POST   /api/drains/{id}/adopt      Adopt a drain
```

### Comment Endpoints
```
GET    /api/drains/{id}/comments   Get drain comments
POST   /api/drains/{id}/comments   Add comment
DELETE /api/drains/{drainId}/comments/{commentId}  Delete comment (admin)
```

### Admin Endpoints
```
GET    /api/admin/notifications    Get all notifications
PUT    /api/admin/notifications/{id}/read  Mark notification as read
PUT    /api/admin/notifications/read-all   Mark all as read
POST   /api/admin/create-first-admin       Create first admin (one-time)
POST   /api/admin/promote/{userId}         Promote user to admin
```

---

## 🧪 Testing

### Run Backend Tests
```bash
cd drain-adoption
mvn test
```

### Run Frontend Tests
```bash
cd drain-adoption-frontend
npm test
```

### Build for Production
```bash
# Backend
cd drain-adoption
mvn clean package

# Frontend
cd drain-adoption-frontend
npm run build
```

---

## 📊 Database Schema

### Main Entities

**User**
- id, email, password, name, role (ADMIN/ADOPTER)

**Drain**
- id, name, latitude, longitude, address, status
- adopterId (foreign key to User)

**Comment**
- id, text, imageUrl, createdAt
- drainId (foreign key to Drain)
- userId (foreign key to User)

**Notification**
- id, type, message, read, createdAt
- drainId (foreign key to Drain)

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing (BCrypt)
- ✅ Role-based access control (RBAC)
- ✅ CORS configuration
- ✅ SQL injection protection (JPA)
- ✅ XSS protection
- ✅ HTTPS support (in production)
- ✅ Environment variable security

See [Security Setup Guide](./BACKEND_SECURITY_SETUP.md) for details.

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check database connection in `application.properties`
- Ensure PostgreSQL is running
- Verify Java 17 is installed: `java -version`

**Frontend won't start:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node version: `node -v` (should be 16+)

**CORS errors:**
- Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
- Check `SecurityConfig.java` configuration
- Clear browser cache

**Maps not loading:**
- Verify Google Maps API key is set
- Check APIs are enabled: Maps JavaScript, Places, Geocoding
- Ensure billing is enabled in Google Cloud Console

---

## 📝 License

This project is for educational purposes as part of a university project.

---

## 👥 Contributors

- Fabian González - Developer
- Emily Pekarski - Project Manager

---

## 🙏 Acknowledgments

- Spring Boot Team
- React Team
- AWS Free Tier
- Google Maps Platform
- Cloudinary
- Prisma

---

## 📞 Support

For deployment issues, refer to the troubleshooting sections in:
- [Frontend Deployment Guide](./AWS_AMPLIFY_DEPLOYMENT.md)
- [Backend Deployment Guide](./AWS_ELASTIC_BEANSTALK_DEPLOYMENT.md)

For code issues, check the inline documentation and comments.

---

**Live Demo:**
- Frontend: `https://main.xxxxx.amplifyapp.com` (Update after deployment)
- Backend: `http://drain-adoption-env.us-east-1.elasticbeanstalk.com` (Update after deployment)

---

*Last Updated: November 8, 2025*
