# Fresh Machine Setup

This guide configures the BankTrust application on a new Windows machine using a local Hardhat blockchain, MongoDB, the backend API, and the React frontend.

## 1. Install prerequisites

Install these tools before cloning the project:

- Git
- Node.js 20 LTS (recommended for this Hardhat version)
- MongoDB Community Server, or access to a MongoDB Atlas database
- MetaMask (optional for the current version; the backend signs blockchain transactions)

Check Node and npm:

```powershell
node --version
npm --version
```

Use Node.js 20 LTS if Hardhat reports that your Node.js version is unsupported.

## 2. Get the project

```powershell
git clone <repository-url>
cd blockchain-bank-record-system
```

If the project was copied instead of cloned, open PowerShell in the project root.

## 3. Install dependencies

Install the root Hardhat dependencies:

```powershell
npm install
```

Install backend dependencies:

```powershell
cd backend
npm install
cd ..
```

Install frontend dependencies:

```powershell
cd frontend
npm install
cd ..
```

## 4. Configure MongoDB and the backend

Start MongoDB locally, or obtain the MongoDB Atlas connection string.

Create the backend environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env` and set:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bank_records
JWT_SECRET=replace_with_a_long_random_secret
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=replace_after_deployment
ADMIN_PRIVATE_KEY=replace_with_hardhat_account_0_private_key
```

For MongoDB Atlas, replace `MONGO_URI` with the Atlas URI. Do not commit `backend/.env` or share the private key.

## 5. Start the local blockchain

Open Terminal 1 in the project root and leave it running:

```powershell
npx hardhat node
```

Hardhat prints test accounts. Account #0 is the default deployer and admin account. Its private key is printed by Hardhat and must be used as `ADMIN_PRIVATE_KEY` for this local demo.

## 6. Deploy the smart contract

Open Terminal 2 in the project root:

```powershell
npx hardhat run scripts/deploy.js --network localhost
```

Copy the address printed after `BankRecordRegistry deployed to:` into `backend/.env` as `CONTRACT_ADDRESS`.

The contract address is not Account #0. Account #0 owns and signs the contract calls; `CONTRACT_ADDRESS` is the deployed contract itself.

Keep the same Hardhat node running after deployment. Restarting the node resets the local blockchain, removes the contract and its record history, and requires a fresh deployment and a new `CONTRACT_ADDRESS`.

## 7. Start the backend

Open Terminal 3:

```powershell
cd backend
npm start
```

A successful startup should report a MongoDB connection and `Server running on port 5000`.

## 8. Start the frontend

Open Terminal 4:

```powershell
cd frontend
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173
```

The frontend uses the backend API at `http://localhost:5000/api`.

## 9. Test the application

1. Register a user and log in.
2. Create an `admin` user if required by the application flow.
3. Create a new bank record.
4. Confirm that the record appears as `Verified`.
5. Open the record and click `Verify Integrity`.
6. Use `Simulate Hack`, or edit the record fields in MongoDB.
7. Click `Verify Integrity` again. The record should become `Tampered`.

The current MetaMask button is optional and displays the connected address. Record transactions are signed by the backend using `ADMIN_PRIVATE_KEY`.

## Troubleshooting

### `BAD_DATA`, `could not decode result data`, or no blockchain history

The backend is using an address with no contract on the current RPC network. Keep Hardhat running, deploy again, and update `CONTRACT_ADDRESS` with the newly printed address.

### Records show `Pending` after restarting Hardhat

This is expected. A fresh Hardhat node has no previous record history. Create new records after deploying the contract again.

### Frontend says `Record not found`

Confirm that the backend is running on port 5000 and that the frontend was started with `npm run dev`, not `npm start`. Then refresh the page after restarting the backend.

### Port already in use

Stop the process using port 8545, 5000, or 5173, or configure the affected service to use another port. The frontend API URL is currently fixed in `frontend/src/services/api.js`.

## Optional Docker startup

Docker Compose can start the backend, frontend, Prometheus, and Grafana:

```powershell
docker compose up --build
```

The local Hardhat node and contract deployment still need to be handled separately. When the backend runs inside Docker, `127.0.0.1:8545` refers to the container itself, so `RPC_URL` must be changed to a host-reachable blockchain RPC address.
