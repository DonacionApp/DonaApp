
INSERT INTO "people" ("id", "name", "birdthDate", "dni", "residencia", "telefono", "createdAt", 
"updatedAt", "typeDniId", "municipio", "supportId", "lastName")
 VALUES (26, 'Juan ', '2005-07-12', '123456987', 'Mocoa', '325683421', '2025-10-29 07:54:45.842309', 
 '2025-10-29 07:54:45.842309', 2, '{"pais":{"iso2":"CO"},"state":{"iso2":"PUT"},"city":{"name":"Orito"}}', NULL, NULL);

INSERT INTO "user" ("id", "username", "email", "password", "token", "loginAttempts", 
"lockUntil", "profilePhoto", "dateSendCodigo", "lastLogin", "emailVerified",
 "verified", "code", "block", "createdAt", "updatedAt", "peopleId", "rolId", 
 "location") VALUES
 (26, 'juanperez', 'admin@admin.co', 
 '$2b$10$OrZVbTVlRI.4zPRrNIwtjeSID8FSyNBjjPFOPSX2uZHpGNxioPP1G', NULL,
  0, NULL, 'https://res.cloudinary.com/dxpykzzty/image/upload/v1761689375/Donarapp/profiles/mgs1qtvieopylm60cefg.jpg', NULL, '2025-11-20 10:11:12.301', 'true', 
  'true', NULL, 'false', '2025-10-29 07:54:45.856016', '2025-10-29 07:54:45.856016', 26, 1, NULL);
