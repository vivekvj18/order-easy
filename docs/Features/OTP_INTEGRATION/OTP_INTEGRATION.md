# OTP Integration — OrderEasy (Twilio Verify API)

## What is Twilio Verify?

Twilio Verify ek cloud-based OTP service hai jo automatically:
- OTP generate karta hai
- SMS bhejta hai
- OTP store karta hai (server side)
- OTP verify karta hai

Tumhe OTP database mein store karna hi nahi padta — Twilio khud sab handle karta hai.

**Simple analogy:** Twilio ek security guard ki tarah hai — woh khud passcode generate karta hai, tumhare user ko bhejta hai, aur baad mein check karta hai ki sahi passcode enter hua ya nahi.

---

## Why OTP in OrderEasy?

| Problem | Solution |
|---|---|
| Password bhool jaate hain | Phone number se login — OTP se verify |
| Password weak ho sakta hai | OTP har baar naya — more secure |
| Fake accounts | Phone verify = real user confirm |

**Real world:** Blinkit, Zepto, Swiggy — sab OTP se login karte hain. Password optional hota hai.

---

## Login Flow Change

**Pehle (password login):**
```
Phone + Password → JWT token
```

**Ab (OTP login):**
```
Step 1 → Phone number → OTP SMS aaya
Step 2 → OTP enter karo → JWT token mila
```

**Password login hataya nahi** — fallback ke taur pe rakha (trial Twilio account limitation ki wajah se).

---

## Twilio Setup (3 credentials)

| Credential | Kahan milega | Kaam |
|---|---|---|
| Account SID | Twilio Dashboard | Account identify karta hai |
| Auth Token | Twilio Dashboard | Password jaisa — authorization |
| Verify Service SID | Verify → Services | OTP service identify karta hai |

---

## Implementation Steps

### Step 1 — pom.xml (Auth Service)
Twilio Java SDK add kiya.

```xml
<dependency>
    <groupId>com.twilio.sdk</groupId>
    <artifactId>twilio</artifactId>
    <version>10.1.0</version>
</dependency>
```

**Why:** Bina SDK ke Java code Twilio API call nahi kar sakta — `ClassNotFoundException` aata.

---

### Step 2 — application.properties (Auth Service)
Twilio credentials externalize kiye.

```properties
twilio.account-sid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
twilio.auth-token=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
twilio.verify-service-sid=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Why:** Credentials code mein hardcode nahi karte — security risk hai. Properties file mein rakhne se environment-specific config alag rehta hai.

---

### Step 3 — OtpRequest.java (NEW FILE)
```java
@Data
public class OtpRequest {
    private String phoneNumber;
}
```

**Why:** `/auth/send-otp` endpoint ko request body receive karne ke liye ek DTO chahiye. Sirf phone number — OTP bhejne ke liye itna kaafi hai.

---

### Step 4 — OtpVerifyRequest.java (NEW FILE)
```java
@Data
public class OtpVerifyRequest {
    private String phoneNumber;
    private String otp;
}
```

**Why:** `/auth/verify-otp` endpoint ko 2 cheezein chahiye — phone (kaun hai) aur OTP (sahi code hai ya nahi).

| DTO | Fields | Use |
|---|---|---|
| OtpRequest | phoneNumber | OTP bhejne ke liye |
| OtpVerifyRequest | phoneNumber + otp | OTP verify karne ke liye |

---

### Step 5 — TwilioService.java (NEW FILE)
Sabse important file — actual Twilio API calls yahin hoti hain.

```java
@Service
public class TwilioService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.verify-service-sid}")
    private String verifyServiceSid;

    @PostConstruct
    public void initTwilio() {
        Twilio.init(accountSid, authToken);  // app start pe initialize
    }

    public void sendOtp(String phoneNumber) {
        String formatted = "+91" + phoneNumber;  // E.164 format
        Verification.creator(verifyServiceSid, formatted, "sms").create();
    }

    public boolean verifyOtp(String phoneNumber, String otp) {
        String formatted = "+91" + phoneNumber;
        VerificationCheck check = VerificationCheck
            .creator(verifyServiceSid)
            .setTo(formatted)
            .setCode(otp)
            .create();
        return "approved".equals(check.getStatus().toString());
    }
}
```

**3 important points:**

1. `@PostConstruct` — app start hote hi Twilio initialize — sirf ek baar hota hai
2. `+91` prepend — Twilio E.164 international format maangta hai
3. `"approved"` check — Twilio ke 2 possible responses: `approved` (sahi OTP) ya `pending` (galat OTP)

---

### Step 6 — AuthController.java (MODIFIED)
2 new endpoints add kiye.

```java
@PostMapping("/send-otp")
public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
    twilioService.sendOtp(request.getPhoneNumber());
    return ResponseEntity.ok("OTP sent successfully");
}

@PostMapping("/verify-otp")
public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
    boolean isValid = twilioService.verifyOtp(
        request.getPhoneNumber(), request.getOtp()
    );
    if (!isValid) {
        return ResponseEntity.status(401).body("Invalid OTP");
    }
    User user = userService.findByPhone(request.getPhoneNumber());
    String token = jwtUtil.generateToken(user);
    return ResponseEntity.ok(new LoginResponse(token, user.getRole()));
}
```

**Why JWT flow touch nahi kiya:** OTP sirf verification step hai — OTP approved hone ke baad same purana JWT generation use kiya. Zero risk of breaking existing flow.

---

### Step 7 — SecurityConfig.java (MODIFIED)
New endpoints ko JWT se exempt kiya.

```java
.requestMatchers("/auth/send-otp", "/auth/verify-otp").permitAll()
```

**Why:** Spring Security by default har endpoint pe JWT maangta hai. Login endpoints pe JWT nahi ho sakta — user logged in hi nahi hai abhi. Explicitly permit karna zaroori tha.

---

### Step 8 — authApi.js (Frontend — MODIFIED)
2 new API functions add kiye.

```javascript
export const sendOtp = async (phoneNumber) => {
    const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber })
    });
    return response.json();
};

export const verifyOtp = async (phoneNumber, otp) => {
    const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp })
    });
    return response.json();
};
```

**Why centralized API file:** Kal URL change ho toh sirf yahan change karo — har page mein nahi.

---

### Step 9 — LoginPage.jsx (Frontend — MODIFIED)
3-state UI banaya.

```jsx
const [step, setStep] = useState("phone"); // "phone" | "otp"
const [phoneNumber, setPhoneNumber] = useState("");
const [otp, setOtp] = useState("");
const [timer, setTimer] = useState(30);

// State 1: phone screen → Send OTP
// State 2: otp screen → Verify OTP + 30s resend timer
// State 3: success → JWT save → home page
```

**30s resend timer kyun:** Twilio spam protection — baar baar OTP request block karta hai. Timer se accidental spam avoid hota hai.

---

### Step 10 — AuthContext.jsx (Frontend — MODIFIED)
Response format mismatch fix kiya.

```javascript
// Password login → plain JWT string
// OTP login     → { token, role } object
// Dono handle karo:

const token = typeof responseData === "string"
    ? responseData
    : responseData.token;
```

**Why:** Password login aur OTP login ka response format alag tha — AuthContext dono ko handle kare, isliye typeof check add kiya.

---

## Complete Flow

```
User enters phone number
    ↓
LoginPage → sendOtp() → authApi.js
    ↓ POST /auth/send-otp (no JWT needed — permitAll)
AuthController → TwilioService.sendOtp()
    ↓ +91 prepend → Twilio Verify API
SMS: "Your OrderEasy code is 602206" ✅
    ↓
User enters 602206
    ↓
LoginPage → verifyOtp() → authApi.js
    ↓ POST /auth/verify-otp
AuthController → TwilioService.verifyOtp()
    ↓ Twilio checks → "approved"
    ↓ true → find user → generateToken()
JWT response → AuthContext.login()
    ↓
localStorage mein save → Home page ✅
```

---

## Interview Answer

**"Why Twilio Verify instead of custom OTP?"**

> "Custom OTP banane mein OTP generate karna, DB mein store karna, expiry handle karna, SMS gateway integrate karna — sab khud karna padta. Twilio Verify ek managed service hai jo yeh sab handle karta hai. Hum sirf sendOtp() aur verifyOtp() call karte hain — security, storage, delivery sab Twilio ka responsibility hai."

---

## Trial Account Limitation

Twilio trial mein sirf **verified phone numbers** pe SMS ja sakta hai.

Fix: `console.twilio.com → Phone Numbers → Verified Caller IDs → Add number`

Production mein yeh limitation nahi hogi.

---

## Files Summary

| File | Service | Action |
|---|---|---|
| `pom.xml` | Auth | Modified — Twilio SDK added |
| `application.properties` | Auth | Modified — 3 credentials added |
| `OtpRequest.java` | Auth | **Created** — send-otp DTO |
| `OtpVerifyRequest.java` | Auth | **Created** — verify-otp DTO |
| `TwilioService.java` | Auth | **Created** — Twilio API calls |
| `AuthController.java` | Auth | Modified — 2 new endpoints |
| `SecurityConfig.java` | Auth | Modified — new endpoints permitted |
| `authApi.js` | Frontend | Modified — 2 new API functions |
| `LoginPage.jsx` | Frontend | Modified — 3-state UI |
| `AuthContext.jsx` | Frontend | Modified — response format fix |
