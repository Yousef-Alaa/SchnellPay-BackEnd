# Schnell-Pay Backend

The backend service for the Schnell-Pay digital wallet project, powered by Node.js and MS SQL Server (mssql), providing secure APIs for user management and financial transactions.

## Features
- Secure RESTful APIs for user and transaction management
- Integration with MS SQL Server for reliable data persistence
- Support for complex transactions including funds deposit, bills payment, and admin refunds
- Secure validation and PIN verification for financial operations
- Advanced authentication using JWT Refresh Tokens
- Enhanced security with Two-Factor Authentication (2FA)

## Technologies Used
- Node.js
- MS SQL Server (mssql)

## Project Structure

```text
Backend/
├── api/             # API routes or server entry points
├── config/          # Configuration files (e.g., database connection)
├── controllers/     # Route controllers containing business logic
├── diagrams/        # ERD and Mapping Schema files
├── middleware/      # Express middleware functions
├── models/          # Database models/schemas
├── routes/          # Express route definitions
├── uploads/         # Uploaded files directory
├── utils/           # Utility functions and helpers
├── .env             # Environment variables (create this)
├── .envExample      # Example environment variables
├── package.json     # Project dependencies and scripts
└── vercel.json      # Vercel deployment configuration
```

## API Documentation

We provide two ways to explore our API documentation:

1. **Apidog**: The complete and interactive API documentation can be found here:
   👉 **[View Apidog Documentation](https://gzmjqslu89.apidog.io)**
   
2. **Swagger**: You can also find our Swagger-based API documentation on the dedicated `apiDoc` branch of this repository.

## Database Diagrams

The `diagrams/` folder contains the **Entity Relationship Diagram (ERD)** and the **Mapping Schema** for the database.
These files are in `.drawio` format. To view or edit them, please use [draw.io](https://app.diagrams.net/) (available on web or desktop).
- `ERD.drawio`: Visual representation of the database entities and relationships.
- `Relational Model.drawio`: The relational mapping schema.

## Installation Guide

### Prerequisites
- Node.js installed on your system.
- MS SQL Server installed and running.

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yousef-Alaa/SchnellPay-BackEnd
   ```

2. **Navigate to the project directory:**
   ```bash
   cd Backend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configuration:**
   - Configure your environment variables to connect to your database instance (create a `.env` file or configure your system environment variables accordingly).

5. **Start the server:**
   ```bash
   npm start
   # or npm run dev (for development mode)
   ```

## Related Repositories

Explore the other components of the Schnell-Pay platform:
- [Frontend Repository](https://github.com/Mahmoud-Nasser1/SchnellPay-FrontEnd) - React-based web interface for users.
- [ATM Repository](https://github.com/Yousef-Alaa/SchnellPay-ATM) - Embedded ATmega32 project and simulation for the physical ATM interface.
