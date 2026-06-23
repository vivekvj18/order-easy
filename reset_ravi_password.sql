-- Update existing account (id=1, phone 9876543210) to ravi@example.com with password: deliverypassword
-- BCrypt hash for: deliverypassword
UPDATE users
SET email    = 'ravi@example.com',
    role     = 'DELIVERY_PARTNER',
    password = '$2b$12$w1xJJ/XFY7EKeGhWrTM3rObKw4UKAdKfllYohtF9gerAyCC/QBtMe'
WHERE phone_number = '9876543210';

SELECT id, email, phone_number, role FROM users WHERE phone_number = '9876543210';
