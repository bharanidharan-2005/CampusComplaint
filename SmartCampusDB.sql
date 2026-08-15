-- ==========================================
-- SMART CAMPUS DATABASE INITIALIZATION
-- ==========================================

-- Safely drop the database if it already exists to ensure a clean slate
USE master;
ALTER DATABASE SmartCampusDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE SmartCampusDB;
CREATE DATABASE SmartCampusDB;
GO

USE SmartCampusDB;
GO

-- ==========================================
-- 1. LOOKUP & CORE TABLES
-- ==========================================
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE -- 'Admin', 'Student', 'Faculty', 'HOD', 'Dean', 'Principal'
);

CREATE TABLE Departments (
    DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ComplaintStatus (
    StatusID INT IDENTITY(1,1) PRIMARY KEY,
    StatusName VARCHAR(50) NOT NULL UNIQUE -- 'New', 'Assigned', 'Under Review', 'Pending', 'In Progress', 'Resolved', 'Rejected', 'Closed'
);

CREATE TABLE SystemSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey VARCHAR(100) NOT NULL UNIQUE,
    SettingValue VARCHAR(255) NOT NULL
);

INSERT INTO Roles (RoleName) VALUES ('Student'), ('Faculty'), ('HOD'), ('Dean'), ('Principal'), ('Admin');

-- ==========================================
-- 2. USER MANAGEMENT & DJANGO AUXILIARY TABLES
-- ==========================================
-- Core Users table (Used by Django Authentication)
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    RoleID INT NOT NULL DEFAULT 6 FOREIGN KEY REFERENCES Roles(RoleID),
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- ==========================================
-- 2.1 DJANGO AUTHENTICATION AUXILIARY TABLES
-- (Must match lowercase app label: users)
-- ==========================================
CREATE TABLE auth_group (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE auth_permission (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content_type_id INT NOT NULL,
    codename VARCHAR(100) NOT NULL
);

CREATE TABLE auth_group_permissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    group_id INT NOT NULL FOREIGN KEY REFERENCES auth_group(id) ON DELETE CASCADE,
    permission_id INT NOT NULL FOREIGN KEY REFERENCES auth_permission(id) ON DELETE CASCADE
);

-- Lowercase names match Django's expectation for the 'users' app
CREATE TABLE users_groups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    group_id INT NOT NULL FOREIGN KEY REFERENCES auth_group(id) ON DELETE CASCADE
);

CREATE TABLE users_user_permissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    permission_id INT NOT NULL FOREIGN KEY REFERENCES auth_permission(id) ON DELETE CASCADE
); -- <-- Fixed: Added missing closing parenthesis here

-- Role-Specific Profile Tables
CREATE TABLE Students (
    StudentID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    Name VARCHAR(100) NOT NULL,
    RegisterNumber VARCHAR(50) NOT NULL UNIQUE,
    DepartmentID INT NOT NULL FOREIGN KEY REFERENCES Departments(DepartmentID),
    StudyYear INT NOT NULL,
    PhoneNumber VARCHAR(20)
);

CREATE TABLE Faculty (
    FacultyID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    Name VARCHAR(100) NOT NULL,
    FacultyNumber VARCHAR(50) NOT NULL UNIQUE,
    DepartmentID INT NOT NULL FOREIGN KEY REFERENCES Departments(DepartmentID)
);

CREATE TABLE HOD (
    HodID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    Name VARCHAR(100) NOT NULL,
    DepartmentID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Departments(DepartmentID)
);

CREATE TABLE Dean (
    DeanID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    Name VARCHAR(100) NOT NULL,
    School VARCHAR(100) NOT NULL
);

CREATE TABLE Principal (
    PrincipalID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    Name VARCHAR(100) NOT NULL
);

-- ==========================================
-- 3. COMPLAINT MANAGEMENT MODULE
-- ==========================================
CREATE TABLE Complaints (
    ComplaintID INT IDENTITY(1000,1) PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    ModuleType VARCHAR(50) NOT NULL, 
    Category VARCHAR(100) NOT NULL, 
    Priority VARCHAR(20) NOT NULL, 
    DepartmentID INT FOREIGN KEY REFERENCES Departments(DepartmentID),
    Location VARCHAR(255),
    StatusID INT NOT NULL DEFAULT 1 FOREIGN KEY REFERENCES ComplaintStatus(StatusID),
    CreatedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    ResolvedDate DATETIME NULL
);

CREATE TABLE ComplaintAssignments (
    AssignmentID INT IDENTITY(1,1) PRIMARY KEY,
    ComplaintID INT NOT NULL FOREIGN KEY REFERENCES Complaints(ComplaintID) ON DELETE CASCADE,
    AssignedTo INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    AssignedBy INT NOT NULL,
    AssignedDate DATETIME DEFAULT GETDATE()
);

CREATE TABLE ComplaintRemarks (
    RemarkID INT IDENTITY(1,1) PRIMARY KEY,
    ComplaintID INT NOT NULL FOREIGN KEY REFERENCES Complaints(ComplaintID) ON DELETE CASCADE,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    RemarkText NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE ComplaintImages (
    ImageID INT IDENTITY(1,1) PRIMARY KEY,
    ComplaintID INT NOT NULL FOREIGN KEY REFERENCES Complaints(ComplaintID) ON DELETE CASCADE,
    ImageType VARCHAR(50) NOT NULL, 
    ImageURL VARCHAR(500) NOT NULL,
    UploadedAt DATETIME DEFAULT GETDATE()
);

-- ==========================================
-- 4. LOST & FOUND MODULE
-- ==========================================
CREATE TABLE LostItems (
    ItemID INT IDENTITY(1,1) PRIMARY KEY,
    Title VARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Category VARCHAR(50),
    DepartmentID INT FOREIGN KEY REFERENCES Departments(DepartmentID),
    Location VARCHAR(255),
    DateReported DATE NOT NULL,
    PhotoURL VARCHAR(500),
    ContactDetails VARCHAR(100),
    Status VARCHAR(50) DEFAULT 'Open',
    ReportedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE FoundItems (
    ItemID INT IDENTITY(1,1) PRIMARY KEY,
    Title VARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Category VARCHAR(50),
    DepartmentID INT FOREIGN KEY REFERENCES Departments(DepartmentID),
    Location VARCHAR(255),
    DateFound DATE NOT NULL,
    PhotoURL VARCHAR(500),
    ContactDetails VARCHAR(100),
    Status VARCHAR(50) DEFAULT 'Open',
    ReportedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE ClaimRequests (
    ClaimID INT IDENTITY(1,1) PRIMARY KEY,
    ItemType VARCHAR(10) NOT NULL, 
    ItemID INT NOT NULL, 
    ClaimedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    ProofDescription NVARCHAR(MAX) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Pending',
    RequestedAt DATETIME DEFAULT GETDATE()
);

-- ==========================================
-- 5. NOTIFICATIONS & AUDIT LOGS
-- ==========================================
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Title VARCHAR(100) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE AuditLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    ActionType VARCHAR(50) NOT NULL, 
    TableName VARCHAR(50) NOT NULL,
    RecordID INT NOT NULL,
    PerformedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    ActionDetails NVARCHAR(MAX),
    Timestamp DATETIME DEFAULT GETDATE()
);
GO

USE SmartCampusDB;
DELETE FROM django_migrations WHERE app = 'lostfound';