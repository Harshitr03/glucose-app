-- Runs once when the Postgres volume is first created.
-- A separate database for automated tests, so tests never touch dev data.
CREATE DATABASE sweety_test;
