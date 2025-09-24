CREATE TABLE IF NOT EXISTS blacklist (
  ss VARCHAR NOT NULL,
  username VARCHAR(255),
  PRIMARY KEY (ss, username),
)