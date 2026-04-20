# Phone Number Feature — OrderEasy Auth Service

## What is this feature?

Previously login and register both used **email + password**.

We added:
1. **Phone number field** in registration — mandatory, saved to DB
2. **Login with phone number + password** — email login still works as fallback

---

## Step 1 — Frontend: RegisterPage.jsx

User fills the form:
```javascript
formData = {
  fullName: "Vivek Joshi",
  email: "vivek@gmail.com",
  phoneNumber: "9876543210",   // NEW
  password: "Vivek@123",
  role: "CUSTOMER"
}
```

Frontend validates phone before API call:
```javascript
const isValidPhone = /^[6-9]\d{9}$/.test(formData.phoneNumber);
if (!isValidPhone) {
  toast.error('Enter valid 10-digit Indian number');
  return;
}
```

---

## Step 2 — Frontend: authApi.js

API call goes to API Gateway:
```javascript
export const register = (data) => {
  return axios.post('/auth/signup', data);
}
```

Path: `Frontend → API Gateway :8084 → Auth Service :8081`

API Gateway skips JWT check for `/auth/**` routes — these are public endpoints.

---

## Step 3 — Backend: AuthController.java

Request arrives here:
```java
@PostMapping("/signup")
public ResponseEntity<SignupResponse> signup(
    @Valid @RequestBody SignupRequest request) {
    return ResponseEntity.ok(userService.registerUser(request));
}
```

`@Valid` triggers backend validation on `SignupRequest`.

---

## Step 4 — Backend: SignupRequest.java

Validation annotations check phone format:
```java
@NotBlank(message = "Phone number is required")
@Pattern(
  regexp = "^[6-9]\\d{9}$",
  message = "Enter valid 10-digit Indian number"
)
private String phoneNumber;

@NotBlank
private String email;

@NotBlank
private String password;

private String role;
```

If phone is invalid → `GlobalExceptionHandler` returns **400 BAD REQUEST**.

---

## Step 5 — Backend: UserService.java (Register)

```java
public SignupResponse registerUser(SignupRequest request) {

  // Step 1 — encrypt password
  String encodedPassword = passwordEncoder.encode(request.getPassword());

  // Step 2 — build user object
  User user = User.builder()
      .email(request.getEmail())
      .phoneNumber(request.getPhoneNumber())   // NEW
      .password(encodedPassword)
      .role(request.getRole())
      .build();

  // Step 3 — save to DB
  userRepository.save(user);

  return new SignupResponse(user.getEmail(), user.getPhoneNumber());
}
```

Password is **BCrypt encrypted** — plain text never stored in DB.

---

## Step 6 — Backend: User.java (Entity)

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = true)   // NEW
    private String phoneNumber;

    private String password;   // BCrypt encrypted

    private String role;
}
```

- `unique = true` → same phone, 2 accounts not possible
- `nullable = true` → old users without phone are safe
- Hibernate auto-added `phone_number` column via `ddl-auto=update`

---

## Step 7 — Frontend: LoginPage.jsx

User fills login form with phone now:
```javascript
formData = {
  phoneNumber: "9876543210",
  password: "Vivek@123"
}
```

Validation before API call:
```javascript
const isValidPhone = /^[6-9]\d{9}$/.test(formData.phoneNumber);
if (!isValidPhone) {
  toast.error('Enter valid phone number');
  return;
}
```

---

## Step 8 — Backend: AuthController.java (Login)

```java
@PostMapping("/login")
public ResponseEntity<LoginResponse> login(
    @RequestBody LoginRequest request) {
    return ResponseEntity.ok(
        userService.loginUser(
            request.getPhoneNumber(),
            request.getPassword()
        )
    );
}
```

`LoginRequest.java` now has `phoneNumber` instead of `email`.

---

## Step 9 — Backend: UserService.java (Login)

```java
public LoginResponse loginUser(String phoneNumber, String password) {

    // Step 1 — find user by phone
    User user = userRepository.findByPhoneNumber(phoneNumber)
        .orElseThrow(() -> new RuntimeException("User not found"));

    // Step 2 — match BCrypt password
    boolean match = passwordEncoder.matches(password, user.getPassword());
    if (!match) {
        throw new RuntimeException("Invalid credentials");
    }

    // Step 3 — generate JWT with email (NOT phone)
    String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

    return new LoginResponse(token);
}
```

Why email in JWT and not phone?
- `JwtFilter` reads email from JWT subject
- `AuthContext.jsx` parses email from JWT
- Changing to phone would break both — so kept email in JWT

---

## Step 10 — Backend: JwtUtil.java

```java
public String generateToken(String email, String role) {

    return Jwts.builder()
        .setSubject(email)           // "vivek@gmail.com"
        .claim("role", role)         // "CUSTOMER"
        .setIssuedAt(new Date())
        .setExpiration(new Date(
            System.currentTimeMillis() + 86400000  // 24 hours
        ))
        .signWith(SignatureAlgorithm.HS256, secretKey)
        .compact();
}
```

Token payload:
```json
{
  "sub": "vivek@gmail.com",
  "role": "CUSTOMER",
  "iat": 1713456789,
  "exp": 1713543189
}
```

---

## Step 11 — Frontend: AuthContext.jsx

Token received → saved → decoded:
```javascript
// save token
localStorage.setItem('token', response.data.token);

// decode token
const decoded = jwtDecode(token);
// decoded.sub   = "vivek@gmail.com"
// decoded.role  = "CUSTOMER"

setUser({
  email: decoded.sub,
  role: decoded.role,
});
```

User is now logged in → redirected to home page.

---

## Step 12 — How every API call uses the token

File: `axios.js`

```javascript
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Every request after login automatically carries the token in the header.

---

## Step 13 — API Gateway validates the token

File: `JwtAuthenticationFilter.java`

```
Request → API Gateway
    ↓
Is path /auth/** ?
    ├── YES → skip JWT check (login/register are public)
    └── NO  → validate JWT token
                 ↓
           Token valid + role check
                 ↓
           Forward to downstream service
```

---

## What was NOT changed

| File | Reason |
|---|---|
| `JwtUtil.java` | JWT still uses email as subject |
| `JwtFilter.java` | Reads email from JWT — unchanged |
| `AuthContext.jsx` | Parses email from JWT — unchanged |
| `axios.js` | Token attachment logic — unchanged |
| All other microservices | Order, Delivery, Inventory etc — untouched |

---

## Database change

Column added automatically by Hibernate:

```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(15) UNIQUE;
```

Verify:
```sql
DESCRIBE users;
-- phone_number | varchar(15) | YES | UNI | NULL
```

---

## Validation rule

```
Regex: ^[6-9]\d{9}$
```

- Starts with 6, 7, 8, or 9 (valid Indian prefixes)
- Exactly 10 digits
- No +91 prefix

---

## Next planned feature

OTP verification on phone number during login.
