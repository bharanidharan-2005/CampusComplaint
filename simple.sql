USE master;
ALTER DATABASE SmartCampusDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE SmartCampusDB;
CREATE DATABASE SmartCampusDB;
GO

USE SmartCampusDB;
GO

CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Departments (
    DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName VARCHAR(100) NOT NULL UNIQUE
);

-- Insert the default roles so you don't have to do it later
INSERT INTO Roles (RoleName) VALUES ('Student'), ('Faculty'), ('HOD'), ('Dean'), ('Principal'), ('Admin');