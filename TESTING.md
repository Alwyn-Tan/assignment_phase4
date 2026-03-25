# Testing Checklist And Results

Date: 2026-03-25

Test environment:
- App URL: `http://localhost:3000`
- Start command: `npm start`
- Syntax check: `npm run check`

Demo accounts:
- Admin: `admin@futuredrinks.test` / `Admin123!`
- Normal user: `user@futuredrinks.test` / `User12345!`

## Manual Testing Checklist

### A. Guest / Unauthenticated

- Open `/`
  Expected:
  - Header shows `guest`
  - `Login` and `Register` are visible
  - `Admin` and `Logout` are hidden
  - `Cart` appears to the left of the login area

- Open `/admin`
  Expected:
  - Redirect to `/login`

- Open `/change-password`
  Expected:
  - Redirect to `/login`

- Try to browse products on `/` and `/product.html?pid=1`
  Expected:
  - Product list and product detail still work without login

### B. Login

- Open `/login`
  Expected:
  - Login page loads normally
  - Demo account hints are visible

- Login with wrong email or wrong password
  Expected:
  - Error message appears
  - Stay on the login page

- Login with admin account
  Expected:
  - Redirect to `/admin`

- Login with normal user account
  Expected:
  - Redirect to `/`

### C. Registration

- Open `/register`
  Expected:
  - Registration page loads normally

- Register a new user with matching passwords
  Expected:
  - Registration succeeds
  - User is logged in automatically
  - Redirect to `/`

- Register again with the same email
  Expected:
  - Error that the email already exists

- Register with mismatched passwords
  Expected:
  - Error that the two passwords do not match

### D. Header State

- After normal user login
  Expected:
  - Username replaces `guest`
  - `Password` and `Logout` are visible
  - `Admin` is hidden

- After admin login
  Expected:
  - Username replaces `guest`
  - `Password`, `Admin`, and `Logout` are visible

### E. Admin Authorization

- Normal user opens `/admin`
  Expected:
  - Redirect to `/`

- Normal user attempts admin actions from the UI
  Expected:
  - Access denied

- Admin opens `/admin`
  Expected:
  - Admin page loads
  - Category and product data load normally

### F. Admin CRUD Regression

- Admin creates a category
  Expected:
  - New category appears in the table

- Admin edits a category
  Expected:
  - Updated name appears in the table

- Admin deletes an empty category
  Expected:
  - Category is removed

- Admin creates, edits, and deletes a product
  Expected:
  - Product table updates correctly

- Admin tries to delete a category that still has products
  Expected:
  - Deletion is blocked with an error

### G. Change Password

- Logged-in user opens `/change-password`
  Expected:
  - Page loads normally

- Submit wrong current password
  Expected:
  - Error message appears

- Submit correct current password and matching new passwords
  Expected:
  - Password changes successfully
  - User is logged out
  - Redirect to `/login`

- Try old password after change
  Expected:
  - Login fails

- Try new password after change
  Expected:
  - Login succeeds

### H. Logout

- Click `Logout`
  Expected:
  - Session is cleared
  - Redirect to `/login`

- After logout, open `/admin`
  Expected:
  - Redirect to `/login`

### I. Cookie Checks In Browser DevTools

- After login, inspect cookie `fd_auth`
  Expected:
  - Present
  - `HttpOnly` enabled
  - Has an expiry time
  - `SameSite=Lax`

- On local HTTP development server
  Expected:
  - `Secure` is not set on localhost HTTP
  - This is expected in local non-HTTPS testing

### J. Remaining Phase 4 Gaps

- CSRF hidden field and nonce validation are not implemented yet
- HTTPS / TLS deployment is not implemented yet
- Secure cookies for production HTTPS still need deployment verification

## Self-Test Results

### Automated / CLI Checks Run By Codex

- `npm run check`
  Result: PASS

### HTTP Flow Self-Test

| ID | Scenario | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| T1 | Guest `GET /api/auth/me` | `200` with `authenticated:false` | `200`, body `{\"authenticated\":false,\"user\":null}` | PASS |
| T2 | Guest `GET /admin` | Redirect to `/login` | `302`, `Location: /login` | PASS |
| T3 | Guest `POST /api/categories` | Blocked | `401`, body `Please log in first.` | PASS |
| T4 | Admin login | Login success and auth cookie | `200`, redirect target `/admin`, `Set-Cookie: fd_auth=...; HttpOnly; SameSite=Lax` | PASS |
| T5 | Admin create category | Category created | `201`, body `{\"catid\":5,\"name\":\"Self Test Category\"}` | PASS |
| T6 | Normal user login | Login success and redirect to `/` | `200`, body redirect target `/` | PASS |
| T7 | Normal user `GET /admin` | Redirect away from admin page | `302`, `Location: /` | PASS |
| T8 | Normal user `POST /api/categories` | Forbidden | `403`, body `Admin access is required.` | PASS |
| T9 | Normal user change password | Success and session cleared | `200`, `Set-Cookie` clears `fd_auth`, body `redirectTo:/login` | PASS |
| T10 | Old session after password change | Logged out | `200`, body `{\"authenticated\":false,\"user\":null}` | PASS |
| T11 | Old password login after password change | Fail | `400`, body `Email or password is incorrect.` | PASS |
| T12 | New password login after password change | Success | `200`, login succeeded | PASS |
| T13 | Revert normal user password to default | Success | `200`, password restored to `User12345!` | PASS |
| T14 | Admin cleanup self-test category | Success | `200`, body `{\"success\":true}` | PASS |

### Notes About Self-Test Coverage

- The self-test above verified authentication, authorization, password change, session invalidation, and cleanup.
- UI-only layout checks such as header alignment, button visibility, and cart placement still need browser confirmation using the manual checklist above.
- Product and cart browsing flows were not re-automated in CLI in this pass because they are primarily existing frontend interactions; they should still be confirmed manually in the browser.
