# Simple Object Storage System

> **Learning Project**: This is my second experimental backend development project after [FirstBrick Real Estate Platform](https://github.com/Abdullah-Dev115/Firstbrick-real-estate), created as part of my journey in learning backend development.

A robust object storage API built with NestJS and TypeScript that provides a unified interface for storing and retrieving blobs (binary data) across multiple storage backends. this app uses an adapter pattern to seamlessly switch between S3 compatible storages, database storage, and local filesystem storage.

## Project Overview

This project demonstrates a practical implementation of:

- using adapter pattern

- S3 protocol implementation using HTTP client (with no SDK)

- JWT authentication

- RESTful API design

- Database management with Prisma ORM

- Simple unit testing with Jest

## Features

### Storage Backends

The system supports three interchangeable storage backends configured via environment variables:

1. **S3-Compatible Storages**:

- Implements AWS Signature V4 authentication using only HTTP client

- Compatible with AWS S3, Digital Ocean Spaces, and Linode Object Storage

- No SDK dependencies - pure HTTP implementation

2. **Database Storage**:

- Stores blob data directly in SQLite database

- Useing Prisma ORM for database operations

3. **Local Filesystem**:

- Saves files to local disk storage

### Core Functionality

- **Blob Storage**: Store binary data with unique identifiers

- **Blob Retrieval**: Retrieve blobs with metadata (size, creation timestamp)

- **Base64 Encoding**: Transmit binary data safely over JSON/HTTP

- **Metadata Tracking**: Separate table for blob metadata regardless of storage backend

- **JWT Authentication**: JWT based API security

## Tech Stack

- **Framework**: NestJS with TypeScript

- **Database**: SQLite with Prisma ORM

- **Authentication**: JWT (JSON Web Tokens)

- **Unit Testing**: with Jest

- **Validation**: class-validator & class-transformer (for dtos)

## Getting Started

### 1. Clone the Repository

```bash

git clone https://github.com/Abdullah-Dev115/simple-object-storage-system

cd <project-directory>

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying from `.env.example`:

```bash
cp .env.example .env

```

Edit the `.env` file and configure your environment variables:

```env
# Dtatbase (for prisma)
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET=NOTE: I KNOW THAT I MUST NOT EXPOSE THIS SECRET KEY AT ALL (IN GITHUB), BUT THIS IS FOR ONLY FOCUSING ON THE MAIN IDEA, YOU DON NOT NEED TO WASTE YOUR TIME TO CREATE A SECRET KEY!.
# JWT_EXPIRES=10m


# Storage Backend ('s3' or 'database', or 'local')
STORAGE_BACKEND=s3



# AWS S3 Configuration (only needed if STORAGE_BACKEND=s3)

S3_ENDPOINT=
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_REGION=

# Local Storage Configuration (only needed if STORAGE_BACKEND=local)
LOCAL_STORAGE_PATH=./local/storage


```

**Important**: Replace placeholder values with your actual credentials.

### 4. Set Up the Database

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev

```

Generate Prisma Client:

```bash
npx prisma generate

```

### 5. Run the Application

```bash

# Development mode with hot-reload

npm run start:dev

# Production mode

npm run start:prod

```

The API will be available at `http://localhost:3000`

## API Documentation

### Authentication

All endpoints require JWT Bearer token authentication.

#### Register first

```http

POST /v1/auth/register

Content-Type: application/json



{

"username": "your-username",

"password": "your-password"

}

```

#### Then Login

```http

POST /v1/auth/login

Content-Type: application/json



{

"username": "your-username",

"password": "your-password"

}

```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Use this token in the next subsequent requests:

```http

Authorization: Bearer <access_token>

```

### Blob Operations

#### Store a Blob

```http

POST /v1/blobs

Authorization: Bearer <token>

Content-Type: application/json



{

"id": "test-blob-01",

"data": "SGVsbG8gU2ltcGxlIFN0b3JhZ2UgV29ybGQh"

}

```

- `id`: Unique identifier for the blob
- `data`: Base64-encoded binary data

**Response:**

```json
{
  "message": "Blob test-blob-01 is created"
}
```

#### Retrieve a Blob

```http

GET /v1/blobs/:id

Authorization: Bearer <token>

```

**Response:**

```json
{
  "id": "test-blob-01",

  "data": "SGVsbG8gU2ltcGxlIFN0b3JhZ2UgV29ybGQh",

  "size": 27,

  "created_at": "2025-10-18T12:00:00.000Z"
}
```

## Unit Tests

This project includes unit tests for the blob module (service and controller).

```bash
#In project directory

# Run service tests

npm test -- blob.service.spec.ts

# Run controller tests

npm test -- blob.controller.spec.ts


```

## ❗ Security Note

JWT authentication was kept intentionally simple to focus on the storage logic. In a production environment, this would include password hashing, refresh tokens, user roles, and more robust security measures.

## Switching Storage Backends

Simply change the `STORAGE_BACKEND` environment variable and restart the application:

```env

# Use S3-compatible storage

STORAGE_BACKEND=s3



# Use database storage

STORAGE_BACKEND=database



# Use local filesystem

STORAGE_BACKEND=local

```

No code changes required

## 📝 Development Commands

```bash

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod

```

**Note**: This is an educational project created for learning purposes. While the code follows best practices, it's designed more for understanding backend concepts than production deployment. Authentication and error handling are simplified to focus on the core storage functionality.
