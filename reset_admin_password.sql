-- Reset admin password to: Admin@123
UPDATE users
SET password = '$2b$12$ebCMoy91oMdaA2.14q0bxecm8rhEaeMUfX8IqudQRuyxtl8mupfB2'
WHERE role = 'ADMIN';
