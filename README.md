# DAVAPlopers

Internet Programming Group Project

## Running the Frontend

The frontend is an Angular app.

```bash
cd frontend
npm install
npm start
```

The app will be available at `http://localhost:4200`.

## Running the Backend

The backend is a FastAPI app that connects to a MySQL database hosted on CISE servers.

### 1. Set up the database tunnel

The database runs on `mysql.cise.ufl.edu`. Forward it locally before starting the server:

```bash
ssh -L 3307:mysql.cise.ufl.edu:3306 <cise-username>@rain.cise.ufl.edu -N
```

### 2. Configure environment variables

Copy the `.env` file in `backend/` and fill in your credentials:

```
OPENAI_API_KEY=<your key>
GOOGLE_PLACES_API_KEY=<your key>
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=<cise-username>
DB_PASSWORD=<cise-db-password>
DB_NAME=travel_app
```

### 3. Install dependencies and start the server

```bash
cd backend
pip install -r requirements.txt
uvicorn agent.main:app --reload
```

The API will be available at `http://localhost:8000`. A health check endpoint is at `http://localhost:8000/health`.
