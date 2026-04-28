ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_verification_code_hash text,
  ADD COLUMN IF NOT EXISTS phone_verification_code_salt text,
  ADD COLUMN IF NOT EXISTS pending_phone_code_hash text,
  ADD COLUMN IF NOT EXISTS pending_phone_code_salt text,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash text,
  ADD COLUMN IF NOT EXISTS email_verification_token_salt text,
  ADD COLUMN IF NOT EXISTS device_verification_code_hash text,
  ADD COLUMN IF NOT EXISTS device_verification_code_salt text,
  ADD COLUMN IF NOT EXISTS password_reset_token_hash text,
  ADD COLUMN IF NOT EXISTS password_reset_token_salt text,
  ADD COLUMN IF NOT EXISTS password_reset_otp_hash text,
  ADD COLUMN IF NOT EXISTS password_reset_otp_salt text;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_verification_token_hash_idx ON users(email_verification_token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS users_password_reset_token_hash_idx ON users(password_reset_token_hash);

ALTER TABLE trusted_devices
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS token_salt text;

CREATE UNIQUE INDEX IF NOT EXISTS trusted_devices_token_hash_idx ON trusted_devices(token_hash);

ALTER TABLE teller_enrollments
  ADD COLUMN IF NOT EXISTS access_token_ciphertext text,
  ADD COLUMN IF NOT EXISTS access_token_ciphertext_iv text,
  ADD COLUMN IF NOT EXISTS access_token_ciphertext_tag text,
  ADD COLUMN IF NOT EXISTS access_token_wrapped_dek text,
  ADD COLUMN IF NOT EXISTS access_token_wrapped_dek_iv text,
  ADD COLUMN IF NOT EXISTS access_token_wrapped_dek_tag text;
