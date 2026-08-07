-- ==========================================
-- SMART CAMPUS DATABASE INITIALIZATION
-- ==========================================
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

-- ==========================================
-- 2. USER MANAGEMENT
-- ==========================================
-- Core Users table (Used by Django Authentication)
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    RoleID INT NOT NULL FOREIGN KEY REFERENCES Roles(RoleID),
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

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
    School VARCHAR(100) NOT NULL -- Dean supervises multiple departments under a school
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
    ModuleType VARCHAR(50) NOT NULL, -- 'Academic' or 'Campus'
    Category VARCHAR(100) NOT NULL, 
    Priority VARCHAR(20) NOT NULL, -- 'Low', 'Medium', 'High', 'Critical'
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
    AssignedBy INT NOT NULL, -- The HOD/Dean who assigned it
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
    ImageType VARCHAR(50) NOT NULL, -- 'InitialUpload', 'Attachment', 'ResolutionImage'
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
    Status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Claimed', 'Closed'
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
    Status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Claimed', 'Returned'
    ReportedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE ClaimRequests (
    ClaimID INT IDENTITY(1,1) PRIMARY KEY,
    ItemType VARCHAR(10) NOT NULL, -- 'Lost' or 'Found'
    ItemID INT NOT NULL, 
    ClaimedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    ProofDescription NVARCHAR(MAX) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
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
    ActionType VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    TableName VARCHAR(50) NOT NULL,
    RecordID INT NOT NULL,
    PerformedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    ActionDetails NVARCHAR(MAX),
    Timestamp DATETIME DEFAULT GETDATE()
);
GO