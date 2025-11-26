# DocGen

An intelligent document generation platform that uses AI to create professional Word documents and PowerPoint presentations. Users provide a title and outline, and the AI generates comprehensive content for each section.

## Live Demo

Visit the live application: [https://docagent-29522.web.app](https://docagent-29522.web.app)

## Features

- **AI-Powered Content Generation** - Creates detailed, professional content using Google Gemini API
- **Multiple Document Types** - Generate Word documents (.docx) and PowerPoint presentations (.pptx)
- **Section-by-Section Refinement** - Improve specific sections without regenerating everything
- **Cloud Storage** - Save and manage documents with Firebase Firestore
- **User Authentication** - Secure personal account system with Firebase Auth
- **Export Functionality** - Download generated documents in professional formats
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

### Frontend
- **React** - Component-based UI with hooks (useState, useEffect)
- **Lucide React** - Icon library for modern UI elements
- **Inline CSS** - Custom styling with gradient themes

### Backend & Database
- **Firebase Authentication** - Email/password user authentication
- **Cloud Firestore** - NoSQL database for document storage
- **Firebase Hosting** - Static site hosting with global CDN

### AI Integration
- **Google Gemini API** - Powers content generation
  - Model: gemini-2.5-flash-lite (fast generation)
  - Model: gemini-1.5-flash (content refinement)

### Document Export
- **docx.js** - Creates Word documents (.docx)
- **PptxGenJS** - Generates PowerPoint presentations (.pptx)

## Prerequisites

Before you begin, ensure you have:
- Node.js (v14 or higher)
- npm or yarn
- A Google account for Firebase
- A Gemini API key from Google AI Studio

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-doc-agent.git
cd ai-doc-agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Firebase Setup

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

Enable the following services:
- Authentication (Email/Password)
- Cloud Firestore Database

Update the Firebase configuration in `src/App.jsx`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 4. Set up Firestore Security Rules

In Firebase Console, go to Firestore Database > Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{document} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 5. Get a Gemini API Key

Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to generate your API key.

## Usage

### Run Locally

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase:
```bash
firebase init
```

Select:
- Hosting
- Use existing project (select your project)
- Public directory: `build`
- Single-page app: Yes

4. Build and deploy:
```bash
npm run build
firebase deploy
```

Your app will be live at `https://YOUR_PROJECT.firebaseapp.com`

## Project Structure

```
ai-doc-agent/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx          # Main application component
│   └── index.js         # React entry point
├── .gitignore
├── firebase.json        # Firebase configuration
├── package.json         # Dependencies and scripts
└── README.md
```

## How It Works

### User Flow

1. **Authentication** - Sign up or sign in with email/password
2. **Document Type Selection** - Choose Word Document or PowerPoint
3. **Create Outline** - Define sections with titles and descriptions
4. **API Key Entry** - Provide Gemini API key for content generation
5. **Generate Content** - AI creates detailed content for each section
6. **Refine & Edit** - Improve specific sections with AI assistance
7. **Save & Export** - Save to cloud or download in desired format

### Content Generation Process

- Uses Google Gemini API to generate 200-300 words per section
- Each section is generated independently based on its title and description
- Refinement feature allows iterative improvements using natural language prompts
- All generation happens client-side with user-provided API keys

## Security Considerations

### Firebase Configuration
The Firebase API key in the code is safe to expose publicly because:
- Firebase client API keys are designed for public use
- Security is enforced through Firestore security rules
- Authentication is required for all database operations

### API Key Management
- Users provide their own Gemini API keys
- Keys are not stored in the database
- Each user's API usage is tied to their own account

### Data Privacy
- Firestore rules ensure users can only access their own documents
- All documents are private by default
- Authentication required for all operations

## License

This project is open source and available under the MIT License.
