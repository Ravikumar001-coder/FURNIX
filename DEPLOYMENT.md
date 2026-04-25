# Furnix Deployment Checklist

Follow these steps to deploy the Furnix platform to a production environment.

## 1. Environment Variables
Create a `.env` file in the root (or configure your CI/CD provider) with the following keys. 
Refer to `.env.example` for details.

### Backend Required:
- `DB_USERNAME`: Database user
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: A long, random string for token signing
- `CLOUDINARY_CLOUD_NAME`: For image storage
- `CLOUDINARY_API_KEY`: For image storage
- `CLOUDINARY_API_SECRET`: For image storage
- `GOOGLE_CLIENT_ID`: (Optional) for Google Login

### Frontend Required:
- `VITE_API_BASE_URL`: URL of your deployed backend (e.g., `https://api.furnix.com/api`)
- `VITE_GOOGLE_CLIENT_ID`: Same as backend

## 2. Backend Build & Deploy
1. Ensure Java 17+ is installed.
2. Run `./mvnw clean package -DskipTests` to generate the JAR.
3. Deploy the JAR to your server.
4. Ensure the database (`carpenter_db`) is created on the production MySQL server.

## 3. Frontend Build & Deploy
1. Run `npm install` in `carpenter-frontend`.
2. Run `npm run build`.
3. Deploy the contents of the `dist` folder to your static hosting (Vercel, Netlify, or Nginx).
4. **Important**: Configure your host to fallback to `index.html` for SPA routing.

## 4. Post-Deployment Verification
- [ ] Verify SSL (HTTPS) is active.
- [ ] Login to Admin Panel and change default password (if any).
- [ ] Test the "Custom Order" form submission.
- [ ] Upload a test product to verify Cloudinary integration.
- [ ] Verify WhatsApp links point to the correct number.

## 5. Security Hardening
- [ ] Set `app.seed.reset-admin-password=false` in production.
- [ ] Ensure `REFRESH_COOKIE_SECURE=true` if using HTTPS.
- [ ] Rotate `JWT_SECRET` every 90 days.
