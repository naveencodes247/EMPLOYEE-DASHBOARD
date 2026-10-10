# outFyt Supabase Confirmation Email Configuration Guide

This guide describes how to apply the official **outFyt** branded email template to your Supabase project (`jfhjlibbdypicynvhfgo`).

---

### Step 1: Open Supabase Email Templates
1. Navigate to your Supabase Dashboard:
   **[https://supabase.com/dashboard/project/jfhjlibbdypicynvhfgo/auth/templates](https://supabase.com/dashboard/project/jfhjlibbdypicynvhfgo/auth/templates)**
2. Click on the **Confirm signup** template tab.

---

### Step 2: Configure Subject Line
In the **Subject** input field, enter:
```text
Confirm your outFyt employee account
```

---

### Step 3: Configure Email Body
1. Open the template file: [`supabase/email-templates/confirm-signup.html`](file:///d:/START-UPS/EMPLOYEE%20WEB/authportal/supabase/email-templates/confirm-signup.html)
2. Copy the entire HTML contents.
3. In the Supabase Dashboard, replace the default template body with the copied HTML.
4. Click **Save Changes**.

---

### Step 4: Verify Assets & Links
- **Official Hosted Logo URL**:
  `https://jfhjlibbdypicynvhfgo.supabase.co/storage/v1/object/public/branding/outfyt-logo.jpeg`
  *(Already uploaded and publicly accessible via HTTP 200 on your project's storage)*.
- **Confirmation Button Link**:
  Uses `{{ .ConfirmationURL }}` which automatically attaches the secure verification token.

---

### Step 5: Verify URL Configuration
1. Go to **Authentication** → **URL Configuration**:
   **[https://supabase.com/dashboard/project/jfhjlibbdypicynvhfgo/auth/url-configuration](https://supabase.com/dashboard/project/jfhjlibbdypicynvhfgo/auth/url-configuration)**
2. Ensure **Site URL** is set to:
   `http://localhost:3000` (or your production domain `https://outfyt.co.in`)
3. Under **Redirect URLs**, ensure:
   - `http://localhost:3000/`
   - `http://localhost:3000/**`
   - `https://outfyt.co.in/**`

---

### Step 6: Test Real Registration
1. Open the outFyt portal Sign Up page.
2. Register an employee or manager with a test email.
3. Check inbox to verify that the email now displays the outFyt logo, subject line, and styling!
